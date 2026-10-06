import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Prévient l'équipe (Telegram) qu'un dossier partenaire attend sa validation.
// Appelé par le formulaire « Ouvrir un compte partenaire » de /pro.

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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentification requise" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Session invalide" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Uniquement pour un dossier pro réellement en attente
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "pro")
      .maybeSingle();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_pro_validated")
      .eq("id", user.id)
      .maybeSingle();
    if (!role || profile?.is_pro_validated) return json({ skipped: true });

    const resp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-admin-telegram`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventType: "pro_application", userId: user.id }),
    });
    return json({ success: resp.ok });
  } catch (e) {
    console.error("notify-pro-application error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
