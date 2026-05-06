import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import { AuthProvider, useAuth } from "./lib/AuthContext";

// ═══════════════════════════════════════════════════════════
// SECTION 1: 상수 + 데이터 (→ lib/constants.js)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 색상 팔레트
// ═══════════════════════════════════════════════════════════

const C = {
  bg: "#F8F4EF",
  surface: "#FFFFFF",
  card: "#F2EDE5",
  warm: "#9B5E45",
  warmLight: "#E5CDB8",
  text: "#1A100A",
  sub: "#7A6055",
  muted: "#B5A49A",
  border: "#E8DDD5",
  dark: "#1A100A",
};

// ═══════════════════════════════════════════════════════════
// 감정 분류
// ═══════════════════════════════════════════════════════════

const NEGATIVE = ["힘들어요","외로워요","불안해요","짜증나요","피곤해요","공허해요","복잡해요"];
const POSITIVE = ["괜찮아요","평온해요","뭉클해요","설레요","뿌듯해요"];

const EMOTIONS = [
  { emoji:"🌤", label:"괜찮아요", color:"#F5D98E" },
  { emoji:"😌", label:"평온해요", color:"#B8D4BE" },
  { emoji:"🥹", label:"뭉클해요", color:"#D4C4E8" },
  { emoji:"🌸", label:"설레요",   color:"#F5C4D0" },
  { emoji:"💪", label:"뿌듯해요", color:"#C4D4B8" },
  { emoji:"😔", label:"힘들어요", color:"#B8C4D8" },
  { emoji:"😢", label:"외로워요", color:"#C4D0E8" },
  { emoji:"😰", label:"불안해요", color:"#E8D8B8" },
  { emoji:"😤", label:"짜증나요", color:"#D8B8B8" },
  { emoji:"🥱", label:"피곤해요", color:"#D4CCB8" },
  { emoji:"😶", label:"공허해요", color:"#C8C8D4" },
  { emoji:"🤯", label:"복잡해요", color:"#C4B8D4" },
];

// 온보딩 첫 기분 체크용 (8개만)
const ONBOARDING_EMOTIONS = [
  { emoji:"🌤", label:"괜찮아요", color:"#F5D98E" },
  { emoji:"😌", label:"평온해요", color:"#B8D4BE" },
  { emoji:"🌸", label:"설레요",   color:"#F5C4D0" },
  { emoji:"😔", label:"힘들어요", color:"#B8C4D8" },
  { emoji:"😢", label:"외로워요", color:"#C4D0E8" },
  { emoji:"😰", label:"불안해요", color:"#E8D8B8" },
  { emoji:"😤", label:"짜증나요", color:"#D8B8B8" },
  { emoji:"🥱", label:"피곤해요", color:"#D4CCB8" },
];

// ═══════════════════════════════════════════════════════════
// 홈탭 카피
// ═══════════════════════════════════════════════════════════

const POSITIVE_PROMPTS = [
  "오늘 기분 좋아 보이세요 😊 무슨 좋은 일 있으셨어요?",
  "뭔가 좋은 일 있으셨군요! 들려주세요",
  "오늘 에너지 넘치시는데요? ✨ 어떤 일이세요?",
  "기분 좋은 날엔 그 이유 기록해두면 나중에 힘이 돼요. 오늘 뭐가 좋으셨어요?",
];

const MOOD_MSGS = {
  "힘들어요": "많이 힘드셨겠어요. 혼자 담아두지 말고 들려주세요.",
  "외로워요": "혼자라 외로운 날이군요. 여기 있을게요.",
  "불안해요": "불안한 마음이 드셨군요. 어떤 게 걱정이세요?",
  "짜증나요": "뭔가 쌓인 게 있으신가봐요. 다 말씀하셔도 돼요.",
  "피곤해요": "많이 지치셨군요. 오늘은 그냥 쉬셔도 괜찮아요.",
  "공허해요": "텅 빈 느낌이 드셨군요. 같이 이야기해봐요.",
  "복잡해요": "복잡한 마음이시군요. 하나씩 들려주세요.",
};

// ═══════════════════════════════════════════════════════════
// 피드 데이터 (시연용 정적)
// ═══════════════════════════════════════════════════════════

const FEED_POSTS = [
  { id:1, user:"자취 3년차", emoji:"🌿", time:"2시간 전", content:"냉장고가 비어있는 날이 제일 무서움. 근데 요즘은 그게 오히려 장보러 나가는 이유가 됨 ㅋㅋ 작은 루틴이 생겼어요.", likes:48, saved:12, liked:false, savedByMe:false, tag:"일상" },
  { id:2, user:"서울 혼살이", emoji:"🏙", time:"5시간 전", content:"다이소 욕실 선반 진짜 인생템이에요. 3,000원짜리가 이렇게 삶의 질을 올릴 줄은 몰랐음 😂", likes:134, saved:67, liked:false, savedByMe:false, tag:"꿀팁" },
  { id:3, user:"1인가구 2년", emoji:"🌙", time:"어제", content:"퇴근하고 집에 오면 아무도 없다는 게 처음엔 너무 쓸쓸했는데 이제는 내 공간이 생겼다는 게 얼마나 소중한지 알 것 같아요.", likes:312, saved:89, liked:false, savedByMe:false, tag:"감성" },
  { id:4, user:"꿀팁러", emoji:"✨", time:"어제", content:"에어컨 필터 한 달에 한 번 청소하면 전기세 10~15% 줄어요. 진짜임. 지난달에 확인했어요.", likes:201, saved:145, liked:false, savedByMe:false, tag:"꿀팁" },
  { id:5, user:"새벽 감성", emoji:"🌃", time:"2일 전", content:"새벽 2시에 혼자 라면 끓여 먹는 거, 누군가한테는 외로운 일이겠지만 저한테는 나만의 소소한 행복이에요.", likes:567, saved:234, liked:false, savedByMe:false, tag:"감성" },
];

// ═══════════════════════════════════════════════════════════
// 날짜
// ═══════════════════════════════════════════════════════════

const DAY_KR = ["일","월","화","수","목","금","토"];
const MONTH_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// ═══════════════════════════════════════════════════════════
// 서울시 25개 자치구
// ═══════════════════════════════════════════════════════════

const GU_LIST = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
  "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
];

// 자치구별 1인가구 지원센터 (3개월에 한 번 갱신 예정)
// 출처: 사용자 직접 모집 (씽글벙글 서울 + 자치구청)
// admin_connected: 자치구 admin 시스템과 부여번호 연결 여부 (운영 중 자치구별 활성화)
const GU_CENTERS = {
  "강남구": { name: "강남구청 사회보장과", phone: "02-3423-5874", admin_connected: false },
  "강동구": { name: "강동구 1인가구지원센터", phone: "02-479-1179", admin_connected: false },
  "강북구": { name: null, phone: null, admin_connected: false },
  "강서구": { name: "강서구 가족센터", phone: "02-2606-2017", admin_connected: false },
  "관악구": { name: "관악구청 복지정책과", phone: "02-879-5841", admin_connected: false },
  "광진구": { name: "광진구청 복지정책과", phone: "02-450-7305", admin_connected: false },
  "구로구": { name: "구로구청 통합돌봄과", phone: "02-860-5445", admin_connected: false },
  "금천구": { name: "금천구청 복지정책과", phone: "02-2627-1004", admin_connected: false },
  "노원구": { name: "노원구청 복지정책과", phone: "02-2116-3676", admin_connected: false },
  "도봉구": { name: "도봉구 가족센터 2관", phone: "02-995-6800", admin_connected: false },
  "동대문구": { name: "동대문구 1인가구 지원센터", phone: "010-7459-3301", admin_connected: false },
  "동작구": { name: "동작구청 복지정책과", phone: "02-820-9046", admin_connected: false },
  "마포구": { name: "마포구 가족센터", phone: "070-7467-0790", admin_connected: false },
  "서대문구": { name: "서대문구 1인가구지원센터", phone: "070-4108-9160", admin_connected: false },
  "서초구": { name: "서초구 1인가구지원센터", phone: "02-2155-8977", admin_connected: false },
  "성동구": { name: "성동구 1인가구지원센터", phone: "02-2281-7715", admin_connected: false },
  "성북구": { name: "성북복지재단 1인가구 지원센터", phone: "070-4271-5490", admin_connected: false },
  "송파구": { name: "송파구 가족센터", phone: "070-7450-4331", admin_connected: false },
  "양천구": { name: "양천구 가족센터", phone: "070-7433-3422", admin_connected: false },
  "영등포구": { name: "영등포구 1인가구지원센터", phone: "02-846-5432", admin_connected: false },
  "용산구": { name: "용산구 가족센터", phone: "02-797-9184", admin_connected: false },
  "은평구": { name: "은평구 1인가구지원센터", phone: "070-7492-7901", admin_connected: false },
  "종로구": { name: null, phone: null, admin_connected: false },
  "중구": { name: "중구 1인가구지원센터", phone: "02-6953-1299", admin_connected: false },
  "중랑구": { name: "중랑구청 복지정책과", phone: "02-2094-1622", admin_connected: false },
};

