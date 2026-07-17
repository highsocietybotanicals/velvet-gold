import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request, serviceClient: any): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!anonKey) return jsonResponse({ error: "Authentication unavailable" }, 500);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (claims.role === "service_role") return null;

  const userId = claims.sub;
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: role, error: roleError } = await serviceClient
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  return null;
}

const SERIES_SYSTEM_PROMPT = `Tu es la Directrice de Communication de High Society Botanicals (HSB), une marque CBD ultra-premium française. C'est TON entreprise, TON empire, et tu veux qu'il explose.

PERSONNALITÉ :
- Passionnée, stratège, visionnaire
- Tu parles comme une fondatrice qui vit et respire sa marque
- Ton luxueux mais accessible, jamais prétentieux
- Tu crées du DÉSIR et du MYSTÈRE à chaque post

RÈGLES ABSOLUES :
- JAMAIS de prix mentionnés
- JAMAIS de "achetez" ou "commandez" — tu crées l'envie, pas la pression
- Toujours en français
- Emojis avec parcimonie : 🌿✨👑🖤🔥
- 8-12 hashtags pertinents à la fin de chaque caption
- Maximum 280 caractères avant les hashtags
- Cohérence sur toute la série : même fil narratif

IDENTITÉ VISUELLE HSB :
- Noir profond, or, luxe discret
- "Haute Couture du CBD"
- Chaque produit est un bijou, chaque variété une œuvre d'art

STRUCTURE D'UNE SÉRIE (5-7 posts) :
1. TEASING — Mystère, intrigue, image sombre avec lueur dorée. "Quelque chose arrive..."
2. PRODUCT — Mise en lumière d'un produit star. Description sensorielle.
3. EDUCATION — Terpènes, CBD, bienfaits. Positionnement expert.
4. LIFESTYLE — Ambiance, moment de vie, rituel. Le monde HSB.
5. PRODUCT2 — Deuxième produit, complémentaire au premier.
6. CONSEIL — Astuce d'utilisation, recommandation personnalisée.
7. CTA — Invitation subtile. "Le luxe se mérite. Lien en bio."

Tu dois retourner un JSON structuré via l'outil fourni.`;

// ── Personnage figé (scènes "hands" et "rolling") ──
const CHARACTER_DESC = `Silhouette masculine élégante en costume trois-pièces noir sur mesure, chemise blanche impeccable, cravate soie noire, poignet avec chevalière or discrète et bracelet fin en or. Peau claire, mains soignées, ongles nets et courts. VISAGE JAMAIS VISIBLE : hors cadre, dans l'ombre, ou coupé au niveau du menton. Ambiance clair-obscur cinématographique, éclairage chaud tungsten/or.`;

const DA_RULES = `CHARTE VISUELLE HSB — OBLIGATOIRE :
- Palette EXCLUSIVE : noir profond #000000, or #C8A94E, vert botanique, blanc cassé
- Poussière d'or flottante subtile en suspension
- Style "Haute Joaillerie" inspiré des campagnes Rolex/Cartier/Dior
- Grain photo cinématographique, profondeur de champ

INTERDICTIONS ABSOLUES :
- AUCUN logo autre que HSB
- AUCUNE marque concurrente, AUCUNE étiquette inventée
- AUCUN texte lisible
- AUCUNE couleur hors palette (pas de rouge, bleu vif, rose, orange criard)
- Ne jamais déformer la couleur, la texture ou la forme du produit de référence`;

