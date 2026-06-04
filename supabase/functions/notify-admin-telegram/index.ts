import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, eventType } = await req.json();
    if (!orderId) throw new Error("orderId required");

    const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const telegramKey = Deno.env.get("TELEGRAM_API_KEY");

    if (!chatId || !lovableKey || !telegramKey) {
      console.log("Telegram admin notify skipped: missing env (chat_id/api_keys)");
      return new Response(JSON.stringify({ skipped: true, reason: "missing config" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order } = await supabase
      .from("orders")
      .select("display_order_number, order_number, total_amount, total_flower_weight, delivery_type, guest_name, guest_email, user_id, contact_phone, delivery_address, relay_point_name, order_items(product_name, weight, quantity, product_type)")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Order not found");

    let clientName = order.guest_name || order.guest_email || "Client";
    if (!order.guest_email && order.user_id) {
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", order.user_id).single();
      clientName = profile?.full_name || profile?.email || clientName;
    }

    const deliveryLabel = order.delivery_type === "personal" ? "🚗 Main propre" : order.delivery_type === "relay" ? "📦 Point Relais" : "✉️ Postal";
    const orderNum = order.display_order_number || `#${order.order_number}`;

    const itemsLines = (order.order_items || [])
      .filter((i: any) => i.product_type !== "gift" && i.product_type !== "sample")
      .map((i: any) => `  • ${i.product_name}${i.weight ? ` — ${i.weight}g` : i.quantity ? ` ×${i.quantity}` : ""}`)
      .join("\n");

    const emoji = eventType === "paid" ? "💰" : "🆕";
    const title = eventType === "paid" ? "COMMANDE PAYÉE" : "Nouvelle commande";

    const text = [
      `${emoji} *${title}* — ${orderNum}`,
      ``,
      `*Total :* ${Number(order.total_amount).toFixed(2)}€  (${order.total_flower_weight}g)`,
      `*Client :* ${clientName}`,
      order.contact_phone ? `*Tél :* ${order.contact_phone}` : "",
      `*Livraison :* ${deliveryLabel}${order.relay_point_name ? ` — ${order.relay_point_name}` : ""}`,
      ``,
      `*Articles :*`,
      itemsLines || "—",
    ].filter(Boolean).join("\n");

    const tgResp = await fetch(`${TELEGRAM_GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": telegramKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });

    if (!tgResp.ok) {
      const errText = await tgResp.text();
      console.error("Telegram send failed:", tgResp.status, errText);
      return new Response(JSON.stringify({ error: "Telegram send failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-admin-telegram error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
