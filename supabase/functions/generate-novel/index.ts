import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractJson(raw: string): any {
  if (!raw) throw new Error("Empty AI response");
  // Try fenced code block first
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    // Try to locate first { ... last }
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = candidate.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error("Failed to parse AI JSON response");
  }
}

async function callAI(model: string, systemPrompt: string, userPrompt: string, maxTokens = 8000) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });

  if (response.status === 429) throw new Error("Rate limit exceeded. Try again in a moment.");
  if (response.status === 402) throw new Error("AI credits exhausted. Add funds in Settings > Workspace > Usage.");
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI Gateway error (${response.status}): ${err.slice(0, 300)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      type, genre, theme, tone, language,
      chapterCount, novelTitle, novelSynopsis,
      chapterNumber, model,
      // NEW: chapter selection
      startChapter, endChapter, chapterNumbers,
    } = body;

    const lang = language || "Portuguese (Brazil)";
    const useModel = model || "google/gemini-3-flash-preview";

    if (type === "novel") {
      const systemPrompt = `You are a creative fiction writer. Generate a novel concept in ${lang}. Return valid JSON only, no markdown.`;
      const userPrompt = `Create a novel concept with the following:
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
  "read_time": number
}`;
      const raw = await callAI(useModel, systemPrompt, userPrompt, 6000);
      const parsed = extractJson(raw);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (type === "single_chapter") {
      const systemPrompt = `You are a creative fiction writer. Write a full chapter in ${lang}. Return valid JSON only, no markdown.`;
      const userPrompt = `For a novel titled "${novelTitle}" with synopsis: "${novelSynopsis}"

Write chapter ${chapterNumber || 1}. Return JSON:
{
  "title": "string",
  "content": "string (full chapter, 1500-3000 words)"
}`;
      const raw = await callAI(useModel, systemPrompt, userPrompt, 8000);
      const parsed = extractJson(raw);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (type === "chapters") {
      // Build target chapter list
      let targets: number[] = [];
      if (Array.isArray(chapterNumbers) && chapterNumbers.length > 0) {
        targets = chapterNumbers.map((n: any) => parseInt(n)).filter((n: number) => !isNaN(n) && n > 0);
      } else if (startChapter && endChapter) {
        const s = Math.max(1, parseInt(startChapter));
        const e = Math.max(s, parseInt(endChapter));
        for (let i = s; i <= e; i++) targets.push(i);
      } else {
        const count = Math.max(1, Math.min(30, parseInt(chapterCount) || 5));
        for (let i = 1; i <= count; i++) targets.push(i);
      }

      // Cap to avoid timeouts
      if (targets.length > 10) targets = targets.slice(0, 10);

      const systemPrompt = `You are a creative fiction writer. Write full chapters in ${lang}. Return valid JSON only, no markdown.`;
      const wordTarget = targets.length <= 3 ? "1200-2000" : targets.length <= 6 ? "800-1400" : "600-1000";
      const userPrompt = `For a novel titled "${novelTitle}" with synopsis: "${novelSynopsis}"

Write the following chapter numbers in order: ${targets.join(", ")}.
Each chapter should be ${wordTarget} words and continue the story coherently.

Return JSON exactly:
{
  "chapters": [
    { "title": "string", "chapter_order": number, "content": "string" }
  ]
}
Use the requested chapter numbers as chapter_order values.`;

      const raw = await callAI(useModel, systemPrompt, userPrompt, 16000);
      const parsed = extractJson(raw);
      if (!parsed?.chapters || !Array.isArray(parsed.chapters)) {
        throw new Error("AI did not return a 'chapters' array. Try fewer chapters or another model.");
      }
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid type. Use 'novel', 'chapters', or 'single_chapter'.");
  } catch (error: any) {
    console.error("generate-novel error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
