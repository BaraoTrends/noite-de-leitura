// Suggests SEO keywords/briefing using Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, synopsis, categories, age_rating } = await req.json();
    if (!title) throw new Error("title required");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an SEO content strategist for adult fiction platforms. Respond with valid JSON only." },
          { role: "user", content: `Create an SEO briefing for this novel page (English market).

Title: ${title}
Synopsis: ${synopsis || "(none)"}
Categories: ${categories || "(none)"}
Age rating: ${age_rating || "Adult"}

Return JSON:
{
  "primary_keyword": "...",
  "secondary_keywords": ["...", "..."],
  "long_tail_keywords": ["...", "...", "..."],
  "search_intent": "informational|navigational|transactional",
  "recommended_title_pattern": "...",
  "recommended_description_pattern": "...",
  "content_outline": ["heading 1", "heading 2", ...],
  "internal_link_topics": ["topic 1", "topic 2"],
  "competitor_angle": "..."
}` },
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