// ═══════════════════════════════════════════════════════════
// 서울시 열린데이터광장 OpenAPI (1인가구 마음챙김 프로그램)
// ═══════════════════════════════════════════════════════════

// 공공 API라 클라이언트 노출 가능
// data.seoul.go.kr 마이페이지 > 인증키 관리에서 발급
const OPENAPI_KEY = "686752756c6b6a6939365446737952";
const OPENAPI_SERVICE = "tbPartcptn"; // 1인가구 참여프로그램 현황
const CACHE_KEY = "orot:programs:v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

// 정서 매칭 키워드 (외로움 카테고리는 무조건 통과, 기타 카테고리는 키워드로)
const EMOTION_KEYWORDS = [
  "마음","심리","정서","감정","자존","자기이해","자기돌봄",
  "우울","불안","스트레스","외롭","고립","정신건강","마음건강",
  "명상","힐링","치유","위로","공감","토닥","다독",
  "쉼","휴식","안식","안녕","돌봄",
  "관계","소통","교류","친구","대인","동행","모임",
  "친교","어울림","사귐","혼자","혼밥","혼술","1인생활","네트워크",
  "상담","멘토",
  "미술","그림","음악","예술","영화","글쓰기","일기",
  "산책","걷기","독서","북클럽","책",
];

// ═══════════════════════════════════════════════════════════
// SECTION 2: 유틸 함수 (→ utils/date.js, streak.js, programs.js)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 날짜 유틸
// ═══════════════════════════════════════════════════════════

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  return dateKey(new Date());
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

// 그 날짜가 속한 주의 월요일 (월요일 시작)
function weekStartKey(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day; // 일요일이면 6일 전 월요일, 그 외엔 (1-day)
  x.setDate(x.getDate() + diff);
  return dateKey(x);
}

// 표시할 주: 오늘이 일요일이면 이번 주, 아니면 지난 주
function targetWeekStartKey() {
  const today = new Date();
  if (today.getDay() === 0) return weekStartKey(today); // 일요일 → 이번 주(월~일)
  // 월~토 → 지난 주
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay()); // 직전 일요일
  return weekStartKey(lastSunday);
}

// "11.18 - 11.24" 형식
function formatWeekRange(weekStart) {
  const s = new Date(weekStart);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  const fmt = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
  return `${fmt(s)} - ${fmt(e)}`;
}

function formatRelativeTime(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
}

function getCalendarDays(y, m) {
  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < first; i++) days.push(null);
  for (let i = 1; i <= last; i++) days.push(i);
  return days;
}

// ═══════════════════════════════════════════════════════════
// 기분 연속 기록 계산
// ═══════════════════════════════════════════════════════════


