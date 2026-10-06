import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ALLOWED_FORMATS,
  KIT_DEDUCTION_PROMO_CODE,
  KIT_PRICE_HT,
  KIT_PROMO_CODE,
  KIT_UNITS,
  PRO_MIN_ORDER_HT,
  VAT_RATE,
  isKitCart,
  kitStatusFromOrders,
  proPricePerGram,
} from "../_shared/proOffer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const round2 = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentification requise" }, 401);
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
      return json({ error: "Session invalide" }, 401);
    }

    const { lines, paymentMethod, notes } = await req.json();

    if (!Array.isArray(lines) || lines.length === 0) {
      return json({ error: "Panier vide" }, 400);
    }

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

    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    const isCommercial = (roles || []).some((r: any) => r.role === "commercial");
    const isPro = (roles || []).some((r: any) => r.role === "pro");
    const validatedPartner =
      isPro && profile?.is_pro_validated && profile?.is_vat_validated && !!profile?.vat_number;
    const isStaff = isAdmin || isCommercial;

    if (!isStaff && !validatedPartner) {
      return json({ error: "Compte professionnel non validé" }, 403);
    }

    // Partenaires : paiement intégral à la commande, par virement.
    // Le règlement TPE à la remise reste réservé aux commandes saisies par l'équipe.
    const method = paymentMethod === "physical" && isStaff ? "physical" : "transfer";

    // Normaliser les lignes
    const safeLines = lines
      .map((l: any) => ({
        productId: String(l.productId || ""),
        format: Number(l.format),
        units: Math.max(0, Math.floor(Number(l.units) || 0)),
      }))
      .filter((l: any) => l.productId && ALLOWED_FORMATS.has(l.format) && l.units > 0);

    if (!safeLines.length) {
      return json({ error: "Lignes invalides" }, 400);
    }

    const productIds = [...new Set(safeLines.map((l: any) => l.productId))];
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, name, category, price, price_group, is_active, is_out_of_stock")
      .in("id", productIds);

    for (const id of productIds) {
      const p = (dbProducts || []).find((d: any) => d.id === id);
      if (!p || p.is_active === false || p.is_out_of_stock === true) {
        return json({ error: `Produit indisponible : ${id}` }, 400);
      }
    }

    // Historique pro du partenaire : kit découverte et déduction
    const { data: pastOrders } = await supabaseAdmin
      .from("orders")
      .select("created_at, status, promo_code")
      .eq("user_id", user.id)
      .eq("order_channel", "pro");
    const kit = kitStatusFromOrders(pastOrders || []);

    const isKitOrder = !isStaff && kit.kitAvailable && isKitCart(safeLines);

    const { data: tiers } = await supabaseAdmin
      .from("pro_price_tiers")
      .select("gamme, tier_max_g, price_per_gram");

    const totalWeight = round2(safeLines.reduce((s: number, l: any) => s + l.format * l.units, 0));

    let totalHT = 0;
    const orderItems: any[] = [];

    for (const l of safeLines) {
      const dbProduct = (dbProducts || []).find((d: any) => d.id === l.productId);
      // Kit découverte : prix forfaitaire réparti sur les 4 pochons de 1 g
      const ppg = isKitOrder
        ? round2(KIT_PRICE_HT / KIT_UNITS)
        : proPricePerGram(
            tiers || [],
            l.productId,
            totalWeight,
            l.format,
            Number(dbProduct?.price ?? 0),
            dbProduct?.price_group ?? "A"
          );

      if (!ppg) {
        return json({ error: "Grille tarifaire pro indisponible" }, 500);
      }
      const weight = round2(l.format * l.units);
      const lineTotal = round2(weight * ppg);
      totalHT += lineTotal;

      orderItems.push({
        product_id: l.productId,
        product_name: `${dbProduct?.name ?? l.productId} — ${l.format} g x${l.units}${isKitOrder ? " (kit découverte)" : ""}`,
        product_type: dbProduct?.category ?? "fleur",
        weight,
        quantity: l.units,
        unit_price: ppg,
        total_price: lineTotal,
      });
    }

    totalHT = round2(totalHT);

    if (!isStaff && !isKitOrder && totalHT < PRO_MIN_ORDER_HT) {
      return json(
        {
          error: `Minimum de commande : ${PRO_MIN_ORDER_HT} € HT (panier actuel ${totalHT.toFixed(2)} € HT).`,
          code: "below_minimum",
        },
        400
      );
    }

    // Kit découverte déduit de la commande suivante passée dans le mois
    const deductionHT = !isStaff && !isKitOrder && kit.deductionAvailable ? KIT_PRICE_HT : 0;
    const payableHT = round2(totalHT - deductionHT);
    const totalTTC = round2(payableHT * (1 + VAT_RATE));

    if (totalTTC <= 0) {
      return json({ error: "Montant invalide" }, 400);
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
        promo_code: isKitOrder ? KIT_PROMO_CODE : deductionHT > 0 ? KIT_DEDUCTION_PROMO_CODE : null,
        promo_discount_amount: deductionHT > 0 ? round2(deductionHT * (1 + VAT_RATE)) : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Pro order creation error:", orderError);
      return json({ error: "Création de la commande impossible" }, 500);
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

    // Alerte Telegram à l'équipe (sans bloquer la commande)
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-admin-telegram`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id, eventType: isKitOrder ? "pro_kit" : "pro_order" }),
      });
    } catch (e) {
      console.error("Telegram notify (pro order) failed:", e);
    }

    // Aucun paiement en ligne pour les pros : virement à la commande (ou TPE
    // pour les commandes saisies par l'équipe), validé dans l'administration.
    return json({
      orderId: order.id,
      orderNumber: order.display_order_number,
      paymentMethod: method,
      totalHT: payableHT,
      totalTTC,
      deductionHT,
      isKit: isKitOrder,
    });
  } catch (error) {
    console.error("create-pro-order unexpected error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
