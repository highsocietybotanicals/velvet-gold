import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTS_CONTEXT = `
Tu es le Sommelier de High Society Botanicals, une boutique premium de fleurs et résines CBD.
Tu es élégant, chaleureux et expert. Tu tutoies le client de manière respectueuse.

CATALOGUE COMPLET (prix de base par gramme, remises sur quantité disponibles) :

FLEURS :
- Amnesia "Signature Oniria" (12€/g) : Sativa, 27% CBD, arômes agrumes/terre. Énergie & Créativité. Profil : fruité dominant.
- Platinum OG (12€/g) : Indica, 22% CBD, notes pin/citron/bois. Relaxation profonde. Profil : boisé dominant.
- Mint Kush (12€/g) : Indica, 20% CBD, menthe fraîche & épices douces. Fraîcheur. Profil : floral/épicé.
- 911 OG "Indoor Master" (14€/g) : Indoor Premium, 50% Élixir Noir, puissance pure. Collection Force Noire. Profil : boisé/terreux.
- Blue Mango "Indoor Master" (14€/g) : Indoor, 30% Élixir Noir, mangue & notes tropicales. Collection Force Noire. Profil : fruité dominant.

RÉSINES :
- Ice O Lator (12€/g) : 60% CBD, extraction eau glacée. Pureté. Profil : fruité.
- Golden CBN (12€/g) : 25% CBD / 10% CBN / 10% CBG, combo sommeil royal. Profil : épicé.
- Nuage de Mousseux (10€/g) : 50% Élixir Noir, texture aérienne. Collection Force Noire. Profil : boisé/terreux.

GRILLES DE PRIX (par gramme, remises par paliers de poids) :
Groupe A (Amnesia, Platinum OG, Mint Kush, Ice O Lator, Golden CBN — base 12€/g) :
  Moins de 10g : 12€/g (pas de remise)
  10-24g : 10.20€/g (-15%)
  25-49g : 9€/g (-25%)
  50-99g : 7.80€/g (-35%)
  100g+ : 6€/g (-50%)
Groupe B (911 OG, Blue Mango — base 14€/g) :
  Moins de 10g : 14€/g (pas de remise)
  10-24g : 12.60€/g (-10%)
  25-49g : 11.20€/g (-20%)
  50-99g : 10.50€/g (-25%)
  100g+ : 9.10€/g (-35%)
Nuage de Mousseux (base 10€/g, paliers Groupe A) :
  Moins de 10g : 10€/g (pas de remise)
  10-24g : 8.50€/g (-15%)
  25-49g : 7.50€/g (-25%)
  50-99g : 6.50€/g (-35%)
  100g+ : 5€/g (-50%)

COLLECTION FORCE NOIRE : Produits enrichis à l'Élixir Noir (molécule exclusive). 911 OG, Blue Mango, Nuage de Mousseux.

OFFRE SPÉCIALE : Pour chaque tranche de 10g achetée (poids TOTAL de la commande, tous produits confondus), le client peut choisir 1g offert du produit de son choix. Le calcul se fait sur le poids cumulé de TOUS les produits du panier. Exemple : 3 fleurs différentes à 4g chacune = 12g total → 1g offert au choix. 20g achetés = 2g offerts, 30g = 3g offerts, etc. Mentionne cette offre quand c'est pertinent et aide le client à choisir son gramme cadeau.
PROGRAMME FIDÉLITÉ : 10 commandes de ≥10g = 10g offerts (système automatique, ne jamais promettre manuellement).

IDS PRODUITS (pour les commandes panier) :
- amnesia-signature-oniria (Amnesia "Signature Oniria")
- platinum-og (Platinum OG)
- mint-kush (Mint Kush)
- 911-og-indoor-master (911 OG "Indoor Master")
- blue-mango-indoor-master (Blue Mango "Indoor Master")
- ice-o-lator (Ice O Lator)
- golden-cbn (Golden CBN)
- nuage-de-mousseux (Nuage de Mousseux)

RÈGLES :
- Ne recommande QUE les produits listés ci-dessus
- Pose des questions sur l'intention (détente, énergie, sommeil, créativité) et les préférences gustatives
- Donne des conseils personnalisés et experts
- Mentionne les prix et remises quantité quand pertinent
- Reste dans le domaine du CBD légal, ne fais jamais référence au THC ou cannabis illégal
- Si on te demande quelque chose hors sujet, ramène poliment la conversation sur les produits
- Réponds en français, de manière concise mais chaleureuse (max ~150 mots)
- Ne propose JAMAIS de réductions qui ne sont pas dans la grille de prix ci-dessus. La SEULE offre de grammes gratuits autorisée est celle de 1g offert par tranche de 10g achetée.
- Quand tu recommandes un produit et que le client semble intéressé, propose-lui de l'ajouter au panier en utilisant le format suivant (UN par produit recommandé) :
  [ADD_TO_CART:{"productId":"ID_DU_PRODUIT","weight":POIDS_EN_GRAMMES}]
  Exemple : [ADD_TO_CART:{"productId":"amnesia-signature-oniria","weight":5}]
- Utilise un poids par défaut de 5g sauf si le client a spécifié une quantité
- Place les commandes [ADD_TO_CART:...] à la fin de ta réponse, après le texte
`;

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
            { role: "system", content: PRODUCTS_CONTEXT },
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