// 오늘부터 거꾸로 — 기분 기록 연속된 날 수
function calcStreak(moodLog) {
  let n = 0;
  const d = new Date();
  while (moodLog[dateKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// 오늘부터 거꾸로 — 부정 감정 연속된 날 수 (최대 7일)
function countConsecNegative(log) {
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const k = dateKey(d);
    if (log[k] && NEGATIVE.includes(log[k])) {
      count++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

// ═══════════════════════════════════════════════════════════
// 서울시 1인가구 마음챙김 프로그램 (OpenAPI)
// ═══════════════════════════════════════════════════════════

// 한 행이 정서 카테고리인지
function matchEmotion(row) {
  if (row.SE_NM === "외로움") return true;
  if (row.SE_NM !== "기타") return false;
  const title = row.PARTCPTN_SJ || "";
  return EMOTION_KEYWORDS.some((k) => title.includes(k));
}

// 종료일이 오늘 이후 (활성)
function isActive(row) {
  const end = row.PROGRS_DE2;
  if (!end) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return end >= todayStr;
}

// API row → 앱 내부 형태로 변환
function normalizeRow(row) {
  return {
    id: row.PARTCPTN_ID,
    gu: row.ATDRC_NM,
    title: (row.PARTCPTN_SJ || "").trim(),
    startDate: row.PROGRS_DE1 || null,
    endDate: row.PROGRS_DE2 || null,
    link: row.RCEPT_MTH_LINK || null,
  };
}

// 페이지네이션 fetch (1000건씩)
async function fetchProgramsPage(start, end) {
  const url = `http://openapi.seoul.go.kr:8088/${OPENAPI_KEY}/json/${OPENAPI_SERVICE}/${start}/${end}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  if (json.RESULT && json.RESULT.CODE && json.RESULT.CODE !== "INFO-000") {
    throw new Error(`API: ${json.RESULT.MESSAGE || json.RESULT.CODE}`);
  }
  const payload = json[OPENAPI_SERVICE];
  if (!payload) throw new Error("API 응답 형식 오류");
  if (payload.RESULT && payload.RESULT.CODE !== "INFO-000") {
    throw new Error(`API: ${payload.RESULT.MESSAGE || payload.RESULT.CODE}`);
  }
  return {
    total: payload.list_total_count || 0,
    rows: payload.row || [],
  };
}

// 전체 가져와서 정제
async function fetchAllPrograms() {
  const PAGE_SIZE = 1000;
  const first = await fetchProgramsPage(1, PAGE_SIZE);
  let allRows = first.rows;
  const total = first.total;
  if (total > PAGE_SIZE) {
    const remainingPages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
    for (let i = 0; i < remainingPages; i++) {
      const s = PAGE_SIZE * (i + 1) + 1;
      const e = Math.min(PAGE_SIZE * (i + 2), total);
      const page = await fetchProgramsPage(s, e);
      allRows = allRows.concat(page.rows);
    }
  }
  return allRows
    .filter((r) => matchEmotion(r) && isActive(r))
    .map(normalizeRow);
}

// 캐시 읽기 (6시간 이내면 사용)
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.fetchedAt || !Array.isArray(parsed.programs)) return null;
    const age = Date.now() - parsed.fetchedAt;
    if (age > CACHE_TTL_MS) return null;
    return parsed.programs;
  } catch {
    return null;
  }
}

function writeCache(programs) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        fetchedAt: Date.now(),
        programs,
      })
    );
  } catch {}
}

// 커스텀 훅: 우리 동네 탭에서 호출
function usePrograms() {
  const [programs, setPrograms] = useState(() => readCache() || []);
  const [loading, setLoading] = useState(() => readCache() === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (readCache() !== null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAllPrograms()
      .then((data) => {
        if (cancelled) return;
        setPrograms(data);
        writeCache(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "불러오기 실패");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { programs, loading, error };
}

// "5월 9일 시작" / "5월 1일부터"
function formatStartDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const today = new Date();
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const isStarted = start <= today;
  const label = `${m}월 ${d}일`;
  return isStarted ? `${label}부터` : `${label} 시작`;
}

// 자치구별 + 시작일 오름차순 분리
function splitProgramsByGu(programs, gu) {
  const ours = programs
    .filter((p) => p.gu === gu)
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  const city = programs
    .filter((p) => p.gu === "서울시")
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  return { ours, city };
}


// ═══════════════════════════════════════════════════════════
// SECTION 3: 공용 컴포넌트 (→ components/shared/)
// ═══════════════════════════════════════════════════════════


function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "20px 24px 0" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 2,
            background: i < step ? C.warm : C.border,
            transition: "background .3s",
          }}
        />
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION 4: 진입 흐름 - 단계 (→ flows/steps/)
// ═══════════════════════════════════════════════════════════


function NicknameSetup({ nickname, setNickname, next }) {
  const examples = ["혼자살이중", "자취 3년차", "서울토박이", "새벽감성"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ProgressBar step={1} total={3} />

      <div style={{ flex: 1, padding: "40px 28px 0" }}>
        <div className="up" style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>
          뭐라고 불러드릴까요?
        </div>
        <div className="up" style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 36 }}>
          피드에서 사용할 닉네임이에요. 언제든 바꿀 수 있어요.
        </div>

        <div className="up" style={{ background: C.surface, borderRadius: 14, border: `1px solid ${nickname ? C.warm : C.border}`, padding: "16px 20px", marginBottom: 16, transition: "border .2s" }}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 12))}
            placeholder="닉네임 입력 (최대 12자)"
            style={{ width: "100%", border: "none", background: "transparent", fontSize: 16, color: C.text, fontWeight: 300 }}
          />
        </div>

        <div style={{ fontSize: 11, color: C.muted, marginBottom: 24, fontWeight: 300 }}>
          이런 닉네임은 어떠세요?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => setNickname(e)}
              style={{ padding: "8px 16px", borderRadius: 40, fontSize: 12, border: `1px solid ${C.border}`, color: C.sub, background: C.surface, fontWeight: 300 }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "32px 28px 52px" }}>
        <button
          onClick={next}
          disabled={!nickname.trim()}
          style={{
            width: "100%",
            background: nickname.trim() ? C.dark : C.border,
            color: "#fff",
            padding: "17px",
            borderRadius: 8,
            fontSize: 15,
            letterSpacing: 0.3,
            transition: "background .2s",
            cursor: nickname.trim() ? "pointer" : "default",
          }}
        >
          좋아요, 이걸로 할게요 →
        </button>
      </div>
    </div>
  );
}


function GuSetup({ selectedGu, setSelectedGu, next }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ProgressBar step={2} total={3} />

      <div style={{ flex: 1, padding: "40px 28px 0", display: "flex", flexDirection: "column" }}>
        <div className="up" style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>
          어느 동네에<br />
          <span style={{ color: C.warm }}>살고 계세요?</span>
        </div>
        <div className="up" style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 28, lineHeight: 1.7 }}>
          우리 동네에 어떤 자원이 있는지 알려드릴게요.<br />언제든 바꿀 수 있어요.
        </div>

        <div className="up" style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GU_LIST.map((gu) => {
              const isSelected = selectedGu === gu;
              return (
                <button
                  key={gu}
                  onClick={() => setSelectedGu(gu)}
                  style={{
                    background: isSelected ? C.warm : C.surface,
                    color: isSelected ? "#fff" : C.text,
                    border: `1px solid ${isSelected ? C.warm : C.border}`,
                    borderRadius: 12,
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: isSelected ? 500 : 400,
                    fontFamily: "'Noto Serif KR',serif",
                    letterSpacing: 0.3,
                    transition: "all 0.15s",
                  }}
                >
                  {gu}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px 52px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={next}
          disabled={!selectedGu}
          style={{
            width: "100%",
            background: selectedGu ? C.dark : C.border,
            color: "#fff",
            padding: "17px",
            borderRadius: 8,
            fontSize: 15,
            letterSpacing: 0.3,
            transition: "background .2s",
            cursor: selectedGu ? "pointer" : "default",
          }}
        >
          {selectedGu ? `${selectedGu}로 시작하기 →` : "동네를 골라주세요"}
        </button>
      </div>
    </div>
  );
}


function FirstMoodCheck({ selectedMood, setSelectedMood, setDone }) {
  const emotion = ONBOARDING_EMOTIONS.find((e) => e.label === selectedMood);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const startApp = async () => {
    if (saving) return;
    if (selectedMood) {
      setSaving(true);
      try {
        if (user) {
          await supabase.from("mood_logs").insert({
            user_id: user.id,
            date: todayKey(),
            mood_label: selectedMood,
          });
        }
      } catch (e) {
        console.error("첫 기분 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }
    setDone(true);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "52px 28px 0" }}>
        <div className="up" style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>
          마지막으로,<br />지금 기분은 어떠세요?
        </div>
        <div className="up" style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 36 }}>
          솔직하게 골라주세요. 여기선 다 괜찮아요.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          {ONBOARDING_EMOTIONS.map((e) => (
            <button
              key={e.label}
              className="emo"
              onClick={() => setSelectedMood(e.label)}
              style={{ width: "calc(25% - 9px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: selectedMood === e.label ? e.color + "88" : C.surface,
                  border: `2px solid ${selectedMood === e.label ? e.color : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  boxShadow: selectedMood === e.label ? `0 4px 16px ${e.color}66` : "0 2px 8px rgba(26,16,10,.05)",
                  transition: "all .2s",
                }}
              >
                {e.emoji}
              </div>
              <span style={{ fontSize: 10, color: selectedMood === e.label ? C.warm : C.muted, fontWeight: selectedMood === e.label ? 500 : 300 }}>
                {e.label}
              </span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div
            className="up"
            style={{
              marginTop: 24,
              background: emotion ? emotion.color + "33" : C.card,
              borderRadius: 14,
              padding: "16px 18px",
              border: `1px solid ${emotion ? emotion.color + "66" : C.border}`,
            }}
          >
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, fontWeight: 300 }}>
              {selectedMood === "힘들어요" && "많이 힘드셨겠어요. 들려주세요 🤍"}
              {selectedMood === "외로워요" && "외로운 날이군요. 여기 있을게요."}
              {selectedMood === "불안해요" && "불안한 마음이시군요. 같이 이야기해봐요."}
              {selectedMood === "짜증나요" && "뭔가 쌓인 게 있으신가봐요. 다 말씀하셔도 돼요."}
              {selectedMood === "피곤해요" && "많이 지치셨군요. 오늘은 그냥 쉬셔도 괜찮아요."}
              {selectedMood === "괜찮아요" && "오늘 좋은 날이네요 😊 무슨 일 있으셨어요?"}
              {selectedMood === "평온해요" && "그 평온함 소중히 여기세요. 잘 하고 계세요."}
              {selectedMood === "설레요" && "뭔가 좋은 일 있으셨군요! 들려주세요"}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "28px 28px 52px" }}>
        <button
          onClick={startApp}
          disabled={!selectedMood || saving}
          style={{
            width: "100%",
            background: selectedMood ? C.warm : C.border,
            color: "#fff",
            padding: "17px",
            borderRadius: 8,
            fontSize: 15,
            letterSpacing: 0.3,
            transition: "background .2s",
            cursor: selectedMood ? "pointer" : "default",
          }}
        >
          {selectedMood ? "오롯 시작하기 →" : "기분을 골라주세요"}
        </button>
        <button
          onClick={() => setDone(true)}
          style={{ width: "100%", marginTop: 12, padding: "12px", fontSize: 13, color: C.muted, fontWeight: 300 }}
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}


