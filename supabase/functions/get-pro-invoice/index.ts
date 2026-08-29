import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "orderId invalide" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, display_order_number")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return json({ error: "Commande introuvable" }, 404);

    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (order.user_id !== user.id && !isAdmin) return json({ error: "Forbidden" }, 403);

    const path = `pro/${order.display_order_number}.pdf`;
    const { data: signed, error } = await admin.storage
      .from("invoices")
      .createSignedUrl(path, 300);
    if (error || !signed?.signedUrl) return json({ error: "Facture indisponible" }, 404);

    return json({ url: signed.signedUrl });
  } catch (e) {
    console.error("get-pro-invoice error:", (e as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
