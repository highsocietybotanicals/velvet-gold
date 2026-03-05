import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Viva sends a GET request for verification
  if (req.method === "GET") {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    console.log("Viva webhook received:", JSON.stringify(body));

    const eventTypeId = body.EventTypeId;
    const eventData = body.EventData;

    // EventTypeId 1796 = Transaction Payment Created (successful payment)
    if (eventTypeId !== 1796) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantTrns = eventData?.MerchantTrns; // This is the order ID
    const transactionId = eventData?.TransactionId;

    if (!merchantTrns) {
      console.error("No MerchantTrns in webhook");
      return new Response(JSON.stringify({ error: "Missing order reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify transaction with Viva API
    const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
    const apiKey = Deno.env.get("VIVA_API_KEY");
    const credentials = btoa(`${merchantId}:${apiKey}`);

    const verifyResponse = await fetch(
      `https://demo.vivapayments.com/api/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error("Transaction verification failed");
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txData = await verifyResponse.json();
    console.log("Transaction verified:", txData.StatusId);

    // Update order status
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (txData.StatusId === "F") {
      // F = completed/finalized
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "preparing",
        })
        .eq("id", merchantTrns);

      console.log(`Order ${merchantTrns} marked as paid`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
