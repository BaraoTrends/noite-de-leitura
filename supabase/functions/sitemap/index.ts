import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE_URL = "https://novelbraril.lovable.app";

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/categorias", changefreq: "weekly", priority: "0.8" },
  { loc: "/populares", changefreq: "daily", priority: "0.8" },
  { loc: "/novos", changefreq: "daily", priority: "0.8" },
  { loc: "/narradas", changefreq: "weekly", priority: "0.7" },
  { loc: "/busca", changefreq: "weekly", priority: "0.6" },
  { loc: "/sobre", changefreq: "monthly", priority: "0.4" },
  { loc: "/terms", changefreq: "monthly", priority: "0.3" },
  { loc: "/privacy", changefreq: "monthly", priority: "0.3" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: string): string {
  return new Date(date).toISOString().split("T")[0];
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: novels, error } = await supabase
      .from("novels")
      .select("id, slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("DB error:", error.message);
      return new Response("Internal Server Error", { status: 500 });
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("slug, created_at")
      .eq("is_active", true);

    const { data: authors } = await supabase
      .from("authors")
      .select("id, updated_at")
      .eq("is_active", true);

    let urls = "";

    // Static pages
    for (const page of STATIC_PAGES) {
      urls += `
  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // Novel pages
    for (const novel of novels || []) {
      const lastmod = novel.updated_at || novel.published_at;
      urls += `
  <url>
    <loc>${BASE_URL}/novel/${escapeXml(novel.id)}</loc>
    <lastmod>${formatDate(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Category pages
    for (const cat of categories || []) {
      urls += `
  <url>
    <loc>${BASE_URL}/categoria/${escapeXml(cat.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Author pages
    for (const author of authors || []) {
      urls += `
  <url>
    <loc>${BASE_URL}/autor/${escapeXml(author.id)}</loc>
    <lastmod>${formatDate(author.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
