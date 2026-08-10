import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEPARTURE = "15 rue des écoles, 44170 Abbaretz, France";
const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

async function isAuthorized(req: Request, serviceClient: any): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  // Accepted server-side secret keys
  const accepted = new Set<string>();
  const addAll = (val?: string | null) => {
    if (!val) return;
    for (const k of val.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) accepted.add(k);
  };
  addAll(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  addAll(Deno.env.get("SUPABASE_SECRET_KEYS"));
  if (accepted.has(token)) return true;

  try {
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (anonKey) {
      const authClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await authClient.auth.getClaims(token);
      const claims: any = data?.claims;
      if (claims?.role === "service_role") return true;
      const userId = claims?.sub;
      if (userId) {
        const { data: role } = await serviceClient
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (role) return true;
      }
    }

    const { data: { user } } = await serviceClient.auth.getUser(token);
    if (!user) return false;
    const { data: role } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    return !!role;
  } catch {
    return false;
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!(await isAuthorized(req, supabase))) {
      console.error("compute-mileage: unauthorized request (auth header present:", !!req.headers.get("Authorization"), ")");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, delivery_type, delivery_address, payment_status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.delivery_type !== "personal" || order.payment_status !== "paid") {
      return new Response(JSON.stringify({ skipped: true, reason: "not eligible" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.delivery_address) {
      return new Response(JSON.stringify({ skipped: true, reason: "no delivery address" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already computed?
    const { data: existing } = await supabase
      .from("delivery_mileage")
      .select("id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing && existing.status === "computed") {
      return new Response(JSON.stringify({ skipped: true, reason: "already computed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get rate
    const { data: settings } = await supabase
      .from("mileage_settings")
      .select("rate_per_km")
      .eq("id", 1)
      .single();
    const rate = Number(settings?.rate_per_km ?? 0.636);

    // Call Google Routes API via gateway
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const gmKey = Deno.env.get("GOOGLE_MAPS_API_KEY")!;

    let distanceKm: number | null = null;
    let durationMin: number | null = null;
    let errorMessage: string | null = null;

    try {
      const routesRes = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gmKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: { address: DEPARTURE },
          destination: { address: order.delivery_address },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
        }),
      });
      const txt = await routesRes.text();
      if (!routesRes.ok) {
        errorMessage = `Routes API ${routesRes.status}: ${txt.slice(0, 300)}`;
      } else {
        const data = JSON.parse(txt);
        const route = data?.routes?.[0];
        if (route?.distanceMeters) {
          distanceKm = route.distanceMeters / 1000;
          const durSec = parseInt(String(route.duration ?? "0s").replace("s", ""), 10);
          durationMin = isNaN(durSec) ? null : durSec / 60;
        } else {
          errorMessage = "No route found";
        }
      }
    } catch (e) {
      errorMessage = `Routes API error: ${(e as Error).message}`;
    }

    const oneWay = distanceKm;
    const roundTrip = oneWay !== null ? oneWay * 2 : null;
    const cost = roundTrip !== null ? Number((roundTrip * rate).toFixed(2)) : null;
    const status = oneWay !== null ? "computed" : "failed";

    const payload = {
      order_id: orderId,
      departure_address: DEPARTURE,
      arrival_address: order.delivery_address,
      distance_km_one_way: oneWay,
      distance_km_round_trip: roundTrip,
      duration_min: durationMin,
      rate_per_km: rate,
      cost_euros: cost,
      status,
      error_message: errorMessage,
      computed_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("delivery_mileage")
      .upsert(payload, { onConflict: "order_id" });

    if (upErr) {
      console.error("Upsert error:", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Do not include arrival_address (PII) in response
    const { arrival_address: _omit, departure_address: _omit2, ...safePayload } = payload;
    return new Response(JSON.stringify({ success: true, status, ...safePayload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-mileage error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
