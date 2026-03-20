import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

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

    const { action, postId, chatId, products, theme } = await req.json();

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

      // Build product image map from frontend data
      const productImageMap: Record<string, string> = {};
      for (const p of products) {
        if (p.id && p.imageUrl) {
          productImageMap[p.id] = p.imageUrl;
        }
      }

      // Insert all posts as drafts
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
            caption: post.caption,
            parse_mode: "HTML",
          }),
        });
      } else {
        // Text-only post (teasing, lifestyle, cta without product)
        telegramResponse = await fetch(`${TELEGRAM_GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: post.caption,
            parse_mode: "HTML",
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

    // ── GENERATE IMAGE ──
    if (action === "generate-image") {
      if (!postId) throw new Error("postId required");

      const { data: post, error: postError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !post) throw new Error("Post not found");

      // Get product info if available
      const productInfo = (() => {
        if (products && Array.isArray(products) && post.product_id) {
          const p = products.find((pr: any) => pr.id === post.product_id);
          if (p) return { name: p.name, category: p.category, description: p.description || "" };
        }
        return { name: "produit CBD premium", category: "fleur", description: "" };
      })();

      const categoryDesc = productInfo.category === "resine" || productInfo.category === "hash"
        ? "résine CBD dorée/ambrée, texture compacte et brillante"
        : "fleur CBD dense avec trichomes givrés, nuances vertes et violettes";

      const imagePrompt = `Photographie de studio ultra haute qualité d'un produit CBD premium nommé "${productInfo.name}".

CHARTE VISUELLE HSB — OBLIGATOIRE :
- Fond noir profond #000000, éclairage studio avec rim light doré
- Poussière d'or flottante subtile, texture velours/mat
- Style "Haute Joaillerie" inspiré des campagnes Rolex/Cartier
- Palette EXCLUSIVE : noir, or (#C8A94E), vert botanique
- Le logo HSB (couronne dorée ornée + initiales HSB + ornements baroques dorés) peut apparaître en filigrane doré discret dans un coin
- Le produit est une ${categoryDesc}
${productInfo.description ? `- Description : ${productInfo.description}` : ""}

INTERDICTIONS ABSOLUES :
- AUCUN logo autre que celui de High Society Botanicals (HSB)
- AUCUNE marque concurrente
- AUCUN texte inventé, AUCUNE étiquette
- AUCUNE couleur hors palette (pas de rouge, bleu vif, rose, orange)
- Ne jamais inventer une forme de produit irréaliste
- Le produit doit ressembler à un vrai produit CBD, pas à une illustration`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI image error:", aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI image generation failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageData) throw new Error("No image returned from AI");

      // Extract base64 and upload to storage
      const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) throw new Error("Invalid image data format");

      const imageBytes = Uint8Array.from(atob(base64Match[2]), (c: string) => c.charCodeAt(0));
      const filePath = `generated/${postId}.png`;

      const { error: uploadError } = await supabase.storage
        .from("social-media")
        .upload(filePath, imageBytes, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("social-media")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      await supabase
        .from("social_posts")
        .update({ image_url: publicUrl })
        .eq("id", postId);

      return new Response(JSON.stringify({ success: true, imageUrl: publicUrl }), {
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
