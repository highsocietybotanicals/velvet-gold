import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Contrôle d'accès des fonctions internes (même logique que compute-mileage et
// send-order-confirmation) : clé service role / clés secrètes du projet, jeton
// service_role, ou session d'un compte admin (user_roles.role = 'admin').

function bearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

function keyList(...values: (string | undefined | null)[]): Set<string> {
  const keys = new Set<string>();
  for (const val of values) {
    if (!val) continue;
    for (const k of val.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) keys.add(k);
  }
  return keys;
}

/** Appel serveur (clé service role) ou administratrice connectée. */
export async function isPrivilegedRequest(req: Request, serviceClient: any): Promise<boolean> {
  const token = bearerToken(req);
  if (!token) return false;

  const accepted = keyList(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), Deno.env.get("SUPABASE_SECRET_KEYS"));
  if (accepted.has(token)) return true;

  try {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!anonKey) return false;
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await authClient.auth.getClaims(token);
    const claims: any = data?.claims;
    if (claims?.role === "service_role") return true;
    const userId = claims?.sub;
    if (!userId) return false;
    const { data: role } = await serviceClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!role;
  } catch {
    return false;
  }
}
