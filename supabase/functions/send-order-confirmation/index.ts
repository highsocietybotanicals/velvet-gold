import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireServiceRole(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!anonKey) return jsonResponse({ error: "Authentication unavailable" }, 500);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || data?.claims?.role !== "service_role") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authError = await requireServiceRole(req);
    if (authError) return authError;

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
    const { data: allItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Failed to fetch order items:", itemsError);
    }

    // Separate items by type
    const billedItems = (allItems || []).filter((i: any) => i.product_type !== "sample" && i.product_type !== "gift");
    const sampleItemsList = (allItems || []).filter((i: any) => i.product_type === "sample");
    const giftItemsList = (allItems || []).filter((i: any) => i.product_type === "gift");

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

    // Check promo code usage for this order
    let promoUsed = null;
    if (order.user_id) {
      const { data: promoData } = await supabase
        .from("promo_code_usage")
        .select("code, discount_percent, discount_amount")
        .eq("order_id", orderId)
        .maybeSingle();
      promoUsed = promoData;
    }

    // Check if this is the customer's first paid order (to show BIENVENUE15 code)
    let isFirstOrder = false;
    if (order.user_id) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", order.user_id)
        .eq("payment_status", "paid");
      isFirstOrder = (count || 0) <= 1;
    }

    // Check if user already used BIENVENUE15
    let alreadyUsedPromo = false;
    if (order.user_id && !isFirstOrder) {
      const { data: usage } = await supabase
        .from("promo_code_usage")
        .select("id")
        .eq("user_id", order.user_id)
        .eq("code", "BIENVENUE15")
        .maybeSingle();
      alreadyUsedPromo = !!usage;
    }

    // Build billed items table rows
    const itemRows = billedItems
      .map((item: any) => {
        const weightOrQty = item.weight ? `${item.weight}g` : `x${item.quantity || 1}`;
        const typeLabel = item.product_type === "fleur" ? "Fleur" : item.product_type === "resine" ? "Resine" : item.product_type === "accessoire" ? "Accessoire" : item.product_type;
        return `<tr><td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;">${item.product_name}</td><td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#999;text-align:center;">${typeLabel}</td><td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:center;">${weightOrQty}</td><td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:right;">${Number(item.unit_price).toFixed(2)} EUR</td><td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#d4af37;text-align:right;font-weight:600;">${Number(item.total_price).toFixed(2)} EUR</td></tr>`;
      })
      .join("");

    // Build samples section
    const samplesBlock = sampleItemsList.length > 0 ? `<div style="background-color:#1a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #2a5a2a;"><h3 style="color:#4ade80;font-size:14px;font-weight:500;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Echantillons gratuits offerts</h3>${sampleItemsList.map((s: any) => `<p style="color:#e0e0e0;margin:0 0 4px;font-size:14px;">&#127793; ${s.product_name} - 1g <span style="color:#4ade80;font-weight:600;">GRATUIT</span></p>`).join("")}</div>` : "";

    // Build gifts section (currently disabled but ready)
    const giftsBlock = giftItemsList.length > 0 ? `<div style="background-color:#1a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #3a2a1a;"><h3 style="color:#d4af37;font-size:14px;font-weight:500;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Cadeaux offerts</h3>${giftItemsList.map((g: any) => `<p style="color:#e0e0e0;margin:0 0 4px;font-size:14px;">&#127873; ${g.product_name} <span style="color:#d4af37;font-weight:600;">OFFERT</span></p>`).join("")}</div>` : "";

    // Build discount info block
    let discountBlock = "";
    const billedSubtotal = billedItems.reduce((sum: number, i: any) => sum + Number(i.total_price), 0);
    const hasWeightDiscount = billedSubtotal > Number(order.total_amount) + (promoUsed?.discount_amount || 0);

    if (promoUsed || hasWeightDiscount) {
      let discountLines = "";
      if (hasWeightDiscount) {
        const rawTotal = billedItems.reduce((sum: number, i: any) => {
          if (i.weight) return sum + Number(i.unit_price) * Number(i.weight);
          return sum + Number(i.unit_price) * (Number(i.quantity) || 1);
        }, 0);
        const weightSavings = rawTotal - billedSubtotal;
        if (weightSavings > 0.01) {
          discountLines += `<p style="color:#e0e0e0;margin:0 0 4px;font-size:14px;">Remise palier poids : <span style="color:#4ade80;font-weight:600;">-${weightSavings.toFixed(2)} EUR</span></p>`;
        }
      }
      if (promoUsed) {
        discountLines += `<p style="color:#e0e0e0;margin:0 0 4px;font-size:14px;">Code promo ${promoUsed.code} (-${promoUsed.discount_percent}%) : <span style="color:#4ade80;font-weight:600;">-${Number(promoUsed.discount_amount).toFixed(2)} EUR</span></p>`;
      }
      if (discountLines) {
        discountBlock = `<div style="background-color:#1a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #2a2a2a;"><h3 style="color:#d4af37;font-size:14px;font-weight:500;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Remises appliquees</h3>${discountLines}</div>`;
      }
    }

    // Delivery info
    const deliveryTypeLabel = order.delivery_type === "delivery" ? "Livraison a domicile" : order.delivery_type === "pickup" ? "Retrait en point relais" : order.delivery_type === "postal" ? "Envoi postal" : order.delivery_type === "personal" ? "Remise en main propre" : order.delivery_type;
    const deliveryDetails: string[] = [];
    if (order.delivery_address) deliveryDetails.push(order.delivery_address);
    if (order.delivery_date) {
      const date = new Date(order.delivery_date);
      deliveryDetails.push(date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    }
    if (order.delivery_time) deliveryDetails.push(`Creneau : ${order.delivery_time}`);

    const greeting = firstName ? `${firstName}` : "";
    const greetingLine = greeting ? `Salut ${greeting}` : "Hey";

    // Promo code block for first order (show BIENVENUE15 for next order)
    let promoBlock = "";
    if (isFirstOrder && !alreadyUsedPromo) {
      promoBlock = `<div style="background:linear-gradient(135deg,#1a0f2e 0%,#2d1b4e 100%);border:2px dashed #d4af37;border-radius:12px;padding:24px;margin:32px 0;text-align:center;"><p style="margin:0 0 4px;color:#d4af37;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Cadeau de bienvenue</p><p style="margin:0 0 12px;color:#e0e0e0;font-size:15px;">Merci pour ta confiance ! Voici <strong style="color:#d4af37;">-15%</strong> sur ta prochaine commande :</p><div style="background-color:#0a0a0a;border-radius:8px;padding:14px 24px;display:inline-block;"><span style="color:#d4af37;font-size:26px;font-weight:800;letter-spacing:4px;font-family:monospace;">BIENVENUE15</span></div><p style="margin:12px 0 0;color:#888;font-size:12px;">Valable sur ta prochaine commande - Usage unique</p></div>`;
    }

    // Build the full HTML email - all on minimal lines to avoid =20 issues
    const htmlEmail = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
      '<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">',
      '<div style="max-width:640px;margin:0 auto;background-color:#111111;">',
      '<div style="background:linear-gradient(135deg,#1a1a1a 0%,#111111 100%);padding:40px 32px;text-align:center;border-bottom:2px solid #d4af37;">',
      '<h1 style="margin:0;font-size:28px;color:#d4af37;letter-spacing:2px;font-weight:300;">HIGH SOCIETY</h1>',
      '<p style="margin:4px 0 0;font-size:12px;color:#888;letter-spacing:4px;text-transform:uppercase;">Botanicals</p></div>',
      '<div style="padding:40px 32px;">',
      `<p style="color:#e0e0e0;font-size:18px;line-height:1.6;margin:0 0 16px;">${greetingLine}</p>`,
      '<p style="color:#e0e0e0;font-size:16px;line-height:1.7;margin:0 0 8px;">Un grand merci pour ta commande !</p>',
      '<p style="color:#bbb;font-size:15px;line-height:1.7;margin:0 0 24px;">On s\'en occupe avec soin et on te tient au courant. Voici le recap :</p>',
      `<div style="background:linear-gradient(135deg,#1a1507 0%,#2a200a 100%);border:1px solid #d4af37;border-radius:8px;padding:16px 24px;margin-bottom:32px;text-align:center;"><p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Commande</p><p style="margin:4px 0 0;color:#d4af37;font-size:24px;font-weight:700;letter-spacing:1px;">${orderNumber}</p></div>`,
      '<h2 style="color:#d4af37;font-size:18px;font-weight:500;margin:0 0 16px;letter-spacing:1px;">Tes articles</h2>',
      '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;"><thead><tr style="border-bottom:2px solid #d4af37;">',
      '<th style="padding:12px 16px;text-align:left;color:#d4af37;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Produit</th>',
      '<th style="padding:12px 16px;text-align:center;color:#d4af37;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Type</th>',
      '<th style="padding:12px 16px;text-align:center;color:#d4af37;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Qte</th>',
      '<th style="padding:12px 16px;text-align:right;color:#d4af37;font-size:12px;text-transform:uppercase;letter-spacing:1px;">P.U.</th>',
      '<th style="padding:12px 16px;text-align:right;color:#d4af37;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total</th>',
      '</tr></thead><tbody>',
      itemRows,
      '</tbody><tfoot><tr>',
      `<td colspan="4" style="padding:16px;text-align:right;color:#e0e0e0;font-size:18px;font-weight:600;border-top:2px solid #d4af37;">Total</td>`,
      `<td style="padding:16px;text-align:right;color:#d4af37;font-size:20px;font-weight:700;border-top:2px solid #d4af37;">${Number(order.total_amount).toFixed(2)} EUR</td>`,
      '</tr></tfoot></table>',
      discountBlock,
      samplesBlock,
      giftsBlock,
      `<div style="background-color:#1a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:24px;"><h3 style="color:#d4af37;font-size:14px;font-weight:500;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Livraison</h3><p style="color:#e0e0e0;margin:0 0 4px;font-size:14px;">${deliveryTypeLabel}</p>${deliveryDetails.map((d: string) => `<p style="color:#999;margin:0 0 4px;font-size:14px;">${d}</p>`).join("")}</div>`,
      promoBlock,
      '<p style="color:#bbb;font-size:15px;line-height:1.7;margin:0 0 8px;">Si t\'as la moindre question, on est la ! Reponds simplement a cet email.</p>',
      '<p style="color:#e0e0e0;font-size:15px;line-height:1.7;margin:16px 0 0;">A tres vite,<br><span style="color:#d4af37;">L\'equipe HSB</span></p>',
      '</div>',
      '<div style="background-color:#0a0a0a;padding:32px;text-align:center;border-top:1px solid #2a2a2a;">',
      '<p style="color:#d4af37;font-size:14px;margin:0 0 8px;font-weight:500;">High Society Botanicals</p>',
      '<p style="color:#666;font-size:12px;margin:0 0 4px;">contacts@highsocietybotanicals.com</p>',
      '<p style="color:#666;font-size:12px;margin:0;">highsocietybotanicals.com</p></div>',
      '</div></body></html>',
    ].join("");

    // Build plain text version
    const textContent = [
      `${greetingLine}`,
      "",
      "Un grand merci pour ta commande !",
      `Commande : ${orderNumber}`,
      "",
      "--- Tes articles ---",
      ...billedItems.map((i: any) => `${i.product_name} - ${i.weight ? i.weight + "g" : "x" + (i.quantity || 1)} - ${Number(i.total_price).toFixed(2)} EUR`),
      "",
      `Total : ${Number(order.total_amount).toFixed(2)} EUR`,
      "",
      ...(sampleItemsList.length > 0 ? ["--- Echantillons gratuits ---", ...sampleItemsList.map((s: any) => `${s.product_name} - 1g GRATUIT`), ""] : []),
      ...(promoUsed ? [`Code promo ${promoUsed.code} : -${Number(promoUsed.discount_amount).toFixed(2)} EUR`, ""] : []),
      `Livraison : ${deliveryTypeLabel}`,
      ...deliveryDetails,
      "",
      ...(isFirstOrder && !alreadyUsedPromo ? ["Code promo pour ta prochaine commande : BIENVENUE15 (-15%)", ""] : []),
      "A tres vite,",
      "L'equipe HSB",
    ].join("\n");

    // Generate invoice PDF
    let invoicePdfBase64: string | null = null;
    let invoiceFileName = `facture-${orderNumber}.pdf`;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const invoiceRes = await fetch(`${supabaseUrl}/functions/v1/generate-invoice-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ orderId }),
      });
      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        invoicePdfBase64 = invoiceData.pdfBase64;
        if (invoiceData.invoiceNumber) {
          invoiceFileName = `${invoiceData.invoiceNumber}.pdf`;
        }
        console.log("Invoice PDF generated successfully");
      } else {
        console.error("Failed to generate invoice PDF:", await invoiceRes.text());
      }
    } catch (invoiceErr) {
      console.error("Invoice generation error:", invoiceErr);
    }

    // Send via Gmail SMTP with MIME multipart (attachment if PDF available)
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

    const sendOptions: any = {
      from: `HSB <${gmailUser}>`,
      to: recipientEmail,
      subject: `Merci ${orderNumber} - HSB`,
      content: textContent,
      html: htmlEmail,
    };

    if (invoicePdfBase64) {
      // denomailer supports attachments
      sendOptions.attachments = [
        {
          encoding: "base64",
          filename: invoiceFileName,
          content: invoicePdfBase64,
          contentType: "application/pdf",
        },
      ];
    }

    await client.send(sendOptions);

    await client.close();

    // Log success
    await supabase.from("email_send_log").insert({
      template_name: "order_confirmation",
      recipient_email: recipientEmail,
      status: "sent",
      metadata: { order_id: orderId, order_number: orderNumber },
    });

    console.log(`Confirmation email sent to ${recipientEmail} for order ${orderNumber}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send confirmation email error:", error);

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
