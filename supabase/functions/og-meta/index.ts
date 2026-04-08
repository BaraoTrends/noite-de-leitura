import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE_NAME = "Erotics Novels";
const BASE_URL = "https://novelbraril.lovable.app";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=630&fit=crop";

const CRAWLER_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "Slackbot",
  "TelegramBot",
  "Discordbot",
  "Pinterest",
  "Googlebot",
  "bingbot",
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  author?: string;
  publishDate?: string;
}): string {
  const { title, description, image, url, type = "website", author, publishDate } = opts;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description.substring(0, 200));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}"/>
  <meta property="og:title" content="${safeTitle}"/>
  <meta property="og:description" content="${safeDesc}"/>
  <meta property="og:image" content="${escapeHtml(image)}"/>
  <meta property="og:url" content="${escapeHtml(url)}"/>
  <meta property="og:type" content="${type}"/>
  <meta property="og:site_name" content="${SITE_NAME}"/>
  <meta property="og:locale" content="pt_BR"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${safeTitle}"/>
  <meta name="twitter:description" content="${safeDesc}"/>
  <meta name="twitter:image" content="${escapeHtml(image)}"/>
  ${author ? `<meta property="article:author" content="${escapeHtml(author)}"/>` : ""}
  ${publishDate ? `<meta property="article:published_time" content="${publishDate}"/>` : ""}
  <link rel="canonical" href="${escapeHtml(url)}"/>
</head>
<body>
  <p>${safeTitle}</p>
  <p>${safeDesc}</p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  const userAgent = req.headers.get("user-agent") || "";

  // Only serve OG HTML to crawlers
  if (!isCrawler(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${BASE_URL}${path}` },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Novel detail page: /novel/<id-or-slug>
    const novelMatch = path.match(/^\/novel\/(.+)$/);
    if (novelMatch) {
      const identifier = novelMatch[1];
      const { data: novel } = await supabase
        .from("novels")
        .select("title, synopsis, thumbnail_url, slug, published_at, meta_title, meta_description, author_id, authors(name)")
        .or(`id.eq.${identifier},slug.eq.${identifier}`)
        .eq("status", "published")
        .single();

      if (novel) {
        const authorName = (novel as any).authors?.name || "";
        return new Response(
          buildOgHtml({
            title: novel.meta_title || `${novel.title} | ${SITE_NAME}`,
            description: novel.meta_description || novel.synopsis,
            image: novel.thumbnail_url || DEFAULT_IMAGE,
            url: `${BASE_URL}/novel/${novel.slug || identifier}`,
            type: "article",
            author: authorName,
            publishDate: novel.published_at || undefined,
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } }
        );
      }
    }

    // Author page: /autor/<id>
    const authorMatch = path.match(/^\/autor\/(.+)$/);
    if (authorMatch) {
      const authorId = authorMatch[1];
      const { data: author } = await supabase
        .from("authors")
        .select("name, bio, avatar_url")
        .eq("id", authorId)
        .eq("is_active", true)
        .single();

      if (author) {
        return new Response(
          buildOgHtml({
            title: `${author.name} | ${SITE_NAME}`,
            description: author.bio || `Conheça as obras de ${author.name}`,
            image: author.avatar_url || DEFAULT_IMAGE,
            url: `${BASE_URL}/autor/${authorId}`,
            type: "profile",
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } }
        );
      }
    }

    // Category page: /categoria/<slug>
    const catMatch = path.match(/^\/categoria\/(.+)$/);
    if (catMatch) {
      const catSlug = catMatch[1];
      const { data: category } = await supabase
        .from("categories")
        .select("name, description")
        .eq("slug", catSlug)
        .eq("is_active", true)
        .single();

      if (category) {
        return new Response(
          buildOgHtml({
            title: `${category.name} | ${SITE_NAME}`,
            description: category.description || `Novels na categoria ${category.name}`,
            image: DEFAULT_IMAGE,
            url: `${BASE_URL}/categoria/${catSlug}`,
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } }
        );
      }
    }

    // Fallback: generic OG tags
    return new Response(
      buildOgHtml({
        title: `${SITE_NAME} - Leia Histórias Online Grátis`,
        description: "Sua plataforma favorita para ler novels e histórias online. Fantasia, romance, suspense, drama e muito mais.",
        image: DEFAULT_IMAGE,
        url: `${BASE_URL}${path}`,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    console.error("OG Meta error:", err);
    return new Response(
      buildOgHtml({
        title: SITE_NAME,
        description: "Leia novels e histórias online grátis.",
        image: DEFAULT_IMAGE,
        url: `${BASE_URL}${path}`,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
});
