import { useState, useEffect, useRef } from "react";
import { C, GU_LIST, CRISIS_KEYWORDS } from "../lib/constants";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { todayKey, formatRelativeTime } from "../utils/date";
import { calcStreak, countConsecNegative } from "../utils/streak";

import HomeTab from "./tabs/HomeTab";
import ChatTab from "./tabs/ChatTab";
import FeedTab from "./tabs/FeedTab";
import NeighborhoodTab from "./tabs/NeighborhoodTab";
import DiaryTab from "./tabs/DiaryTab";

import PostComposeModal from "./modals/PostComposeModal";
import GuModal from "./modals/GuModal";
import LoginPromptModal from "./modals/LoginPromptModal";
import CrisisModal from "./modals/CrisisModal";
import Settings, { MyPage } from "./modals/Settings";

// 메인앱 - 4개 탭 + 설정/모달
// authed=true → 인증 모드 (모든 기능)
// authed=false → 게스트 모드 (둘러보기만, 액션 시 로그인 모달)
export default function MainApp({ authed = true, onSignupStart, onLoginStart }) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("홈");
  const [moodLog, setMoodLog] = useState({});
  const [moodLogsByDate, setMoodLogsByDate] = useState({}); // { "2026-05-04": [{label, time}, ...] }
  const [todayMood, setTodayMood] = useState(null);
  const [diaryView, setDiaryView] = useState(false);
  const [userGu, setUserGu] = useState(null);
  const [guModalOpen, setGuModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // continue 타이머 + chain 제한
  const continueTimerRef = useRef(null);
  const continueChainRef = useRef(false); // true면 직전 응답이 continue, 또 박지 않음

  const cancelContinueTimer = () => {
    if (continueTimerRef.current) {
      clearTimeout(continueTimerRef.current);
      continueTimerRef.current = null;
    }
  };
  const [posts, setPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const bottomRef = useRef(null);

  // 게스트 모드에서 액션 시 호출 - 로그인 모달 띄움
  const requireAuth = () => {
    if (!authed) {
      setLoginModalOpen(true);
      return false;
    }
    return true;
  };

  // 초기 데이터: localStorage 캐시 + DB 진실
  useEffect(() => {
    try {
      const raw = localStorage.getItem("orot_mood_log");
      if (raw) {
        const log = JSON.parse(raw);
        setMoodLog(log);
        if (log[todayKey()]) setTodayMood(log[todayKey()]);
      }
    } catch (_) {}
    try {
      const gu = localStorage.getItem("orot_user_gu");
      if (gu && GU_LIST.includes(gu)) setUserGu(gu);
    } catch (_) {}

    // 게스트 모드 또는 user 없음 → DB 불러오기 X
    if (!authed || !user) return;

    let cancelled = false;
    (async () => {
      try {
        // profiles에서 gu 불러오기
        const { data: profile } = await supabase
          .from("profiles")
          .select("gu")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profile?.gu && GU_LIST.includes(profile.gu)) {
          setUserGu(profile.gu);
          try { localStorage.setItem("orot_user_gu", profile.gu); } catch (_) {}
        }

        // mood_logs 최근 60일치
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const { data: moods } = await supabase
          .from("mood_logs")
          .select("date, mood_label, created_at")
          .gte("date", sixtyDaysAgo.toISOString().slice(0, 10))
          .order("created_at", { ascending: true });
        if (cancelled) return;
        if (moods && moods.length > 0) {
          const log = {};
          const byDate = {};
          for (const m of moods) {
            log[m.date] = m.mood_label; // 마지막 mood가 덮어씀
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push({ label: m.mood_label, time: m.created_at });
          }
          setMoodLog(log);
          setMoodLogsByDate(byDate);
          if (log[todayKey()]) setTodayMood(log[todayKey()]);
          try { localStorage.setItem("orot_mood_log", JSON.stringify(log)); } catch (_) {}
        }
      } catch (e) {
        console.error("초기 데이터 불러오기 실패:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [authed, user?.id]);

  // chat_messages 불러오기
  useEffect(() => {
    let mounted = true;
    if (!authed || !user) {
      setMessages([{
        from: "ai",
        text: "안녕하세요\n로그인하시면 이야기 나눌 수 있어요",
        note: null,
      }]);
      setMessagesLoaded(true);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("role, content, created_at")
          .order("created_at", { ascending: true });
        if (!mounted) return;
        if (error) {
          console.error("메시지 불러오기 실패:", error);
          setMessagesLoaded(true);
          return;
        }
        const formatted = (data || []).map((m) => ({
          from: m.role === "ai" ? "ai" : "user",
          text: m.content,
          note: null,
          created_at: m.created_at,
        }));
        if (formatted.length === 0) {
          formatted.push({
            from: "ai",
            text: "오셨네요\n오늘은 어떤 하루였어요?",
            note: null,
          });
        }
        setMessages(formatted);
        setMessagesLoaded(true);
      } catch (e) {
        console.error("메시지 불러오기 예외:", e);
        if (mounted) setMessagesLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, [authed, user?.id]);

  // 채팅 탭 진입 — 30분 이상 비어있었으면 오로시가 먼저 인사
  useEffect(() => {
    if (tab !== "털어놓기") return;
    if (!authed || !user) return;
    if (!messagesLoaded) return;
    if (typing) return;

    // 마지막 AI 메시지 시간 체크
    const lastAiMsg = [...messages].reverse().find((m) => m.from === "ai" && m.created_at);
    if (lastAiMsg) {
      const lastTime = new Date(lastAiMsg.created_at).getTime();
      const now = Date.now();
      const minutesPassed = (now - lastTime) / (1000 * 60);
      if (minutesPassed < 30) return; // 30분 안이면 인사 X
    }

    // greeting 호출
    let cancelled = false;
    continueChainRef.current = false; // chain 리셋
    setTyping(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("chat", {
          body: { trigger: "greeting" },
        });
        if (cancelled) return;
        if (error) {
          console.error("greeting 호출 실패:", error);
          return;
        }
        if (data?.reply) {
          setMessages((p) => [...p, {
            from: "ai",
            text: data.reply,
            note: null,
            created_at: new Date().toISOString(),
          }]);
          scheduleContinueIfNeeded(data.reply);
        }
      } catch (e) {
        console.error("greeting 예외:", e);
      } finally {
        if (!cancelled) setTyping(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, authed, user?.id, messagesLoaded]);

  // 탭 떠나거나 unmount면 continue 타이머 취소
  useEffect(() => {
    if (tab !== "털어놓기") {
      cancelContinueTimer();
    }
  }, [tab]);
  useEffect(() => {
    return () => cancelContinueTimer();
  }, []);

  // 사용자가 입력창에 글자 박으면 타이머 취소
  useEffect(() => {
    if (input.trim()) cancelContinueTimer();
  }, [input]);

  // 자치구 변경 시 localStorage에도 저장
  const changeGu = async (gu) => {
    setUserGu(gu);
    try { localStorage.setItem("orot_user_gu", gu); } catch (_) {}
    setGuModalOpen(false);
    if (authed && user) {
      try {
        await supabase.from("profiles").update({ gu }).eq("id", user.id);
      } catch (e) {
        console.error("자치구 저장 실패:", e);
      }
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const saveMood = async (label) => {
    if (!requireAuth()) return;
    const today = todayKey();
    const now = new Date().toISOString();
    setTodayMood(label);
    const newLog = { ...moodLog, [today]: label };
    setMoodLog(newLog);
    setMoodLogsByDate((prev) => ({
      ...prev,
      [today]: [...(prev[today] || []), { label, time: now }],
    }));
    try { localStorage.setItem("orot_mood_log", JSON.stringify(newLog)); } catch (_) {}
    try {
      if (user) {
        await supabase.from("mood_logs").insert({
          user_id: user.id,
          date: today,
          mood_label: label,
        });
      }
    } catch (e) {
      console.error("기분 저장 실패:", e);
    }
  };

  // 직전 AI 응답이 짧고 ?로 안 끝나면 5초 후 continue 호출
  const scheduleContinueIfNeeded = (aiReply) => {
    if (!aiReply) return;
    if (continueChainRef.current) return; // 직전이 continue면 또 X
    const trimmed = aiReply.trim();
    if (trimmed.length > 80) return; // 충분히 길면 X
    if (trimmed.endsWith("?")) return; // 질문이면 X (사용자가 답할 차례)

    cancelContinueTimer();
    continueTimerRef.current = setTimeout(async () => {
      continueTimerRef.current = null;
      // 사용자가 다른 탭에 있거나 입력 중이면 취소
      if (tab !== "털어놓기") return;
      if (typing) return;
      if (input.trim()) return; // 입력창에 글자 있으면 X
      if (document.visibilityState !== "visible") return;

      continueChainRef.current = true;
      setTyping(true);
      try {
        const { data, error } = await supabase.functions.invoke("chat", {
          body: { trigger: "continue" },
        });
        if (error) throw error;
        if (data?.reply) {
          setMessages((p) => [...p, {
            from: "ai",
            text: data.reply,
            note: null,
            created_at: new Date().toISOString(),
          }]);
        }
      } catch (e) {
        console.error("continue 호출 실패:", e);
      } finally {
        setTyping(false);
      }
    }, 5000);
  };

  const sendMessage = async () => {
    if (!requireAuth()) return;
    if (!input.trim() || typing) return;
    cancelContinueTimer();
    continueChainRef.current = false; // 사용자가 박으면 chain 리셋
    const txt = input.trim();
    setInput("");
    setMessages((p) => [...p, { from: "user", text: txt, created_at: new Date().toISOString() }]);
    setTyping(true);

    // 위기 키워드 감지 — 매칭되면 메시지 목록에 위기 카드 추가 + crisis_signals insert
    // 페이지 전환 X — 챗봇 흐름 안 끊음. chat 호출 그대로 진행.
    // 정규화: 띄어쓰기 빼고 매치 ("죽고 싶" / "죽고싶" 둘 다 잡힘)
    const normalized = txt.replace(/\s/g, "");
    const matched = CRISIS_KEYWORDS.filter((kw) =>
      normalized.includes(kw.replace(/\s/g, ""))
    );
    if (matched.length > 0 && user) {
      setMessages((p) => [...p, { from: "crisis_card", created_at: new Date().toISOString() }]);
      try {
        await supabase.from("crisis_signals").insert({
          user_id: user.id,
          detected_at: new Date().toISOString(),
          keywords: matched,
          context: txt.slice(0, 200),
        });
      } catch (e) {
        // 테이블 없거나 RLS에 막혀도 챗봇은 정상 동작
        console.error("crisis_signals 저장 실패:", e);
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: txt },
      });
      if (error) throw error;
      const reply = data?.reply || "응답을 받지 못했어요. 다시 한 번 말씀해주실래요?";
      setMessages((p) => [...p, { from: "ai", text: reply, note: null, created_at: new Date().toISOString() }]);
      scheduleContinueIfNeeded(reply);
    } catch (e) {
      console.error("sendMessage 실패:", e);
      setMessages((p) => [...p, {
        from: "ai",
        text: "잠깐 연결이 어려워요. 잠시 후 다시 시도해주세요.",
        note: null,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setTyping(false);
    }
  };

  // 피드 로드 (posts + 내 좋아요/저장 상태)
  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsErr } = await supabase
        .from("posts")
        .select("id, user_display, emoji, tag, content, likes_count, saves_count, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (postsErr) {
        console.error("posts 로드 실패:", postsErr);
        setPostsLoaded(true);
        return;
      }

      let likedIds = new Set();
      let savedIds = new Set();
      if (user) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id);
        likedIds = new Set((likes || []).map((l) => l.post_id));

        const { data: saves } = await supabase
          .from("post_saves")
          .select("post_id")
          .eq("user_id", user.id);
        savedIds = new Set((saves || []).map((s) => s.post_id));
      }

      const formatted = (postsData || []).map((p) => ({
        id: p.id,
        user: p.user_display,
        emoji: p.emoji || "🌿",
        tag: p.tag,
        content: p.content,
        likes: p.likes_count,
        saved: p.saves_count,
        liked: likedIds.has(p.id),
        savedByMe: savedIds.has(p.id),
        time: formatRelativeTime(p.created_at),
      }));

      setPosts(formatted);
      setPostsLoaded(true);
    } catch (e) {
      console.error("피드 로드 예외:", e);
      setPostsLoaded(true);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleLike = async (id) => {
    if (!requireAuth()) return;
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    // 낙관적 업데이트
    setPosts((p) => p.map((x) => x.id === id
      ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 }
      : x));
    try {
      if (post.liked) {
        await supabase.from("post_likes").delete()
          .eq("user_id", user.id).eq("post_id", id);
      } else {
        await supabase.from("post_likes").insert({ user_id: user.id, post_id: id });
      }
    } catch (e) {
      console.error("좋아요 실패:", e);
      // 롤백
      setPosts((p) => p.map((x) => x.id === id
        ? { ...x, liked: post.liked, likes: post.likes }
        : x));
    }
  };

  const toggleSave = async (id) => {
    if (!requireAuth()) return;
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    setPosts((p) => p.map((x) => x.id === id
      ? { ...x, savedByMe: !x.savedByMe, saved: x.savedByMe ? x.saved - 1 : x.saved + 1 }
      : x));
    try {
      if (post.savedByMe) {
        await supabase.from("post_saves").delete()
          .eq("user_id", user.id).eq("post_id", id);
      } else {
        await supabase.from("post_saves").insert({ user_id: user.id, post_id: id });
      }
    } catch (e) {
      console.error("저장 실패:", e);
      setPosts((p) => p.map((x) => x.id === id
        ? { ...x, savedByMe: post.savedByMe, saved: post.saved }
        : x));
    }
  };

  // 글 올리기 — content + tag (emoji는 tag별 자동)
  const addPost = async (content, tag) => {
    if (!requireAuth()) return false;
    if (!content.trim() || !tag) return false;
    const emojiByTag = { "꿀팁": "✨", "감성": "🌙", "일상": "🌿" };
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          user_display: profile?.nickname || "이름 없음",
          emoji: emojiByTag[tag] || "🌿",
          tag,
          content: content.trim(),
        })
        .select()
        .single();
      if (error) {
        console.error("글 올리기 실패:", error);
        return false;
      }
      // 새 글 맨 위에 추가
      setPosts((p) => [{
        id: data.id,
        user: data.user_display,
        emoji: data.emoji,
        tag: data.tag,
        content: data.content,
        likes: 0,
        saved: 0,
        liked: false,
        savedByMe: false,
        time: "방금 전",
      }, ...p]);
      return true;
    } catch (e) {
      console.error("글 올리기 예외:", e);
      return false;
    }
  };

  const streak = calcStreak(moodLog);
  const negDays = countConsecNegative(moodLog);
  const NAV = ["홈", "털어놓기", "피드", "우리 동네", "마이"];
  const NAV_ICONS = ["◯", "◎", "⊟", "◈", "◉"];

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::placeholder { color:${C.muted}; }
        textarea:focus { outline:none; }
        textarea { resize:none; }
        ::-webkit-scrollbar { width:0; }
        button { cursor:pointer; border:none; background:none; }
        @keyframes up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot { 0%,80%,100%{opacity:.25;transform:scale(1)} 40%{opacity:1;transform:scale(1.4)} }
        .up { animation: up .3s ease forwards; }
        .emo { transition: transform .12s; }
        .emo:active { transform: scale(.9); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: 76 }}>
        {tab === "홈" && !diaryView && (
          <HomeTab
            authed={authed}
            onSignupStart={onSignupStart}
            onLoginStart={onLoginStart}
            todayMood={todayMood}
            moodLog={moodLog}
            streak={streak}
            negDays={negDays}
            saveMood={saveMood}
            setTab={setTab}
            setDiaryView={setDiaryView}
            userGu={userGu}
            openGuModal={() => { if (requireAuth()) setGuModalOpen(true); }}
            openSettings={() => { if (requireAuth()) setSettingsOpen(true); }}
            onCrisisOpen={() => setCrisisModalOpen(true)}
          />
        )}
        {tab === "홈" && diaryView && <DiaryTab moodLog={moodLog} moodLogsByDate={moodLogsByDate} setDiaryView={setDiaryView} />}
        {tab === "털어놓기" && <ChatTab messages={messages} input={input} setInput={setInput} sendMessage={sendMessage} typing={typing} bottomRef={bottomRef} userGu={userGu} />}
        {tab === "피드" && <FeedTab posts={posts} postsLoaded={postsLoaded} toggleLike={toggleLike} toggleSave={toggleSave} onComposeOpen={() => requireAuth() && setComposerOpen(true)} />}
        {composerOpen && <PostComposeModal onClose={() => setComposerOpen(false)} onSubmit={addPost} />}
        {tab === "우리 동네" && <NeighborhoodTab userGu={userGu} openGuModal={() => setGuModalOpen(true)} />}
        {tab === "마이" && !diaryView && (
          <MyPage
            authed={authed}
            onSignupStart={onSignupStart}
            onLoginStart={onLoginStart}
            userGu={userGu}
            moodLog={moodLog}
            streak={streak}
            setDiaryView={setDiaryView}
            openSettings={() => { if (requireAuth()) setSettingsOpen(true); }}
            openGuModal={() => { if (requireAuth()) setGuModalOpen(true); }}
            onCrisisOpen={() => setCrisisModalOpen(true)}
          />
        )}
        {tab === "마이" && diaryView && <DiaryTab moodLog={moodLog} moodLogsByDate={moodLogsByDate} setDiaryView={setDiaryView} />}
      </div>

      {guModalOpen && <GuModal currentGu={userGu} onSelect={changeGu} onClose={() => setGuModalOpen(false)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} userGu={userGu} />}
      {crisisModalOpen && <CrisisModal onClose={() => setCrisisModalOpen(false)} userGu={userGu} />}
      {loginModalOpen && (
        <LoginPromptModal
          onClose={() => setLoginModalOpen(false)}
          onLoginStart={() => {
            setLoginModalOpen(false);
            onLoginStart && onLoginStart();
          }}
          onSignupStart={() => {
            setLoginModalOpen(false);
            onSignupStart && onSignupStart();
          }}
        />
      )}

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(248,244,239,.97)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 }}>
        {NAV.map((n, i) => (
          <button
            key={n}
            onClick={() => {
              setTab(n);
              setDiaryView(false);
            }}
            style={{ flex: 1, padding: "13px 0 17px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <span style={{ fontSize: 15, color: tab === n ? C.warm : C.muted, transition: "color .2s" }}>{NAV_ICONS[i]}</span>
            <span style={{ fontSize: 10, letterSpacing: 0.5, color: tab === n ? C.warm : C.muted, fontWeight: tab === n ? 500 : 400 }}>{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
