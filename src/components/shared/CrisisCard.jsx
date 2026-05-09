import { C, CRISIS_NUMBERS, MENTAL_HEALTH_CENTERS } from "../../lib/constants";

// 챗봇 메시지 안에 표시되는 위기 카드 — 페이지 전환 X, 흐름 안 끊음
// 사용처: ChatTab의 messages 배열에 type으로 추가됨
// 톤: 차분하게, 위협 X
export default function CrisisCard({ userGu }) {
  const center = userGu ? MENTAL_HEALTH_CENTERS[userGu] : null;

  return (
    <div
      style={{
        maxWidth: "82%",
        background: C.surface,
        border: `1px solid ${C.warmLight}`,
        borderRadius: "4px 16px 16px 16px",
        padding: "16px 18px",
        boxShadow: "0 2px 12px rgba(26,16,10,.06)",
      }}
    >
      {/* 한 줄 안내 */}
      <div
        style={{
          fontSize: 12,
          color: C.warm,
          fontWeight: 500,
          marginBottom: 6,
          letterSpacing: 0.3,
        }}
      >
        🌿 혼자 담아두지 마세요
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.sub,
          fontWeight: 300,
          lineHeight: 1.7,
          marginBottom: 14,
        }}
      >
        지금 너무 힘드시다면<br />아래 번호로 연락하실 수 있어요.
      </div>

      {/* 외부 통화 4개 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: center ? 14 : 0 }}>
        {CRISIS_NUMBERS.map((c) => (
          <a
            key={c.phone}
            href={`tel:${c.phone}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              textDecoration: "none",
              color: C.text,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 400 }}>
                📞 {c.name}
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 300 }}>
                {c.note}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Noto Serif KR',serif",
                fontSize: 15,
                color: C.warm,
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              {c.phone}
            </div>
          </a>
        ))}
      </div>

      {/* 자치구 정신건강복지센터 */}
      {center && (
        <a
          href={`tel:${center.phone}`}
          style={{
            display: "block",
            padding: "12px 14px",
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            textDecoration: "none",
            color: C.text,
          }}
        >
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 300, marginBottom: 4 }}>
            📍 {userGu}
          </div>
          <div style={{ fontSize: 12, color: C.text, fontWeight: 400, marginBottom: 3 }}>
            {center.name}
          </div>
          <div style={{ fontSize: 13, color: C.warm, fontWeight: 500 }}>
            {center.phone}
          </div>
        </a>
      )}
    </div>
  );
}