function Complete({ nickname, mood, gu, onStart }) {
  const emotion = ONBOARDING_EMOTIONS.find((e) => e.label === mood);

  return (
    <div
      className="fade"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 28px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: emotion ? emotion.color + "66" : C.warmLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          marginBottom: 24,
          boxShadow: emotion ? `0 8px 24px ${emotion.color}66` : "none",
        }}
      >
        🌿
      </div>
      <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, marginBottom: 10, lineHeight: 1.4 }}>
        반가워요, {nickname || "친구"} 😊
      </div>
      {gu && (
        <div style={{ fontSize: 12, color: C.warm, fontWeight: 400, marginBottom: 18, letterSpacing: 0.5 }}>
          📍 {gu}
        </div>
      )}
      <div style={{ fontSize: 14, color: C.sub, fontWeight: 300, lineHeight: 1.8, marginBottom: 48 }}>
        오롯이 너의 자리예요.<br />
        힘드실 때, 외로우실 때, 그냥 말하고 싶으실 때<br />
        언제든 오세요.
      </div>
      <button
        onClick={onStart}
        style={{ width: "100%", maxWidth: 360, background: C.dark, color: "#fff", padding: "17px", borderRadius: 8, fontSize: 15, letterSpacing: 0.3 }}
      >
        시작하기 →
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION 5: 진입 흐름 - 묶음 (→ flows/)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
// 환영 슬라이드 - 4장 (회원가입 후 첫 로그인 시 한 번만)
// SetupFlow의 첫 단계로 들어감
// ═══════════════════════════════════════════════════════════

const SLIDES = [
  {
    emoji: "🌿",
    title: "오롯이 삶을 꾸리고 있는",
    titleHighlight: "당신의 마음을 돌봐주세요",
    desc: null,
  },
  {
    emoji: "💬",
    title: "오로시와",
    titleHighlight: "마음 나눠요",
    desc: "어떤 말이든 들려주세요",
  },
  {
    emoji: "📍",
    title: "동네 자원이",
    titleHighlight: "한 곳에",
    desc: "우리 동네 마음챙김 프로그램 정보를 모아드려요",
  },
  {
    emoji: "🌟",
    title: "거의 다 됐어요",
    titleHighlight: null,
    desc: "닉네임과 동네만 알려주세요",
  },
];

