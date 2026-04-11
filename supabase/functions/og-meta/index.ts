import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE_NAME = "Erotics Novels";
const BASE_URL = "https://eroticsnovels.com";
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
  "YandexBot",
  "DuckDuckBot",
  "Baiduspider",
  "Sogou",
  "Applebot",
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function buildFullHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  author?: string;
  publishDate?: string;
  keywords?: string;
  bodyContent: string;
  jsonLd?: object;
  breadcrumbs?: { name: string; url: string }[];
}): string {
  const {
    title, description, image, url, type = "website",
    author, publishDate, keywords, bodyContent, jsonLd, breadcrumbs,
  } = opts;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description.substring(0, 200));

  const breadcrumbLd = breadcrumbs
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      })
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}"/>
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}"/>` : ""}
  <meta name="robots" content="index, follow"/>
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
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
  ${breadcrumbLd ? `<script type="application/ld+json">${breadcrumbLd}</script>` : ""}
</head>
<body>
  <header>
    <nav>
      <a href="${BASE_URL}/">${SITE_NAME}</a>
      <ul>
        <li><a href="${BASE_URL}/categorias">Categorias</a></li>
        <li><a href="${BASE_URL}/populares">Populares</a></li>
        <li><a href="${BASE_URL}/novos">Lançamentos</a></li>
        <li><a href="${BASE_URL}/narradas">Narradas</a></li>
        <li><a href="${BASE_URL}/busca">Busca</a></li>
      </ul>
    </nav>
  </header>
  <main>
    ${bodyContent}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Todos os direitos reservados.</p>
    <ul>
      <li><a href="${BASE_URL}/sobre">Sobre</a></li>
      <li><a href="${BASE_URL}/terms">Termos de Uso</a></li>
      <li><a href="${BASE_URL}/privacy">Política de Privacidade</a></li>
    </ul>
  </footer>
