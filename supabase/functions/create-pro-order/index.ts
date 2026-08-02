import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TO_GAMME: Record<string, string> = {
  "amnesia-signature-oniria": "classiques",
  "platinum-og": "classiques",
  "mint-kush": "classiques",
  "blue-mango-indoor": "911_og",
  "ice-o-lator": "classiques",
  "golden-cbn": "classiques",
  "nuage-de-mousseux": "classiques",
  "911-og-indoor": "911_og",
  "poussiere-dor": "poussiere",
  haribo: "nectar_top",
  heisenberg: "nectar_top",
};


const ALLOWED_FORMATS = new Set([1, 2.5, 5, 10]);

function pricePerGram(tiers: any[], gamme: string, totalWeight: number): number | null {
  const forGamme = tiers
    .filter((t) => t.gamme === gamme)
    .sort((a, b) => Number(a.tier_max_g) - Number(b.tier_max_g));
  if (!forGamme.length) return null;
  for (const t of forGamme) {
    if (totalWeight <= Number(t.tier_max_g)) return Number(t.price_per_gram);
  }
  return Number(forGamme[forGamme.length - 1].price_per_gram);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentification requise" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lines, paymentMethod, notes } = await req.json();

    if (!Array.isArray(lines) || lines.length === 0) {
      return new Response(JSON.stringify({ error: "Panier vide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const method = paymentMethod === "transfer" ? "transfer" : "online";

    // Vérifier le statut pro validé
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_pro_validated, is_vat_validated, vat_number, company_name, email, address_line1, postal_code, city, phone, full_name")
      .eq("id", user.id)
      .single();

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isPro = (roles || []).some((r: any) => r.role === "pro" || r.role === "admin");
    const validated =
      isPro && profile?.is_pro_validated && profile?.is_vat_validated && !!profile?.vat_number;

    if (!validated) {
      return new Response(JSON.stringify({ error: "Compte professionnel non validé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normaliser les lignes
    const safeLines = lines
      .map((l: any) => ({
        productId: String(l.productId || ""),
        format: Number(l.format),
        units: Math.max(0, Math.floor(Number(l.units) || 0)),
      }))
      .filter((l: any) => l.productId && ALLOWED_FORMATS.has(l.format) && l.units > 0);

    if (!safeLines.length) {
      return new Response(JSON.stringify({ error: "Lignes invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productIds = [...new Set(safeLines.map((l: any) => l.productId))];
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, name, category, is_active")
      .in("id", productIds);

    for (const id of productIds) {
      const p = (dbProducts || []).find((d: any) => d.id === id);
      if (!p || p.is_active === false) {
        return new Response(JSON.stringify({ error: `Produit indisponible : ${id}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: tiers } = await supabaseAdmin
      .from("pro_price_tiers")
      .select("gamme, tier_max_g, price_per_gram");

    const totalWeight =
      Math.round(safeLines.reduce((s: number, l: any) => s + l.format * l.units, 0) * 100) / 100;

    let totalHT = 0;
    const orderItems: any[] = [];

    for (const l of safeLines) {
      const gamme = PRODUCT_TO_GAMME[l.productId] ?? "classiques";
      const ppg = pricePerGram(tiers || [], gamme, totalWeight);
      if (!ppg) {
        return new Response(JSON.stringify({ error: "Grille tarifaire pro indisponible" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const dbProduct = (dbProducts || []).find((d: any) => d.id === l.productId);
      const weight = Math.round(l.format * l.units * 100) / 100;
      const lineTotal = Math.round(weight * ppg * 100) / 100;
      totalHT += lineTotal;

      orderItems.push({
        product_id: l.productId,
        product_name: `${dbProduct?.name ?? l.productId} — ${l.format} g x${l.units}`,
        product_type: dbProduct?.category ?? "fleur",
        weight,
        quantity: l.units,
        unit_price: ppg,
        total_price: lineTotal,
      });
    }

    totalHT = Math.round(totalHT * 100) / 100;
    const totalTTC = Math.round(totalHT * 1.2 * 100) / 100;

    if (totalTTC <= 0) {
      return new Response(JSON.stringify({ error: "Montant invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deliveryAddress = [
      profile?.address_line1,
      profile?.postal_code,
      profile?.city,
    ]
      .filter(Boolean)
      .join(" ");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalTTC,
        total_flower_weight: totalWeight,
        delivery_type: "postal",
        delivery_address: deliveryAddress || null,
        contact_phone: (profile?.phone || "").slice(0, 20) || null,
        status: "pending",
        payment_status: "unpaid",
        order_channel: "pro",
        payment_method: method,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Pro order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Création de la commande impossible" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

    if (notes) {
      await supabaseAdmin
        .from("order_status_history")
        .insert({
          order_id: order.id,
          new_status: "pending",
          old_status: null,
        });
    }

    if (method === "transfer") {
      return new Response(
        JSON.stringify({ orderId: order.id, orderNumber: order.display_order_number }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Paiement en ligne Viva Wallet
    const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
    const apiKey = Deno.env.get("VIVA_API_KEY");
    const credentials = btoa(`${merchantId}:${apiKey}`);

    const vivaResponse = await fetch("https://www.vivapayments.com/api/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(totalTTC * 100),
        customerTrns: `Commande pro ${order.display_order_number || "#" + order.order_number}`,
        merchantTrns: order.id,
        fullName: profile?.company_name || profile?.full_name || "",
        email: profile?.email || "",
      }),
    });

    const vivaText = await vivaResponse.text();
    let vivaData: any;
    try {
      vivaData = JSON.parse(vivaText);
    } catch {
      console.error("Viva parse error");
      return new Response(JSON.stringify({ error: "Erreur du service de paiement" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!vivaResponse.ok || vivaData.ErrorCode !== 0) {
      console.error("Viva error:", vivaData?.ErrorCode);
      return new Response(JSON.stringify({ error: "Échec de la création du paiement" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderCodeMatch = vivaText.match(/"OrderCode"\s*:\s*(\d+)/);
    const orderCode = orderCodeMatch ? orderCodeMatch[1] : String(vivaData.OrderCode);

    await supabaseAdmin
      .from("orders")
      .update({ viva_order_code: String(orderCode) })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        orderCode,
        checkoutUrl: `https://www.vivapayments.com/web/checkout?ref=${orderCode}&color=D4AF37&paymentMethod=0`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-pro-order unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
