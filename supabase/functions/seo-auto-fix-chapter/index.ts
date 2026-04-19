// Auto-applies SEO fixes to a chapter using AI based on its content + parent novel context
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chapter_id } = await req.json();
    if (!chapter_id) throw new Error("chapter_id required");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );

    // Load chapter
    const { data: chapter, error: cErr } = await supabase
      .from("chapters")
      .select("id, title, content, chapter_order, novel_id, meta_title, meta_description, meta_keywords")
      .eq("id", chapter_id)
      .single();
    if (cErr || !chapter) throw new Error("Chapter not found");

    // Load parent novel for context
    const { data: novel } = await supabase
      .from("novels")
      .select("id, title, slug, synopsis, age_rating, thumbnail_url")
      .eq("id", chapter.novel_id)
      .single();

    const contentSnippet = (chapter.content || "").slice(0, 1500);

    // Ask AI to produce optimized SEO fields + Article schema
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior SEO specialist for an adult fiction platform. Output strict JSON. Match the chapter's language. Optimize meta_title to 50-58 chars (include novel title and chapter number), meta_description to 140-158 chars (intriguing summary, no spoilers), keywords 6-10 comma-separated.",
          },
          {
            role: "user",
            content: `Optimize SEO for this chapter page.

Novel: ${novel?.title || "(unknown)"}
Novel synopsis: ${novel?.synopsis || ""}
Age rating: ${novel?.age_rating || ""}
Chapter ${chapter.chapter_order}: ${chapter.title}
Content excerpt: ${contentSnippet}

Return JSON ONLY:
{
  "meta_title": "...",
  "meta_description": "...",
  "meta_keywords": "kw1, kw2, ...",
  "h1_suggestion": "...",
  "image_alt": "...",
  "schema_article": {
    "@context":"https://schema.org",
    "@type":"Article",
    "headline":"...",
    "description":"...",
    "articleSection":"Chapter ${chapter.chapter_order}",
    "isPartOf":{"@type":"Book","name":"${novel?.title || ""}"},
    "inLanguage":"..."
  },
  "improvements": ["short bullet of what changed", "..."]
}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const fix = JSON.parse(aiData.choices[0].message.content);

    const seoExtras = {
      h1_suggestion: fix.h1_suggestion,
      image_alt: fix.image_alt,
      schema_article: fix.schema_article,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("chapters")
      .update({
        meta_title: fix.meta_title?.slice(0, 70),
        meta_description: fix.meta_description?.slice(0, 170),
        meta_keywords: fix.meta_keywords,
        seo_extras: seoExtras,
      })
      .eq("id", chapter_id);
    if (upErr) throw upErr;

    return new Response(
      JSON.stringify({
        success: true,
        applied: {
          meta_title: fix.meta_title,
          meta_description: fix.meta_description,
          meta_keywords: fix.meta_keywords,
        },
        recommendations: {
          h1_suggestion: fix.h1_suggestion,
          image_alt: fix.image_alt,
          schema_article: fix.schema_article,
        },
        improvements: fix.improvements || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
