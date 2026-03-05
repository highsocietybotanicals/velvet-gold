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
- Amnesia "Signature Oniria" (12€/g) : Sativa, 18% CBD, arômes agrumes/terre. Énergie & Créativité. Profil : fruité dominant.
- Platinum OG (12€/g) : Indica, 22% CBD, notes pin/citron/bois. Relaxation profonde. Profil : boisé dominant.
- Mint Kush (12€/g) : Indica, 20% CBD, menthe fraîche & épices douces. Fraîcheur. Profil : floral/épicé.
- 911 OG "Indoor Master" (14€/g) : Indoor Premium, 50% Élixir Noir, puissance pure. Collection Force Noire. Profil : boisé/terreux.
- Blue Mango "Indoor Master" (14€/g) : Indoor, 30% Élixir Noir, mangue & notes tropicales. Collection Force Noire. Profil : fruité dominant.

RÉSINES :
- Ice O Lator (12€/g) : 60% CBD, extraction eau glacée. Pureté. Profil : fruité.
- Golden CBN (12€/g) : 25% CBD / 10% CBN / 10% CBG, combo sommeil royal. Profil : épicé.
- Nuage de Mousseux (10€/g) : 50% Élixir Noir, texture aérienne. Collection Force Noire. Profil : boisé/terreux.

GRILLES DE PRIX (par gramme) :
Groupe A (12€ base) : 1g=12€, 2g=11€, 3.5g=10€, 5g=9€, 10g=8€, 20g=7€, 50g=5.50€, 100g=4€
Groupe B (14€ base) : 1g=14€, 2g=13€, 3.5g=12€, 5g=11€, 10g=10€, 20g=9€, 50g=7.50€, 100g=6€
Nuage de Mousseux : 1g=10€, 2g=9€, 3.5g=8€, 5g=7€, 10g=6€, 20g=5€, 50g=3.50€, 100g=2€

COLLECTION FORCE NOIRE : Produits enrichis à l'Élixir Noir (molécule exclusive). 911 OG, Blue Mango, Nuage de Mousseux.

PROGRAMME FIDÉLITÉ : 10 commandes de ≥10g = 10g offerts.
ÉCHANTILLON DÉCOUVERTE : Gratuit pour les nouveaux clients (3 variétés × 1g).

RÈGLES :
- Ne recommande QUE les produits listés ci-dessus
- Pose des questions sur l'intention (détente, énergie, sommeil, créativité) et les préférences gustatives
- Donne des conseils personnalisés et experts
- Mentionne les prix et remises quantité quand pertinent
- Reste dans le domaine du CBD légal, ne fais jamais référence au THC ou cannabis illégal
- Si on te demande quelque chose hors sujet, ramène poliment la conversation sur les produits
- Réponds en français, de manière concise mais chaleureuse (max ~150 mots)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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
            ...messages,
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
