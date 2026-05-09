import { C } from "../../lib/constants";
import CrisisCard from "../shared/CrisisCard";

export default function ChatTab({ messages, input, setInput, sendMessage, typing, bottomRef, userGu }) {
  const hk = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 76px)" }}>
      <div style={{ padding: "32px 24px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, marginBottom: 5 }}>털어놓기</div>
        <div style={{ fontSize: 12, color: C.warm, fontWeight: 300 }}>익명 · 잘 들을게요</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 0" }}>
        {messages.map((msg, i) => {
          // 위기 카드 — AI 메시지처럼 왼쪽에 표시, 페이지 전환 X
          if (msg.from === "crisis_card") {
            return (
              <div
                key={i}
                className="up"
                style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "flex-start" }}
              >
                <CrisisCard userGu={userGu} />
              </div>
            );
          }
          return (
            <div
              key={i}
              className="up"
              style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: msg.from === "user" ? "flex-end" : "flex-start" }}
            >
              {msg.from === "ai" && <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>오로시</div>}
              <div
                style={{
                  maxWidth: "76%",
                  padding: "13px 17px",
                  borderRadius: msg.from === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                  background: msg.from === "user" ? C.dark : C.surface,
                  color: msg.from === "user" ? "#fff" : C.text,
                  fontSize: 14,
                  lineHeight: 1.8,
                  fontWeight: 300,
                  whiteSpace: "pre-line",
                  boxShadow: msg.from === "ai" ? "0 2px 12px rgba(26,16,10,.06)" : "none",
                }}
              >
                {msg.text}
              </div>
              {msg.note && (
                <div style={{ maxWidth: "76%", marginTop: 8, padding: "11px 15px", borderRadius: "4px 16px 16px 16px", background: "#FBF5F0", border: `1px solid ${C.warmLight}` }}>
                  <div style={{ fontSize: 10, color: C.warm, marginBottom: 4 }}>🌿 한마디</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, fontWeight: 300 }}>{msg.note}</div>
                </div>
              )}
            </div>
          );
        })}
        {typing && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>오로시</div>
            <div style={{ display: "inline-flex", gap: 5, padding: "13px 18px", background: C.surface, borderRadius: "4px 20px 20px 20px", boxShadow: "0 2px 12px rgba(26,16,10,.06)" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.muted, display: "block", animation: `dot 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "14px 20px 22px", borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={hk}
            placeholder="어떤 말이든 들려주세요..."
            rows={2}
            style={{
              flex: 1,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "13px 16px",
              fontSize: 14,
              color: C.text,
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: input.trim() ? C.dark : C.border,
              color: "#fff",
              fontSize: 17,
              flexShrink: 0,
              transition: "background .2s",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
