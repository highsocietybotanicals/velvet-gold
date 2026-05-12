import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function requireServiceRoleOrAdmin(req: Request, serviceClient: any): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!anonKey) return jsonResponse({ error: "Authentication unavailable" }, 500);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims) return jsonResponse({ error: "Unauthorized" }, 401);
  if (claims.role === "service_role") return null;

  const userId = claims.sub;
  if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

  const { data: role, error: roleError } = await serviceClient
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) return jsonResponse({ error: "Forbidden" }, 403);
  return null;
}

// La Poste Suivi API v2
const LAPOSTE_TRACKING_URL = "https://api.laposte.fr/suivi/v2/idships/";

// Map La Poste event codes to our order statuses
function mapColissimoStatus(events: any[]): string | null {
  if (!events || events.length === 0) return null;

  // Events are sorted most recent first
  const latestEvent = events[0];
  const code = latestEvent?.code || "";
  const label = (latestEvent?.label || "").toLowerCase();

  // Delivered / picked up
  if (
    code.startsWith("DI1") || code.startsWith("DI2") ||
    code === "AG1" ||
    label.includes("distribué") ||
    label.includes("retrait") ||
    label.includes("livré") ||
    label.includes("remis au destinataire") ||
    label.includes("retiré")
  ) {
    return "delivered";
  }

  // Available at relay point / post office
  if (
    code.startsWith("ET4") || code === "RE1" ||
    label.includes("disponible") ||
    label.includes("arrivé au point") ||
    label.includes("instance")
  ) {
    return "in_delivery";
  }

  // In transit
  if (
    code.startsWith("EP1") || code.startsWith("DO") ||
    code.startsWith("PC") ||
    label.includes("pris en charge") ||
    label.includes("en cours")
  ) {
    return "shipped";
  }

  return null;
}

// Status hierarchy: only move forward
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  preparing: 1,
  shipped: 2,
  in_delivery: 3,
  delivered: 4,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const colissimoApiKey = Deno.env.get("COLISSIMO_API_KEY");
    if (!colissimoApiKey) {
      return new Response(
        JSON.stringify({ error: "COLISSIMO_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all shipped/in_delivery orders with tracking numbers
    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, tracking_number, status, display_order_number, order_number")
      .not("tracking_number", "is", null)
      .in("status", ["shipped", "in_delivery"])
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching orders:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No orders to track", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${orders.length} orders for tracking updates`);

    const results: Array<{ orderId: string; orderNum: string; oldStatus: string; newStatus: string }> = [];
    const errors: Array<{ orderId: string; error: string }> = [];

    for (const order of orders) {
      try {
        // Call La Poste tracking API
        const trackingRes = await fetch(
          `${LAPOSTE_TRACKING_URL}${order.tracking_number}`,
          {
            headers: {
              "Accept": "application/json",
              "X-Okapi-Key": colissimoApiKey,
            },
          }
        );

        const body = await trackingRes.text();

        if (!trackingRes.ok) {
          console.warn(`Tracking API error for ${order.tracking_number}: ${trackingRes.status} ${body.substring(0, 200)}`);
          errors.push({ orderId: order.id, error: `HTTP ${trackingRes.status}` });
          continue;
        }

        let trackingData: any;
        try {
          trackingData = JSON.parse(body);
        } catch {
          console.warn(`Invalid JSON for ${order.tracking_number}: ${body.substring(0, 200)}`);
          errors.push({ orderId: order.id, error: "Invalid JSON response" });
          continue;
        }

        const events = trackingData?.shipment?.event || [];
        const newStatus = mapColissimoStatus(events);

        if (!newStatus) continue;

        // Only update if moving forward in the status chain
        const currentRank = STATUS_ORDER[order.status] ?? 0;
        const newRank = STATUS_ORDER[newStatus] ?? 0;

        if (newRank > currentRank) {
          const { error: updateError } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", order.id);

          if (updateError) {
            console.error(`Failed to update order ${order.id}:`, updateError);
            errors.push({ orderId: order.id, error: updateError.message });
          } else {
            const orderNum = order.display_order_number || `#${order.order_number}`;
            console.log(`Order ${orderNum}: ${order.status} → ${newStatus}`);
            results.push({
              orderId: order.id,
              orderNum,
              oldStatus: order.status,
              newStatus,
            });

            // Send status update email for delivered orders
            if (newStatus === "delivered") {
              supabase.functions
                .invoke("send-status-update-email", {
                  body: { orderId: order.id, newStatus },
                })
                .catch((e: any) => console.error("Status email error:", e));
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        console.error(`Error tracking order ${order.id}:`, err);
        errors.push({ orderId: order.id, error: String(err) });
      }
    }

    console.log(`Tracking sync complete: ${results.length} updated, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: orders.length,
        updated: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check Colissimo status error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
