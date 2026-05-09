import { useState, useEffect } from "react";
import { C, GU_CENTERS } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { dateKey, yesterdayKey, targetWeekStartKey, formatWeekRange } from "../../utils/date";
import OrotCareModal from "./OrotCareModal";
import { useConnectedDistricts } from "../../lib/useConnectedDistricts";

// ───────── 마이페이지 ─────────
export function MyPage({ authed, onSignupStart, onLoginStart, userGu, moodLog, streak, setDiaryView, openSettings, openGuModal, onCrisisOpen }) {
  const { user, profile: ctxProfile } = useAuth();
  const profile = ctxProfile || { nickname: "", gu: null };

  const [dailySummary, setDailySummary] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(null);

  const [careModalOpen, setCareModalOpen] = useState(false); // 오롯 케어 (준비 중)

  const center = userGu ? GU_CENTERS[userGu] : null;
  const totalDays = Object.keys(moodLog).length;

  // 어제 요약 — 있으면 가져오고, 없으면 어제 활동 있을 때만 lazy 생성
  useEffect(() => {
    if (!authed || !user) return;
    let cancelled = false;
    const ydate = yesterdayKey();

    (async () => {
      try {
        // 이미 저장된 게 있는지
        const { data: existing } = await supabase
          .from("daily_summaries")
          .select("summary")
          .eq("user_id", user.id)
          .eq("date", ydate)
          .maybeSingle();
        if (cancelled) return;
        if (existing?.summary) {
          setDailySummary(existing.summary);
          return;
        }

        // 어제 활동 있는지 체크 (없으면 호출 X)
        const { data: yMoods } = await supabase
          .from("mood_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", ydate)
          .limit(1);
        if (cancelled) return;
        if (!yMoods || yMoods.length === 0) {
          // mood 없으면 chat도 체크
          const start = `${ydate}T00:00:00`;
          const end = `${ydate}T23:59:59`;
          const { data: yMsgs } = await supabase
            .from("chat_messages")
            .select("id")
            .eq("user_id", user.id)
            .gte("created_at", start)
            .lte("created_at", end)
            .limit(1);
          if (cancelled) return;
          if (!yMsgs || yMsgs.length === 0) return; // 활동 X → 종료
        }

        // 호출
        setDailyLoading(true);
        const { data, error } = await supabase.functions.invoke("daily-summary", {
          body: { date: ydate },
        });
        if (cancelled) return;
        if (error) {
          console.error("daily-summary 호출 실패:", error);
        } else if (data?.summary) {
          setDailySummary(data.summary);
        }
      } catch (e) {
        console.error("daily summary 예외:", e);
      } finally {
        if (!cancelled) setDailyLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authed, user?.id]);

  // 주간 요약 — 일요일이면 이번 주, 아니면 지난 주
  useEffect(() => {
    if (!authed || !user) return;
    let cancelled = false;
    const wstart = targetWeekStartKey();
    setWeekStart(wstart);

    (async () => {
      try {
        const { data: existing } = await supabase
          .from("weekly_summaries")
          .select("summary")
          .eq("user_id", user.id)
          .eq("week_start", wstart)
          .maybeSingle();
        if (cancelled) return;
        if (existing?.summary) {
          setWeeklySummary(existing.summary);
          return;
        }

        // 그 주 daily 있는지
        const wend = new Date(wstart);
        wend.setDate(wend.getDate() + 6);
        const wendStr = dateKey(wend);
        const { data: dailies } = await supabase
          .from("daily_summaries")
          .select("id")
          .eq("user_id", user.id)
          .gte("date", wstart)
          .lte("date", wendStr)
          .limit(1);
        if (cancelled) return;
        if (!dailies || dailies.length === 0) return; // daily 없음 → 종료

        setWeeklyLoading(true);
        const { data, error } = await supabase.functions.invoke("weekly-summary", {
          body: { week_start: wstart },
        });
        if (cancelled) return;
        if (error) {
          console.error("weekly-summary 호출 실패:", error);
        } else if (data?.summary) {
          setWeeklySummary(data.summary);
        }
      } catch (e) {
        console.error("weekly summary 예외:", e);
      } finally {
        if (!cancelled) setWeeklyLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authed, user?.id]);

  // 게스트 모드
  if (!authed) {
    return (
      <div style={{ flex: 1, padding: "52px 24px 28px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400, lineHeight: 1.4, marginBottom: 6 }}>
            나의 자리
          </div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 300 }}>
            로그인하시면 나만의 기록과 정리가 쌓여요
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>
            🌿
          </div>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 16, marginBottom: 8 }}>
            아직 비어있어요
          </div>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7, marginBottom: 20 }}>
            기분 기록과 대화, 정서 정리는<br />
            로그인한 분만 이용하실 수 있어요.
          </div>
          <button
            onClick={onSignupStart}
            style={{ background: C.warm, color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 8 }}
          >
            회원가입하고 시작하기 →
          </button>
          <div>
            <button
              onClick={onLoginStart}
              style={{ fontSize: 12, color: C.muted, fontWeight: 300, padding: "8px 16px" }}
            >
              이미 계정 있으세요? 로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 인증 모드
  return (
    <div style={{ flex: 1, padding: "52px 24px 28px" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400 }}>
          나의 자리
        </div>
        <button
          onClick={openSettings}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "transparent",
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: C.sub,
          }}
          aria-label="설정"
        >
          ⚙
        </button>
      </div>

      {/* 프로필 카드 */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
            🌿
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 18, marginBottom: 4 }}>
              {profile.nickname || "닉네임 미설정"}
            </div>
            {userGu && (
              <button
                onClick={openGuModal}
                style={{ fontSize: 12, color: C.sub, display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}
              >
                <span>📍 {userGu}</span>
                <span style={{ fontSize: 9, color: C.muted }}>▾</span>
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, color: C.warm, lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 300 }}>연속 기록</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, color: C.warm, lineHeight: 1 }}>{totalDays}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 300 }}>총 기록</div>
          </div>
        </div>
      </div>

      {/* 내 기록 */}
      <button
        onClick={() => setDiaryView(true)}
        style={{
          width: "100%",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 400 }}>내 기록</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginTop: 2 }}>캘린더와 감정 분포</div>
          </div>
        </div>
        <span style={{ fontSize: 14, color: C.muted }}>›</span>
      </button>

      {/* 어제의 흐름 */}
      {(dailySummary || dailyLoading) && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>🌿</span>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>어제의 흐름</div>
          </div>
          {dailyLoading ? (
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.7 }}>
              어제를 비춰보고 있어요...
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {dailySummary}
            </div>
          )}
        </div>
      )}

      {/* 한 주의 흐름 */}
      {(weeklySummary || weeklyLoading) && weekStart && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🌙</span>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>한 주의 흐름</div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>
              {formatWeekRange(weekStart)}
            </div>
          </div>
          {weeklyLoading ? (
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.7 }}>
              지난 한 주를 정리하고 있어요...
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {weeklySummary}
            </div>
          )}
        </div>
      )}

      {/* 오롯 케어 — 구독 (준비 중) */}
      <button
        onClick={() => setCareModalOpen(true)}
        style={{
          width: "100%",
          background: C.surface,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🌱</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>오롯 케어</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.5 }}>
              준비 중
            </div>
          </div>
        </div>
        <span style={{ fontSize: 14, color: C.muted }}>›</span>
      </button>

      {/* 오롯 케어 모달 (준비 중) */}
      {careModalOpen && (
        <OrotCareModal onClose={() => setCareModalOpen(false)} />
      )}

      {/* 1인가구 지원 */}
      {center?.name && (
        <>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
            우리 동네 자원
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 6 }}>
              📍 {userGu} 1인가구 지원
            </div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 4 }}>
              {center.name}
            </div>
            <a
              href={`tel:${center.phone}`}
              style={{ fontSize: 15, color: C.warm, fontWeight: 500, textDecoration: "none" }}
            >
              {center.phone}
            </a>
          </div>
        </>
      )}

      {/* 위기 진입 — 외부 통화 4개 + 자치구 정신건강복지센터 */}
      <button
        onClick={onCrisisOpen}
        style={{
          width: "100%",
          background: C.surface,
          color: C.text,
          border: `1px solid ${C.warmLight}`,
          borderRadius: 14,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🌿</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>
              지금 너무 힘드시다면
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.5 }}>
              24시간 자원 + 자치구 정신건강복지센터
            </div>
          </div>
        </div>
        <span style={{ fontSize: 14, color: C.muted }}>›</span>
      </button>
    </div>
  );
}

