import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { type, genre, theme, tone, language, chapterCount, novelTitle, novelSynopsis, chapterNumber, model } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "novel") {
      systemPrompt = `You are a creative fiction writer. Generate a novel concept in ${language || "Portuguese (Brazil)"}. Return valid JSON only, no markdown.`;
      userPrompt = `Create a novel concept with the following:
- Genre: ${genre || "any"}
- Theme: ${theme || "any"}
- Tone: ${tone || "dramatic"}

Return JSON with these exact fields:
{
  "title": "string",
  "synopsis": "string (2-3 paragraphs)",
  "content": "string (introduction/prologue, 500-800 words)",
  "tags": ["string array of 3-5 tags"],
  "age_rating": "Livre" or "+12" or "+16" or "+18",
  "read_time": number (estimated minutes)
}`;
    } else if (type === "chapters") {
      systemPrompt = `You are a creative fiction writer. Generate chapter outlines in ${language || "Portuguese (Brazil)"}. Return valid JSON only, no markdown.`;
      userPrompt = `For a novel titled "${novelTitle}" with synopsis: "${novelSynopsis}"

Generate ${chapterCount || 5} chapter outlines. Return JSON:
{
  "chapters": [
    {
      "title": "string",
      "chapter_order": number,
      "content": "string (chapter content, 800-1500 words each)"
    }
  ]
}`;
    } else if (type === "single_chapter") {
      systemPrompt = `You are a creative fiction writer. Write a full chapter in ${language || "Portuguese (Brazil)"}. Return valid JSON only, no markdown.`;
      userPrompt = `For a novel titled "${novelTitle}" with synopsis: "${novelSynopsis}"

Write chapter ${chapterNumber || 1}. Return JSON:
{
  "title": "string",
  "content": "string (full chapter content, 1500-3000 words)"
}`;
    } else {
      throw new Error("Invalid type. Use 'novel', 'chapters', or 'single_chapter'.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI Gateway error: ${err}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { raw: rawContent };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
