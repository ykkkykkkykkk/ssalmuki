import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";
const CATS = [
  { key: "all", label: "전체" },
  { key: "humor", label: "유머", emoji: "😂" },
  { key: "youtube", label: "유튜브정보", emoji: "📺" },
  { key: "free", label: "자유", emoji: "💬" },
  { key: "winner", label: "당첨후기", emoji: "🎉" },
];
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.key, c]));
const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "popular", label: "인기순" },
];

export default function Community({ onSelectPost, onWrite }) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 20, sort });
      if (category !== "all") p.set("category", category);
      const r = await fetch(`${BASE}/api/posts?${p}`);
      const data = await r.json();
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {}
    setLoading(false);
  }, [category, sort, page]);

  useEffect(() => { load(); }, [load]);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr + "Z").getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    return new Date(dateStr).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  };

  return (
    <div>
      {/* 카테고리 필터 */}
      <div style={{ display: "flex", gap: "6px", padding: "10px 16px", overflowX: "auto", borderBottom: "0.5px solid #f0f0f0" }}>
        {CATS.map((c) => (
          <button key={c.key} onClick={() => { setCategory(c.key); setPage(1); }}
            style={{ flexShrink: 0, padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "500",
              border: `0.5px solid ${category === c.key ? "transparent" : "#e0e0e0"}`,
              background: category === c.key ? "#EFF6FF" : "#fff",
              color: category === c.key ? "#1D4ED8" : "#888", cursor: "pointer" }}>
            {c.emoji ? `${c.emoji} ` : ""}{c.label}
          </button>
        ))}
      </div>

      {/* 정렬 + 글쓰기 */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", gap: "8px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {SORT_OPTIONS.map((s) => (
            <button key={s.key} onClick={() => { setSort(s.key); setPage(1); }}
              style={{ fontSize: "11px", color: sort === s.key ? "#111" : "#bbb", background: "none", border: "none", cursor: "pointer", fontWeight: sort === s.key ? "600" : "400", padding: "2px 4px" }}>
              {s.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "#ccc", marginLeft: "auto" }}>{total}개</span>
      </div>

      {/* 글 목록 */}
      <main style={{ padding: "0 16px 80px" }}>
        {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>불러오는 중...</div>}
        {!loading && posts.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>아직 글이 없습니다</div>}
        {!loading && posts.map((p) => (
          <div key={p.id} onClick={() => onSelectPost(p.id)}
            style={{ padding: "14px 0", borderBottom: "0.5px solid #f5f5f5", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f3f4f6", color: "#666" }}>
                {CAT_LABEL[p.category]?.emoji || "💬"} {CAT_LABEL[p.category]?.label || "자유"}
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

        {/* 페이징 */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "16px 0" }}>
            {page > 1 && <button onClick={() => setPage(page - 1)} style={{ fontSize: "12px", color: "#888", background: "none", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "4px 12px", cursor: "pointer" }}>이전</button>}
            <span style={{ fontSize: "12px", color: "#aaa", padding: "4px 8px" }}>{page} / {totalPages}</span>
            {page < totalPages && <button onClick={() => setPage(page + 1)} style={{ fontSize: "12px", color: "#888", background: "none", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "4px 12px", cursor: "pointer" }}>다음</button>}
          </div>
        )}
      </main>

      {/* 글쓰기 FAB */}
      <button onClick={onWrite}
        style={{ position: "fixed", bottom: "80px", right: "max(24px, calc((100vw - 560px) / 2 + 16px))",
          width: "48px", height: "48px", borderRadius: "50%", background: "#111", color: "#fff",
          border: "none", fontSize: "20px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        ✏️
      </button>
    </div>
  );
}