function buildScenePrompt(sceneType: string, productName: string, productDescription: string, hasReference: boolean, variantHint: string): string {
  const referenceInstruction = hasReference
    ? `RÉFÉRENCE PRODUIT : L'image jointe montre le VRAI produit "${productName}". Tu dois reproduire EXACTEMENT sa couleur, sa texture, sa forme, ses détails (trichomes, granulométrie, brillance). C'est le même produit, photographié dans une nouvelle mise en scène.`
    : `PRODUIT : "${productName}"${productDescription ? ` — ${productDescription}` : ""}. Reste réaliste, pas d'illustration.`;

  const scenes: Record<string, string> = {
    packshot: `Packshot studio ultra haute qualité du produit CBD "${productName}" seul sur fond noir profond, éclairage rim light doré latéral, réflexions dorées subtiles, poussière d'or en suspension. Composition centrée, style joaillerie de luxe. ${variantHint}`,

    hands: `Photographie éditoriale : ${CHARACTER_DESC} Il présente délicatement le produit CBD "${productName}" dans le creux de sa paume ou entre ses doigts, geste précis et raffiné. Le produit est PARFAITEMENT visible et net au premier plan. Fond flou sombre avec bokeh doré. ${variantHint}`,

    rolling: `Photographie éditoriale d'un geste artisanal : ${CHARACTER_DESC} On voit ses mains en train ${productName.toLowerCase().includes("resin") || productName.toLowerCase().includes("hash") ? "d'effriter délicatement la résine sur un plateau de marbre noir veiné d'or, avec une lame fine" : "d'effriter délicatement la fleur CBD sur un plateau de marbre noir veiné d'or, puis de préparer un joint fin avec feuille kraft"}. Le produit "${productName}" est le sujet central, texture ultra visible. Éclairage chaud tungsten venant du haut. ${variantHint}`,

    lifestyle: `Nature morte lifestyle luxueuse : le produit CBD "${productName}" posé dans un décor haute joaillerie — velours noir profond, marbre veiné or, verre en cristal avec cognac ambré, fauteuil chesterfield en cuir noir en arrière-plan flou. Éclairage clair-obscur théâtral, ambiance salon de gentleman. Le produit reste le sujet principal, parfaitement net et fidèle. ${variantHint}`,
  };

  return `${scenes[sceneType] || scenes.packshot}

${referenceInstruction}

${DA_RULES}`;
}

