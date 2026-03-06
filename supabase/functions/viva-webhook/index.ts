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

  // Viva sends a GET request for webhook verification (challenge-response)
  // Must return the verification key from Viva's API
  if (req.method === "GET") {
    try {
      const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
      const apiKey = Deno.env.get("VIVA_API_KEY");
      const credentials = btoa(`${merchantId}:${apiKey}`);

      // Try production first
      let tokenResponse = await fetch(
        "https://www.vivapayments.com/api/messages/config/token",
        { headers: { Authorization: `Basic ${credentials}` } }
      );

      // Fallback to demo if production fails
      if (!tokenResponse.ok) {
        console.log("Production token fetch failed, trying demo...");
        tokenResponse = await fetch(
          "https://demo.vivapayments.com/api/messages/config/token",
          { headers: { Authorization: `Basic ${credentials}` } }
        );
      }

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.text();
        console.log("Viva verification token retrieved successfully");
        return new Response(tokenData, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: use stored verification key if API call fails
      const verificationKey = Deno.env.get("VIVA_WEBHOOK_VERIFICATION_KEY");
      if (verificationKey) {
        console.log("Using stored verification key as fallback");
        return new Response(JSON.stringify({ Key: verificationKey }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("Failed to get verification token from Viva:", tokenResponse.status);
      return new Response(JSON.stringify({ error: "Verification token unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Verification error:", err);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate merchantTrns is a valid UUID format to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(merchantTrns)) {
      console.error("Invalid MerchantTrns format:", merchantTrns);
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify transaction with Viva API
    const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
    const apiKey = Deno.env.get("VIVA_API_KEY");
    const credentials = btoa(`${merchantId}:${apiKey}`);

    const verifyResponse = await fetch(
      `https://www.vivapayments.com/api/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error("Transaction verification failed, status:", verifyResponse.status);
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txData = await verifyResponse.json();
    console.log("Transaction verified, response keys:", Object.keys(txData));

    // SECURITY: Use the amount from the VERIFIED Viva API response, NOT the webhook payload.
    // The webhook payload can be forged, but the Viva API response is trustworthy.
    // Viva /api/transactions/ returns amount in cents (e.g. 1500 = €15.00)
    const vivaAmountCents = txData.Amount;
    
    if (typeof vivaAmountCents !== "number" || vivaAmountCents <= 0) {
      console.error("Invalid amount from Viva API:", vivaAmountCents);
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also verify the MerchantTrns from the API response matches the webhook's
    const vivaOrderRef = txData.MerchantTrns;
    if (vivaOrderRef !== merchantTrns) {
      console.error("MerchantTrns mismatch: API says", vivaOrderRef, "webhook says", merchantTrns);
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get order to verify amount
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("id", merchantTrns)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", merchantTrns);
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compare: vivaAmountCents is in cents, order.total_amount is in euros
    const expectedAmountCents = Math.round(order.total_amount * 100);
    
    console.log("Amount check: Viva API says", vivaAmountCents, "cents, expected", expectedAmountCents, "cents");
    
    if (Math.abs(vivaAmountCents - expectedAmountCents) > 1) {
      console.error("Amount mismatch: Viva API", vivaAmountCents, "cents vs expected", expectedAmountCents, "cents");
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also verify the transaction status from the API response, not the webhook
    // Viva StatusId: "F" = completed/finalized
    const vivaStatusId = txData.StatusId;
    if (vivaStatusId === "F") {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "preparing",
        })
        .eq("id", merchantTrns);

      console.log(`Order ${merchantTrns} marked as paid ✅`);
    } else {
      console.log(`Order ${merchantTrns} received but StatusId is: ${eventData.StatusId}`);
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
