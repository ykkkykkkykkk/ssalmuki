import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

async function fetchEvents({ status, tag, page = 1, limit = 20, q, min_subs, max_subs, deadline_from, deadline_to, channel } = {}) {
  const p = new URLSearchParams({ page, limit });
  if (status && status !== "all") p.set("status", status);
  if (tag && tag !== "all") p.set("tag", tag);
  if (q) p.set("q", q);
  if (min_subs !== undefined && min_subs !== "") p.set("min_subs", min_subs);
  if (max_subs !== undefined && max_subs !== "") p.set("max_subs", max_subs);
  if (deadline_from) p.set("deadline_from", deadline_from);
  if (deadline_to) p.set("deadline_to", deadline_to);
  if (channel) p.set("channel", channel);
  const r = await fetch(`${BASE}/api/events?${p}`);
  if (!r.ok) throw new Error("API 오류");
  return r.json();
}

async function fetchStats() {
  const r = await fetch(`${BASE}/api/stats`);
  if (!r.ok) throw new Error("API 오류");
  return r.json();
}

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState({ status: "all", tag: "all", q: "", min_subs: "", max_subs: "", deadline_from: "", deadline_to: "", channel: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ev, st] = await Promise.all([fetchEvents({ ...filter, page }), fetchStats()]);
      setEvents(ev.events);
      setTotal(ev.total);
      setTotalPages(ev.totalPages);
      setStats(st);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = useCallback((f) => {
    setFilter((p) => ({ ...p, ...f }));
    setPage(1);
  }, []);

  // 새로고침: YouTube 수집 트리거 → DB 재조회
  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/api/refresh`, { method: "POST" });
      const data = await r.json();
      if (!r.ok && data.error) {
        // rate limit 등 — 그래도 DB 재조회는 함
      }
    } catch {
      // 수집 실패해도 DB 재조회는 진행
    }
    // 수집 후 DB에서 최신 데이터 가져오기
    try {
      const [ev, st] = await Promise.all([fetchEvents({ ...filter, page }), fetchStats()]);
      setEvents(ev.events);
      setTotal(ev.total);
      setTotalPages(ev.totalPages);
      setStats(st);
    } catch (e) {
      setError(e.message);
    }
    setRefreshing(false);
  }, [filter, page]);

  return { events, stats, loading, error, filter, updateFilter, page, setPage, totalPages, total, reload, refreshing };
}
