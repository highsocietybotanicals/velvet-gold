import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STATUS_LABELS: Record<string, { label: string; emoji: string; message: string; color: string }> = {
  preparing: {
    label: "En preparation",
    emoji: "📦",
    message: "Ta commande est en cours de preparation par notre equipe. On met tout en oeuvre pour que ce soit parfait !",
    color: "#f59e0b",
  },
  shipped: {
    label: "Expediee",
    emoji: "🚀",
    message: "Ta commande vient d'etre expediee ! Elle est en route vers toi.",
    color: "#3b82f6",
    withTracking: true,
  },
  in_delivery: {
    label: "En livraison",
    emoji: "🚚",
    message: "Le livreur est en chemin ! Tu devrais recevoir ta commande tres bientot.",
    color: "#8b5cf6",
  },
  delivered: {
    label: "Livree",
    emoji: "✅",
    message: "Ta commande a ete livree avec succes ! On espere que tu vas kiffer. N'hesite pas a nous donner ton avis !",
    color: "#22c55e",
  },
  cancelled: {
    label: "Annulee",
    emoji: "❌",
    message: "Ta commande a ete annulee. Si tu as des questions, n'hesite pas a nous contacter.",
    color: "#ef4444",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus } = await req.json();

    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({ error: "Missing orderId or newStatus" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusInfo = STATUS_LABELS[newStatus];
    if (!statusInfo) {
      console.log("No email for status:", newStatus);
      return new Response(JSON.stringify({ success: true, status: "no_email_for_status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recipient email
    let recipientEmail = order.guest_email;
    let recipientName = order.guest_name || "";

    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .single();
      if (profile) {
        recipientEmail = profile.email;
        recipientName = profile.full_name || "";
      }
    }

    if (!recipientEmail) {
      console.error("No email for order:", orderId);
      return new Response(JSON.stringify({ error: "No recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderNumber = order.display_order_number || `HSB-${String(order.order_number).padStart(6, "0")}`;
    const firstName = recipientName.split(" ")[0] || "";
    const greetingLine = firstName ? `Salut ${firstName}` : "Hey";

    // Build status timeline from history
    const { data: history } = await supabase
      .from("order_status_history")
      .select("new_status, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    const timelineRows = (history || []).map((h: any) => {
      const info = STATUS_LABELS[h.new_status];
      if (!info) return "";
      const date = new Date(h.created_at);
      const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const isLatest = h.new_status === newStatus;
      return `<tr><td style="padding:8px 12px;color:${isLatest ? info.color : '#888'};font-weight:${isLatest ? '700' : '400'};font-size:14px;">${info.emoji} ${info.label}</td><td style="padding:8px 12px;color:#999;font-size:13px;text-align:right;">${dateStr}</td></tr>`;
    }).join("");

    const htmlEmail = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
      '<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">',
      '<div style="max-width:640px;margin:0 auto;background-color:#111111;">',
      '<div style="background:linear-gradient(135deg,#1a1a1a 0%,#111111 100%);padding:40px 32px;text-align:center;border-bottom:2px solid #d4af37;">',
      '<h1 style="margin:0;font-size:28px;color:#d4af37;letter-spacing:2px;font-weight:300;">HIGH SOCIETY</h1>',
      '<p style="margin:4px 0 0;font-size:12px;color:#888;letter-spacing:4px;text-transform:uppercase;">Botanicals</p></div>',
      '<div style="padding:40px 32px;">',
      `<p style="color:#e0e0e0;font-size:18px;line-height:1.6;margin:0 0 16px;">${greetingLine}</p>`,
      `<div style="background:linear-gradient(135deg,#1a1507 0%,#2a200a 100%);border:1px solid #d4af37;border-radius:8px;padding:16px 24px;margin-bottom:24px;text-align:center;"><p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Commande</p><p style="margin:4px 0 0;color:#d4af37;font-size:24px;font-weight:700;letter-spacing:1px;">${orderNumber}</p></div>`,
      `<div style="background-color:#1a1a1a;border-left:4px solid ${statusInfo.color};border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">`,
      `<p style="margin:0 0 8px;color:${statusInfo.color};font-size:20px;font-weight:700;">${statusInfo.emoji} ${statusInfo.label}</p>`,
      `<p style="margin:0;color:#e0e0e0;font-size:15px;line-height:1.6;">${statusInfo.message}</p></div>`,
      // Tracking link for shipped orders
      (statusInfo as any).withTracking && order.tracking_number
        ? `<div style="background:linear-gradient(135deg,#0a1628 0%,#1a2a4a 100%);border:1px solid #3b82f6;border-radius:8px;padding:20px 24px;margin-bottom:24px;text-align:center;"><p style="margin:0 0 8px;color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Numero de suivi Colissimo</p><p style="margin:0 0 16px;color:#fff;font-size:20px;font-weight:700;font-family:monospace;letter-spacing:2px;">${order.tracking_number}</p><a href="${order.tracking_url || 'https://www.laposte.fr/outils/suivre-vos-envois?code=' + order.tracking_number}" target="_blank" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">Suivre mon colis sur La Poste</a></div>`
        : '',
      timelineRows ? `<div style="background-color:#1a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:24px;"><h3 style="color:#d4af37;font-size:14px;font-weight:500;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Suivi de ta commande</h3><table style="width:100%;border-collapse:collapse;">${timelineRows}</table></div>` : '',
      '<p style="color:#bbb;font-size:15px;line-height:1.7;margin:0 0 8px;">Une question ? Reponds simplement a cet email.</p>',
      '<p style="color:#e0e0e0;font-size:15px;line-height:1.7;margin:16px 0 0;">A tres vite,<br><span style="color:#d4af37;">L\'equipe HSB</span></p>',
      '</div>',
      '<div style="background-color:#0a0a0a;padding:32px;text-align:center;border-top:1px solid #2a2a2a;">',
      '<p style="color:#d4af37;font-size:14px;margin:0 0 8px;font-weight:500;">High Society Botanicals</p>',
      '<p style="color:#666;font-size:12px;margin:0 0 4px;">contacts@highsocietybotanicals.com</p>',
      '<p style="color:#666;font-size:12px;margin:0;">highsocietybotanicals.com</p></div>',
      '</div></body></html>',
    ].join("");

    const textContent = [
      greetingLine,
      "",
      `Commande ${orderNumber}`,
      "",
      `${statusInfo.emoji} ${statusInfo.label}`,
      statusInfo.message,
      "",
      ...((statusInfo as any).withTracking && order.tracking_number
        ? [`N° de suivi Colissimo : ${order.tracking_number}`, `Suivre mon colis : ${order.tracking_url || 'https://www.laposte.fr/outils/suivre-vos-envois?code=' + order.tracking_number}`, ""]
        : []),
      ...(history || []).map((h: any) => {
        const info = STATUS_LABELS[h.new_status];
        if (!info) return "";
        const date = new Date(h.created_at);
        return `${info.emoji} ${info.label} - ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
      }).filter(Boolean),
      "",
      "A tres vite,",
      "L'equipe HSB",
    ].join("\n");

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
      from: `HSB <${gmailUser}>`,
      to: recipientEmail,
      subject: `${statusInfo.emoji} ${orderNumber} - ${statusInfo.label}`,
      content: textContent,
      html: htmlEmail,
    });

    await client.close();

    // Log
    await supabase.from("email_send_log").insert({
      template_name: "status_update",
      recipient_email: recipientEmail,
      status: "sent",
      metadata: { order_id: orderId, order_number: orderNumber, new_status: newStatus },
    });

    console.log(`Status update email sent to ${recipientEmail} for ${orderNumber} -> ${newStatus}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Status update email error:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
