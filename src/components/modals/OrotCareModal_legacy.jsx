// ⚠️ LEGACY — import 안 함. 참고용으로만 보관.
// 옛 구조: 구독(Mock 결제) + B 동의가 한 모달에 묶여있었음
// 분리된 곳:
//   - 새 OrotCareModal.jsx (준비 중 안내)
//   - Settings.jsx 안 정서 동행 토글
// 구독 방향이 결정되면 이 코드를 참고해서 새로 작성할 것.
import { useState, useEffect } from "react";
import { C } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";

// 미구독 → 결제 화면 (Mock) → 동의 모달 → 활성화
// 구독 중 → 관리 화면 (해지 가능)
export default function OrotCareModalLegacy({ onClose, subscription, consent, onSubscribed, onCancelled }) {
  const { user } = useAuth();
  const [view, setView] = useState("intro"); // intro | consent | done | manage
  const [plan, setPlan] = useState("monthly"); // monthly | half
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isActive = subscription?.status === "active";

  useEffect(() => {
    if (isActive) setView("manage");
  }, [isActive]);

  // Mock 결제 → 구독 + 동의 동시 활성화
  const handleSubscribe = async () => {
    if (!agreed || processing) return;
    setProcessing(true);
    try {
      const now = new Date().toISOString();

      // subscription upsert
      const { data: sub } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "orot_care",
          status: "active",
          started_at: now,
          updated_at: now,
        }, { onConflict: "user_id" })
        .select()
        .single();

      // consent upsert
      const { data: con } = await supabase
        .from("consent_states")
        .upsert({
          user_id: user.id,
          counselor_consent: true,
          counselor_consented_at: now,
          updated_at: now,
        }, { onConflict: "user_id" })
        .select()
        .single();

      onSubscribed(sub, con);
      setView("done");
    } catch (e) {
      console.error("구독 처리 실패:", e);
      alert("처리 실패. 다시 시도해주세요.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("정말 오롯 케어를 해지하시겠어요?\n해지 시 임상심리사 검수가 중단되고, 정서 동행 동의도 함께 해제됩니다.")) return;
    setProcessing(true);
    try {
      const now = new Date().toISOString();
      const { data: sub } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: now,
          updated_at: now,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      await supabase
        .from("consent_states")
        .update({
          counselor_consent: false,
          updated_at: now,
        })
        .eq("user_id", user.id);

      onCancelled(sub);
      onClose();
    } catch (e) {
      console.error("해지 실패:", e);
      alert("해지 실패. 다시 시도해주세요.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: C.bg, zIndex: 200,
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
      overflowY: "auto",
    }}>
      {/* 헤더 */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => {
            if (view === "consent") setView("intro");
            else onClose();
          }}
          style={{ fontSize: 22, color: C.sub, padding: 4 }}
        >
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17 }}>
          {view === "intro" && "오롯 케어"}
          {view === "consent" && "정서 동행 동의"}
          {view === "done" && "오롯 케어 시작"}
          {view === "manage" && "오롯 케어"}
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* intro — 결제 화면 */}
      {view === "intro" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🌱</div>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, lineHeight: 1.5, marginBottom: 16 }}>
            혼자 정리하는 마음을<br />함께 보아드려요
          </div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, marginBottom: 20 }}>
            오롯 케어를 시작하시면, 임상심리사 1급 자격을 가진 운영진이 회원님의 정서 기록과 대화를 살펴보고, 필요한 경우 도움이 될 수 있는 자원을 안내해드려요.
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.7, marginBottom: 32, padding: "12px 14px", background: C.card, borderRadius: 8 }}>
            * 본 서비스는 의료 행위가 아니며, 진단·치료를 제공하지 않습니다.<br />
            * 위기 상황에서는 자살예방상담전화 109 등 공식 지원체계로 연결을 안내해드립니다.
          </div>

          {/* 가격 옵션 */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setPlan("monthly")}
              style={{
                width: "100%",
                background: plan === "monthly" ? C.dark : C.surface,
                border: `1px solid ${plan === "monthly" ? C.dark : C.border}`,
                borderRadius: 12,
                padding: "16px 18px",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, color: plan === "monthly" ? "#fff" : C.text, fontWeight: 500, marginBottom: 4 }}>월 구독</div>
                <div style={{ fontSize: 11, color: plan === "monthly" ? "#D4C4B8" : C.muted, fontWeight: 300 }}>매달 자동 결제</div>
              </div>
              <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 18, color: plan === "monthly" ? "#fff" : C.text }}>
                9,900원
              </div>
            </button>
            <button
              onClick={() => setPlan("half")}
              style={{
                width: "100%",
                background: plan === "half" ? C.dark : C.surface,
                border: `1px solid ${plan === "half" ? C.dark : C.border}`,
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, color: plan === "half" ? "#fff" : C.text, fontWeight: 500, marginBottom: 4 }}>
                  6개월 구독 <span style={{ fontSize: 10, color: C.warm, marginLeft: 6 }}>7% 할인</span>
                </div>
                <div style={{ fontSize: 11, color: plan === "half" ? "#D4C4B8" : C.muted, fontWeight: 300 }}>월 약 9,167원</div>
              </div>
              <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 18, color: plan === "half" ? "#fff" : C.text }}>
                55,000원
              </div>
            </button>
          </div>

          <button
            onClick={() => setView("consent")}
            style={{
              width: "100%",
              background: C.warm,
              color: "#fff",
              padding: "14px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            다음
          </button>

          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.6, marginTop: 16, textAlign: "center" }}>
            언제든 해지하실 수 있어요. 결제 시점에 정서 동행 동의가 함께 활성화됩니다.
          </div>
        </div>
      )}

      {/* consent — 동의 모달 */}
      {view === "consent" && (
        <div style={{ flex: 1, padding: "28px 24px" }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 18, lineHeight: 1.5, marginBottom: 8 }}>
            정서 동행 동의
          </div>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
            오롯 케어 이용을 위해 아래 내용에 동의가 필요해요.<br />
            민감한 정보가 다루어지므로 정확히 확인해주세요.
          </div>

          {/* 5개 항목 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
            {[
              { label: "제공받는 자", value: "오롯 운영진 (운영자 + 임상심리사 1급)" },
              { label: "제공 목적", value: "정서 기록·대화 검토 및 필요 시 자원 안내" },
              { label: "제공 항목", value: "기분 기록, AI 대화 내용, 매일·주간 정서 정리" },
              { label: "보유·이용 기간", value: "오롯 케어 해지 또는 회원 탈퇴 시까지" },
              { label: "거부 권리", value: "동의 거부 가능합니다. 단, 거부 시 오롯 케어 이용이 불가합니다." },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 300, lineHeight: 1.6 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* 면책 문구 */}
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.7, marginBottom: 20, padding: "12px 14px", background: C.card, borderRadius: 8 }}>
            * 본 서비스는 의료 행위가 아니며, 진단·치료를 제공하지 않습니다.<br />
            * 위기 상황에서는 자살예방상담전화 109 등 공식 지원체계로 연결을 안내해드립니다.
          </div>

          {/* 동의 체크 */}
          <div
            onClick={() => setAgreed(!agreed)}
            style={{
              padding: "14px 16px",
              border: `1px solid ${agreed ? C.warm : C.border}`,
              borderRadius: 10,
              marginBottom: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: agreed ? "#FAF3EC" : C.surface,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${agreed ? C.warm : C.muted}`,
              background: agreed ? C.warm : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {agreed && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
            </div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 400 }}>
              위 내용을 모두 확인했고 동의합니다
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={!agreed || processing}
            style={{
              width: "100%",
              background: agreed ? C.warm : C.muted,
              color: "#fff",
              padding: "14px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              opacity: processing ? 0.6 : 1,
              cursor: agreed && !processing ? "pointer" : "default",
            }}
          >
            {processing ? "처리 중..." : `${plan === "monthly" ? "9,900원" : "55,000원"} 결제하고 시작하기`}
          </button>

          <div style={{ fontSize: 10, color: C.muted, fontWeight: 300, lineHeight: 1.6, marginTop: 12, textAlign: "center" }}>
            * 시연용 화면입니다. 실제 결제는 진행되지 않아요.
          </div>
        </div>
      )}

      {/* done — 시작 완료 */}
      {view === "done" && (
        <div style={{ flex: 1, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🌱</div>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, lineHeight: 1.5, marginBottom: 16 }}>
            오롯 케어가 시작됐어요
          </div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, marginBottom: 40, maxWidth: 320, margin: "0 auto 40px" }}>
            오늘부터 임상심리사가 회원님의 정서 기록을 살펴보아드려요. 평소처럼 기록하고 대화하시면 됩니다.
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.warm,
              color: "#fff",
              padding: "14px 40px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            돌아가기
          </button>
        </div>
      )}

      {/* manage — 관리 화면 */}
      {view === "manage" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.warmLight}`, borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>🌱</span>
              <div style={{ fontSize: 14, fontWeight: 500 }}>이용 중</div>
            </div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.8 }}>
              {subscription?.started_at && (
                <div style={{ marginBottom: 6 }}>
                  시작일: {new Date(subscription.started_at).toLocaleDateString("ko-KR")}
                </div>
              )}
              <div>정서 동행 동의: 활성</div>
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.text, fontWeight: 500, marginBottom: 10 }}>
              지금 함께하는 분들
            </div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.8 }}>
              오롯 운영진 (운영자 + 임상심리사 1급)<br />
              회원님의 기분 기록과 대화, 정서 정리를 살펴보고 있어요.
            </div>
          </div>

          <button
            onClick={handleCancel}
            disabled={processing}
            style={{
              width: "100%",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "14px",
              fontSize: 13,
              color: "#C44545",
              fontWeight: 400,
              opacity: processing ? 0.6 : 1,
              cursor: processing ? "default" : "pointer",
            }}
          >
            {processing ? "처리 중..." : "오롯 케어 해지"}
          </button>
        </div>
      )}
    </div>
  );
}