</body>
</html>`;
}

function renderNovelCard(novel: any, authorName: string): string {
  const cats = novel.novel_categories?.map((nc: any) => nc.categories?.name).filter(Boolean) || [];
  const slug = novel.slug || novel.id;
  return `
    <article>
      <a href="${BASE_URL}/novel/${escapeHtml(slug)}">
        ${novel.thumbnail_url ? `<img src="${escapeHtml(novel.thumbnail_url)}" alt="Capa de ${escapeHtml(novel.title)}" loading="lazy" width="300" height="400"/>` : ""}
        <h3>${escapeHtml(novel.title)}</h3>
      </a>
      <p>por <a href="${BASE_URL}/autor/${novel.author_id}">${escapeHtml(authorName)}</a></p>
      ${cats.length > 0 ? `<p>Categorias: ${cats.map((c: string) => escapeHtml(c)).join(", ")}</p>` : ""}
      <p>${escapeHtml((novel.synopsis || "").substring(0, 200))}</p>
      <p>Classificação: ${novel.age_rating} | Avaliação: ${novel.rating}/5 | ${novel.views} visualizações | ${novel.read_time} min de leitura</p>
    </article>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  const userAgent = req.headers.get("user-agent") || "";

  if (!isCrawler(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${BASE_URL}${path}` },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ===== HOME PAGE =====
    if (path === "/" || path === "") {
      const { data: novels } = await supabase
        .from("novels")
        .select("*, authors(name), novel_categories(category_id, categories(name))")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(20);

      const { data: categories } = await supabase
        .from("categories")
        .select("name, slug, description")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      let body = `<h1>${SITE_NAME} - Leia Novels e Histórias Online Grátis</h1>`;
      body += `<p>Sua plataforma favorita para ler novels e histórias online. Fantasia, romance, suspense, drama e muito mais.</p>`;

      if (novels?.length) {
        body += `<section><h2>Novels em Destaque</h2>`;
        for (const n of novels) {
          body += renderNovelCard(n, (n as any).authors?.name || "Desconhecido");
        }
        body += `</section>`;
      }

      if (categories?.length) {
        body += `<section><h2>Categorias</h2><ul>`;
        for (const c of categories) {
          body += `<li><a href="${BASE_URL}/categoria/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a>${c.description ? ` - ${escapeHtml(c.description)}` : ""}</li>`;
        }
        body += `</ul></section>`;
      }

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: BASE_URL,
        description: "Sua plataforma favorita para ler novels e histórias online.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/busca?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

      return new Response(
        buildFullHtml({
          title: `${SITE_NAME} - Leia Novels e Histórias Online Grátis`,
          description: "Sua plataforma favorita para ler novels e histórias online. Fantasia, romance, suspense, drama e muito mais.",
          image: DEFAULT_IMAGE,
          url: BASE_URL,
          keywords: "novels, histórias online, romance, fantasia, suspense, ler online grátis, light novel, web novel",
          bodyContent: body,
          jsonLd,
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
      );
    }

    // ===== NOVEL DETAIL =====
    const novelMatch = path.match(/^\/novel\/([^/]+)$/);
    if (novelMatch) {
      const identifier = novelMatch[1];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let novelQuery = supabase
        .from("novels")
        .select("*, authors(name, bio, id), novel_categories(category_id, categories(name)), novel_tags(tag_id, tags(name))")
        .eq("status", "published");
      if (isUuid) {
        novelQuery = novelQuery.eq("id", identifier);
      } else {
        novelQuery = novelQuery.eq("slug", identifier);
      }
      const { data: novel } = await novelQuery.single();

      if (novel) {
        const authorName = (novel as any).authors?.name || "Desconhecido";
        const authorId = (novel as any).authors?.id || novel.author_id;
        const cats = novel.novel_categories?.map((nc: any) => nc.categories?.name).filter(Boolean) || [];
        const tags = novel.novel_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [];
        const slug = novel.slug || identifier;

        // Fetch chapters
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id, title, chapter_order, views, published_at")
          .eq("novel_id", novel.id)
          .eq("status", "published")
          .order("chapter_order", { ascending: true });

        let body = `
          <article>
            <h1>${escapeHtml(novel.title)}</h1>
            ${novel.thumbnail_url ? `<img src="${escapeHtml(novel.thumbnail_url)}" alt="Capa de ${escapeHtml(novel.title)}" width="400" height="533"/>` : ""}
            <p>por <a href="${BASE_URL}/autor/${authorId}">${escapeHtml(authorName)}</a></p>
            <p>Classificação indicativa: ${escapeHtml(novel.age_rating)}</p>
            ${cats.length > 0 ? `<p>Categorias: ${cats.map((c: string) => `<a href="${BASE_URL}/categoria/${encodeURIComponent(c)}">${escapeHtml(c)}</a>`).join(", ")}</p>` : ""}
            ${tags.length > 0 ? `<p>Tags: ${tags.map((t: string) => escapeHtml(t)).join(", ")}</p>` : ""}
            <p>Avaliação: ${novel.rating}/5 (${novel.rating_count} avaliações) | ${novel.views} visualizações | ${novel.read_time} min de leitura</p>
            <h2>Sinopse</h2>
            <p>${escapeHtml(novel.synopsis || "")}</p>
            <h2>Conteúdo</h2>
            <div>${novel.content ? stripHtml(novel.content).substring(0, 3000) : ""}</div>
        `;

        if (chapters?.length) {
          body += `<h2>Capítulos (${chapters.length})</h2><ol>`;
          for (const ch of chapters) {
            body += `<li><a href="${BASE_URL}/novel/${slug}/capitulo/${ch.id}">${escapeHtml(ch.title)}</a></li>`;
          }
          body += `</ol>`;
        }

        body += `</article>`;

        const wordCount = stripHtml(novel.content || "").split(/\s+/).length;
        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: novel.title,
          description: novel.synopsis,
          image: novel.thumbnail_url || DEFAULT_IMAGE,
          author: { "@type": "Person", name: authorName },
          datePublished: novel.published_at,
          dateModified: novel.updated_at,
          publisher: { "@type": "Organization", name: SITE_NAME },
          wordCount,
          interactionStatistic: [
            { "@type": "InteractionCounter", interactionType: "https://schema.org/ReadAction", userInteractionCount: novel.views },
          ],
          aggregateRating: novel.rating_count > 0 ? {
            "@type": "AggregateRating",
            ratingValue: novel.rating,
            ratingCount: novel.rating_count,
            bestRating: 5,
            worstRating: 1,
          } : undefined,
        };

        const breadcrumbs = [
          { name: "Início", url: BASE_URL },
          ...(cats.length > 0 ? [{ name: cats[0], url: `${BASE_URL}/categoria/${encodeURIComponent(cats[0])}` }] : []),
          { name: novel.title, url: `${BASE_URL}/novel/${slug}` },
        ];

        return new Response(
          buildFullHtml({
            title: novel.meta_title || `${novel.title} | ${SITE_NAME}`,
            description: novel.meta_description || novel.synopsis,
            image: novel.thumbnail_url || DEFAULT_IMAGE,
            url: `${BASE_URL}/novel/${slug}`,
            type: "article",
            author: authorName,
            publishDate: novel.published_at || undefined,
            keywords: novel.meta_keywords || cats.join(", "),
            bodyContent: body,
            jsonLd,
            breadcrumbs,
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
        );
      }
    }

    // ===== CHAPTER READER =====
    const chapterMatch = path.match(/^\/novel\/(.+)\/capitulo\/(.+)$/);
    if (chapterMatch) {
      const novelIdentifier = chapterMatch[1];
      const chapterId = chapterMatch[2];

      const { data: chapter } = await supabase
        .from("chapters")
        .select("*, novels(title, slug, id, thumbnail_url, synopsis, authors(name, id))")
        .eq("id", chapterId)
        .eq("status", "published")
        .single();

      if (chapter) {
        const novelData = (chapter as any).novels;
        const authorName = novelData?.authors?.name || "Desconhecido";
        const novelSlug = novelData?.slug || novelData?.id || novelIdentifier;
        const chapterContent = stripHtml(chapter.content || "").substring(0, 5000);

        const body = `
          <article>
            <h1>${escapeHtml(chapter.title)}</h1>
            <p>Novel: <a href="${BASE_URL}/novel/${escapeHtml(novelSlug)}">${escapeHtml(novelData?.title || "")}</a></p>
            <p>por <a href="${BASE_URL}/autor/${novelData?.authors?.id || ""}">${escapeHtml(authorName)}</a></p>
            <div>${escapeHtml(chapterContent)}</div>
          </article>
        `;

        const breadcrumbs = [
          { name: "Início", url: BASE_URL },
          { name: novelData?.title || "", url: `${BASE_URL}/novel/${novelSlug}` },
          { name: chapter.title, url: `${BASE_URL}/novel/${novelSlug}/capitulo/${chapterId}` },
        ];

        return new Response(
          buildFullHtml({
            title: `${chapter.title} - ${novelData?.title || ""} | ${SITE_NAME}`,
            description: `Leia ${chapter.title} de ${novelData?.title || ""} online grátis.`,
            image: novelData?.thumbnail_url || DEFAULT_IMAGE,
            url: `${BASE_URL}/novel/${novelSlug}/capitulo/${chapterId}`,
            type: "article",
            author: authorName,
            bodyContent: body,
            breadcrumbs,
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
        );
      }
    }

    // ===== AUTHOR PAGE =====
    const authorMatch = path.match(/^\/autor\/(.+)$/);
    if (authorMatch) {
      const authorId = authorMatch[1];
      const { data: author } = await supabase
        .from("authors")
        .select("*")
        .eq("id", authorId)
        .eq("is_active", true)
        .single();

      if (author) {
        const { data: authorNovels } = await supabase
          .from("novels")
          .select("*, novel_categories(category_id, categories(name))")
          .eq("author_id", authorId)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(20);

        let body = `
          <h1>${escapeHtml(author.name)}</h1>
          ${author.avatar_url ? `<img src="${escapeHtml(author.avatar_url)}" alt="${escapeHtml(author.name)}" width="200" height="200"/>` : ""}
          ${author.bio ? `<p>${escapeHtml(author.bio)}</p>` : ""}
        `;

        if (authorNovels?.length) {
          body += `<section><h2>Obras de ${escapeHtml(author.name)}</h2>`;
          for (const n of authorNovels) {
            body += renderNovelCard(n, author.name);
          }
          body += `</section>`;
        }

        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.name,
          description: author.bio || `Autor(a) em ${SITE_NAME}`,
          image: author.avatar_url || undefined,
          url: `${BASE_URL}/autor/${authorId}`,
        };

        return new Response(
          buildFullHtml({
            title: `${author.name} | ${SITE_NAME}`,
            description: author.bio || `Conheça as obras de ${author.name} em ${SITE_NAME}`,
            image: author.avatar_url || DEFAULT_IMAGE,
            url: `${BASE_URL}/autor/${authorId}`,
            type: "profile",
            bodyContent: body,
            jsonLd,
            breadcrumbs: [
              { name: "Início", url: BASE_URL },
              { name: author.name, url: `${BASE_URL}/autor/${authorId}` },
            ],
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
        );
      }
    }

    // ===== CATEGORY PAGE =====
    const catMatch = path.match(/^\/categoria\/(.+)$/);
    if (catMatch) {
      const catSlug = catMatch[1];
      const { data: category } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", catSlug)
        .eq("is_active", true)
        .single();

      if (category) {
        const { data: catNovels } = await supabase
          .from("novels")
          .select("*, authors(name), novel_categories!inner(category_id, categories(name))")
          .eq("novel_categories.category_id", category.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(20);

        let body = `
          <h1>Novels de ${escapeHtml(category.name)}</h1>
          ${category.description ? `<p>${escapeHtml(category.description)}</p>` : ""}
        `;

        if (catNovels?.length) {
          for (const n of catNovels) {
            body += renderNovelCard(n, (n as any).authors?.name || "Desconhecido");
          }
        } else {
          body += `<p>Nenhum novel encontrado nesta categoria.</p>`;
        }

        return new Response(
          buildFullHtml({
            title: `Novels de ${category.name} | ${SITE_NAME}`,
            description: category.description || `Leia novels na categoria ${category.name}`,
            image: DEFAULT_IMAGE,
            url: `${BASE_URL}/categoria/${catSlug}`,
            bodyContent: body,
            breadcrumbs: [
              { name: "Início", url: BASE_URL },
              { name: "Categorias", url: `${BASE_URL}/categorias` },
              { name: category.name, url: `${BASE_URL}/categoria/${catSlug}` },
            ],
          }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
        );
      }
    }

    // ===== CATEGORIES LIST =====
    if (path === "/categorias") {
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      let body = `<h1>Categorias de Novels</h1>`;
      if (categories?.length) {
        body += `<ul>`;
        for (const c of categories) {
          body += `<li><a href="${BASE_URL}/categoria/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a>${c.description ? ` - ${escapeHtml(c.description)}` : ""}</li>`;
        }
        body += `</ul>`;
      }

      return new Response(
        buildFullHtml({
          title: `Categorias | ${SITE_NAME}`,
          description: "Explore todas as categorias de novels disponíveis.",
          image: DEFAULT_IMAGE,
          url: `${BASE_URL}/categorias`,
          bodyContent: body,
          breadcrumbs: [
            { name: "Início", url: BASE_URL },
            { name: "Categorias", url: `${BASE_URL}/categorias` },
          ],
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
      );
    }

    // ===== POPULAR =====
    if (path === "/populares") {
      const { data: novels } = await supabase
        .from("novels")
        .select("*, authors(name), novel_categories(category_id, categories(name))")
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(20);

      let body = `<h1>Novels Mais Populares</h1>`;
      if (novels?.length) {
        for (const n of novels) {
          body += renderNovelCard(n, (n as any).authors?.name || "Desconhecido");
        }
      }

      return new Response(
        buildFullHtml({
          title: `Novels Populares | ${SITE_NAME}`,
          description: "As novels mais lidas e populares da plataforma.",
          image: DEFAULT_IMAGE,
          url: `${BASE_URL}/populares`,
          bodyContent: body,
          breadcrumbs: [
            { name: "Início", url: BASE_URL },
            { name: "Populares", url: `${BASE_URL}/populares` },
          ],
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
      );
    }

    // ===== NEW RELEASES =====
    if (path === "/novos") {
      const { data: novels } = await supabase
        .from("novels")
        .select("*, authors(name), novel_categories(category_id, categories(name))")
        .eq("status", "published")
        .eq("is_new", true)
        .order("published_at", { ascending: false })
        .limit(20);

      let body = `<h1>Lançamentos</h1>`;
      if (novels?.length) {
        for (const n of novels) {
          body += renderNovelCard(n, (n as any).authors?.name || "Desconhecido");
        }
      }

      return new Response(
        buildFullHtml({
          title: `Lançamentos | ${SITE_NAME}`,
          description: "As novels mais recentes publicadas na plataforma.",
          image: DEFAULT_IMAGE,
          url: `${BASE_URL}/novos`,
          bodyContent: body,
          breadcrumbs: [
            { name: "Início", url: BASE_URL },
            { name: "Lançamentos", url: `${BASE_URL}/novos` },
          ],
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
      );
    }

    // ===== STATIC PAGES =====
    const staticPages: Record<string, { title: string; description: string }> = {
      "/sobre": { title: `Sobre | ${SITE_NAME}`, description: `Conheça o ${SITE_NAME}, sua plataforma favorita para ler novels online.` },
      "/terms": { title: `Termos de Uso | ${SITE_NAME}`, description: `Termos e condições de uso do ${SITE_NAME}.` },
      "/privacy": { title: `Política de Privacidade | ${SITE_NAME}`, description: `Política de privacidade do ${SITE_NAME}.` },
      "/narradas": { title: `Novels Narradas | ${SITE_NAME}`, description: `Novels com narração em áudio disponível.` },
      "/busca": { title: `Buscar Novels | ${SITE_NAME}`, description: `Pesquise e encontre novels por título, autor ou categoria.` },
    };

    if (staticPages[path]) {
      const pg = staticPages[path];
      return new Response(
        buildFullHtml({
          title: pg.title,
          description: pg.description,
          image: DEFAULT_IMAGE,
          url: `${BASE_URL}${path}`,
          bodyContent: `<h1>${escapeHtml(pg.title.split(" | ")[0])}</h1><p>${escapeHtml(pg.description)}</p>`,
          breadcrumbs: [
            { name: "Início", url: BASE_URL },
            { name: pg.title.split(" | ")[0], url: `${BASE_URL}${path}` },
          ],
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400" } }
      );
    }

    // ===== FALLBACK =====
    return new Response(
      buildFullHtml({
        title: `${SITE_NAME} - Leia Histórias Online Grátis`,
        description: "Sua plataforma favorita para ler novels e histórias online. Fantasia, romance, suspense, drama e muito mais.",
        image: DEFAULT_IMAGE,
        url: `${BASE_URL}${path}`,
        bodyContent: `<h1>${SITE_NAME}</h1><p>Sua plataforma favorita para ler novels e histórias online.</p>`,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    console.error("OG Meta error:", err);
    return new Response(
      buildFullHtml({
        title: SITE_NAME,
        description: "Leia novels e histórias online grátis.",
        image: DEFAULT_IMAGE,
        url: `${BASE_URL}${path}`,
        bodyContent: `<h1>${SITE_NAME}</h1><p>Leia novels e histórias online grátis.</p>`,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
});
