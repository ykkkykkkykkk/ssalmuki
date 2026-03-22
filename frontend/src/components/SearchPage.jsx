import { useState, useCallback } from "react";
import EventCard from "./EventCard";

const BASE = import.meta.env.VITE_API_URL || "";
const CAT_LABEL = { humor: "😂 유머", youtube: "📺 유튜브정보", free: "💬 자유", winner: "🎉 당첨후기" };

export default function SearchPage({ onSelectEvent, onSelectPost, onBack }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/search?q=${encodeURIComponent(q.trim())}`);
      setResults(await r.json());
    } catch {
      setResults({ events: [], posts: [] });
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    search(query);
  };

  const timeAgo = useCallback((dateStr) => {
    const diff = Date.now() - new Date(dateStr + "Z").getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    return new Date(dateStr).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  }, []);

  const totalCount = results ? results.events.length + results.posts.length : 0;

  return (
    <div>
      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #f0f0f0" }}>
        <button onClick={onBack} style={{ fontSize: "13px", color: "#999", background: "none", border: "none", cursor: "pointer", padding: "0 0 10px" }}>← 뒤로</button>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이벤트, 채널, 글 검색..."
            autoFocus style={{ flex: 1, padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: "10px", fontSize: "14px", outline: "none", background: "#f9fafb" }} />
          <button type="submit" disabled={loading}
            style={{ padding: "10px 16px", background: loading ? "#ccc" : "#111", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "500", cursor: loading ? "default" : "pointer", whiteSpace: "nowrap" }}>
            검색
          </button>
        </form>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>검색 중...</div>}

        {results && !loading && totalCount === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>검색 결과가 없습니다</div>
        )}

        {results && !loading && results.events.length > 0 && (
          <>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "10px" }}>
              🎁 이벤트 ({results.events.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {results.events.map((e) => (
                <EventCard key={e.id || e.video_id} event={e} onSelect={onSelectEvent} />
              ))}
            </div>
          </>
        )}

        {results && !loading && results.posts.length > 0 && (
          <>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "10px" }}>
              💬 커뮤니티 글 ({results.posts.length})
            </div>
            <div>
              {results.posts.map((p) => (
                <div key={p.id} onClick={() => onSelectPost(p.id)}
                  style={{ padding: "14px 0", borderBottom: "0.5px solid #f5f5f5", cursor: "pointer", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f3f4f6", color: "#666" }}>
                      {CAT_LABEL[p.category] || "💬 자유"}
                    </span>
                    {p.is_ai === 1 && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "#EDE9FE", color: "#7C3AED" }}>AI</span>}
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: "500", color: "#111", margin: "0 0 6px", lineHeight: "1.4" }}>{p.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#bbb" }}>
                    <span style={{ color: "#888" }}>{p.nickname}</span>
                    <span>{timeAgo(p.created_at)}</span>
                    <span>❤️ {p.likes}</span>
                    <span>💬 {p.comment_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!results && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc", fontSize: "13px" }}>
            이벤트, 채널명, 커뮤니티 글을 검색해보세요
          </div>
        )}
      </div>
    </div>
  );
}
