import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";
const CAT_LABEL = { humor: "😂 유머", youtube: "📺 유튜브정보", free: "💬 자유", winner: "🎉 당첨후기" };

export default function PostDetail({ postId, onBack, user, authHeaders, onRequireLogin }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}`);
      setPost(await r.json());
    } catch {}
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submitComment = async () => {
    if (!user) return onRequireLogin();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content: comment }),
      });
      if (r.ok) { setComment(""); load(); }
      else { const err = await r.json(); alert(err.error); }
    } catch {}
    setSubmitting(false);
  };

  const doLike = async () => {
    if (!user) return onRequireLogin();
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({}),
      });
      if (r.ok) load();
      else { const err = await r.json(); alert(err.error); }
    } catch {}
  };

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>불러오는 중...</div>;
  if (!post) return <div style={{padding:"60px 20px",textAlign:"center"}}><p style={{fontSize:"40px",marginBottom:"8px"}}>🔍</p><p style={{color:"#999",fontSize:"14px"}}>글을 찾을 수 없습니다</p></div>;

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={{ fontSize: "13px", color: "#999", background: "none", border: "none", cursor: "pointer", padding: "0 0 12px" }}>← 목록으로</button>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "#f3f4f6", color: "#666" }}>{CAT_LABEL[post.category] || "💬 자유"}</span>
        {post.is_ai === 1 && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#EDE9FE", color: "#7C3AED" }}>AI 자동생성</span>}
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111", margin: "0 0 8px", lineHeight: "1.4" }}>{post.title}</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#aaa", marginBottom: "16px", paddingBottom: "16px", borderBottom: "0.5px solid #f0f0f0" }}>
        <span style={{ color: "#555", fontWeight: "500" }}>{post.nickname}</span>
        <span>{new Date(post.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: "20px", minHeight: "60px" }}>
        {post.content}
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingBottom: "20px", borderBottom: "0.5px solid #f0f0f0" }}>
        <button onClick={doLike} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 24px", border: "1px solid #f0f0f0", borderRadius: "999px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#E84E3B" }}>
          ❤️ 좋아요 {post.likes}
        </button>
      </div>

      {/* 댓글 */}
      <div style={{ paddingTop: "16px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "12px" }}>💬 댓글 ({post.comments?.length || 0})</span>

        <div style={{ marginBottom: "16px" }}>
          {user ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="댓글을 남겨보세요" maxLength={500} rows={2}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit" }} />
              <button onClick={submitComment} disabled={submitting}
                style={{ padding: "8px 16px", background: submitting ? "#ccc" : "#111", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: submitting ? "default" : "pointer", alignSelf: "flex-end", whiteSpace: "nowrap" }}>등록</button>
            </div>
          ) : (
            <button onClick={onRequireLogin} style={{ width: "100%", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "8px", background: "#f9fafb", cursor: "pointer", fontSize: "13px", color: "#aaa" }}>로그인하고 댓글 남기기</button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(!post.comments || post.comments.length === 0) && <div style={{ fontSize: "13px", color: "#ccc", textAlign: "center", padding: "20px 0" }}>첫 댓글을 남겨보세요!</div>}
          {post.comments?.map((c) => (
            <div key={c.id} style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#333" }}>{c.nickname}</span>
                <span style={{ fontSize: "11px", color: "#ccc" }}>{new Date(c.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#555", margin: 0, lineHeight: "1.5", wordBreak: "break-word" }}>{c.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
