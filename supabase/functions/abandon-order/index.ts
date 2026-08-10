import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, vivaOrderCode } = await req.json();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || !uuidRegex.test(orderId) || !vivaOrderCode) {
      return json({ error: "Paramètres invalides" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order } = await supabase
      .from("orders")
      .select("id, total_amount, payment_status, viva_order_code, order_channel")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) return json({ deleted: false, reason: "not_found" });

    // Sécurité : le code Viva doit correspondre à celui stocké
    if (order.viva_order_code !== String(vivaOrderCode)) {
      return json({ deleted: false, reason: "code_mismatch" });
    }

    if (order.payment_status === "paid") {
      return json({ deleted: false, reason: "already_paid" });
    }

    // Trust but verify : on interroge Viva avant de supprimer
    try {
      const credentials = btoa(
        `${Deno.env.get("VIVA_MERCHANT_ID")}:${Deno.env.get("VIVA_API_KEY")}`
      );
      const vivaResponse = await fetch(
        `https://www.vivapayments.com/api/orders/${vivaOrderCode}`,
        { headers: { Authorization: `Basic ${credentials}` } }
      );
      if (vivaResponse.ok) {
        const vivaOrder = await vivaResponse.json();
        const paidAmount = vivaOrder.PaymentAmount || 0;
        if (paidAmount >= Math.round(Number(order.total_amount) * 100)) {
          console.log("Order actually paid, keeping it:", orderId);
          return json({ deleted: false, reason: "paid_on_viva" });
        }
      }
    } catch (e) {
      console.error("Viva check error:", e);
    }

    // Nettoyage des dépendances puis de la commande
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase.from("order_status_history").delete().eq("order_id", orderId);
    await supabase.from("delivery_mileage").delete().eq("order_id", orderId);
    await supabase.from("promo_code_usage").delete().eq("order_id", orderId);

    const { error: deleteError } = await supabase.from("orders").delete().eq("id", orderId);
    if (deleteError) {
      console.error("Abandon delete error:", deleteError);
      return json({ error: "Suppression impossible" }, 500);
    }

    console.log("Abandoned order deleted:", orderId);
    return json({ deleted: true });
  } catch (error) {
    console.error("abandon-order error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
