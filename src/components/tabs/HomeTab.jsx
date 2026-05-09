import { useState } from "react";
import {
  C,
  EMOTIONS,
  POSITIVE,
  POSITIVE_PROMPTS,
  MOOD_MSGS,
  DAY_KR,
} from "../../lib/constants";
import { dateKey } from "../../utils/date";

export default function HomeTab({
  authed,
  onSignupStart,
  onLoginStart,
  todayMood,
  moodLog,
  streak,
  negDays,
  saveMood,
  setTab,
  setDiaryView,
  userGu,
  openGuModal,
  openSettings,
  onCrisisOpen,
}) {
  const emotion = EMOTIONS.find((e) => e.label === todayMood);
  const h = new Date().getHours();
  const greet = h < 12 ? "좋은 아침이에요 ☀️" : h < 18 ? "안녕하세요, 잘 지내고 계세요?" : "오늘 하루 수고하셨어요 🌙";
  const isPositive = todayMood && POSITIVE.includes(todayMood);
  const posPrompt = POSITIVE_PROMPTS[Math.floor(Math.random() * POSITIVE_PROMPTS.length)];

  // 매 진입 시 그리드부터 — 다른 탭 갔다 돌아오면 자동 리셋
  const [reInput, setReInput] = useState(true);
  const showGrid = !todayMood || reInput;
  const handleSelect = (label) => {
    saveMood(label);
    setReInput(false);
  };

  return (
    <div className="up" style={{ flex: 1, padding: "52px 24px 28px" }}>
      {/* 자치구 칩 (상단 좌측) + 톱니바퀴 또는 로그인 (상단 우측) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        {authed && userGu ? (
          <button
            onClick={openGuModal}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: "6px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: C.sub,
              fontWeight: 400,
              letterSpacing: 0.3,
            }}
          >
            <span style={{ fontSize: 11, marginRight: 2 }}>📍</span>
            <span>{userGu}</span>
            <span style={{ fontSize: 9, color: C.muted, marginLeft: 2 }}>▾</span>
          </button>
        ) : (
          <div />
        )}
        {authed ? (
          <div />
        ) : (
          <button
            onClick={onLoginStart}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: C.dark,
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 0.3,
            }}
          >
            로그인
          </button>
        )}
      </div>

      {/* 게스트 환영 카드 */}
      {!authed && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400, lineHeight: 1.4, marginBottom: 6 }}>
            오롯에 오신 걸<br />
            <span style={{ color: C.warm }}>환영해요</span>
          </div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, fontWeight: 300, marginBottom: 20 }}>
            매일의 정서 케어와 정서 자원이<br />
            한 곳에 닿게.
          </div>
          <button
            onClick={onSignupStart}
            style={{
              width: "100%",
              background: C.warm,
              color: "#fff",
              padding: "16px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 0.3,
              marginBottom: 10,
            }}
          >
            회원가입하고 시작하기 →
          </button>
          <button
            onClick={onLoginStart}
            style={{ width: "100%", padding: "10px", fontSize: 12, color: C.muted, fontWeight: 300 }}
          >
            이미 계정 있으세요? 로그인
          </button>
          <div style={{ height: 1, background: C.border, margin: "24px 0 8px" }} />
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, textAlign: "center" }}>
            아래에서 오롯을 둘러보실 수 있어요
          </div>
        </div>
      )}

      {/* 인사 + streak (인증 시만) */}
      {authed && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: C.muted, marginBottom: 10, fontWeight: 300 }}>오로시</div>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 28, fontWeight: 400, lineHeight: 1.35 }}>
              {greet}<br />
              <span style={{ color: C.warm }}>오늘 기분은 어떠세요?</span>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 14px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 18 }}>🔥</div>
              <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 20, color: C.warm, lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>연속</div>
            </div>
          )}
        </div>
      )}

      {/* 게스트 모드 - 둘러보기용 헤더 */}
      {!authed && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 20, fontWeight: 400, lineHeight: 1.35, color: C.sub }}>
            오늘 기분은 어떠세요?
          </div>
        </div>
      )}

      {/* 부정 3일 이상 유도 배너 (7일 이상이면 위기 진입 버튼도 표시) */}
      {negDays >= 3 && (
        <div className="up" style={{ background: "#FDF0EA", border: `1px solid ${C.warmLight}`, borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15, color: C.warm, marginBottom: 6 }}>
            요즘 많이 힘드시죠 😔
          </div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.75, marginBottom: 14, fontWeight: 300 }}>
            {negDays}일째 힘드신 것 같아 마음에 걸려요.<br />혼자 담아두지 말고 들려주세요.
          </div>
          <div style={{ display: "flex", gap: 10, flexDirection: negDays >= 7 ? "column" : "row" }}>
            <button onClick={() => setTab("털어놓기")} style={{ flex: 1, background: C.warm, color: "#fff", padding: "11px", borderRadius: 8, fontSize: 13 }}>
              오로시에게 들려주기
            </button>
            {negDays >= 7 && onCrisisOpen && (
              <button onClick={onCrisisOpen} style={{ flex: 1, background: "transparent", color: C.warm, padding: "11px", borderRadius: 8, fontSize: 13, border: `1px solid ${C.warm}` }}>
                지금 너무 힘드시다면
              </button>
            )}
          </div>
        </div>
      )}

      {/* 감정 선택 — 진입 시 그리드, 클릭하면 카드 + 버튼 */}
      {showGrid ? (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
            {EMOTIONS.map((e) => (
              <button
                key={e.label}
                className="emo"
                onClick={() => handleSelect(e.label)}
                style={{ width: "calc(25% - 8px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 2px 8px rgba(26,16,10,.05)" }}>
                  {e.emoji}
                </div>
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 300 }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="up" style={{ marginBottom: 28 }} key={todayMood}>
          <div style={{ background: emotion ? emotion.color + "44" : C.card, borderRadius: 20, padding: "22px", border: `1px solid ${emotion ? emotion.color + "88" : C.border}`, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <span style={{ fontSize: 36 }}>{emotion?.emoji}</span>
              <div>
                <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 16, color: C.text, marginBottom: 3 }}>오늘은 {todayMood}</div>
                <div style={{ fontSize: 11, color: C.sub, fontWeight: 300 }}>기분 기록됐어요 ✓</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.8, fontWeight: 300, background: "rgba(255,255,255,.55)", borderRadius: 12, padding: "12px 14px" }}>
              {isPositive ? posPrompt : MOOD_MSGS[todayMood] || "들려주세요."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setTab("털어놓기")} style={{ flex: 1, background: C.dark, color: "#fff", padding: "14px", borderRadius: 8, fontSize: 13, letterSpacing: 0.3 }}>
              {isPositive ? "오로시에게 들려주기" : "혼잣말하기"}
            </button>
            <button onClick={() => setDiaryView(true)} style={{ flex: 1, background: C.surface, color: C.sub, padding: "14px", borderRadius: 8, fontSize: 13, border: `1px solid ${C.border}` }}>
              기분 기록
            </button>
          </div>
        </div>
      )}

      {/* 최근 7일 */}
      <div style={{ background: C.surface, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 14 }}>최근 7일</div>
          <button onClick={() => setDiaryView(true)} style={{ fontSize: 11, color: C.warm }}>전체 보기 →</button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const k = dateKey(d);
            const emo = EMOTIONS.find((e) => e.label === moodLog[k]);
            const isToday = i === 6;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 9, color: isToday ? C.warm : C.muted, fontWeight: isToday ? 500 : 400 }}>{DAY_KR[d.getDay()]}</div>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: emo ? emo.color + "55" : C.card, border: `1px solid ${emo ? emo.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                  {emo?.emoji || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 바로가기 */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setTab("피드")} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 16px", textAlign: "left" }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginBottom: 8 }}>
            <path d="M 8 8 L 36 6 L 38 36 L 10 38 Z" fill="#B8D4BE" opacity="0.5" />
            <path d="M 9 9 Q 9 9 36 7 L 37 36 Q 37 36 10 37 Z" stroke={C.warm} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 15 17 Q 24 16 32 16" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M 15 23 Q 24 22 32 22" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M 15 29 Q 21 28 27 28" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 14, marginBottom: 3 }}>1인가구 피드</div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 300 }}>혼자 사는 사람들 일상</div>
        </button>

        <button onClick={() => setTab("우리 동네")} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 16px", textAlign: "left" }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginBottom: 8 }}>
            <ellipse cx="22" cy="38" rx="14" ry="3" stroke={C.warm} strokeWidth="1" fill="none" opacity="0.7" />
            <path d="M 22 8 Q 33 8 33 19 Q 33 27 22 38 Q 11 27 11 19 Q 11 8 22 8 Z" fill="#C4D0E8" opacity="0.5" />
            <path d="M 22 9 Q 32 9.5 32 19 Q 32 26.5 22 37 Q 12 26.5 12 19 Q 12 9 22 9 Z" stroke={C.warm} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 18 21 Q 22 16 26 19 Q 24 23 18 21 Z" fill="#FFFFFF" />
            <path d="M 18 21 Q 22 16 26 19 Q 24 23 18 21 Z" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 19 20 Q 22 18 25 19" stroke={C.warm} strokeWidth="0.7" strokeLinecap="round" fill="none" />
          </svg>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 14, marginBottom: 3 }}>우리 동네</div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 300 }}>동네 마음챙김 프로그램</div>
        </button>
      </div>
    </div>
  );
}
