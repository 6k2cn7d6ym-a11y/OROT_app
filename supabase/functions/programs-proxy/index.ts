// IMHERE — programs-proxy Edge Function
// 서울 OpenAPI는 HTTP만 지원. 클라이언트(HTTPS)에서 직접 호출하면
// Mixed Content / SSL_PROTOCOL_ERROR로 차단됨.
// 이 함수가 서버 결로 HTTP 호출 → HTTPS로 응답 돌려줌.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAPI_KEY = Deno.env.get("SEOUL_OPENAPI_KEY");
    if (!OPENAPI_KEY) {
      throw new Error("SEOUL_OPENAPI_KEY not set in Supabase Secrets");
    }

    const OPENAPI_SERVICE = "tbPartcptn";

    const url = new URL(req.url);
    const start = url.searchParams.get("start") || "1";
    const end = url.searchParams.get("end") || "1000";

    // 숫자 검증 (injection 방지)
    if (!/^\d+$/.test(start) || !/^\d+$/.test(end)) {
      throw new Error("Invalid start/end (numbers only)");
    }

    const apiUrl = `http://openapi.seoul.go.kr:8088/${OPENAPI_KEY}/json/${OPENAPI_SERVICE}/${start}/${end}/`;

    const apiRes = await fetch(apiUrl);

    if (!apiRes.ok) {
      throw new Error(`Seoul API ${apiRes.status}`);
    }

    const json = await apiRes.json();

    return new Response(JSON.stringify(json), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // 30분 캐시 (CDN 결)
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message || "fetch failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