const VARIANT_HINTS = [
  "Cadrage serré macro, angle légèrement plongeant.",
  "Cadrage moyen, angle de face à hauteur du produit, composition asymétrique.",
  "Cadrage large avec espace négatif, angle contre-plongée dramatique.",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authError = await requireAdmin(req, supabase);
    if (authError) return authError;

    const { action, postId, chatId, products, theme, sceneType, referenceImageUrl } = await req.json();

    // ── GENERATE SERIES ──
    if (action === "generate-series") {
      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new Error("Products catalog required for series generation");
      }

      const catalogDescription = products.map((p: any) =>
        `- ${p.name} (${p.category}) : ${p.description} | CBD: ${p.cbdPercentage} | Mood: ${p.mood} | Terpènes: boisé ${p.terpenes.boise}%, fruité ${p.terpenes.fruite}%, épicé ${p.terpenes.epice}%, terreux ${p.terpenes.terreux}%`
      ).join("\n");

      const userPrompt = theme
        ? `Planifie une série de 5-7 posts autour du thème "${theme}". Voici le catalogue complet pour choisir les produits à mettre en avant :\n\n${catalogDescription}`
        : `Planifie une série de 5-7 posts stratégiques pour faire exploser notre visibilité. Choisis intelligemment dans notre catalogue :\n\n${catalogDescription}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SERIES_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "plan_series",
              description: "Plan a strategic series of social media posts",
              parameters: {
                type: "object",
                properties: {
                  series_name: { type: "string", description: "Nom de la série" },
                  posts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        position: { type: "integer", description: "Position in series (1-7)" },
                        post_type: { type: "string", enum: ["teasing", "product", "education", "lifestyle", "conseil", "cta"] },
                        product_id: { type: "string", description: "ID of the product to feature, or null for non-product posts" },
                        caption: { type: "string", description: "The full caption with hashtags" },
                      },
                      required: ["position", "post_type", "caption"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["series_name", "posts"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "plan_series" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI generation failed: ${response.status}`);
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No structured response from AI");

      const seriesPlan = JSON.parse(toolCall.function.arguments);
      const seriesId = crypto.randomUUID();

      const productImageMap: Record<string, string> = {};
      for (const p of products) {
        if (p.id && p.imageUrl) {
          productImageMap[p.id] = p.imageUrl;
        }
      }

      const postsToInsert = seriesPlan.posts.map((post: any) => ({
        series_id: seriesId,
        series_position: post.position,
        post_type: post.post_type,
        product_id: post.product_id || null,
        image_url: post.product_id ? (productImageMap[post.product_id] || null) : null,
        caption: post.caption,
        theme: seriesPlan.series_name,
        status: "draft",
      }));

      const { data: insertedPosts, error: insertError } = await supabase
        .from("social_posts")
        .insert(postsToInsert)
        .select();

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

      return new Response(JSON.stringify({
        success: true,
        seriesId,
        seriesName: seriesPlan.series_name,
        posts: insertedPosts,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PUBLISH TO TELEGRAM ──
    if (action === "publish-telegram") {
      if (!postId) throw new Error("postId required");
      if (!chatId) throw new Error("chatId required for Telegram publishing");

      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
      if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

      const { data: post, error: postError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !post) throw new Error("Post not found");

      let telegramResponse: Response;
      let telegramData: any;

      const SITE_URL = "https://highsocietybotanicals.com";
      const captionWithLink = `${post.caption}\n\n🛒 Commander maintenant :\n${SITE_URL}`;

      if (post.image_url) {
        telegramResponse = await fetch(`${TELEGRAM_GATEWAY_URL}/sendPhoto`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            photo: post.image_url,
            caption: captionWithLink,
          }),
        });
      } else {
        telegramResponse = await fetch(`${TELEGRAM_GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: captionWithLink,
          }),
        });
      }

      telegramData = await telegramResponse.json();
      if (!telegramResponse.ok) {
        throw new Error(`Telegram API failed [${telegramResponse.status}]: ${JSON.stringify(telegramData)}`);
      }

      const publishedTo = [...(post.published_to || []), "telegram"];
      await supabase
        .from("social_posts")
        .update({
          status: "published",
          published_to: publishedTo,
          published_at: new Date().toISOString(),
        })
        .eq("id", postId);

      return new Response(JSON.stringify({ success: true, telegram: telegramData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GENERATE IMAGE VARIANTS ──
    if (action === "generate-image") {
      if (!postId) throw new Error("postId required");
      const scene = (sceneType as string) || "packshot";
      const validScenes = ["packshot", "hands", "rolling", "lifestyle"];
      if (!validScenes.includes(scene)) throw new Error(`Invalid sceneType: ${scene}`);

      const { data: post, error: postError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !post) throw new Error("Post not found");

      const productInfo = (() => {
        if (products && Array.isArray(products) && post.product_id) {
          const p = products.find((pr: any) => pr.id === post.product_id);
          if (p) return { name: p.name, category: p.category, description: p.description || "" };
        }
        return { name: "produit CBD premium", category: "fleur", description: "" };
      })();

      // Try to fetch reference image and inline as base64 (public URL fallback if fetch fails)
      let referenceBase64: string | null = null;
      let referenceMime = "image/jpeg";
      if (referenceImageUrl) {
        try {
          const imgRes = await fetch(referenceImageUrl);
          if (imgRes.ok) {
            const ct = imgRes.headers.get("content-type") || "image/jpeg";
            referenceMime = ct.split(";")[0].trim();
            const buf = new Uint8Array(await imgRes.arrayBuffer());
            // Convert to base64 in chunks (avoid stack overflow on large images)
            let bin = "";
            const chunk = 0x8000;
            for (let i = 0; i < buf.length; i += chunk) {
              bin += String.fromCharCode(...buf.subarray(i, i + chunk));
            }
            referenceBase64 = btoa(bin);
          } else {
            console.warn("Reference image fetch failed:", imgRes.status);
          }
        } catch (e) {
          console.warn("Reference image fetch error:", e);
        }
      }

      const hasReference = !!referenceBase64;

      // Generate 3 variants in parallel
      const variantPromises = VARIANT_HINTS.map(async (hint, idx) => {
        const prompt = buildScenePrompt(scene, productInfo.name, productInfo.description, hasReference, hint);

        const userContent: any[] = [{ type: "text", text: prompt }];
        if (hasReference && referenceBase64) {
          userContent.push({
            type: "image_url",
            image_url: { url: `data:${referenceMime};base64,${referenceBase64}` },
          });
        }

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image",
            messages: [{ role: "user", content: userContent }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`Variant ${idx} error:`, aiResponse.status, errText);
          throw new Error(`AI status ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageData) throw new Error("No image returned");

        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) throw new Error("Invalid image data");

        const imageBytes = Uint8Array.from(atob(base64Match[2]), (c: string) => c.charCodeAt(0));
        const filePath = `generated/${postId}-v${idx}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("social-media")
          .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from("social-media").getPublicUrl(filePath);
        return publicUrlData.publicUrl;
      });

      const results = await Promise.allSettled(variantPromises);
      const variants = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map(r => r.value);

      if (variants.length === 0) {
        const firstError = results.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
        const errMsg = firstError?.reason?.message || "Toutes les variantes ont échoué";
        if (errMsg.includes("429")) {
          return jsonResponse({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }, 429);
        }
        if (errMsg.includes("402")) {
          return jsonResponse({ error: "Crédits IA insuffisants." }, 402);
        }
        throw new Error(errMsg);
      }

      return new Response(JSON.stringify({ success: true, variants }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-content error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
