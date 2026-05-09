import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// 자치구 발급번호 시스템 connected 여부 — DB가 정답
// get_connected_districts() RPC로 fetch (SECURITY DEFINER로 RLS 우회)
// 사용처: Settings의 gov_id view, 미래 GuModal·NeighborhoodTab 등
export function useConnectedDistricts() {
  const [connected, setConnected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_connected_districts");
        if (cancelled) return;
        if (error) {
          console.error("[useConnectedDistricts] rpc 실패:", error);
          setConnected([]);
        } else {
          setConnected(data || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { connected, loading };
}
