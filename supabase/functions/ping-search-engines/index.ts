// Ping Bing/IndexNow + Google sitemap notification
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://eroticsnovels.com";
const INDEXNOW_KEY = "8a7b6c5d4e3f2g1h0i9j8k7l6m5n4o3p"; // Static key — host file at /{key}.txt

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) throw new Error("urls (array) required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: Record<string, any> = {};

    // 1. IndexNow (Bing, Yandex)
    try {
      const indexNowRes = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "eroticsnovels.com",
          key: INDEXNOW_KEY,
          keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      });
      results.indexnow = { status: indexNowRes.status, ok: indexNowRes.ok };
    } catch (e: any) {
      results.indexnow = { error: e.message };
    }

    // 2. Google sitemap ping (deprecated by Google in 2023, but still safe)
    try {
      const googleRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITE + "/sitemap.xml")}`);
      results.google_sitemap = { status: googleRes.status };
    } catch (e: any) {
      results.google_sitemap = { error: e.message };
    }

    // 3. Bing sitemap ping
    try {
      const bingRes = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITE + "/sitemap.xml")}`);
      results.bing_sitemap = { status: bingRes.status };
    } catch (e: any) {
      results.bing_sitemap = { error: e.message };
    }

    // 4. Update indexing_status for each URL
    for (const u of urls) {
      await supabase
        .from("indexing_status")
        .upsert(
          { url: u, status: "submitted", last_submitted_at: new Date().toISOString() },
          { onConflict: "url" }
        );
    }

    return new Response(JSON.stringify({ success: true, results, submitted: urls.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
