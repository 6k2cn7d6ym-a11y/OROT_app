import { C } from "../../lib/constants";
import CrisisContent from "../shared/CrisisContent";

// 위기 모달 — 사용자 직접 진입 (HomeTab·MyPage, 미래에 ChatTab도)
// 챗봇 자동 표시는 별도 (ChatTab 안 CrisisCard)
export default function CrisisModal({ onClose, userGu }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.bg,
        zIndex: 400,
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
        overflowY: "auto",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onClose}
          style={{ fontSize: 22, color: C.sub, padding: 4 }}
          aria-label="닫기"
        >
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17 }}>
          지금 너무 힘드시다면
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, padding: "28px 24px" }}>
        <CrisisContent userGu={userGu} />
      </div>
    </div>
  );
}
