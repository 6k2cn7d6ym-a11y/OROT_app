import { C } from "../../lib/constants";

// 오롯 케어 — 구독 결 (어떤 서비스 박을지 결정 중, 준비 중 결)
// B 동의(정서 동행)는 별도 토글로 분리됨 — Settings.jsx의 MyPage 봐.
export default function OrotCareModal({ onClose }) {
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
          onClick={onClose}
          style={{ fontSize: 22, color: C.sub, padding: 4 }}
          aria-label="닫기"
        >
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17 }}>
          오롯 케어
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 28 }}>🌱</div>

        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, lineHeight: 1.5, marginBottom: 16 }}>
          준비 중이에요
        </div>

        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, marginBottom: 36, maxWidth: 320 }}>
          오롯 케어를 어떤 모습으로 만들지<br />
          아직 다듬는 중이에요.<br />
          준비되면 알려드릴게요.
        </div>

        <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.7, marginBottom: 32, padding: "12px 14px", background: C.card, borderRadius: 8, maxWidth: 320 }}>
          매일·주간 요약과 기분 캘린더는 마이페이지에서<br />
          정서 동행 토글로 운영자에게 열 수 있어요.<br />
          (별도 동의, 무료)
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
    </div>
  );
}
