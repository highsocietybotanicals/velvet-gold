import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyAdminsOfOrder } from "../_shared/admin-order-notify.ts";
import { isPrivilegedRequest } from "../_shared/request-auth.ts";

// Notification admin d'une commande (e-mail à chaque compte admin + Telegram si configuré),
// au plus une fois par commande et par événement.
// POST { orderId, eventType: "new" | "paid" } — réservé aux appels serveur (clé service role)
// et aux comptes admin. Exemple d'usage : create-pro-order juste après la création.
// GET → {"version": "..."}.

const VERSION = "notify-admin-order 2026-10-12.1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json({ version: VERSION });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!(await isPrivilegedRequest(req, supabase))) {
      return json({ error: "Forbidden" }, 403);
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Corps de requête invalide" }, 400);
    }
    const orderId = typeof payload?.orderId === "string" ? payload.orderId.trim() : "";
    const eventType = payload?.eventType === "paid" ? "paid" : payload?.eventType === "new" ? "new" : null;
    if (!UUID_RE.test(orderId) || !eventType) {
      return json({ error: "orderId (uuid) et eventType (« new » ou « paid ») requis" }, 400);
    }

    const result = await notifyAdminsOfOrder(supabase, orderId, eventType, {
      telegram: payload?.telegram !== false,
      source: "notify-admin-order",
    });
    return json({ success: true, ...result });
  } catch (error) {
    console.error("notify-admin-order error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
