import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { orderId, vivaOrderCode, transactionId } = await req.json();

    if (!orderId || !vivaOrderCode) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate orderId is UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(JSON.stringify({ error: "Invalid order ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_amount, payment_status, viva_order_code, user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already paid? Return success immediately
    if (order.payment_status === "paid") {
      console.log("Order already paid:", orderId);
      return new Response(JSON.stringify({ success: true, status: "already_paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security: verify the viva_order_code matches
    if (order.viva_order_code !== String(vivaOrderCode)) {
      console.error("Order code mismatch:", order.viva_order_code, "vs", vivaOrderCode);
      return new Response(JSON.stringify({ error: "Order code mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Viva API - get transactions for this order
    const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
    const apiKey = Deno.env.get("VIVA_API_KEY");
    const credentials = btoa(`${merchantId}:${apiKey}`);

    // Use Viva's order endpoint to check if the order has been paid
    const vivaResponse = await fetch(
      `https://www.vivapayments.com/api/orders/${vivaOrderCode}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    if (!vivaResponse.ok) {
      console.error("Viva order check failed:", vivaResponse.status);
      return new Response(JSON.stringify({ error: "Payment verification failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vivaOrder = await vivaResponse.json();
    console.log("Viva order state:", vivaOrder.StateId, "for order:", orderId);

    // Viva StateId: 0 = Pending, 2 = Expired/Cancelled, 
    // Check if there are completed payments
    // PaymentAmount is the amount already paid in cents
    const paidAmount = vivaOrder.PaymentAmount || 0;
    const expectedAmount = Math.round(order.total_amount * 100);

    if (paidAmount >= expectedAmount) {
      // Payment confirmed!
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "preparing",
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update order" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Order ${orderId} verified and marked as paid`);

      // Trigger loyalty counter update if user is authenticated
      if (order.user_id) {
        console.log("Order paid for user:", order.user_id);
      }

      // Send confirmation email (fire-and-forget)
      try {
        const emailUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-confirmation`;
        fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ orderId }),
        }).catch((e) => console.error("Fire-and-forget email error:", e));
      } catch (e) {
        console.error("Email trigger error:", e);
      }

      return new Response(JSON.stringify({ success: true, status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.log("Payment not yet confirmed. Paid:", paidAmount, "Expected:", expectedAmount);
      return new Response(JSON.stringify({ success: false, status: "pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
