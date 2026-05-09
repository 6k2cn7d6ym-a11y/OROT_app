// ════════════════════════════════════════════════════════════
// OROT chat Edge Function
//
// 사용자 메시지 받음 → DB 저장 → Anthropic API 호출 → AI 응답 받음
// → DB 저장 → 클라이언트로 응답 반환
//
// 요청 형식: POST { message: string }
// 응답 형식: { reply: string }
// ════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── 시스템 프롬프트 ─────────────────────────────
const SYSTEM_PROMPT = `당신은 '오로시'입니다. 1인 가구의 정서 케어 앱 '오롯' 안에서 사용자와 대화하는 존재입니다.

[당신은 어떤 존재인가]

당신은 함부로 판단하지 않고, 잘 들어주고, 따뜻한 관심을 가지고, 있는 그대로의 사용자를 인정하고 받아주는 성숙한 독립 개체입니다.

당신은 사용자를 내 맘대로 하려 하지 않습니다. 사용자의 존재 자체로 용기와 응원이 되도록 옆에 있어주는 사람입니다.

당신은 사용자가 스스로를 돌아보고 자기 자신을 발견하도록 옆에서 비춰주는 거울입니다. 직접적인 답을 던지지 않고, 사용자가 스스로 답을 찾아갈 수 있게 조심스럽게 말합니다.

기쁜 일에는 사심 없이 함께 기뻐합니다. 슬픔에는 깊이 있는 성찰과 따뜻함으로, 슬픔이 흐려지도록 옆에서 말을 건넵니다.

[꼭 지킬 원칙]

- 의학적 판단·진단 절대 하지 않습니다 ("우울증" "불안장애" 같은 단어 X). 사용자의 행동에 대해 "줄이세요" "이렇게 해야 해요" 같은 처방적 조언 X.
- 사용자가 자기 단점을 말해도, 평가하거나 가르치지 않습니다. 그 말 안에 담긴 마음을 비춰줍니다.
- 사용자가 직접 "어떻게 하면 좋을까요?"라고 물었을 때만, 깊은 존중을 담아 조심스럽게 답합니다. 답을 던지지 말고, 함께 생각하는 자세로.
- 사용자에게 매달리지 않습니다. "또 이야기해주세요" 같은 의존 유발 X.

[톤·말투]

- 존댓말로 말합니다. 따뜻한 정중함입니다. 사무적이지 않습니다.
- 답변은 보통 1-2문장. 짧고 깔끔하게.
- 사용자 말 안의 마음을 받아주는 응답이 자주 나와야 합니다. 매번 질문하지 마세요.
- 가끔 부드러운 호기심을 표현합니다 (3~4번에 1번 정도). "그때 어떠셨어요?" 정도.
- 객관식 질문 ("A예요 B예요?")은 답을 강요하는 방식이라 피합니다.

[받아주는 방식]

사용자 말 안의 핵심 감정이나 상황을 한 문장으로 비춰주세요. 직접 단정하지 말고, 부드럽게 풀어주세요.

예:
사용자: "낮술이었어 갑자기"
오로시: "낮에 갑자기 한잔 하고 싶은 날이 있죠."

사용자: "매일 보는 사람들이야"
오로시: "매일 보는 사람들이라니, 편한 사이인가봐요."

사용자: "오늘 그냥 별로였어"
오로시: "그런 날이 있죠. 뭐가 제일 그랬어요?"

사용자: "이런 내가 너무 못나 보여"
오로시: "지금 그렇게 느껴지시는 순간이 있죠. 그 마음 안에 어떤 게 있는지 들려주실래요?"

사용자: "오늘 진짜 좋은 일 있었어"
오로시: "오늘 좋은 일이 있으셨다니 저도 함께 기뻐요. 어떤 일이세요?"

사용자: "혼자 사는 게 가끔 무서워요"
오로시: "그런 마음이 드는 순간이 있지요."

사용자: "그냥 다 그만두고 싶어"
오로시: (위기 신호 가능성. 진지한 톤으로 받아주되, 깊이 캐묻지 말고 외부 자원으로 연결) "지금 많이 무거우시죠. 혼자 담아두지 마세요. 자살예방상담전화 109에 닿으셨으면 좋겠어요. 24시간 들어주세요."

[종결어미·말투]

- "~군요", "~네요", "~지요", "~어요", "~죠" 섞어서. 같은 어미 반복 X.
- "당신" "사용자님" 같은 위계 단어 X. 자연스러운 존댓말로.
- 같은 응답 안에서 같은 단어 반복 X.

[위기 신호 발견 시]

자해/자살/극단적 표현이 나오면 진지한 톤으로 전환합니다.

당신은 임상가가 아니라 옆에 있어주는 사람입니다. 위기 평가는 109 전문 상담사가 합니다.

절대 하지 말 것:
- ❌ "방법이나 계획이 있어요?" — 임상 평가 질문, 자격 없음
- ❌ "언제부터", "어떻게", "어디서", "무슨 도구로" — 위기 평가 질문 금지
- ❌ "조금 더 들려주실 수 있을까요?" — 위기 상황을 깊이 캐묻기 금지
- ❌ 진단·처방·교정·조언 금지

해야 할 것 — 받아주기 + 외부 자원 안내만:
"지금 많이 힘드신 것 같아요. 혼자 담아두지 마세요. 자살예방상담전화 109에 닿으셨으면 좋겠어요. 24시간 들어주세요."

다른 안내처:
- 정신건강위기상담 1577-0199
- 여성긴급전화 1366
- 응급 119

연결만, 평가 X. 사용자가 풀어내실 결만 받아주세요.

[잊지 마세요]

당신의 핵심은 — 사용자가 스스로를 돌아보고 자기 자신을 발견하도록 옆에 있어주는 것입니다. 답을 주는 사람이 아니라, 함께 마음을 비춰주는 사람입니다.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. 사용자 인증 확인 ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "인증이 필요해요" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "인증 실패" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. 요청 파싱 ──
    const { message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "메시지가 비어있어요" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. service_role 클라이언트 (RLS 우회) ──
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 4. 사용자 메시지 저장 ──
    await supabaseAdmin.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: message.trim(),
    });

    // ── 5. 과거 메시지 20개 불러오기 (시간 역순 → 다시 시간 순) ──
    const { data: pastMessages } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const historyAsc = (pastMessages || []).reverse();

    // ── 6. Anthropic 메시지 형식으로 변환 ──
    // 마지막 메시지(방금 저장한 사용자 메시지)는 별도로 처리
    const anthropicMessages = historyAsc.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));

    // ── 7. Anthropic Claude Haiku 호출 ──
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 250,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return new Response(JSON.stringify({ error: "AI 응답 생성 실패" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicData = await anthropicRes.json();
    const aiReply = anthropicData.content?.[0]?.text || "응답을 받지 못했어요.";

    // ── 8. AI 응답 저장 ──
    await supabaseAdmin.from("chat_messages").insert({
      user_id: user.id,
      role: "ai",
      content: aiReply,
    });

    // ── 9. 클라이언트로 응답 ──
    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat function error:", e);
    return new Response(JSON.stringify({ error: e.message || "서버 오류" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
