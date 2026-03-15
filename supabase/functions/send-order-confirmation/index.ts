import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency check
    const { data: existingLog } = await supabase
      .from("email_send_log")
      .select("id")
      .eq("template_name", "order_confirmation")
      .eq("status", "sent")
      .eq("metadata->>order_id", orderId)
      .maybeSingle();

    if (existingLog) {
      console.log("Email already sent for order:", orderId);
      return new Response(JSON.stringify({ success: true, status: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Failed to fetch order items:", itemsError);
    }

    // Fetch client profile if user_id exists
    let profile = null;
    if (order.user_id) {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", order.user_id)
        .single();
      profile = p;
    }

    // Determine recipient email and name
    const recipientEmail = profile?.email || order.guest_email;
    const recipientName = profile?.full_name || order.guest_name || "";
    const firstName = recipientName.split(" ")[0] || "";

    if (!recipientEmail) {
      console.error("No email found for order:", orderId);
      return new Response(JSON.stringify({ error: "No recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderNumber = order.display_order_number || `HSB-${String(order.order_number).padStart(6, "0")}`;

    // Check if this is the customer's first order (for promo code)
    let isFirstOrder = false;
    if (order.user_id) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", order.user_id)
        .eq("payment_status", "paid");
      isFirstOrder = (count || 0) <= 1;
    }

    // Build items table rows
    const itemRows = (items || [])
      .map((item) => {
        const weightOrQty = item.weight
          ? `${item.weight}g`
          : `x${item.quantity || 1}`;
        const typeLabel = item.product_type === "flower" ? "Fleur" : item.product_type === "resin" ? "Résine" : item.product_type === "accessory" ? "Accessoire" : item.product_type;
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #e0e0e0;">${item.product_name}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #999; text-align: center;">${typeLabel}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #e0e0e0; text-align: center;">${weightOrQty}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #e0e0e0; text-align: right;">${Number(item.unit_price).toFixed(2)} €</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a2a; color: #d4af37; text-align: right; font-weight: 600;">${Number(item.total_price).toFixed(2)} €</td>
          </tr>`;
      })
      .join("");

    // Delivery info
    const deliveryTypeLabel = order.delivery_type === "delivery" ? "Livraison à domicile" : order.delivery_type === "pickup" ? "Retrait en point relais" : order.delivery_type;
    const deliveryDetails = [];
    if (order.delivery_address) deliveryDetails.push(order.delivery_address);
    if (order.delivery_date) {
      const date = new Date(order.delivery_date);
      deliveryDetails.push(date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    }
    if (order.delivery_time) deliveryDetails.push(`Créneau : ${order.delivery_time}`);

    const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; background-color: #111111;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111111 100%); padding: 40px 32px; text-align: center; border-bottom: 2px solid #d4af37;">
      <h1 style="margin: 0; font-size: 28px; color: #d4af37; letter-spacing: 2px; font-weight: 300;">HIGH SOCIETY</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #888; letter-spacing: 4px; text-transform: uppercase;">Botanicals</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">${greeting}</p>
      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Merci pour votre commande ! Nous l'avons bien reçue et elle est en cours de préparation.
      </p>

      <!-- Order number badge -->
      <div style="background: linear-gradient(135deg, #1a1507 0%, #2a200a 100%); border: 1px solid #d4af37; border-radius: 8px; padding: 16px 24px; margin-bottom: 32px; text-align: center;">
        <p style="margin: 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Commande</p>
        <p style="margin: 4px 0 0; color: #d4af37; font-size: 24px; font-weight: 700; letter-spacing: 1px;">${orderNumber}</p>
      </div>

      <!-- Items table -->
      <h2 style="color: #d4af37; font-size: 18px; font-weight: 500; margin: 0 0 16px; letter-spacing: 1px;">Détail de votre commande</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #d4af37;">
            <th style="padding: 12px 16px; text-align: left; color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Produit</th>
            <th style="padding: 12px 16px; text-align: center; color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Type</th>
            <th style="padding: 12px 16px; text-align: center; color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qté</th>
            <th style="padding: 12px 16px; text-align: right; color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">P.U.</th>
            <th style="padding: 12px 16px; text-align: right; color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="padding: 16px; text-align: right; color: #e0e0e0; font-size: 18px; font-weight: 600; border-top: 2px solid #d4af37;">Total</td>
            <td style="padding: 16px; text-align: right; color: #d4af37; font-size: 20px; font-weight: 700; border-top: 2px solid #d4af37;">${Number(order.total_amount).toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>

      <!-- Delivery info -->
      <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px;">
        <h3 style="color: #d4af37; font-size: 14px; font-weight: 500; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Livraison</h3>
        <p style="color: #e0e0e0; margin: 0 0 4px; font-size: 14px;">${deliveryTypeLabel}</p>
        ${deliveryDetails.map((d) => `<p style="color: #999; margin: 0 0 4px; font-size: 14px;">${d}</p>`).join("")}
      </div>

      <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 0;">
        Vous recevrez un message lorsque votre commande sera expédiée. Pour toute question, n'hésitez pas à nous contacter.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0a; padding: 32px; text-align: center; border-top: 1px solid #2a2a2a;">
      <p style="color: #d4af37; font-size: 14px; margin: 0 0 8px; font-weight: 500;">High Society Botanicals</p>
      <p style="color: #666; font-size: 12px; margin: 0 0 4px;">contacts@highsocietybotanicals.com</p>
      <p style="color: #666; font-size: 12px; margin: 0;">highsocietybotanicals.com</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER")!;
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")!;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    await client.send({
      from: `High Society Botanicals <${gmailUser}>`,
      to: recipientEmail,
      subject: `Merci pour votre commande ${orderNumber} — High Society Botanicals`,
      html: htmlEmail,
    });

    await client.close();

    // Log success
    await supabase.from("email_send_log").insert({
      template_name: "order_confirmation",
      recipient_email: recipientEmail,
      status: "sent",
      metadata: { order_id: orderId, order_number: orderNumber },
    });

    console.log(`✅ Confirmation email sent to ${recipientEmail} for order ${orderNumber}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send confirmation email error:", error);

    // Try to log failure
    try {
      const { orderId } = await req.clone().json().catch(() => ({ orderId: "unknown" }));
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("email_send_log").insert({
        template_name: "order_confirmation",
        recipient_email: "unknown",
        status: "failed",
        error_message: String(error),
        metadata: { order_id: orderId },
      });
    } catch (_) {
      // ignore logging failure
    }

    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
