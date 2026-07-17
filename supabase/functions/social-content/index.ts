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

const STRICT_PRODUCT_FIDELITY = `MODE RETOUCHE PRODUIT — PRIORITÉ ABSOLUE :
- L'image jointe est la SOURCE PRODUIT, pas une simple inspiration.
- Le produit final doit ressembler au produit du site à au moins 95% : même couleur dominante, mêmes nuances, même texture, même densité, même relief, même granulométrie, même brillance, même forme générale.
- Ne crée PAS une nouvelle fleur/résine. Ne change PAS la variété. Ne modifie PAS la robe, la matière ou la structure.
- Conserve l'aspect exact du produit ; améliore seulement la lumière, le cadrage, le fond et la présentation.
- Si une scène risque de modifier le produit, simplifie la scène et garde le produit intact, net, grand et central.
- Le produit doit occuper 45% à 70% de l'image, en netteté maximale, sans être masqué par les mains, accessoires, fumée, verre, texte ou décor.
- Interdiction d'ajouter un packaging, une étiquette, un pot, un sachet ou une marque inventée.
- Interdiction de transformer une résine en fleur, une fleur en résine, ou une texture compacte en miettes inventées.`;

function buildScenePrompt(sceneType: string, productName: string, productDescription: string, productCategory: string, variantHint: string): string {
  const productType = productCategory === "resine" ? "résine CBD" : "fleur CBD";
  const referenceInstruction = `PRODUIT RÉEL À CONSERVER : "${productName}" (${productType})${productDescription ? ` — ${productDescription}` : ""}.`;

  const scenes: Record<string, string> = {
    packshot: `Retouche packshot studio du VRAI produit "${productName}" : même produit que la photo source, isolé proprement sur fond noir profond, éclairage rim light doré latéral, reflets discrets. Aucun changement de matière ou de couleur. Composition centrée, macro premium. ${variantHint}`,

    hands: `Retouche éditoriale du VRAI produit "${productName}" : ${CHARACTER_DESC} Les mains servent seulement de décor autour ou sous le produit, sans l'écraser ni le masquer. Le produit source reste intact, grand, parfaitement net et reconnaissable au premier plan. Fond sombre flou avec bokeh doré. ${variantHint}`,

    rolling: `Retouche geste artisanal du VRAI produit "${productName}" : ${CHARACTER_DESC} Le produit source reste la masse principale intacte et reconnaissable sur un plateau de marbre noir veiné d'or. Ajouter seulement quelques petits fragments cohérents si nécessaire, sans inventer une nouvelle texture. Texture ultra visible, éclairage chaud tungsten. ${variantHint}`,

    lifestyle: `Retouche nature morte lifestyle du VRAI produit "${productName}" : conserver le produit source intact et net, posé sur velours noir ou marbre sombre veiné or. Décor luxe très secondaire en arrière-plan flou, sans dominer le produit. Éclairage clair-obscur élégant. ${variantHint}`,
  };

  return `${scenes[sceneType] || scenes.packshot}

${referenceInstruction}

${STRICT_PRODUCT_FIDELITY}

${DA_RULES}`;
}

const VARIANT_HINTS = [
  "Variation uniquement sur le fond et la lumière : cadrage serré macro, angle légèrement plongeant, produit inchangé.",
  "Variation uniquement sur le fond et la lumière : cadrage de face, composition asymétrique, produit inchangé.",
  "Variation uniquement sur le fond et la lumière : léger espace négatif premium, produit inchangé et central.",
];

// Mix mode: 3 variantes = 3 scènes différentes (packshot, hands, lifestyle) pour un vrai choix visuel
const MIX_VARIANTS: Array<{ scene: string; hint: string }> = [
  { scene: "packshot", hint: "Macro studio ultra-net, fond noir profond, rim light doré, produit centré et magnifié." },
  { scene: "hands", hint: "Plan éditorial élégant, mains gantées ou en costume près du produit, bokeh doré chaleureux." },
  { scene: "lifestyle", hint: "Nature morte luxe sur marbre noir veiné or, ambiance clair-obscur cinématographique." },
];


function normalizeProductKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return null;
  return trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/["'“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findCatalogProduct(products: any[], rawProductId: unknown) {
  const key = normalizeProductKey(rawProductId);
  if (!key) return null;
  return products.find((p: any) => {
    const idKey = normalizeProductKey(p.id);
    const nameKey = normalizeProductKey(p.name);
    return idKey === key || nameKey === key || Boolean(nameKey && key.includes(nameKey)) || Boolean(idKey && key.includes(idKey));
  }) || null;
}

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

    const { action, postId, chatId, products, theme, sceneType, referenceImageUrl, referenceImageData, referenceImageMime, selectedProductId } = await req.json();

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
                        product_id: { type: "string", enum: products.map((p: any) => p.id), description: "Exact product ID from the catalog. Never return the product name. Omit for non-product posts." },
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

      const postsToInsert = seriesPlan.posts.map((post: any) => {
        const normalizedProduct = findCatalogProduct(products, post.product_id);
        const normalizedProductId = normalizedProduct?.id || null;
        return {
          series_id: seriesId,
          series_position: post.position,
          post_type: post.post_type,
          product_id: normalizedProductId,
          image_url: normalizedProductId ? (productImageMap[normalizedProductId] || null) : null,
          caption: post.caption,
          theme: seriesPlan.series_name,
          status: "draft",
        };
      });

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
      const scene = (sceneType as string) || "mix";
      const validScenes = ["mix", "real", "packshot", "hands", "rolling", "lifestyle"];
      if (!validScenes.includes(scene)) throw new Error(`Invalid sceneType: ${scene}`);


      const { data: post, error: postError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !post) throw new Error("Post not found");

      const requestedProductId = selectedProductId || post.product_id;
      if (!requestedProductId) {
        return jsonResponse({ error: "Choisis un produit réel avant de générer un shooting IA." }, 400);
      }

      const productInfo = (() => {
        if (products && Array.isArray(products)) {
          const p = products.find((pr: any) => pr.id === requestedProductId);
          if (p) {
            return {
              id: p.id,
              name: p.name,
              category: p.category,
              description: p.description || "",
              imageUrl: p.imageUrl || null,
            };
          }
        }
        return { id: requestedProductId, name: "produit CBD premium", category: "fleur", description: "", imageUrl: null };
      })();

      const realReferenceUrl = referenceImageUrl || productInfo.imageUrl;

      // Fetch reference image and inline as base64. No generic fallback: fidelity requires the real product photo.
      let referenceBase64: string | null = null;
      let referenceBytes: Uint8Array | null = null;
      let referenceMime = "image/jpeg";
      if (typeof referenceImageData === "string" && referenceImageData.length > 0) {
        try {
          const cleanBase64 = referenceImageData.includes(",") ? referenceImageData.split(",").pop()! : referenceImageData;
          referenceBase64 = cleanBase64;
          referenceMime = typeof referenceImageMime === "string" && referenceImageMime.startsWith("image/") ? referenceImageMime : "image/jpeg";
          referenceBytes = Uint8Array.from(atob(cleanBase64), (c: string) => c.charCodeAt(0));
        } catch (e) {
          console.warn("Reference image data decode error:", e);
        }
      } else if (realReferenceUrl) {
        try {
          const imgRes = await fetch(realReferenceUrl);
          const ct = imgRes.headers.get("content-type") || "";
          if (imgRes.ok && ct.startsWith("image/")) {
            referenceMime = ct.split(";")[0].trim();
            const buf = new Uint8Array(await imgRes.arrayBuffer());
            referenceBytes = buf;
            // Convert to base64 in chunks (avoid stack overflow on large images)
            let bin = "";
            const chunk = 0x8000;
            for (let i = 0; i < buf.length; i += chunk) {
              bin += String.fromCharCode(...buf.subarray(i, i + chunk));
            }
            referenceBase64 = btoa(bin);
          } else {
            console.warn("Reference image fetch failed:", imgRes.status, ct || "no content-type");
          }
        } catch (e) {
          console.warn("Reference image fetch error:", e);
        }
      }

      if (!referenceBase64) {
        return jsonResponse({ error: "Impossible de lire la photo réelle du produit. Le shooting IA est annulé pour éviter une image non fidèle." }, 400);
      }

      const hasReference = true;

      if (scene === "real") {
        if (!referenceBytes) {
          return jsonResponse({ error: "Impossible de copier la photo réelle du produit." }, 400);
        }

        const extension = referenceMime.includes("png") ? "png" : referenceMime.includes("webp") ? "webp" : "jpg";
        const uploadPromises = [0, 1, 2].map(async (idx) => {
          const filePath = `real-products/${postId}-real-v${idx}-${Date.now()}.${extension}`;
          const { error: uploadError } = await supabase.storage
            .from("social-media")
            .upload(filePath, referenceBytes!, { contentType: referenceMime, upsert: true });

          if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

          const { data: publicUrlData } = supabase.storage.from("social-media").getPublicUrl(filePath);
          return publicUrlData.publicUrl;
        });

        const variants = await Promise.all(uploadPromises);
        return new Response(JSON.stringify({ success: true, variants }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Utilise la passerelle Lovable AI (LOVABLE_API_KEY déjà chargée en haut)


      // 3 variantes = 3 scènes différentes en mode "mix", sinon 3 variations d'une même scène
      const jobs = scene === "mix"
        ? MIX_VARIANTS
        : VARIANT_HINTS.map((hint) => ({ scene, hint }));

      const variantPromises = jobs.map(async (job, idx) => {
        const prompt = buildScenePrompt(job.scene, productInfo.name, productInfo.description, productInfo.category, job.hint);

        // Passerelle Lovable AI (même service utilisé pour toutes les images du site)
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${referenceMime};base64,${referenceBase64}` } },
              ],
            }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`Variant ${idx} error:`, aiResponse.status, errText);
          throw new Error(`AI status ${aiResponse.status}: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const msg = aiData?.choices?.[0]?.message;
        const imgUrl: string | undefined = msg?.images?.[0]?.image_url?.url
          || (Array.isArray(msg?.content) ? msg.content.find((c: any) => c?.image_url?.url)?.image_url?.url : undefined);
        if (!imgUrl) throw new Error("No image returned from AI gateway");

        const b64 = imgUrl.includes(",") ? imgUrl.split(",").pop()! : imgUrl;
        const imageBytes = Uint8Array.from(atob(b64), (c: string) => c.charCodeAt(0));
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
