// AI assistant for content actions: rewrite, expand, summarize, improve, translate
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIONS: Record<string, string> = {
  rewrite: "Rewrite the following text in a more engaging, polished style. Keep the same meaning and length.",
  expand: "Expand the following text with more detail, sensory description, and depth. Roughly double the length while preserving tone.",
  summarize: "Summarize the following text into 2-3 concise sentences capturing the key points.",
  improve: "Improve the following text: fix grammar, enhance flow, strengthen vocabulary. Keep length similar.",
  shorten: "Shorten the following text to about half the length while keeping the core meaning and best phrases.",
  translate_pt: "Translate the following text to Brazilian Portuguese. Keep the literary tone and style.",
  translate_en: "Translate the following text to English. Keep the literary tone and style.",
  hook: "Rewrite the following text as a compelling opening hook (1-2 sentences) that makes readers want to continue.",
  seo: "Rewrite the following text to be more SEO-friendly: natural keyword usage, clear structure, scannable. Keep length similar.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, instructions, model = "google/gemini-3-flash-preview" } = await req.json();
    if (!action || !ACTIONS[action]) throw new Error(`Invalid action. Valid: ${Object.keys(ACTIONS).join(", ")}`);
    if (!text || typeof text !== "string") throw new Error("text required");
    if (text.length > 20000) throw new Error("text too long (max 20000 chars)");

    const systemPrompt = `You are a professional fiction editor for an adult romance novel platform. ${ACTIONS[action]}${instructions ? `\n\nAdditional instructions: ${instructions}` : ""}\n\nReturn ONLY the transformed text, no preamble, no explanations, no quotes.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const result = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
