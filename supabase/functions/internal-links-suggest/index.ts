// Suggests internal links between novels using Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { novel_id, save = false } = await req.json();
    if (!novel_id) throw new Error("novel_id required");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );

    const { data: source } = await supabase
      .from("novels")
      .select("title, slug, synopsis")
      .eq("id", novel_id)
      .single();
    if (!source) throw new Error("Novel not found");

    const { data: targets } = await supabase
      .from("novels")
      .select("id, title, slug, synopsis")
      .eq("status", "published")
      .neq("id", novel_id)
      .limit(50);

    const candidates = (targets || []).map(t => ({
      id: t.id,
      url: `/novel/${t.slug}`,
      title: t.title,
      synopsis: (t.synopsis || "").slice(0, 200),
    }));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You suggest contextually relevant internal links between novel pages for SEO. Respond with valid JSON only." },
          { role: "user", content: `Source novel: "${source.title}"
Synopsis: ${source.synopsis}

Candidate target novels:
${candidates.map((c, i) => `${i + 1}. [${c.id}] ${c.title} → ${c.url} | ${c.synopsis}`).join("\n")}

Suggest 5-8 internal links. Return JSON:
{
  "suggestions": [
    {
      "target_id": "uuid",
      "target_url": "/novel/slug",
      "anchor_text": "natural english phrase",
      "context": "where in the source page to add it",
      "relevance_score": 0-100,
      "reason": "..."
    }
  ]
}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const parsed = JSON.parse(aiData.choices[0].message.content);

    if (save && Array.isArray(parsed.suggestions)) {
      const sourceUrl = `/novel/${source.slug}`;
      const rows = parsed.suggestions.map((s: any) => ({
        source_novel_id: novel_id,
        source_url: sourceUrl,
        target_novel_id: s.target_id,
        target_url: s.target_url,
        anchor_text: s.anchor_text,
        context: s.context,
        relevance_score: s.relevance_score,
        status: "suggested",
      }));
      await supabase.from("internal_links").insert(rows);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
