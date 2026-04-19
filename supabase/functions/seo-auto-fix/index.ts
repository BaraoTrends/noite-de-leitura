// Auto-applies SEO fixes to a novel using AI based on its latest audit
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { novel_id } = await req.json();
    if (!novel_id) throw new Error("novel_id required");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );

    // Load novel + categories
    const { data: novel, error: nErr } = await supabase
      .from("novels")
      .select("id, title, slug, synopsis, meta_title, meta_description, meta_keywords, thumbnail_url, age_rating")
      .eq("id", novel_id)
      .single();
    if (nErr || !novel) throw new Error("Novel not found");

    const { data: cats } = await supabase
      .from("novel_categories")
      .select("categories(name)")
      .eq("novel_id", novel_id);
    const categoryNames = (cats || []).map((c: any) => c.categories?.name).filter(Boolean).join(", ");

    // Latest audit (optional context)
    const { data: lastAudit } = await supabase
      .from("seo_audit_jobs")
      .select("score, issues, suggestions, ai_summary")
      .eq("novel_id", novel_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const auditContext = lastAudit
      ? `\n\nLatest audit score: ${lastAudit.score}/100\nAI summary: ${lastAudit.ai_summary}\nIssues: ${JSON.stringify(lastAudit.issues)}\nSuggestions: ${JSON.stringify(lastAudit.suggestions)}`
      : "";

    // Ask AI to produce optimized SEO fields + structured data
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
            content: "You are a senior SEO specialist for an adult fiction platform. Output strict JSON. Use the page's primary language (match the synopsis language). Optimize meta_title to 50-58 chars, meta_description to 140-158 chars, include the primary keyword naturally. Keywords list should be 8-12 comma-separated terms.",
          },
          {
            role: "user",
            content: `Optimize SEO for this novel page based on the audit findings.

Title: ${novel.title}
Slug: ${novel.slug}
Synopsis: ${novel.synopsis}
Categories: ${categoryNames || "(none)"}
Age rating: ${novel.age_rating}
Current meta_title: ${novel.meta_title || "(none)"}
Current meta_description: ${novel.meta_description || "(none)"}
Current meta_keywords: ${novel.meta_keywords || "(none)"}${auditContext}

Return JSON ONLY:
{
  "meta_title": "...",
  "meta_description": "...",
  "meta_keywords": "kw1, kw2, ...",
  "h1_suggestion": "...",
  "image_alt": "...",
  "schema_book": { "@context":"https://schema.org", "@type":"Book", "name":"...", "author":{"@type":"Person","name":"..."}, "description":"...", "image":"...", "inLanguage":"..." },
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

    // Apply optimized meta fields to novel
    const { error: upErr } = await supabase
      .from("novels")
      .update({
        meta_title: fix.meta_title?.slice(0, 70),
        meta_description: fix.meta_description?.slice(0, 170),
        meta_keywords: fix.meta_keywords,
      })
      .eq("id", novel_id);
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
          schema_book: fix.schema_book,
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
