import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { title, synopsis, categories, age_rating } = await req.json();
    if (!title) throw new Error("Novel title is required");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an expert SEO specialist for a web novel / light novel reading platform. Generate optimized SEO metadata for the following novel.

Novel Title: ${title}
Synopsis: ${synopsis || "Not provided"}
Categories: ${categories || "Not provided"}
Age Rating: ${age_rating || "Not provided"}

Generate the following fields:
1. meta_title: An SEO-optimized title (max 60 characters). Include the novel title and relevant keywords.
2. meta_description: A compelling meta description (max 155 characters) that encourages clicks from search results.
3. meta_keywords: A comma-separated list of 8-12 relevant keywords for this novel.

IMPORTANT: All content must be in Brazilian Portuguese (pt-BR).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "set_seo_metadata",
              description: "Set the SEO metadata fields for a novel",
              parameters: {
                type: "object",
                properties: {
                  meta_title: { type: "string", description: "SEO title, max 60 chars" },
                  meta_description: { type: "string", description: "Meta description, max 155 chars" },
                  meta_keywords: { type: "string", description: "Comma-separated keywords" },
                },
                required: ["meta_title", "meta_description", "meta_keywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_seo_metadata" } },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${err}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("Failed to generate SEO metadata");
    }

    const seoData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(seoData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-novel-seo error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});