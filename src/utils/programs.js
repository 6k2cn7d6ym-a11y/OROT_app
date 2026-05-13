import { useState, useEffect } from "react";
import {
  OPENAPI_KEY,
  OPENAPI_SERVICE,
  CACHE_KEY,
  CACHE_TTL_MS,
  EMOTION_KEYWORDS,
} from "../lib/constants";

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
  const url = `https://openapi.seoul.go.kr:8088/${OPENAPI_KEY}/json/${OPENAPI_SERVICE}/${start}/${end}/`;
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
export function usePrograms() {
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
export function formatStartDate(dateStr) {
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
export function splitProgramsByGu(programs, gu) {
  const ours = programs
    .filter((p) => p.gu === gu)
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  const city = programs
    .filter((p) => p.gu === "서울시")
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  return { ours, city };
}
