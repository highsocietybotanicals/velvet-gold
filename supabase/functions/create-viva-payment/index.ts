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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { amount, items, deliveryType, deliveryAddress, deliveryDate, deliveryTime, contactPhone, totalFlowerWeight, freeGramsUsed } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the order in DB first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: amount,
        total_flower_weight: totalFlowerWeight || 0,
        delivery_type: deliveryType || "pickup",
        delivery_address: deliveryAddress || null,
        delivery_date: deliveryDate || null,
        delivery_time: deliveryTime || null,
        contact_phone: contactPhone || null,
        status: "pending",
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert order items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_type: item.productType,
        weight: item.weight || null,
        quantity: item.quantity || null,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
      }
    }

    // Create Viva Wallet payment order
    const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
    const apiKey = Deno.env.get("VIVA_API_KEY");

    const vivaAmount = Math.round(amount * 100); // Viva expects cents

    const credentials = btoa(`${merchantId}:${apiKey}`);

    console.log("Calling Viva API with amount:", vivaAmount);

    const vivaResponse = await fetch(
      "https://www.vivapayments.com/api/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: vivaAmount,
          customerTrns: `Commande ${order.display_order_number || '#' + order.order_number}`,
          merchantTrns: order.id,
        }),
      }
    );

    const vivaText = await vivaResponse.text();
    console.log("Viva response status:", vivaResponse.status, "body:", vivaText);

    // Extract OrderCode as string from raw text to avoid BigInt precision loss
    const orderCodeMatch = vivaText.match(/"OrderCode"\s*:\s*(\d+)/);
    
    let vivaData: any;
    try {
      vivaData = JSON.parse(vivaText);
    } catch {
      console.error("Failed to parse Viva response:", vivaText);
      return new Response(
        JSON.stringify({ error: "Invalid response from payment provider", details: vivaText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vivaResponse.ok || vivaData.ErrorCode !== 0) {
      console.error("Viva error:", vivaData);
      return new Response(
        JSON.stringify({ error: "Payment creation failed", details: vivaData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the regex-extracted string to preserve full precision
    const orderCode = orderCodeMatch ? orderCodeMatch[1] : String(vivaData.OrderCode);
    console.log("OrderCode (string, precise):", orderCode);

    // Update order with viva_order_code using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin
      .from("orders")
      .update({ viva_order_code: String(orderCode) })
      .eq("id", order.id);

    // Deduct free grams if used
    if (freeGramsUsed && freeGramsUsed > 0) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("free_grams_available")
        .eq("id", userId)
        .single();

      if (profile) {
        const newFreeGrams = Math.max(0, (profile.free_grams_available || 0) - freeGramsUsed);
        await supabaseAdmin
          .from("profiles")
          .update({ free_grams_available: newFreeGrams })
          .eq("id", userId);
      }
    }

    return new Response(
      JSON.stringify({
        orderCode,
        orderId: order.id,
        checkoutUrl: `https://www.vivapayments.com/web/checkout?ref=${orderCode}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
