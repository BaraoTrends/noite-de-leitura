// SEO Audit using Lovable AI
// Analyzes a novel's SEO and returns score, issues, suggestions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { novel_id, url } = await req.json();
    if (!novel_id) throw new Error("novel_id is required");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch novel
    const { data: novel, error: nErr } = await supabase
      .from("novels")
      .select("title, slug, synopsis, content, meta_title, meta_description, meta_keywords, thumbnail_url, age_rating, authors(name)")
      .eq("id", novel_id)
      .single();
    if (nErr || !novel) throw new Error("Novel not found");

    const targetUrl = url || `https://eroticsnovels.com/novel/${novel.slug}`;

    // Create job
    const { data: job, error: jErr } = await supabase
      .from("seo_audit_jobs")
      .insert({ url: targetUrl, novel_id, status: "running", created_by: user.id })
      .select()
      .single();
    if (jErr) throw jErr;

    // Call Lovable AI
    const aiPrompt = `You are an SEO expert. Analyze the following novel page and return a JSON SEO audit.

NOVEL DATA:
- Title: ${novel.title}
- Author: ${(novel.authors as any)?.name || "Unknown"}
- URL: ${targetUrl}
- Meta Title: ${novel.meta_title || "(missing)"}
- Meta Description: ${novel.meta_description || "(missing)"}
- Meta Keywords: ${novel.meta_keywords || "(missing)"}
- Synopsis (first 500 chars): ${(novel.synopsis || "").slice(0, 500)}
- Content length: ${(novel.content || "").length} chars
- Has cover image: ${!!novel.thumbnail_url}
- Age rating: ${novel.age_rating}

Return ONLY valid JSON with this exact shape:
{
  "score": <0-100>,
  "issues": [{"severity": "high|medium|low", "category": "meta|content|technical", "message": "..."}],
  "suggestions": [{"priority": "high|medium|low", "action": "...", "impact": "..."}],
  "meta_analysis": {"title_length": N, "description_length": N, "keywords_count": N, "title_quality": "good|warning|bad", "description_quality": "good|warning|bad"},
  "content_analysis": {"length": N, "readability": "good|warning|bad", "keyword_density": "good|warning|bad"},
  "technical_analysis": {"has_image": true, "url_friendly": true, "schema_recommended": "Book|Article"},
  "ai_summary": "2-3 sentence summary"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an SEO expert. Always respond with valid JSON only, no markdown." },
          { role: "user", content: aiPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      await supabase.from("seo_audit_jobs").update({ status: "failed", ai_summary: `AI error: ${txt.slice(0, 200)}` }).eq("id", job.id);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    await supabase
      .from("seo_audit_jobs")
      .update({
        status: "completed",
        score: parsed.score || 0,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        meta_analysis: parsed.meta_analysis || {},
        content_analysis: parsed.content_analysis || {},
        technical_analysis: parsed.technical_analysis || {},
        ai_summary: parsed.ai_summary || "",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return new Response(JSON.stringify({ job_id: job.id, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
