// Dynamic OG image generator using SVG → PNG
// Returns a PNG image with the novel title, author, and cover thumbnail
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function wrap(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (words.length > lines.join(" ").split(/\s+/).length) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, max - 3) + "...";
  }
  return lines;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const titleParam = url.searchParams.get("title");
    const subtitleParam = url.searchParams.get("subtitle");

    let title = titleParam || "Erotics Novels";
    let subtitle = subtitleParam || "Read Stories Online";
    let thumbnail: string | null = null;

    if (slug) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await supabase
        .from("novels")
        .select("title, synopsis, thumbnail_url, authors(name)")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        title = data.title;
        subtitle = (data.authors as any)?.name ? `By ${(data.authors as any).name}` : (data.synopsis?.slice(0, 80) || subtitle);
        thumbnail = data.thumbnail_url;
      }
    }

    const titleLines = wrap(title, 28, 3);
    const subtitleLines = wrap(subtitle, 60, 2);

    const W = 1200, H = 630;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a0d0d"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d4a574"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="url(#gold)"/>
  ${thumbnail ? `<image href="${escapeXml(thumbnail)}" x="60" y="115" width="280" height="400" preserveAspectRatio="xMidYMid slice"/>` : ""}
  <g font-family="Georgia, serif" fill="#f5e6d3">
    ${titleLines.map((l, i) => `<text x="${thumbnail ? 380 : 60}" y="${200 + i * 70}" font-size="60" font-weight="bold">${escapeXml(l)}</text>`).join("")}
    ${subtitleLines.map((l, i) => `<text x="${thumbnail ? 380 : 60}" y="${200 + titleLines.length * 70 + 50 + i * 36}" font-size="28" fill="#d4a574">${escapeXml(l)}</text>`).join("")}
  </g>
  <text x="60" y="${H - 40}" font-family="Georgia, serif" font-size="24" fill="#d4a574" font-weight="bold">EROTICS NOVELS</text>
  <text x="${W - 60}" y="${H - 40}" font-family="Arial, sans-serif" font-size="20" fill="#888" text-anchor="end">eroticsnovels.com</text>
</svg>`;

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
