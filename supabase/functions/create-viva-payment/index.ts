import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// Server-side pricing logic (mirrors src/lib/pricing.ts)
// ============================================
interface WeightTier {
  min: number;
  max: number;
  discount: number;
}

// Aligned with src/lib/pricing.ts
const WEIGHT_TIERS_A: WeightTier[] = [
  { min: 0, max: 2.49, discount: 0 },
  { min: 2.5, max: 4.99, discount: 0.17 },
  { min: 5, max: 9.99, discount: 0.25 },
  { min: 10, max: 24.99, discount: 0.33 },
  { min: 25, max: 49.99, discount: 0.40 },
  { min: 50, max: 99.99, discount: 0.45 },
  { min: 100, max: Infinity, discount: 0.50 },
];

const WEIGHT_TIERS_B: WeightTier[] = [
  { min: 0, max: 2.49, discount: 0 },
  { min: 2.5, max: 4.99, discount: 0.07 },
  { min: 5, max: 9.99, discount: 0.13 },
  { min: 10, max: 24.99, discount: 0.35 },
  { min: 25, max: 49.99, discount: 0.40 },
  { min: 50, max: 99.99, discount: 0.45 },
  { min: 100, max: Infinity, discount: 0.50 },
];

// Force Noire / Élixir Noir fixed price grids (mirrors src/lib/pricing.ts)
const FORCE_NOIRE_PRICE_GRID: Record<string, { weight: number; price: number }[]> = {
  "nuage-de-mousseux": [
    { weight: 1, price: 13 },
    { weight: 2.5, price: 30 },
    { weight: 5, price: 55 },
    { weight: 10, price: 65 },
  ],
  "911-og-indoor": [
    { weight: 1, price: 15 },
    { weight: 2.5, price: 35 },
    { weight: 5, price: 65 },
    { weight: 10, price: 90 },
  ],
  "blue-mango-indoor": [
    { weight: 1, price: 13 },
    { weight: 2.5, price: 30 },
    { weight: 5, price: 55 },
    { weight: 10, price: 80 },
  ],
};

function calculateForceNoirePrice(productId: string, weight: number): number | null {
  const grid = FORCE_NOIRE_PRICE_GRID[productId];
  if (!grid || !weight || weight <= 0) return null;
  const exact = grid.find((g) => g.weight === weight);
  if (exact) return exact.price;
  const tier10 = grid[grid.length - 1];
  const pricePerGram10 = tier10.price / tier10.weight;
  if (weight < 10) {
    let lower = grid[0];
    let upper = grid[grid.length - 1];
    for (let i = 0; i < grid.length - 1; i++) {
      if (weight >= grid[i].weight && weight <= grid[i + 1].weight) {
        lower = grid[i];
        upper = grid[i + 1];
        break;
      }
    }
    const ratio = (weight - lower.weight) / (upper.weight - lower.weight);
    return lower.price + (upper.price - lower.price) * ratio;
  }
  let extraDiscount = 0;
  if (weight >= 100) extraDiscount = 0.20;
  else if (weight >= 50) extraDiscount = 0.15;
  else if (weight >= 25) extraDiscount = 0.10;
  return weight * pricePerGram10 * (1 - extraDiscount);
}

const ACCESSORY_BULK_THRESHOLD = 10;
const ACCESSORY_BULK_DISCOUNT = 0.33;

const GROUP_B_PRODUCT_IDS = new Set(["911-og-indoor", "blue-mango-indoor"]);

const ACCESSORY_PRICES: Record<string, number> = {
  "pochon-petit": 1.50,
  "pochon-grand": 3.00,
  "feuilles-slim": 3.00,
  "briquet-hsb": 2.50,
};

function getDiscountTier(weight: number, priceGroup: string): WeightTier {
  const tiers = priceGroup === "B" ? WEIGHT_TIERS_B : WEIGHT_TIERS_A;
  return tiers.find(t => weight >= t.min && weight <= t.max) || tiers[0];
}

function calculateItemPrice(basePrice: number, weight: number, priceGroup: string, productId?: string): number {
  if (!weight || weight <= 0) return 0;
  if (productId && FORCE_NOIRE_PRICE_GRID[productId]) {
    const fn = calculateForceNoirePrice(productId, weight);
    if (fn !== null) return fn;
  }
  const tier = getDiscountTier(weight, priceGroup);
  return basePrice * weight * (1 - tier.discount);
}

