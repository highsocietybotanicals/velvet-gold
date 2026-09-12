import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CatalogRow {
  id: string;
  name: string;
  category: string;
  price: number;
  price_group: string;
  cbd_percentage: string | null;
  subtitle: string | null;
  description: string | null;
  mood: string | null;
  is_force_noire: boolean | null;
  is_out_of_stock: boolean | null;
}

// Le catalogue est construit à chaque requête depuis la base : une variété
// désactivée ou en rupture n'est jamais proposée par le Sommelier.
const buildProductsContext = (rows: CatalogRow[]) => {
  const line = (p: CatalogRow) =>
    `- ${p.name} (id: ${p.id}) — ${Number(p.price)}€/g — ${p.cbd_percentage ?? ""}${
      p.is_force_noire ? " — Collection Force Noire" : ""
    }${p.mood ? ` — ambiance : ${p.mood}` : ""}${
      p.description ? ` — ${p.description}` : ""
    }`;

  const flowers = rows.filter((p) => p.category === "fleur").map(line).join("\n");
  const resins = rows.filter((p) => p.category === "resine").map(line).join("\n");

  return `
Tu es le Sommelier de High Society Botanicals, une boutique premium de fleurs et résines CBD.
Tu es élégant, chaleureux et expert. Tu tutoies le client de manière respectueuse.

CATALOGUE DISPONIBLE (prix public par gramme, remises sur quantité disponibles).
Ce catalogue est la SEULE source de vérité : toute variété absente de cette liste
n'est plus disponible et ne doit JAMAIS être citée, recommandée ou ajoutée au panier.

FLEURS :
${flowers || "- Aucune fleur disponible actuellement"}

RÉSINES :
${resins || "- Aucune résine disponible actuellement"}

REMISES SUR QUANTITÉ (calculées automatiquement par le site sur le poids total) :
- Groupe A : jusqu'à -50% à partir de 100g
- Groupe B / Force Noire : jusqu'à -35% à partir de 100g
Ne cite jamais de prix remisé précis : indique simplement que la remise s'applique automatiquement.

OFFRE SPÉCIALE : Pour chaque tranche de 10g achetée (poids TOTAL de la commande, tous produits confondus), le client peut choisir 1g offert du produit de son choix, avec feuilles et briquet inclus.
PROGRAMME FIDÉLITÉ : 10 commandes de ≥10g = 10g offerts (système automatique, ne jamais promettre manuellement).

RÈGLES :
- Ne recommande QUE les produits listés ci-dessus
- Pose des questions sur l'intention (détente, énergie, sommeil, créativité) et les préférences gustatives
- Donne des conseils personnalisés et experts
- Reste dans le domaine du CBD légal, ne fais jamais référence au THC ou cannabis illégal
- Si on te demande quelque chose hors sujet, ramène poliment la conversation sur les produits
- Réponds en français, de manière concise mais chaleureuse (max ~150 mots)
- Ne propose JAMAIS de réductions en dehors de celles indiquées ci-dessus
- Quand tu recommandes un produit et que le client semble intéressé, propose-lui de l'ajouter au panier en utilisant le format suivant (UN par produit recommandé) :
  [ADD_TO_CART:{"productId":"ID_DU_PRODUIT","weight":POIDS_EN_GRAMMES}]
- Utilise exactement les id indiqués dans le catalogue ci-dessus
- Utilise un poids par défaut de 5g sauf si le client a spécifié une quantité
- Place les commandes [ADD_TO_CART:...] à la fin de ta réponse, après le texte
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication to prevent anonymous abuse
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentification requise." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Session invalide." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const rawMessages = body?.messages;

    // --- Input validation to prevent API credit abuse ---
    const MAX_MESSAGES = 30;
    const MAX_MSG_LENGTH = 2000;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages invalides." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeMessages = rawMessages
      .slice(-MAX_MESSAGES)
      .map((m: { role?: string; content?: string }) => ({
        role: ["user", "assistant"].includes(m.role ?? "") ? m.role! : "user",
        content: String(m.content ?? "").slice(0, MAX_MSG_LENGTH),
      }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { data: catalogRows } = await supabase
      .from("products")
      .select(
        "id, name, category, price, price_group, cbd_percentage, subtitle, description, mood, is_force_noire, is_out_of_stock"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const availableProducts = (catalogRows ?? []).filter(
      (p: CatalogRow) => !p.is_out_of_stock
    );

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: buildProductsContext(availableProducts) },
            ...safeMessages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sommelier-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
