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

const WEIGHT_TIERS_A: WeightTier[] = [
  { min: 0, max: 9.99, discount: 0 },
  { min: 10, max: 24.99, discount: 0.15 },
  { min: 25, max: 49.99, discount: 0.25 },
  { min: 50, max: 99.99, discount: 0.35 },
  { min: 100, max: Infinity, discount: 0.50 },
];

const WEIGHT_TIERS_B: WeightTier[] = [
  { min: 0, max: 9.99, discount: 0 },
  { min: 10, max: 24.99, discount: 0.10 },
  { min: 25, max: 49.99, discount: 0.20 },
  { min: 50, max: 99.99, discount: 0.25 },
  { min: 100, max: Infinity, discount: 0.35 },
];

const ACCESSORY_BULK_THRESHOLD = 10;
const ACCESSORY_BULK_DISCOUNT = 0.33;

const GROUP_B_PRODUCT_IDS = new Set(["911-og-indoor", "blue-mango-indoor"]);

const ACCESSORY_PRICES: Record<string, number> = {
  "pochon-petit": 0.50,
  "pochon-moyen": 2.50,
  "pochon-grand": 3.00,
  "feuilles-slim": 1.00,
  "briquet-hsb": 2.00,
};

function getDiscountTier(weight: number, priceGroup: string): WeightTier {
  const tiers = priceGroup === "B" ? WEIGHT_TIERS_B : WEIGHT_TIERS_A;
  return tiers.find(t => weight >= t.min && weight <= t.max) || tiers[0];
}

function calculateItemPrice(basePrice: number, weight: number, priceGroup: string): number {
  if (!weight || weight <= 0) return 0;
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
    
    // Service role client for all DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to authenticate user (optional for guest checkout)
    let userId: string | null = null;
    let supabaseUser: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub;
        supabaseUser = supabase;
      }
    }

    const { items, deliveryType, deliveryAddress, deliveryDate, deliveryTime, contactPhone, freeGramsUsed, guestEmail, guestName, guestPhone } = await req.json();

    // Validate deliveryType
    const validDeliveryTypes = ['postal', 'personal'];
    if (!deliveryType || !validDeliveryTypes.includes(deliveryType)) {
      return new Response(JSON.stringify({ error: "Type de livraison invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize string inputs
    const safeContactPhone = (contactPhone || '').slice(0, 20);
    const safeDeliveryAddress = (deliveryAddress || '').slice(0, 500);
    const safeGuestName = (guestName || '').slice(0, 200);
    const safeGuestPhone = (guestPhone || '').slice(0, 20);
    const safeGuestEmail = (guestEmail || '').slice(0, 255);

    // For guests, require email
    if (!userId) {
      if (!guestEmail || typeof guestEmail !== "string" || !guestEmail.includes("@")) {
        return new Response(JSON.stringify({ error: "Email requis pour commander sans compte" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate postal delivery requires an address
    if (deliveryType === "postal" && (!deliveryAddress || deliveryAddress.trim().length === 0)) {
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

    // Separate product items from accessory items
    const productItemIds = items
      .filter((i: any) => i.productType === "fleur" || i.productType === "resine")
      .map((i: any) => i.productId);

    // Check if user is pro with validated VAT (only for authenticated users)
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

    // Fetch DB prices for products
    let dbProducts: any[] = [];
    if (productItemIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("products")
        .select("id, price, pro_price, category")
        .in("id", productItemIds);
      dbProducts = data || [];
    }

    // Also fetch pro_prices if user is pro
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

    // Server-side total recalculation
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
          itemTotal = calculateItemPrice(dbProduct.price, weight, priceGroup);
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

    // Validate and apply free grams deduction (only for authenticated users)
    let validFreeGramsUsed = 0;
    if (userId && freeGramsUsed && freeGramsUsed > 0 && userProfile) {
      const available = userProfile.free_grams_available || 0;
      validFreeGramsUsed = Math.min(freeGramsUsed, available);
      const freeGramsValue = validFreeGramsUsed * 12;
      serverTotal = Math.max(0, serverTotal - freeGramsValue);
    }

    serverTotal = Math.round(serverTotal * 100) / 100;

    if (serverTotal <= 0) {
      return new Response(JSON.stringify({ error: "Invalid total amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the order in DB using service role (works for both guest and authenticated)
    const orderData: any = {
      total_amount: serverTotal,
      total_flower_weight: totalFlowerWeight || 0,
      delivery_type: deliveryType || "pickup",
      delivery_address: deliveryAddress || null,
      delivery_date: deliveryDate || null,
      delivery_time: deliveryTime || null,
      contact_phone: contactPhone || null,
      status: "pending",
      payment_status: "unpaid",
    };

    if (userId) {
      orderData.user_id = userId;
    } else {
      orderData.guest_email = guestEmail;
      orderData.guest_name = guestName || null;
      orderData.guest_phone = guestPhone || null;
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

    // Insert order items
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
          fullName: guestName || "",
          email: guestEmail || "",
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
        JSON.stringify({ error: "Invalid response from payment provider", details: vivaText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vivaResponse.ok || vivaData.ErrorCode !== 0) {
      console.error("Viva error:", vivaData);
      return new Response(
        JSON.stringify({ error: "Payment creation failed", details: vivaData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderCode = orderCodeMatch ? orderCodeMatch[1] : String(vivaData.OrderCode);
    console.log("OrderCode (string, precise):", orderCode);

    // Update order with viva_order_code
    await supabaseAdmin
      .from("orders")
      .update({ viva_order_code: String(orderCode) })
      .eq("id", order.id);

    // Deduct free grams if used (only for authenticated users)
    if (userId && validFreeGramsUsed > 0) {
      const newFreeGrams = Math.max(0, (userProfile!.free_grams_available || 0) - validFreeGramsUsed);
      await supabaseAdmin
        .from("profiles")
        .update({ free_grams_available: newFreeGrams })
        .eq("id", userId);
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