function WelcomeSlides({ onComplete }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const next = () => {
    if (isLast) onComplete();
    else setIdx((i) => i + 1);
  };

  return (
    <div
      style={{
        fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; background:none; font-family:inherit; }
        @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadein .5s ease forwards; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* 슬라이드 콘텐츠 */}
        <div
          key={idx}
          className="fade"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: C.warmLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              marginBottom: 36,
            }}
          >
            {slide.emoji}
          </div>

          <div
            style={{
              fontFamily: "'Noto Serif KR',serif",
              fontSize: 24,
              fontWeight: 400,
              lineHeight: 1.5,
              marginBottom: slide.desc ? 16 : 0,
              maxWidth: 320,
            }}
          >
            {slide.title}
            {slide.titleHighlight && (
              <>
                <br />
                <span style={{ color: C.warm }}>{slide.titleHighlight}</span>
              </>
            )}
          </div>

          {slide.desc && (
            <div style={{ fontSize: 14, color: C.sub, fontWeight: 300, lineHeight: 1.7, maxWidth: 320 }}>
              {slide.desc}
            </div>
          )}
        </div>

        {/* 인디케이터 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 0 24px" }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? C.warm : C.border,
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        {/* 버튼 */}
        <div style={{ padding: "0 28px 52px" }}>
          <button
            onClick={next}
            style={{
              width: "100%",
              background: C.dark,
              color: "#fff",
              padding: "17px",
              borderRadius: 8,
              fontSize: 15,
              letterSpacing: 0.3,
            }}
          >
            {isLast ? "시작하기 →" : "다음 →"}
          </button>
          {!isLast && (
            <button
              onClick={onComplete}
              style={{ width: "100%", padding: "12px", marginTop: 8, fontSize: 12, color: C.muted, fontWeight: 300 }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 인증 흐름 - 로그인 또는 회원가입 단순 화면
// mode: "login" | "signup"
// 가입 시 동의 체크박스 강제 (소셜 로그인도)
// ═══════════════════════════════════════════════════════════

function AuthFlow({ mode: initialMode, onCancel }) {
  const [mode, setMode] = useState(initialMode); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState({ ai: false, privacy: false, terms: false, records: false });

  const allAgreed = agreed.ai && agreed.privacy && agreed.terms && agreed.records;
  const canProceed = mode === "login" || allAgreed;

  const toggle = (key) => setAgreed((a) => ({ ...a, [key]: !a[key] }));
  const toggleAll = () => {
    const all = !allAgreed;
    setAgreed({ ai: all, privacy: all, terms: all, records: all });
  };

  const handleEmailAuth = async () => {
    if (!canProceed) {
      setError("필수 항목에 동의해주세요");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fn =
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });
      const { error: err } = await fn;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      // 성공 — 페이지 새로고침으로 확실하게 라우팅
      window.location.reload();
    } catch (e) {
      setError(e.message || "다시 시도해주세요");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!canProceed) {
      setError("필수 항목에 동의해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || "다시 시도해주세요");
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (!canProceed) {
      setError("필수 항목에 동의해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: window.location.origin },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || "다시 시도해주세요");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::placeholder { color:${C.muted}; }
        input:focus { outline:none; }
        ::-webkit-scrollbar { width:0; }
        button { cursor:pointer; border:none; background:none; font-family:inherit; }
        @keyframes up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .up { animation: up .4s ease forwards; }
      `}</style>

      {/* 좌측 상단 닫기 버튼 */}
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 100 }}>
        <button
          onClick={onCancel}
          style={{
            fontSize: 18,
            color: C.sub,
            padding: 8,
            background: "rgba(248,244,239,.7)",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="돌아가기"
        >
          ←
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 28px 40px" }}>
          {/* 헤더 */}
          <div className="up" style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 20px" }}>
              🌿
            </div>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
              {mode === "login" ? "로그인" : "회원가입"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 300, lineHeight: 1.7 }}>
              {mode === "login"
                ? "오롯에 다시 오신 걸 환영해요"
                : "오롯에 오신 걸 환영해요"}
            </div>
          </div>

          {/* 이메일/비번 */}
          <div className="up" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", fontSize: 14, color: C.text }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "비밀번호 (6자 이상)" : "비밀번호"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", fontSize: 14, color: C.text }}
            />
          </div>

          {/* 동의 체크박스 - 회원가입 모드에서만 */}
          {mode === "signup" && (
            <div style={{ marginBottom: 16 }}>
              {/* 전체 동의 */}
              <div
                onClick={toggleAll}
                style={{
                  background: allAgreed ? C.dark : C.surface,
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${allAgreed ? C.dark : C.border}`,
                  marginBottom: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${allAgreed ? "#fff" : C.muted}`,
                    background: allAgreed ? "#fff" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {allAgreed && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.dark }} />}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: allAgreed ? "#fff" : C.text }}>전체 동의하기</div>
              </div>

              {/* 개별 동의 */}
              {[
                { key: "terms", label: "이용약관 동의 (필수)" },
                { key: "privacy", label: "개인정보 수집·이용 동의 (필수)" },
                { key: "ai", label: "AI 대화 사용 동의 (필수)" },
                { key: "records", label: "내 기록 저장 동의 (필수)" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1.5px solid ${agreed[item.key] ? C.warm : C.muted}`,
                      background: agreed[item.key] ? C.warm : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {agreed[item.key] && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 300 }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div style={{ fontSize: 12, color: "#C44545", marginBottom: 12, textAlign: "center", fontWeight: 300 }}>
              {error}
            </div>
          )}

          {/* 메인 버튼 */}
          <button
            onClick={handleEmailAuth}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? C.muted : canProceed ? C.dark : C.border,
              color: "#fff",
              padding: "15px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 10,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
          </button>

          {/* 모드 전환 */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              style={{ fontSize: 12, color: C.sub, fontWeight: 300, textDecoration: "underline" }}
            >
              {mode === "login" ? "처음이세요? 회원가입" : "이미 계정 있으세요? 로그인"}
            </button>
          </div>

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>또는</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* 소셜 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                width: "100%",
                background: C.surface,
                color: C.text,
                border: `1px solid ${C.border}`,
                padding: "14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: loading ? "default" : "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Google로 계속
            </button>

            <button
              onClick={handleAppleAuth}
              disabled={loading}
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                border: `1px solid #000`,
                padding: "14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: loading ? "default" : "pointer",
              }}
            >
              <span style={{ fontSize: 16 }}></span>
              Apple로 계속
            </button>

            <button
              disabled
              style={{
                width: "100%",
                background: C.surface,
                color: C.muted,
                border: `1px solid ${C.border}`,
                padding: "14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              카카오로 계속
              <span style={{ fontSize: 10, marginLeft: 4 }}>(준비 중)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 프로필 셋업 흐름 (회원가입 후 첫 로그인 시)
// 0=슬라이드 → 1=닉네임 → 2=자치구 → 3=첫 기분 → 완료
// ═══════════════════════════════════════════════════════════

function SetupFlow({ onComplete }) {
  const { user, profile, refreshProfile } = useAuth();

  // 시작 step 자동 계산 (mount 시 1회)
  // - 슬라이드 본 적 없음 → 0 (슬라이드부터)
  // - 닉네임 비어있음 → 1 (닉네임)
  // - 자치구 비어있음 → 2 (자치구)
  // - 둘 다 있으면 → 3 (첫 기분)
  const computeInitialStep = () => {
    let slidesSeen = false;
    try { slidesSeen = localStorage.getItem("orot_slides_seen") === "1"; } catch {}
    if (!slidesSeen) return 0;
    if (!profile?.nickname) return 1;
    if (!profile?.gu) return 2;
    return 3;
  };

  const [step, setStep] = useState(computeInitialStep);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [selectedGu, setSelectedGu] = useState(profile?.gu || null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (saving) return;

    // step 1 (닉네임) → 2 가기 전 DB 저장
    if (step === 1 && nickname.trim()) {
      setSaving(true);
      try {
        if (user) {
          await supabase.from("profiles").update({ nickname: nickname.trim() }).eq("id", user.id);
        }
      } catch (e) {
        console.error("닉네임 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }

    // step 2 (자치구) → 3 가기 전 DB 저장
    if (step === 2 && selectedGu) {
      setSaving(true);
      try {
        if (user) {
          await supabase.from("profiles").update({ gu: selectedGu }).eq("id", user.id);
          try { localStorage.setItem("orot_user_gu", selectedGu); } catch {}
        }
      } catch (e) {
        console.error("자치구 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }

    setStep((s) => s + 1);
  };

  // setup 완료 시 AuthContext의 profile 갱신 후 onComplete
  const handleComplete = async () => {
    await refreshProfile();
    onComplete();
  };

  if (done) return <Complete nickname={nickname} mood={selectedMood} gu={selectedGu} onStart={handleComplete} />;

  // step 0 = 슬라이드 (자체 레이아웃) — 한 번 보면 localStorage 박아서 다시 안 보임
  if (step === 0) {
    return <WelcomeSlides onComplete={() => {
      try { localStorage.setItem("orot_slides_seen", "1"); } catch {}
      // 슬라이드 끝났을 때 profile에 이미 nickname/gu가 있으면 그 step으로 jump
      if (!profile?.nickname) setStep(1);
      else if (!profile?.gu) setStep(2);
      else setStep(3);
    }} />;
  }

  return (
    <div
      style={{
        fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::placeholder { color:${C.muted}; }
        input:focus { outline:none; }
        ::-webkit-scrollbar { width:0; }
        button { cursor:pointer; border:none; background:none; font-family:inherit; }
        @keyframes up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadein { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .up { animation: up .4s ease forwards; }
        .fade { animation: fadein .5s ease forwards; }
        .emo { transition: transform .12s; }
        .emo:active { transform: scale(.92); }
        input[type=text] { outline:none; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {step === 1 && <NicknameSetup nickname={nickname} setNickname={setNickname} next={next} />}
        {step === 2 && <GuSetup selectedGu={selectedGu} setSelectedGu={setSelectedGu} next={next} />}
        {step === 3 && <FirstMoodCheck selectedMood={selectedMood} setSelectedMood={setSelectedMood} setDone={setDone} />}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION 6: 메인앱 - 탭 (→ components/tabs/)
// ═══════════════════════════════════════════════════════════


function HomeTab({
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

      {/* 부정 3일 이상 유도 배너 */}
      {negDays >= 3 && (
        <div className="up" style={{ background: "#FDF0EA", border: `1px solid ${C.warmLight}`, borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15, color: C.warm, marginBottom: 6 }}>
            요즘 많이 힘드시죠 😔
          </div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.75, marginBottom: 14, fontWeight: 300 }}>
            {negDays}일째 힘드신 것 같아 마음에 걸려요.<br />혼자 담아두지 말고 들려주세요.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setTab("털어놓기")} style={{ flex: 1, background: C.warm, color: "#fff", padding: "11px", borderRadius: 8, fontSize: 13 }}>
              오로시에게 들려주기
            </button>
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


function ChatTab({ messages, input, setInput, sendMessage, typing, bottomRef }) {
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
        {messages.map((msg, i) => (
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
        ))}
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


function FeedTab({ posts, postsLoaded, toggleLike, toggleSave, onComposeOpen }) {
  const [filter, setFilter] = useState("전체");
  const tags = ["전체", "꿀팁", "감성", "일상"];
  const list = filter === "전체" ? posts : posts.filter((p) => p.tag === filter);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ padding: "32px 24px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, marginBottom: 4 }}>피드</div>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, marginBottom: 18 }}>1인가구들의 이야기</div>
        <div style={{ display: "flex", gap: 8 }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 40,
                fontSize: 12,
                border: `1px solid ${filter === t ? C.dark : C.border}`,
                background: filter === t ? C.dark : "transparent",
                color: filter === t ? "#fff" : C.muted,
                transition: "all .2s",
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={onComposeOpen}
            style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 40, fontSize: 12, border: `1px solid ${C.warm}`, color: C.warm }}
          >
            + 올리기
          </button>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {!postsLoaded ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: C.muted, fontSize: 13, fontWeight: 300 }}>
            불러오는 중...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>🌿</div>
            <div style={{ fontSize: 14, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
              {filter === "전체" ? "아직 글이 없어요." : `'${filter}' 글이 아직 없어요.`}<br />
              첫 이야기를 들려주실래요?
            </div>
            <button
              onClick={onComposeOpen}
              style={{ marginTop: 20, padding: "10px 22px", borderRadius: 40, fontSize: 12, border: `1px solid ${C.warm}`, color: C.warm }}
            >
              + 올리기
            </button>
          </div>
        ) : (
          list.map((post, i) => (
            <div
              key={post.id}
              className="up"
              style={{
                background: C.surface,
                borderRadius: 16,
                padding: "22px",
                marginBottom: 14,
                border: `1px solid ${C.border}`,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {post.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{post.user}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{post.time}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 20, background: C.card, color: C.sub }}>{post.tag}</span>
              </div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.8, fontWeight: 300, marginBottom: 18, whiteSpace: "pre-wrap" }}>{post.content}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => toggleLike(post.id)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16, color: post.liked ? "#D4695A" : C.muted, transition: "color .2s" }}>♥</span>
                  <span style={{ fontSize: 13, color: post.liked ? C.warm : C.muted, fontWeight: post.liked ? 500 : 400 }}>{post.likes}</span>
                </button>
                <button onClick={() => toggleSave(post.id)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, color: post.savedByMe ? C.warm : C.muted, transition: "color .2s" }}>{post.savedByMe ? "★" : "☆"}</span>
                  <span style={{ fontSize: 13, color: post.savedByMe ? C.warm : C.muted, fontWeight: post.savedByMe ? 500 : 400 }}>{post.saved}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// ───────── 글 올리기 모달 ─────────
function PostComposer({ onClose, onSubmit }) {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("일상");
  const [submitting, setSubmitting] = useState(false);
  const tags = ["꿀팁", "감성", "일상"];

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(content, tag);
    setSubmitting(false);
    if (ok) onClose();
    else alert("글 올리기 실패. 다시 시도해주세요.");
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: C.bg, zIndex: 200,
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onClose} style={{ fontSize: 22, color: C.sub, padding: 4 }}>←</button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17 }}>새 이야기</div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          style={{
            fontSize: 13,
            color: content.trim() && !submitting ? C.warm : C.muted,
            fontWeight: 500,
            padding: "4px 8px",
          }}
        >
          {submitting ? "올리는 중..." : "올리기"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginBottom: 8 }}>분위기</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              style={{
                padding: "8px 16px",
                borderRadius: 40,
                fontSize: 12,
                border: `1px solid ${tag === t ? C.dark : C.border}`,
                background: tag === t ? C.dark : "transparent",
                color: tag === t ? "#fff" : C.muted,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="어떤 이야기를 들려주실래요?"
          maxLength={500}
          rows={10}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            fontFamily: "inherit",
            fontSize: 14,
            color: C.text,
            lineHeight: 1.8,
            resize: "none",
            outline: "none",
          }}
        />

        <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, textAlign: "right", marginTop: 12 }}>
          {content.length} / 500
        </div>
      </div>
    </div>
  );
}


// 프로그램 카드 한 장
function ProgramCard({ program }) {
  const { title, startDate, link } = program;
  const dateLabel = formatStartDate(startDate);
  const hasLink = !!link;

  const handleClick = () => {
    if (hasLink) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={hasLink ? handleClick : undefined}
      style={{
        background: C.surface,
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${C.border}`,
        cursor: hasLink ? "pointer" : "default",
        transition: "transform .15s, box-shadow .15s",
      }}
      onMouseEnter={
        hasLink
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(26,16,10,.06)";
            }
          : undefined
      }
      onMouseLeave={
        hasLink
          ? (e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "";
            }
          : undefined
      }
    >
      <div style={{ fontSize: 14, fontWeight: 400, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: C.sub, fontWeight: 300 }}>
        <span>📅 {dateLabel}</span>
        {!hasLink && <span style={{ color: C.muted, fontSize: 10 }}>· 신청 정보가 없어요</span>}
        {hasLink && <span style={{ marginLeft: "auto", color: C.warm, fontSize: 11 }}>신청하기 →</span>}
      </div>
    </div>
  );
}

function NeighborhoodTab({ userGu, openGuModal }) {
  const { programs, loading, error } = usePrograms();

  // 자치구 미설정
  if (!userGu) {
    return (
      <div style={{ flex: 1, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>📍</div>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 18, marginBottom: 10, textAlign: "center" }}>
          자치구를 먼저 설정해주세요
        </div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.7, textAlign: "center", marginBottom: 24 }}>
          우리 동네 마음챙김 프로그램을<br />보여드릴게요.
        </div>
        <button onClick={openGuModal} style={{ background: C.warm, color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14 }}>
          자치구 설정하기
        </button>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div style={{ flex: 1, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.warm, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300 }}>프로그램을 불러오고 있어요...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div style={{ flex: 1, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18 }}>📡</div>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17, marginBottom: 8, textAlign: "center" }}>
          지금 정보를 불러올 수 없어요
        </div>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7, textAlign: "center", marginBottom: 20 }}>
          잠시 후 다시 시도해주세요.
        </div>
        <button onClick={() => window.location.reload()} style={{ background: C.warm, color: "#fff", padding: "10px 22px", borderRadius: 8, fontSize: 13 }}>
          다시 시도
        </button>
      </div>
    );
  }

  // 성공 - 데이터 분리
  const { ours, city } = splitProgramsByGu(programs, userGu);
  const hasOurs = ours.length > 0;
  const hasCity = city.length > 0;

  return (
    <div style={{ flex: 1, padding: "24px 22px 32px" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400, marginBottom: 6 }}>
          우리 동네
        </div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300 }}>
          {userGu}의 마음챙김 프로그램
        </div>
      </div>

      {/* 시 단위 섹션 */}
      {hasCity && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>🏙️</span>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, letterSpacing: 0.3 }}>서울시 전체</div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 12 }}>
            어느 동네에 살든 신청할 수 있어요
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {city.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        </div>
      )}

      {/* 우리 자치구 섹션 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, letterSpacing: 0.3 }}>{userGu}</div>
        </div>

        {hasOurs ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ours.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        ) : (
          <div style={{ background: C.surface, borderRadius: 16, padding: "28px 22px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🌱</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 400, lineHeight: 1.7, marginBottom: 6 }}>
              {hasCity ? `${userGu}에 등록된 프로그램은 아직 없어요.` : "이 동네에는 아직 등록된 프로그램이 없어요."}
            </div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7, marginBottom: hasCity ? 0 : 16 }}>
              {hasCity
                ? "위의 서울시 전체 프로그램은 누구나 신청할 수 있어요."
                : "다른 동네도 둘러보시겠어요?"}
            </div>
            {!hasCity && (
              <button onClick={openGuModal} style={{ background: C.warm, color: "#fff", padding: "10px 22px", borderRadius: 8, fontSize: 13 }}>
                다른 동네 보기 →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 300, textAlign: "center", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        출처: 서울시 1인가구 참여프로그램
      </div>
    </div>
  );
}


function DiaryTab({ moodLog, moodLogsByDate = {}, setDiaryView }) {
  const { user } = useAuth();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthSummaries, setMonthSummaries] = useState({}); // {date: summary}
  const days = getCalendarDays(y, m);
  const tk = todayKey();
  const total = Object.keys(moodLog).length;
  const top = EMOTIONS.map((e) => ({
    ...e,
    count: Object.values(moodLog).filter((v) => v === e.label).length,
  }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  // 그 달 daily_summaries 한 번에 fetch
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    (async () => {
      try {
        const { data } = await supabase
          .from("daily_summaries")
          .select("date, summary")
          .eq("user_id", user.id)
          .gte("date", start)
          .lte("date", end);
        if (cancelled) return;
        const map = {};
        (data || []).forEach((r) => { map[r.date] = r.summary; });
        setMonthSummaries(map);
      } catch (e) {
        console.error("월별 요약 불러오기 실패:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, y, m]);

  const prevM = () => {
    setSelectedDate(null);
    if (m === 0) {
      setY(y - 1);
      setM(11);
    } else setM(m - 1);
  };
  const nextM = () => {
    const n = new Date();
    if (y > n.getFullYear() || (y === n.getFullYear() && m >= n.getMonth())) return;
    setSelectedDate(null);
    if (m === 11) {
      setY(y + 1);
      setM(0);
    } else setM(m + 1);
  };

  const streak = (() => {
    let n = 0;
    const d = new Date();
    while (moodLog[dateKey(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  const selectedMood = selectedDate ? moodLog[selectedDate] : null;
  const selectedEmo = selectedMood ? EMOTIONS.find((e) => e.label === selectedMood) : null;
  const selectedSummary = selectedDate ? monthSummaries[selectedDate] : null;
  const formatSelectedDate = (k) => {
    if (!k) return "";
    const [yy, mm, dd] = k.split("-");
    return `${parseInt(mm)}월 ${parseInt(dd)}일`;
  };

  return (
    <div className="up" style={{ flex: 1, padding: "48px 24px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={() => setDiaryView(false)} style={{ fontSize: 20, color: C.muted }}>
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24 }}>기분 기록</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { label: "총 기록", value: total, unit: "일" },
          { label: "가장 많이", value: top[0]?.emoji || "—", unit: "", big: true },
          { label: "연속 기록", value: streak, unit: "일" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: C.surface,
              borderRadius: 14,
              padding: "16px 12px",
              border: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: s.big ? 26 : 24, color: C.warm, lineHeight: 1.1 }}>
              {s.value}
              <span style={{ fontSize: 12 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 300 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={prevM} style={{ fontSize: 20, color: C.muted, padding: "4px 10px" }}>‹</button>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15 }}>
            {y}년 {MONTH_KR[m]}
          </div>
          <button onClick={nextM} style={{ fontSize: 20, color: C.muted, padding: "4px 10px" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
          {DAY_KR.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 300 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px 2px" }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const emo = EMOTIONS.find((e) => e.label === moodLog[k]);
            const isToday = k === tk;
            const isSelected = k === selectedDate;
            const hasMood = !!moodLog[k];
            const dayLogs = moodLogsByDate[k] || [];
            const hasMultiple = dayLogs.length > 1;
            return (
              <button
                key={i}
                onClick={() => hasMood && setSelectedDate(isSelected ? null : k)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "3px 1px",
                  background: isSelected ? C.warmLight : "transparent",
                  borderRadius: 8,
                  cursor: hasMood ? "pointer" : "default",
                }}
              >
                <div style={{ fontSize: 17, position: "relative" }}>
                  {emo?.emoji || ""}
                  {hasMultiple && (
                    <div style={{
                      position: "absolute",
                      top: -2,
                      right: -8,
                      background: C.warm,
                      color: "#fff",
                      fontSize: 8,
                      fontWeight: 500,
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {dayLogs.length}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: isToday ? C.warm : C.sub, fontWeight: isToday ? 500 : 300 }}>{day}</div>
                {isToday && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.warm }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 패널 */}
      {selectedDate && (
        <div className="up" style={{ background: C.surface, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15 }}>
              {formatSelectedDate(selectedDate)}
            </div>
            <button onClick={() => setSelectedDate(null)} style={{ fontSize: 16, color: C.muted, padding: 4 }}>✕</button>
          </div>

          {/* 그날 기분 흐름 */}
          {(() => {
            const dayLogs = moodLogsByDate[selectedDate] || [];
            if (dayLogs.length === 0 && selectedMood) {
              // localStorage에서 들어와서 byDate 없는 케이스 — 마지막 mood만 표시
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{selectedEmo?.emoji || ""}</span>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 300 }}>{selectedMood}</div>
                </div>
              );
            }
            return (
              <div style={{ paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 10 }}>
                  {dayLogs.length > 1 ? `${dayLogs.length}번 기록` : "기록"}
                </div>
                {dayLogs.map((log, idx) => {
                  const emo = EMOTIONS.find((e) => e.label === log.label);
                  const t = new Date(log.time);
                  const hh = String(t.getHours()).padStart(2, "0");
                  const mm = String(t.getMinutes()).padStart(2, "0");
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, width: 40 }}>{hh}:{mm}</div>
                      <span style={{ fontSize: 18 }}>{emo?.emoji || ""}</span>
                      <div style={{ fontSize: 12, color: C.sub, fontWeight: 300 }}>{log.label}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 그날 정리 */}
          {selectedSummary ? (
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {selectedSummary}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>
              이 날의 정리는 아직 없어요.
            </div>
          )}
        </div>
      )}

      {top.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15, marginBottom: 14 }}>감정 분포</div>
          {top.slice(0, 6).map((e) => (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16, width: 22 }}>{e.emoji}</span>
              <span style={{ fontSize: 12, color: C.sub, width: 54, fontWeight: 300 }}>{e.label}</span>
              <div style={{ flex: 1, height: 6, background: C.card, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: e.color, width: `${(e.count / total) * 100}%`, borderRadius: 3, transition: "width .5s" }} />
              </div>
              <span style={{ fontSize: 11, color: C.muted, width: 16, textAlign: "right" }}>{e.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION 7: 모달 (→ components/modals/)
// ═══════════════════════════════════════════════════════════


function GuModal({ currentGu, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(26,16,10,0.4)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 24px 16px" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: C.sub, padding: 0, marginBottom: 12, cursor: "pointer" }}
          >
            ✕
          </button>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, fontWeight: 400, lineHeight: 1.4, marginBottom: 6 }}>
            어느 동네로 <span style={{ color: C.warm }}>바꿀까요?</span>
          </div>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, fontWeight: 300 }}>
            이사하셨거나 다른 동네 정보가 궁금하시면 바꾸셔도 돼요.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GU_LIST.map((gu) => {
              const isSelected = currentGu === gu;
              return (
                <button
                  key={gu}
                  onClick={() => onSelect(gu)}
                  style={{
                    background: isSelected ? C.warm : C.surface,
                    color: isSelected ? "#fff" : C.text,
                    border: `1px solid ${isSelected ? C.warm : C.border}`,
                    borderRadius: 12,
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: isSelected ? 500 : 400,
                    fontFamily: "'Noto Serif KR',serif",
                    letterSpacing: 0.3,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {gu}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 로그인 유도 모달 (게스트 액션 시 띄움)
// "회원가입하고 시작하기" / "이미 계정 있으세요? 로그인" 분리
// ═══════════════════════════════════════════════════════════

function LoginPromptModal({ onClose, onSignupStart, onLoginStart }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(26,16,10,0.5)",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: C.bg,
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px 32px",
          animation: "up .3s ease forwards",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 20, fontWeight: 400, lineHeight: 1.4, marginBottom: 8, textAlign: "center" }}>
          로그인하고 시작해요
        </div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, fontWeight: 300, textAlign: "center", marginBottom: 28 }}>
          기분 기록과 대화는<br />
          로그인한 분만 이용하실 수 있어요.
        </div>
        <button
          onClick={onSignupStart}
          style={{
            width: "100%",
            background: C.warm,
            color: "#fff",
            padding: "15px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          회원가입하고 시작하기 →
        </button>
        <button
          onClick={onLoginStart}
          style={{ width: "100%", padding: "12px", fontSize: 13, color: C.muted, fontWeight: 300 }}
        >
          이미 계정 있으세요? 로그인
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "10px", fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}


// ───────── 오롯 케어 모달 ─────────
// 미구독 → 결제 화면 (Mock) → 동의 모달 → 활성화
// 구독 중 → 관리 화면 (해지 가능)
function OrotCareModal({ onClose, subscription, consent, onSubscribed, onCancelled }) {
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
            * 위기 상황에서는 자살예방상담전화 1393 등 공식 지원체계로 연결을 안내해드립니다.
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
            * 위기 상황에서는 자살예방상담전화 1393 등 공식 지원체계로 연결을 안내해드립니다.
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


// ───────── 마이페이지 ─────────
function MyPage({ authed, onSignupStart, onLoginStart, userGu, moodLog, streak, setDiaryView, openSettings, openGuModal }) {
  const { user, profile: ctxProfile } = useAuth();
  const profile = ctxProfile || { nickname: "", gu: null };

  const [dailySummary, setDailySummary] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(null);

  // 오롯 케어 — 구독 상태 + 동의 상태
  const [subscription, setSubscription] = useState(null); // null | { status, ... }
  const [consent, setConsent] = useState(null); // null | { counselor_consent, ... }
  const [careModalOpen, setCareModalOpen] = useState(false); // 결제 화면

  const center = userGu ? GU_CENTERS[userGu] : null;
  const totalDays = Object.keys(moodLog).length;

  // subscription / consent 불러오기
  useEffect(() => {
    if (!authed || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status, plan, started_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setSubscription(sub);

        const { data: con } = await supabase
          .from("consent_states")
          .select("counselor_consent, counselor_consented_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setConsent(con);
      } catch (e) {
        console.error("구독/동의 불러오기 실패:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [authed, user?.id]);

  const isSubscribed = subscription?.status === "active";

  // 어제 요약 — 있으면 가져오고, 없으면 어제 활동 있을 때만 lazy 생성
  useEffect(() => {
    if (!authed || !user) return;
    let cancelled = false;
    const ydate = yesterdayKey();

    (async () => {
      try {
        // 이미 박힌 거 있는지
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
            기분 기록과 대화, 정서 결 정리는<br />
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

      {/* 오롯 케어 */}
      {!isSubscribed ? (
        <button
          onClick={() => setCareModalOpen(true)}
          style={{
            width: "100%",
            background: C.dark,
            color: "#fff",
            border: "none",
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
              <div style={{ fontSize: 11, color: "#D4C4B8", fontWeight: 300, lineHeight: 1.5 }}>
                임상심리사가 함께 살펴봐드려요
              </div>
            </div>
          </div>
          <span style={{ fontSize: 14, color: "#D4C4B8" }}>›</span>
        </button>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.warmLight}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🌱</span>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>오롯 케어 이용 중</div>
          </div>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
            정서 동행 동의 {consent?.counselor_consent ? "활성" : "필요"}
          </div>
          <button
            onClick={() => setCareModalOpen(true)}
            style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginTop: 12, padding: 0 }}
          >
            관리하기 →
          </button>
        </div>
      )}

      {/* 오롯 케어 모달 */}
      {careModalOpen && (
        <OrotCareModal
          onClose={() => setCareModalOpen(false)}
          subscription={subscription}
          consent={consent}
          onSubscribed={(newSub, newConsent) => {
            setSubscription(newSub);
            setConsent(newConsent);
          }}
          onCancelled={(newSub) => {
            setSubscription(newSub);
          }}
        />
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

      {/* 24시간 공공 자원 */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
        24시간 공공 자원
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 400, marginBottom: 4 }}>
          정신건강위기상담전화
        </div>
        <a
          href="tel:1577-0199"
          style={{ fontSize: 15, color: C.warm, fontWeight: 500, textDecoration: "none" }}
        >
          1577-0199
        </a>
      </div>
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
function Settings({ onClose, userGu }) {
  const [view, setView] = useState("main"); // main / nickname / gov_id / emergency / emergency_add
  const [nickname, setNickname] = useState("");
  const [govId, setGovId] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", relationship: "가족", phone: "" });
  const center = userGu ? GU_CENTERS[userGu] : null;
  const adminConnected = center?.admin_connected || false;
  const { user, profile, refreshProfile } = useAuth();

  // 프로필 값 채우기 (useAuth().profile 변화 감지)
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
      setGovId(profile.gov_assigned_id || "");
      setSavedAt(profile.gov_assigned_id ? "saved" : null);
      setVerifiedAt(profile.verified_at);
    }
  }, [profile]);

  // emergency_contacts만 자체 fetch (AuthContext에 안 박힘)
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

  const saveGovId = async () => {
    if (!govId.trim() || saving) return;
    setSaving(true);
    try {
      if (user) {
        await supabase.from("profiles").update({ gov_assigned_id: govId.trim() }).eq("id", user.id);
        await refreshProfile();
        setSavedAt("saved");
        setView("main");
      }
    } catch (e) {
      console.error("부여번호 저장 실패:", e);
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
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
                !adminConnected
                  ? "연결 준비 중"
                  : verifiedAt
                  ? `활성화됨 ✓`
                  : govId
                  ? `${govId} (확인 대기 중)`
                  : "등록 안 됨"
              }
              onClick={() => setView("gov_id")}
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

      {/* 부여번호 화면 */}
      {view === "gov_id" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          {!adminConnected ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 8, lineHeight: 1.6 }}>
                {userGu}는 부여번호 시스템<br />연결 준비 중이에요
              </div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
                자치구청과 연결되면 부여번호 등록을 통해<br />
                1인가구 지원 자원이 활성화돼요.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 8, fontWeight: 300, lineHeight: 1.7 }}>
                {userGu}청에서 발급받은 번호를 입력해주세요.<br />
                확인 후 1인가구 자원 연결이 활성화돼요.
              </div>
              <input
                type="text"
                value={govId}
                onChange={(e) => setGovId(e.target.value)}
                placeholder="부여번호"
                style={{ width: "100%", padding: "14px 16px", fontSize: 15, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, marginBottom: 12, marginTop: 12, fontFamily: "inherit" }}
              />
              {savedAt && !verifiedAt && (
                <div style={{ fontSize: 12, color: C.warm, fontWeight: 300, marginBottom: 16 }}>⏳ {userGu}청 확인 대기 중</div>
              )}
              {verifiedAt && (
                <div style={{ fontSize: 12, color: "#5C8A5C", fontWeight: 400, marginBottom: 16 }}>✓ 1인가구 자원 활성화됨</div>
              )}
              <button
                onClick={saveGovId}
                disabled={!govId.trim() || saving}
                style={{ width: "100%", background: govId.trim() ? C.dark : C.border, color: "#fff", padding: "15px", borderRadius: 8, fontSize: 14, cursor: govId.trim() ? "pointer" : "default" }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          )}
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


// ═══════════════════════════════════════════════════════════
// SECTION 8: 메인앱 본체 (→ components/MainApp.jsx)
// ═══════════════════════════════════════════════════════════




// ═══════════════════════════════════════════════════════════
// 메인앱 - 4개 탭 + 설정/모달
// authed=true → 인증 모드 (모든 기능)
// authed=false → 게스트 모드 (둘러보기만, 액션 시 로그인 모달)
// ═══════════════════════════════════════════════════════════

function MainApp({ authed = true, onSignupStart, onLoginStart }) {
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
            log[m.date] = m.mood_label; // 마지막 mood가 박힘
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
      // 새 글 맨 위에 박기
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
          />
        )}
        {tab === "홈" && diaryView && <DiaryTab moodLog={moodLog} moodLogsByDate={moodLogsByDate} setDiaryView={setDiaryView} />}
        {tab === "털어놓기" && <ChatTab messages={messages} input={input} setInput={setInput} sendMessage={sendMessage} typing={typing} bottomRef={bottomRef} />}
        {tab === "피드" && <FeedTab posts={posts} postsLoaded={postsLoaded} toggleLike={toggleLike} toggleSave={toggleSave} onComposeOpen={() => requireAuth() && setComposerOpen(true)} />}
        {composerOpen && <PostComposer onClose={() => setComposerOpen(false)} onSubmit={addPost} />}
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
          />
        )}
        {tab === "마이" && diaryView && <DiaryTab moodLog={moodLog} moodLogsByDate={moodLogsByDate} setDiaryView={setDiaryView} />}
      </div>

      {guModalOpen && <GuModal currentGu={userGu} onSelect={changeGu} onClose={() => setGuModalOpen(false)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} userGu={userGu} />}
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


// ═══════════════════════════════════════════════════════════
// SECTION 9: 진입점 (→ App.jsx)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
// 진입점
// 단일 stage 변수로 박음 - 깜빡임 X
// stage: "loading" | "guest" | "auth_login" | "auth_signup" | "setup" | "main"
// ═══════════════════════════════════════════════════════════
// 최상위 App — AuthProvider + AppRouter
// ═══════════════════════════════════════════════════════════
//
// 핵심 결:
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
