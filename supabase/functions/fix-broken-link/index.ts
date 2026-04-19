// Suggests fixes for broken internal links using Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { broken_url, anchor_text, context } = await req.json();
    if (!broken_url) throw new Error("broken_url required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all published novels as candidates
    const { data: novels } = await supabase
      .from("novels")
      .select("title, slug, synopsis")
      .eq("status", "published")
      .limit(100);

    const candidates = (novels || []).map(n => ({
      url: `/novel/${n.slug}`,
      title: n.title,
      synopsis: (n.synopsis || "").slice(0, 150),
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
          { role: "system", content: "You suggest the best replacement URL for a broken internal link. Respond with valid JSON only." },
          { role: "user", content: `Broken URL: ${broken_url}
Anchor text: ${anchor_text || "(none)"}
Context: ${context || "(none)"}

Candidates:
${candidates.map(c => `- ${c.url} | ${c.title} | ${c.synopsis}`).join("\n")}

Return JSON: {"suggested_url": "...", "confidence": 0-100, "reason": "..."}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const parsed = JSON.parse(aiData.choices[0].message.content);

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