// ───────── SettingsItem ─────────
function SettingsItem({ label, sub, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px 24px",
        background: "transparent",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: danger ? "#C73E3E" : C.text, fontWeight: 400 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 2 }}>{sub}</div>}
      </div>
      {!danger && <span style={{ fontSize: 14, color: C.muted }}>›</span>}
    </button>
  );
}

// ───────── 설정 ─────────
export default function Settings({ onClose, userGu }) {
  const [view, setView] = useState("main"); // main / nickname / gov_id / consent / emergency / emergency_add
  const [nickname, setNickname] = useState("");
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [govAssignedId, setGovAssignedId] = useState(""); // 연결된 발급번호 (표시용)
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", relationship: "가족", phone: "" });
  const [consent, setConsent] = useState(null); // null | { counselor_consent, counselor_consented_at, district_consent_summary, district_consent_mood }
  const [consentToggling, setConsentToggling] = useState(false);

  // 발급번호 검색·연결
  const [formGovId, setFormGovId] = useState("");
  const [formName, setFormName] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchedRow, setSearchedRow] = useState(null); // null | district_registrations row
  const [searchError, setSearchError] = useState("");
  const [connectAgreed, setConnectAgreed] = useState({
    req_view: false,
    req_crisis: false,
    req_chat: false,
    opt_summary: false,
    opt_mood: false,
  });
  const [connecting, setConnecting] = useState(false);

  // D 동의 토글 (연결 후)
  const [districtSummaryToggling, setDistrictSummaryToggling] = useState(false);
  const [districtMoodToggling, setDistrictMoodToggling] = useState(false);

  const center = userGu ? GU_CENTERS[userGu] : null;
  const { user, profile, refreshProfile } = useAuth();
  const { connected: connectedDistricts } = useConnectedDistricts();
  const isGuConnected = userGu ? connectedDistricts.includes(userGu) : false;
  const consentOn = !!consent?.counselor_consent;
  const summaryOn = !!consent?.district_consent_summary;
  const moodOn = !!consent?.district_consent_mood;
  const requiredAllAgreed = connectAgreed.req_view && connectAgreed.req_crisis && connectAgreed.req_chat;

  // 프로필 값 채우기 (useAuth().profile 변화 감지)
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
      setGovAssignedId(profile.gov_assigned_id || "");
      setVerifiedAt(profile.verified_at);
    }
  }, [profile]);

  // 정서 동행 동의 불러오기
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: con } = await supabase
          .from("consent_states")
          .select("counselor_consent, counselor_consented_at, district_consent_summary, district_consent_mood")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setConsent(con);
      } catch (e) {
        console.error("동의 불러오기 실패:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // 정서 동행 동의 토글 — 낙관적 업데이트 + 실패 시 롤백
  const toggleConsent = async () => {
    if (consentToggling || !user) return;
    const prev = consent;
    const next = !consentOn;
    const now = new Date().toISOString();
    setConsentToggling(true);
    setConsent({
      counselor_consent: next,
      counselor_consented_at: next ? now : prev?.counselor_consented_at || null,
    });
    try {
      const { error } = await supabase
        .from("consent_states")
        .upsert(
          {
            user_id: user.id,
            counselor_consent: next,
            ...(next ? { counselor_consented_at: now } : {}),
            updated_at: now,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    } catch (e) {
      console.error("정서 동행 동의 변경 실패:", e);
      setConsent(prev); // 롤백
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setConsentToggling(false);
    }
  };

  // emergency_contacts만 자체 fetch (AuthContext에 없음)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: ec } = await supabase
          .from("emergency_contacts")
          .select("id, name, phone, relationship, created_at")
          .order("created_at", { ascending: true });
        if (!cancelled) setContacts(ec || []);
      } catch (e) {
        console.error("연락처 불러오기 실패:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const addContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim() || saving) return;
    setSaving(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from("emergency_contacts")
          .insert({
            user_id: user.id,
            name: newContact.name.trim(),
            phone: newContact.phone.trim(),
            relationship: newContact.relationship,
          })
          .select()
          .single();
        if (error) throw error;
        setContacts((p) => [...p, data]);
        setNewContact({ name: "", relationship: "가족", phone: "" });
        setView("emergency");
      }
    } catch (e) {
      console.error("연락처 추가 실패:", e);
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (id) => {
    if (!confirm("이 연락처를 삭제하시겠어요?")) return;
    try {
      await supabase.from("emergency_contacts").delete().eq("id", id);
      setContacts((p) => p.filter((c) => c.id !== id));
    } catch (e) {
      console.error("연락처 삭제 실패:", e);
    }
  };

  const handleLogout = async () => {
    if (!confirm("정말 로그아웃 하시겠어요?")) return;
    try {
      localStorage.removeItem("orot_user_gu");
      localStorage.removeItem("orot_mood_log");
      localStorage.removeItem("sb-orot-auth-token");
      await supabase.auth.signOut();
      window.location.reload();
    } catch (e) {
      console.error("로그아웃 실패:", e);
      window.location.reload();
    }
  };

  const saveNickname = async () => {
    if (!nickname.trim() || saving) return;
    setSaving(true);
    try {
      if (user) {
        await supabase.from("profiles").update({ nickname: nickname.trim() }).eq("id", user.id);
        await refreshProfile();
        setView("main");
      }
    } catch (e) {
      console.error("닉네임 저장 실패:", e);
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  // 발급번호 검색 — match_district_registration RPC 사용 (SECURITY DEFINER로 RLS 우회)
  const searchRegistration = async () => {
    if (!formGovId.trim() || !formName.trim() || searching) return;
    setSearching(true);
    setSearchError("");
    try {
      const { data, error } = await supabase.rpc("match_district_registration", {
        gov_id_input: formGovId.trim(),
        name_input: formName.trim(),
      });
      if (error) throw error;
      // RPC 결과가 array일 수도 single object일 수도 있음
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setSearchError("발급번호 또는 이름이 일치하지 않아요. 다시 확인해주세요.");
        setSearchedRow(null);
      } else {
        setSearchedRow(row);
      }
    } catch (e) {
      console.error("발급번호 검색 실패:", e);
      setSearchError("검색 실패. 잠시 후 다시 시도해주세요.");
      setSearchedRow(null);
    } finally {
      setSearching(false);
    }
  };

  // 검색 화면으로 돌아가기 (다시 검색)
  const clearSearch = () => {
    setSearchedRow(null);
    setSearchError("");
    setConnectAgreed({ req_view: false, req_crisis: false, req_chat: false, opt_summary: false, opt_mood: false });
  };

  // 연결 — 3개 테이블 update + refreshProfile
  const connect = async () => {
    if (!searchedRow || !user || connecting || !requiredAllAgreed) return;
    if (searchedRow.gu !== userGu) return; // 자치구 불일치 (UI에서 차단되지만 한 번 더 확인)
    setConnecting(true);
    const now = new Date().toISOString();
    try {
      // 1. district_registrations update
      const { error: regErr } = await supabase
        .from("district_registrations")
        .update({
          linked_user_id: user.id,
          linked_at: now,
          status: "linked",
        })
        .eq("id", searchedRow.id);
      if (regErr) throw regErr;

      // 2. profiles update
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          gov_assigned_id: searchedRow.gov_assigned_id,
          verified_at: now,
        })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // 3. consent_states upsert (선택 2개만 저장 — 필수 3개는 발급번호 입력 자체가 동의)
      const { error: conErr } = await supabase
        .from("consent_states")
        .upsert(
          {
            user_id: user.id,
            district_consent_summary: connectAgreed.opt_summary,
            district_consent_mood: connectAgreed.opt_mood,
            updated_at: now,
          },
          { onConflict: "user_id" }
        );
      if (conErr) throw conErr;

      // 4. profile 갱신 → verified_at 설정되어 State A로 자동 전환
      await refreshProfile();

      // 5. consent state 갱신
      setConsent((p) => ({
        ...(p || {}),
        district_consent_summary: connectAgreed.opt_summary,
        district_consent_mood: connectAgreed.opt_mood,
      }));

      // 6. 검색 상태 초기화 (clearSearch — State A로 전환)
      clearSearch();
      setFormGovId("");
      setFormName("");
    } catch (e) {
      console.error("발급번호 연결 실패:", e);
      alert("연결 실패. 다시 시도해주세요.");
    } finally {
      setConnecting(false);
    }
  };

  // D 동의 토글 (연결 후)
  const toggleDistrictConsent = async (key) => {
    if (!user) return;
    const isSummary = key === "district_consent_summary";
    const togglingSetter = isSummary ? setDistrictSummaryToggling : setDistrictMoodToggling;
    const currentVal = isSummary ? summaryOn : moodOn;
    togglingSetter(true);
    const prev = consent;
    const next = !currentVal;
    const now = new Date().toISOString();
    setConsent((p) => ({ ...(p || {}), [key]: next }));
    try {
      const { error } = await supabase
        .from("consent_states")
        .upsert(
          {
            user_id: user.id,
            [key]: next,
            updated_at: now,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    } catch (e) {
      console.error(`${key} 변경 실패:`, e);
      setConsent(prev); // 롤백
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      togglingSetter(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.bg,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* 헤더 */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => {
            if (view === "main") onClose();
            else if (view === "emergency_add") setView("emergency");
            else if (view === "nickname" && !nickname.trim()) {
              alert("닉네임은 비울 수 없어요.");
              return;
            }
            else setView("main");
          }}
          style={{ fontSize: 22, color: C.sub, background: "transparent", padding: 4 }}
          aria-label="닫기"
        >
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17, fontWeight: 400 }}>
          {view === "main" && "설정"}
          {view === "nickname" && "닉네임 변경"}
          {view === "gov_id" && "자치구 부여번호"}
          {view === "consent" && "정서 동행 동의"}
          {view === "emergency" && "긴급 연락처"}
          {view === "emergency_add" && "연락처 추가"}
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* 메인 화면 */}
      {view === "main" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* 자치구 1인가구 지원센터 카드 */}
          {center?.name && (
            <div style={{ padding: "16px 24px" }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 6 }}>
                  📍 {userGu} 1인가구 지원
                </div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 4 }}>{center.name}</div>
                <a href={`tel:${center.phone}`} style={{ fontSize: 15, color: C.warm, fontWeight: 500, textDecoration: "none" }}>
                  {center.phone}
                </a>
              </div>
            </div>
          )}

          <div style={{ padding: "8px 0" }}>
            <SettingsItem label="프로필" sub={profile?.nickname || "닉네임 미설정"} onClick={() => { setNickname(profile?.nickname || ""); setView("nickname"); }} />
            <SettingsItem
              label="자치구"
              sub={userGu || "선택 안 됨"}
              onClick={() => alert("자치구 변경 — 홈 화면 좌측 상단의 자치구 칩으로 변경하실 수 있어요")}
            />
            <SettingsItem
              label="자치구 부여번호"
              sub={
                verifiedAt
                  ? "활성화됨 ✓"
                  : !isGuConnected
                  ? "연결 준비 중"
                  : "등록 안 됨"
              }
              onClick={() => setView("gov_id")}
            />
            <SettingsItem
              label="정서 동행 동의"
              sub={consentOn ? "활성" : "동의 안 됨"}
              onClick={() => setView("consent")}
            />
            <SettingsItem
              label="긴급 연락처"
              sub={contacts.length > 0 ? `${contacts.length}명 등록됨` : "등록된 연락처 없음"}
              onClick={() => setView("emergency")}
            />

            <div style={{ height: 1, background: C.border, margin: "16px 24px" }} />

            <SettingsItem label="로그아웃" sub="" onClick={handleLogout} danger />
          </div>
        </div>
      )}

      {/* 닉네임 변경 화면 */}
      {view === "nickname" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 8, fontWeight: 300 }}>
            앱에서 사용할 닉네임이에요
          </div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={20}
            style={{ width: "100%", padding: "14px 16px", fontSize: 15, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, marginBottom: 16, fontFamily: "inherit" }}
          />
          <button
            onClick={saveNickname}
            disabled={!nickname.trim() || saving}
            style={{ width: "100%", background: nickname.trim() ? C.dark : C.border, color: "#fff", padding: "15px", borderRadius: 8, fontSize: 14, cursor: nickname.trim() ? "pointer" : "default" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      )}

      {/* 부여번호 화면 — 4단계 분기 */}
      {view === "gov_id" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
          {/* State A: 연결됨 */}
          {verifiedAt ? (
            <>
              <div style={{ background: C.surface, border: `1px solid ${C.warmLight}`, borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>연결되었어요</div>
                </div>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.8 }}>
                  <div style={{ marginBottom: 4 }}>📍 {userGu}</div>
                  <div style={{ marginBottom: 4 }}>발급번호: {govAssignedId}</div>
                  <div>연결일: {new Date(verifiedAt).toLocaleDateString("ko-KR")}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
                자치구 담당자가 보는 정보 (선택)
              </div>

              {/* D 동의 선택 2 토글 — 매일·주간 요약 */}
              <div style={{ background: C.surface, border: `1px solid ${summaryOn ? C.warmLight : C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>매일·주간 요약 봄</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.6 }}>
                      자치구 담당자가 매일·주간 정서 정리를 봅니다.
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDistrictConsent("district_consent_summary")}
                    disabled={districtSummaryToggling}
                    aria-label={`매일·주간 요약 동의 ${summaryOn ? "끄기" : "켜기"}`}
                    style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: summaryOn ? C.warm : C.border,
                      padding: 3, display: "flex", alignItems: "center",
                      justifyContent: summaryOn ? "flex-end" : "flex-start",
                      transition: "background .2s, justify-content .2s",
                      opacity: districtSummaryToggling ? 0.6 : 1,
                      cursor: districtSummaryToggling ? "default" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(26,16,10,.2)" }} />
                  </button>
                </div>
              </div>

              {/* D 동의 선택 2 토글 — 기분 캘린더 */}
              <div style={{ background: C.surface, border: `1px solid ${moodOn ? C.warmLight : C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>기분 캘린더 봄</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.6 }}>
                      자치구 담당자가 기분 기록 캘린더를 봅니다.
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDistrictConsent("district_consent_mood")}
                    disabled={districtMoodToggling}
                    aria-label={`기분 캘린더 동의 ${moodOn ? "끄기" : "켜기"}`}
                    style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: moodOn ? C.warm : C.border,
                      padding: 3, display: "flex", alignItems: "center",
                      justifyContent: moodOn ? "flex-end" : "flex-start",
                      transition: "background .2s, justify-content .2s",
                      opacity: districtMoodToggling ? 0.6 : 1,
                      cursor: districtMoodToggling ? "default" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(26,16,10,.2)" }} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.7, padding: "12px 14px", background: C.card, borderRadius: 8 }}>
                필수 항목 (닉네임·자치구·발급번호 보기 / 위기 신호 보기 / 앱 안 채팅)은 발급번호 연결 자체가 동의입니다.
              </div>
            </>
          ) : !isGuConnected ? (
            /* State B: 자치구가 연결 안 됨 */
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 8, lineHeight: 1.6 }}>
                {userGu}는 부여번호 시스템<br />연결 준비 중이에요
              </div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
                자치구청과 연결되면 부여번호 등록을 통해<br />
                1인가구 지원 자원이 활성화돼요.
              </div>
            </div>
          ) : !searchedRow ? (
            /* State C-1: 검색 폼 */
            <>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, fontWeight: 300, lineHeight: 1.7 }}>
                {userGu}청에서 발급받은 번호와<br />
                신청자 이름을 박아주세요.
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginBottom: 6 }}>발급번호</div>
              <input
                type="text"
                value={formGovId}
                onChange={(e) => setFormGovId(e.target.value)}
                placeholder="발급번호"
                style={{ width: "100%", padding: "14px 16px", fontSize: 15, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, marginBottom: 14, fontFamily: "inherit" }}
              />
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginBottom: 6 }}>이름</div>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="이름"
                style={{ width: "100%", padding: "14px 16px", fontSize: 15, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, marginBottom: 16, fontFamily: "inherit" }}
              />
              {searchError && (
                <div style={{ fontSize: 12, color: "#C44545", fontWeight: 300, marginBottom: 14, lineHeight: 1.6 }}>
                  {searchError}
                </div>
              )}
              <button
                onClick={searchRegistration}
                disabled={!formGovId.trim() || !formName.trim() || searching}
                style={{
                  width: "100%",
                  background: (formGovId.trim() && formName.trim()) ? C.dark : C.border,
                  color: "#fff",
                  padding: "15px",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: (formGovId.trim() && formName.trim() && !searching) ? "pointer" : "default",
                }}
              >
                {searching ? "검색 중..." : "검색"}
              </button>
            </>
          ) : searchedRow.gu !== userGu ? (
            /* State C-2: 자치구 불일치 거부 */
            <>
              <div style={{ background: "#FDF0EA", border: `1px solid ${C.warmLight}`, borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: C.warm, fontWeight: 500, marginBottom: 10 }}>
                  자치구가 다릅니다
                </div>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.8 }}>
                  발급번호 자치구: <strong>{searchedRow.gu}</strong><br />
                  설정된 자치구: <strong>{userGu}</strong><br /><br />
                  홈 화면 좌측 상단 자치구를 변경한 후 다시 시도해주세요.
                </div>
              </div>
              <button
                onClick={clearSearch}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  color: C.sub,
                  padding: "14px",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                다시 검색
              </button>
            </>
          ) : (
            /* State C-3: 발견 + 동의 5 + 연결 */
            <>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 8 }}>
                  발급된 정보를 찾았어요
                </div>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.8 }}>
                  <div>📍 {searchedRow.gu}</div>
                  <div>발급번호: {searchedRow.gov_assigned_id}</div>
                  <div>이름: {searchedRow.real_name}</div>
                  {searchedRow.issued_at && (
                    <div>발행일: {new Date(searchedRow.issued_at).toLocaleDateString("ko-KR")}</div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>
                동의 항목 (필수 3 + 선택 2)
              </div>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 300, lineHeight: 1.7, marginBottom: 14 }}>
                자치구 담당자는 사람입니다. 챗봇 원본 대화는 보지 않습니다.
              </div>

              {/* 필수 3 */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.warm, fontWeight: 500, letterSpacing: 0.5, marginBottom: 8 }}>필수</div>
                {[
                  { key: "req_view", label: "자치구 담당자가 닉네임·자치구·발급번호 봄" },
                  { key: "req_crisis", label: "자치구 담당자가 위기 신호 봄" },
                  { key: "req_chat", label: "자치구 담당자와 앱 안 채팅" },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setConnectAgreed((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    style={{ padding: "8px 4px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `1.5px solid ${connectAgreed[item.key] ? C.warm : C.muted}`,
                      background: connectAgreed[item.key] ? C.warm : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {connectAgreed[item.key] && <div style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</div>}
                    </div>
                    <div style={{ fontSize: 12, color: C.text, fontWeight: 300, lineHeight: 1.5 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* 선택 2 */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: 0.5, marginBottom: 8 }}>선택 (이 화면에서 토글로 변경 가능)</div>
                {[
                  { key: "opt_summary", label: "자치구 담당자가 매일·주간 요약 봄" },
                  { key: "opt_mood", label: "자치구 담당자가 기분 캘린더 봄" },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setConnectAgreed((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    style={{ padding: "8px 4px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `1.5px solid ${connectAgreed[item.key] ? C.warm : C.muted}`,
                      background: connectAgreed[item.key] ? C.warm : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {connectAgreed[item.key] && <div style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</div>}
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.5 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={connect}
                disabled={!requiredAllAgreed || connecting}
                style={{
                  width: "100%",
                  background: requiredAllAgreed ? C.warm : C.border,
                  color: "#fff",
                  padding: "15px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  cursor: (requiredAllAgreed && !connecting) ? "pointer" : "default",
                }}
              >
                {connecting ? "연결 중..." : "연결"}
              </button>
              <button
                onClick={clearSearch}
                disabled={connecting}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  color: C.sub,
                  padding: "12px",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                다시 검색
              </button>
            </>
          )}
        </div>
      )}

      {/* 정서 동행 동의 화면 */}
      {view === "consent" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
          {/* 토글 카드 */}
          <div style={{ background: C.surface, border: `1px solid ${consentOn ? C.warmLight : C.border}`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🌿</span>
                <div>
                  <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 2 }}>정서 동행</div>
                  <div style={{ fontSize: 11, color: consentOn ? C.warm : C.muted, fontWeight: 300 }}>
                    {consentOn ? "활성" : "동의 안 됨"}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleConsent}
                disabled={consentToggling}
                aria-label={`정서 동행 동의 ${consentOn ? "끄기" : "켜기"}`}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 13,
                  background: consentOn ? C.warm : C.border,
                  padding: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: consentOn ? "flex-end" : "flex-start",
                  transition: "background .2s, justify-content .2s",
                  opacity: consentToggling ? 0.6 : 1,
                  cursor: consentToggling ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(26,16,10,.2)",
                }} />
              </button>
            </div>
            {consentOn && consent?.counselor_consented_at && (
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                동의한 날: {new Date(consent.counselor_consented_at).toLocaleDateString("ko-KR")}
              </div>
            )}
          </div>

          {/* 설명 */}
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85 }}>
            <div style={{ marginBottom: 14 }}>
              이 동의를 박으면 운영자가 매일·주간 요약과 기분 캘린더를 봅니다.
            </div>
            <div style={{ marginBottom: 14 }}>
              단, 챗봇 원본 대화는 운영자가 못 봅니다 (감시 X 원칙).
            </div>
            <div>
              언제든 풀 수 있어요.
            </div>
          </div>
        </div>
      )}

      {/* 긴급 연락처 화면 */}
      {view === "emergency" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 12, fontWeight: 300, lineHeight: 1.7 }}>
            힘드실 때 연락할 수 있는 분을 등록해주세요.<br />
            최대 3명까지 등록 가능해요.
          </div>

          {/* 신뢰 안내 */}
          <div style={{ background: C.warmLight + "55", border: `1px solid ${C.warmLight}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
              등록한 연락처는 사용자만 볼 수 있어요.<br />
              위기 상황이 감지되면 동의하신 경우에 한해 안내가 갈 수 있어요.
            </div>
          </div>

          {/* 등록한 연락처 */}
          {contacts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 4 }}>
                      {c.name}
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginLeft: 6 }}>{c.relationship}</span>
                    </div>
                    <a href={`tel:${c.phone}`} style={{ fontSize: 13, color: C.warm, textDecoration: "none" }}>
                      {c.phone}
                    </a>
                  </div>
                  <button
                    onClick={() => removeContact(c.id)}
                    style={{ fontSize: 12, color: C.muted, background: "transparent", padding: "4px 8px" }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 추가 버튼 */}
          {contacts.length < 3 && (
            <button
              onClick={() => setView("emergency_add")}
              style={{ width: "100%", padding: "14px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 12, color: C.sub, fontSize: 13, marginBottom: 24 }}
            >
              + 연락처 추가하기
            </button>
          )}

          {/* 24시간 공공 자원 */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 8 }}>
              24시간 공공 자원
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 400, marginBottom: 4 }}>정신건강위기상담전화</div>
              <a href="tel:1577-0199" style={{ fontSize: 15, color: C.warm, fontWeight: 500, textDecoration: "none" }}>
                1577-0199
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 연락처 추가 화면 */}
      {view === "emergency_add" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 300 }}>이름</div>
            <input
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
              maxLength={20}
              style={{ width: "100%", padding: "12px 14px", fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 300 }}>관계</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["가족", "친구", "연인", "동료", "기타"].map((r) => (
                <button
                  key={r}
                  onClick={() => setNewContact((p) => ({ ...p, relationship: r }))}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    border: `1px solid ${newContact.relationship === r ? C.warm : C.border}`,
                    borderRadius: 999,
                    background: newContact.relationship === r ? C.warm : "transparent",
                    color: newContact.relationship === r ? "#fff" : C.sub,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 300 }}>전화번호</div>
            <input
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
              placeholder="010-0000-0000"
              style={{ width: "100%", padding: "12px 14px", fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, fontFamily: "inherit" }}
            />
          </div>

          <button
            onClick={addContact}
            disabled={!newContact.name.trim() || !newContact.phone.trim() || saving}
            style={{
              width: "100%",
              background: newContact.name.trim() && newContact.phone.trim() ? C.dark : C.border,
              color: "#fff",
              padding: "15px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      )}

      {/* 푸터 */}
      {view === "main" && (
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted, textAlign: "center", fontWeight: 300 }}>
          오롯 v0.1
        </div>
      )}
    </div>
  );
}
