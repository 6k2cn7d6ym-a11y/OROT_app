import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import MainApp from "./components/MainApp";
import AuthFlow from "./flows/AuthFlow";
import SetupFlow from "./flows/SetupFlow";

// 진입점
// 단일 stage 변수로 관리 - 깜빡임 없음
// stage: "loading" | "guest" | "auth_login" | "auth_signup" | "setup" | "main"
//
// 핵심 규칙:
// - 세션 / 프로필 관리는 AuthProvider 가 다 함
// - AppRouter 는 useAuth() 결과로 stage 결정만 (계산 로직 X, await X)
// - 탭 전환 시 TOKEN_REFRESHED 와도 화면 안 바뀜 (initialized 한 번 박으면 끝)

function AppRouter() {
  const { session, profile, initialized, profileLoading } = useAuth();
  const [authStage, setAuthStage] = useState(null); // null | "login" | "signup"

  // 첫 세션 체크 중 — 짧은 로딩 (보통 100ms 이내)
  if (!initialized) {
    return <LoadingScreen />;
  }

  // 로그인/가입 화면 (게스트가 명시적으로 진입)
  if (authStage === "login") {
    return <AuthFlow mode="login" onCancel={() => setAuthStage(null)} />;
  }
  if (authStage === "signup") {
    return <AuthFlow mode="signup" onCancel={() => setAuthStage(null)} />;
  }

  // 게스트 — 세션 없음
  if (!session) {
    return (
      <MainApp
        authed={false}
        onLoginStart={() => setAuthStage("login")}
        onSignupStart={() => setAuthStage("signup")}
      />
    );
  }

  // 세션 있는데 프로필 fetch 중 — 짧은 로딩
  if (profileLoading && !profile) {
    return <LoadingScreen />;
  }

  // 세션 있는데 프로필 없음 또는 nickname/gu 비어있음 → 셋업
  if (!profile?.nickname || !profile?.gu) {
    return <SetupFlow onComplete={() => { /* refreshProfile이 알아서 처리 */ }} />;
  }

  // 인증 완료
  return <MainApp authed={true} />;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F4EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 48, height: 48, border: "3px solid #E8DDD5", borderTopColor: "#9B5E45", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