function calculateProItemPrice(proPrice: number, weight: number): number {
  if (!weight || weight <= 0) return 0;
  return proPrice * weight;
}

function calculateAccessoryPrice(unitPrice: number, quantity: number): number {
  if (!quantity || quantity <= 0) return 0;
  const discount = quantity >= ACCESSORY_BULK_THRESHOLD ? ACCESSORY_BULK_DISCOUNT : 0;
  return unitPrice * quantity * (1 - discount);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;
    let supabaseUser: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        userId = user.id;
        supabaseUser = supabase;
      }
    }

    const { items, sampleItems, deliveryType, deliveryAddress, deliveryDate, deliveryTime, contactPhone, freeGramsUsed, guestEmail, guestName, guestPhone, promoCode, relayPointId, relayPointName, relayPointAddress } = await req.json();

    const validDeliveryTypes = ['postal', 'personal', 'relay'];
    if (!deliveryType || !validDeliveryTypes.includes(deliveryType)) {
      return new Response(JSON.stringify({ error: "Type de livraison invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeContactPhone = (contactPhone || '').slice(0, 20);
    const safeDeliveryAddress = (deliveryAddress || '').slice(0, 500);
    const safeGuestName = (guestName || '').slice(0, 200);
    const safeGuestPhone = (guestPhone || '').slice(0, 20);
    const safeGuestEmail = (guestEmail || '').slice(0, 255);

    if (!userId) {
      if (!safeGuestEmail || !safeGuestEmail.includes("@")) {
        return new Response(JSON.stringify({ error: "Email requis pour commander sans compte" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (deliveryType === "postal" && (!safeDeliveryAddress || safeDeliveryAddress.trim().length === 0)) {
      return new Response(JSON.stringify({ error: "Adresse de livraison requise pour l'envoi postal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productItemIds = items
      .filter((i: any) => i.productType === "fleur" || i.productType === "resine")
      .map((i: any) => i.productId);

    let userProfile: any = null;
    let isProActive = false;

    if (userId) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("is_pro_validated, is_vat_validated, vat_number, free_grams_available")
        .eq("id", userId)
        .single();
      userProfile = data;
      isProActive = userProfile?.is_pro_validated && userProfile?.is_vat_validated && !!userProfile?.vat_number;
    }

    let dbProducts: any[] = [];
    if (productItemIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("products")
        .select("id, price, pro_price, category")
        .in("id", productItemIds);
      dbProducts = data || [];
    }

    let proPriceMap: Record<string, number> = {};
    if (isProActive && productItemIds.length > 0) {
      const { data: proPrices } = await supabaseAdmin
        .from("pro_prices")
        .select("product_id, pro_price")
        .in("product_id", productItemIds);
      if (proPrices) {
        proPrices.forEach((pp: any) => { proPriceMap[pp.product_id] = pp.pro_price; });
      }
    }

    let serverTotal = 0;
    const serverItems: any[] = [];

    for (const item of items) {
      const isAccessory = item.productType === "accessoire";

      if (isAccessory) {
        const knownPrice = ACCESSORY_PRICES[item.productId];
        if (knownPrice === undefined) {
          return new Response(JSON.stringify({ error: `Unknown accessory: ${item.productId}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const itemTotal = calculateAccessoryPrice(knownPrice, quantity);
        serverTotal += itemTotal;
        serverItems.push({
          product_id: item.productId,
          product_name: item.productName,
          product_type: item.productType,
          weight: null,
          quantity,
          unit_price: knownPrice,
          total_price: Math.round(itemTotal * 100) / 100,
        });
      } else {
        const dbProduct = dbProducts.find((p: any) => p.id === item.productId);
        if (!dbProduct) {
          return new Response(JSON.stringify({ error: `Product not found: ${item.productId}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const weight = Math.max(0.1, Number(item.weight) || 0);
        const priceGroup = GROUP_B_PRODUCT_IDS.has(item.productId) ? "B" : "A";
        
        let itemTotal: number;
        let unitPrice: number;

        const proPrice = proPriceMap[item.productId] || dbProduct.pro_price;
        if (isProActive && proPrice) {
          itemTotal = calculateProItemPrice(proPrice, weight);
          unitPrice = proPrice;
        } else {
          itemTotal = calculateItemPrice(dbProduct.price, weight, priceGroup, item.productId);
          unitPrice = dbProduct.price;
        }

        serverTotal += itemTotal;
        serverItems.push({
          product_id: item.productId,
          product_name: item.productName,
          product_type: item.productType,
          weight,
          quantity: null,
          unit_price: unitPrice,
          total_price: Math.round(itemTotal * 100) / 100,
        });
      }
    }

    // Validate and add sample items (free, 1g each)
    const serverFlowerWeight = serverItems.reduce((sum: number, i: any) => sum + (i.weight || 0), 0);
    const maxSamples = Math.floor(serverFlowerWeight / 10);
    
    if (sampleItems && Array.isArray(sampleItems) && sampleItems.length > 0) {
      const validSamples = sampleItems.slice(0, maxSamples);
      for (const sample of validSamples) {
        serverItems.push({
          product_id: sample.productId,
          product_name: sample.productName,
          product_type: "sample",
          weight: 1,
          quantity: null,
          unit_price: 0,
          total_price: 0,
        });
      }
    }

    // Add gift items (feuilles slim + briquet BIC per 10g)
    const giftPackCount = Math.floor(serverFlowerWeight / 10);
    if (giftPackCount > 0 && !isProActive) {
      serverItems.push({
        product_id: "gift-feuilles-slim",
        product_name: `${giftPackCount}x Feuilles Slim + Carton RAW`,
        product_type: "gift",
        weight: null,
        quantity: giftPackCount,
        unit_price: 0,
        total_price: 0,
      });
      serverItems.push({
        product_id: "gift-briquet-bic",
        product_name: `${giftPackCount}x Briquet BIC Noir`,
        product_type: "gift",
        weight: null,
        quantity: giftPackCount,
        unit_price: 0,
        total_price: 0,
      });
    }

    // Validate and apply free grams deduction
    let validFreeGramsUsed = 0;
    if (userId && freeGramsUsed && freeGramsUsed > 0 && userProfile) {
      const available = userProfile.free_grams_available || 0;
      validFreeGramsUsed = Math.min(freeGramsUsed, available);
      const freeGramsValue = validFreeGramsUsed * 12;
      serverTotal = Math.max(0, serverTotal - freeGramsValue);
    }

    // Validate and apply promo code
    let validPromoCode: string | null = null;
    let promoDiscountPercent = 0;
    let promoDiscountAmount = 0;

    if (promoCode === "DEMI160" && userId) {
      // Global single-use check (not per-user)
      const { data: globalUsage } = await supabaseAdmin
        .from("promo_code_usage")
        .select("id")
        .eq("code", "DEMI160")
        .maybeSingle();

      if (!globalUsage) {
        // Verify total flower weight = 50g
        if (serverFlowerWeight === 50) {
          promoDiscountAmount = Math.round((serverTotal - 160) * 100) / 100;
          if (promoDiscountAmount > 0) {
            serverTotal = 160;
            promoDiscountPercent = Math.round((promoDiscountAmount / (serverTotal + promoDiscountAmount)) * 10000) / 100;
            validPromoCode = "DEMI160";
          }
        }
      }
    } else if (promoCode === "NUAGE90") {
      // Global single-use: exactly 20g of nuage-de-mousseux only, fixed price 90€
      const { data: globalUsage } = await supabaseAdmin
        .from("promo_code_usage")
        .select("id")
        .eq("code", "NUAGE90")
        .maybeSingle();

      if (!globalUsage) {
        const nuageItems = serverItems.filter((i: any) => i.product_id === "nuage-de-mousseux");
        const nuageWeight = nuageItems.reduce((s: number, i: any) => s + (i.weight || 0), 0);
        const otherFlowerWeight = serverItems
          .filter((i: any) => i.product_type !== "accessoire" && i.product_type !== "sample" && i.product_type !== "gift" && i.product_id !== "nuage-de-mousseux")
          .reduce((s: number, i: any) => s + (i.weight || 0), 0);
        if (nuageWeight === 20 && otherFlowerWeight === 0) {
          promoDiscountAmount = Math.round((serverTotal - 90) * 100) / 100;
          if (promoDiscountAmount > 0) {
            serverTotal = 90;
            promoDiscountPercent = Math.round((promoDiscountAmount / (serverTotal + promoDiscountAmount)) * 10000) / 100;
            validPromoCode = "NUAGE90";
          }
        }
      }
    } else if (promoCode && promoCode === "BIENVENUE15" && userId) {
      const { data: existingUsage } = await supabaseAdmin
        .from("promo_code_usage")
        .select("id")
        .eq("user_id", userId)
        .eq("code", "BIENVENUE15")
        .maybeSingle();

      if (!existingUsage) {
        promoDiscountPercent = 15;
        promoDiscountAmount = Math.round(serverTotal * 0.15 * 100) / 100;
        serverTotal = Math.round((serverTotal - promoDiscountAmount) * 100) / 100;
        validPromoCode = "BIENVENUE15";
      }
    }

    serverTotal = Math.round(serverTotal * 100) / 100;

    if (serverTotal <= 0) {
      return new Response(JSON.stringify({ error: "Invalid total amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the order in DB
    const orderData: any = {
      total_amount: serverTotal,
      total_flower_weight: serverFlowerWeight,
      delivery_type: deliveryType,
      delivery_address: safeDeliveryAddress || null,
      delivery_date: deliveryDate || null,
      delivery_time: deliveryTime || null,
      contact_phone: safeContactPhone || null,
      status: "pending",
      payment_status: "unpaid",
      relay_point_id: (relayPointId || '').slice(0, 50) || null,
      relay_point_name: (relayPointName || '').slice(0, 200) || null,
      relay_point_address: (relayPointAddress || '').slice(0, 500) || null,
      promo_code: validPromoCode || null,
      promo_discount_percent: promoDiscountPercent > 0 ? promoDiscountPercent : null,
      promo_discount_amount: promoDiscountAmount > 0 ? promoDiscountAmount : null,
    };

    if (userId) {
      orderData.user_id = userId;
    } else {
      orderData.guest_email = safeGuestEmail;
      orderData.guest_name = safeGuestName || null;
      orderData.guest_phone = safeGuestPhone || null;
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert order items (including samples at 0€)
    if (serverItems.length > 0) {
      const orderItems = serverItems.map((si) => ({
        ...si,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
      }
    }

    // Create Viva Wallet payment order
    const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
    const apiKey = Deno.env.get("VIVA_API_KEY");

    const vivaAmount = Math.round(serverTotal * 100);
    const credentials = btoa(`${merchantId}:${apiKey}`);

    console.log("Calling Viva API with server-calculated amount:", vivaAmount);

    const vivaResponse = await fetch(
      "https://www.vivapayments.com/api/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: vivaAmount,
          customerTrns: `Commande ${order.display_order_number || '#' + order.order_number}`,
          merchantTrns: order.id,
          fullName: safeGuestName || "",
          email: safeGuestEmail || "",
        }),
      }
    );

    const vivaText = await vivaResponse.text();
    console.log("Viva response status:", vivaResponse.status, "body:", vivaText);

    const orderCodeMatch = vivaText.match(/"OrderCode"\s*:\s*(\d+)/);
    
    let vivaData: any;
    try {
      vivaData = JSON.parse(vivaText);
    } catch {
      console.error("Failed to parse Viva response:", vivaText);
      return new Response(
        JSON.stringify({ error: "Erreur du service de paiement. Veuillez reessayer." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vivaResponse.ok || vivaData.ErrorCode !== 0) {
      console.error("Viva error:", vivaData);
      return new Response(
        JSON.stringify({ error: "Echec de la creation du paiement. Veuillez reessayer." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderCode = orderCodeMatch ? orderCodeMatch[1] : String(vivaData.OrderCode);
    console.log("OrderCode (string, precise):", orderCode);

    await supabaseAdmin
      .from("orders")
      .update({ viva_order_code: String(orderCode) })
      .eq("id", order.id);

    // Deduct free grams if used
    if (userId && validFreeGramsUsed > 0) {
      const newFreeGrams = Math.max(0, (userProfile!.free_grams_available || 0) - validFreeGramsUsed);
      await supabaseAdmin
        .from("profiles")
        .update({ free_grams_available: newFreeGrams })
        .eq("id", userId);
    }

    // Record promo code usage
    if (validPromoCode && userId) {
      await supabaseAdmin
        .from("promo_code_usage")
        .insert({
          user_id: userId,
          code: validPromoCode,
          order_id: order.id,
          discount_percent: promoDiscountPercent,
          discount_amount: promoDiscountAmount,
        });
    }

    return new Response(
      JSON.stringify({
        orderCode,
        orderId: order.id,
        checkoutUrl: `https://www.vivapayments.com/web/checkout?ref=${orderCode}&color=D4AF37&paymentMethod=0`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
