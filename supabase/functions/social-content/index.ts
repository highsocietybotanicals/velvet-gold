import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

const IMAGE_SYSTEM_PROMPT = `You are a luxury product photographer for High Society Botanicals, a premium CBD brand. Generate a single stunning product image following these strict guidelines:
- Deep black background (#000000)
- "Haute Joaillerie" aesthetic: the CBD product must look like a precious jewel
- Golden rim lighting with warm studio light
- Floating gold dust particles in the air
- Matte velvet texture underneath the product
- NO text, NO logo, NO watermarks on the image
- Square format, Instagram-ready
- Ultra high-end, Cartier/Rolex campaign vibe`;

const CAPTION_SYSTEM_PROMPT = `Tu es le community manager de High Society Botanicals, une marque CBD ultra-premium. Tu écris des légendes Instagram/Telegram en français.

Style :
- Ton élégant, mystérieux, luxueux
- Phrases courtes et percutantes
- Emojis utilisés avec parcimonie (🌿✨👑)
- Inclure 8-12 hashtags pertinents à la fin
- Maximum 300 caractères avant les hashtags
- Ne jamais mentionner de prix`;

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

    const { action, postId, productName, productDescription, theme, chatId } = await req.json();

    // ── GENERATE ──
    if (action === "generate") {
      const subject = productName
        ? `a premium CBD product called "${productName}": ${productDescription || ""}`
        : `a luxury CBD scene with theme: "${theme || "premium lifestyle"}"`;

      // 1. Generate image via Gemini
      const imagePrompt = `Create a stunning luxury product photo of ${subject}. Deep black background, golden rim light, floating gold dust particles, matte velvet surface. Haute joaillerie style, no text or logo.`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            { role: "system", content: IMAGE_SYSTEM_PROMPT },
            { role: "user", content: imagePrompt },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        console.error("Image generation error:", imageResponse.status, errText);
        if (imageResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Image generation failed: ${imageResponse.status}`);
      }

      const imageData = await imageResponse.json();
      const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!base64Image) throw new Error("No image generated");

      // 2. Upload image to storage
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `post-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("social-media")
        .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("social-media").getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // 3. Generate caption via Gemini text
      const captionPrompt = productName
        ? `Écris une légende Instagram/Telegram pour notre produit "${productName}". ${productDescription || ""}`
        : `Écris une légende Instagram/Telegram sur le thème "${theme || "lifestyle premium CBD"}".`;

      const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: CAPTION_SYSTEM_PROMPT },
            { role: "user", content: captionPrompt },
          ],
        }),
      });

      if (!captionResponse.ok) throw new Error("Caption generation failed");
      const captionData = await captionResponse.json();
      const caption = captionData.choices?.[0]?.message?.content || "";

      // 4. Save as draft
      const { data: post, error: insertError } = await supabase
        .from("social_posts")
        .insert({
          product_id: productName ? undefined : null,
          theme: theme || productName || "custom",
          image_url: imageUrl,
          caption,
          status: "draft",
        })
        .select()
        .single();

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

      return new Response(JSON.stringify({ success: true, post }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PUBLISH TO TELEGRAM ──
    if (action === "publish-telegram") {
      if (!postId) throw new Error("postId required");
      if (!chatId) throw new Error("chatId required for Telegram publishing");

      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
      if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

      // Get post
      const { data: post, error: postError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !post) throw new Error("Post not found");

      // Send photo to Telegram
      const telegramResponse = await fetch(`${TELEGRAM_GATEWAY_URL}/sendPhoto`, {
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

      const telegramData = await telegramResponse.json();
      if (!telegramResponse.ok) {
        throw new Error(`Telegram API failed [${telegramResponse.status}]: ${JSON.stringify(telegramData)}`);
      }

      // Update post status
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
