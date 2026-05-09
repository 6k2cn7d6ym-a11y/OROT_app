import { C, CRISIS_NUMBERS, MENTAL_HEALTH_CENTERS } from "../../lib/constants";

// 위기 화면 본문 — 외곽·헤더·padding 없음 (부모에서 처리)
// 사용처: CrisisModal (HomeTab·MyPage에서 진입)
// 챗봇 안 카드는 별도 (CrisisCard.jsx — chat-bubble 스타일)
export default function CrisisContent({ userGu }) {
  const center = userGu ? MENTAL_HEALTH_CENTERS[userGu] : null;

  return (
    <div>
      {/* 차분한 안내 */}
      <div
        style={{
          fontSize: 13,
          color: C.sub,
          fontWeight: 300,
          lineHeight: 1.85,
          marginBottom: 24,
        }}
      >
        혼자 담아두지 마세요.<br />
        전문가가 24시간 함께해드려요.
      </div>

      {/* 외부 통화 4개 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {CRISIS_NUMBERS.map((c) => (
          <a
            key={c.phone}
            href={`tel:${c.phone}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px",
              background: C.surface,
              border: `1px solid ${C.warmLight}`,
              borderRadius: 14,
              textDecoration: "none",
              color: C.text,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                📞 {c.name}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>
                {c.note}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Noto Serif KR',serif",
                fontSize: 20,
                color: C.warm,
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              {c.phone}
            </div>
          </a>
        ))}
      </div>

      {/* 자치구 정신건강복지센터 */}
      {center && (
        <>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              fontWeight: 300,
              letterSpacing: 0.5,
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            우리 동네 정신건강복지센터
          </div>
          <a
            href={`tel:${center.phone}`}
            style={{
              display: "block",
              padding: "16px 18px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              textDecoration: "none",
              color: C.text,
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 6 }}>
              📍 {userGu}
            </div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 4 }}>
              {center.name}
            </div>
            <div style={{ fontSize: 15, color: C.warm, fontWeight: 500, marginBottom: 6 }}>
              {center.phone}
            </div>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 300, lineHeight: 1.6 }}>
              {center.address}
            </div>
          </a>
        </>
      )}

      {/* 차분한 마무리 */}
      <div
        style={{
          fontSize: 11,
          color: C.muted,
          fontWeight: 300,
          lineHeight: 1.7,
          padding: "14px 16px",
          background: C.card,
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        전화하기 어려우시면<br />
        오로시와 더 이야기 나누셔도 돼요.
      </div>
    </div>
  );
}
