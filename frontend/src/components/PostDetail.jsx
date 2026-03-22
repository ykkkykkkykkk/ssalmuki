import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";
const CAT_LABEL = { humor: "😂 유머", youtube: "📺 유튜브정보", free: "💬 자유", winner: "🎉 당첨후기" };
const CATS = [
  { key: "free", label: "💬 자유" },
  { key: "humor", label: "😂 유머" },
  { key: "youtube", label: "📺 유튜브정보" },
  { key: "winner", label: "🎉 당첨후기" },
];

export default function PostDetail({ postId, onBack, user, authHeaders, onRequireLogin, onDeleted }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 글 수정
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCat, setEditCat] = useState("free");
  // 댓글 수정
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}`);
      const data = await r.json();
      setPost(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const isAuthor = user && post && user.nickname === post.nickname;

  // --- 글 수정 ---
  const startEdit = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCat(post.category);
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const submitEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return alert("제목과 내용을 입력해주세요");
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: editTitle, content: editContent, category: editCat }),
      });
      if (r.ok) { setEditing(false); load(); }
      else { const err = await r.json(); alert(err.error); }
    } catch { alert("수정 실패"); }
    setSubmitting(false);
  };

  // --- 글 삭제 ---
  const deletePost = async () => {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (r.ok) { onDeleted?.(); }
      else { const err = await r.json(); alert(err.error); }
    } catch { alert("삭제 실패"); }
  };

  // --- 댓글 작성 ---
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
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  // --- 댓글 삭제 ---
  const deleteComment = async (commentId) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (r.ok) load();
      else { const err = await r.json(); alert(err.error); }
    } catch { alert("삭제 실패"); }
  };

  // --- 댓글 수정 ---
  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditCommentContent(c.content);
  };
  const cancelEditComment = () => { setEditingCommentId(null); setEditCommentContent(""); };
  const submitEditComment = async (commentId) => {
    if (!editCommentContent.trim()) return;
    try {
      const r = await fetch(`${BASE}/api/posts/${postId}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content: editCommentContent }),
      });
      if (r.ok) { setEditingCommentId(null); setEditCommentContent(""); load(); }
      else { const err = await r.json(); alert(err.error); }
    } catch { alert("수정 실패"); }
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
    } catch { /* ignore */ }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>불러오는 중...</div>;
  if (!post) return <div style={{padding:"60px 20px",textAlign:"center"}}><p style={{fontSize:"40px",marginBottom:"8px"}}>🔍</p><p style={{color:"#999",fontSize:"14px"}}>글을 찾을 수 없습니다</p></div>;

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={{ fontSize: "13px", color: "#999", background: "none", border: "none", cursor: "pointer", padding: "0 0 12px" }}>← 목록으로</button>

      {/* 글 수정 모드 */}
      {editing ? (
        <div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
            {CATS.map((c) => (
              <button key={c.key} onClick={() => setEditCat(c.key)}
                style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "12px", border: "1px solid", cursor: "pointer",
                  borderColor: editCat === c.key ? "#E84E3B" : "#e0e0e0",
                  background: editCat === c.key ? "#FEF2F2" : "#fff",
                  color: editCat === c.key ? "#E84E3B" : "#888" }}>
                {c.label}
              </button>
            ))}
          </div>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={100}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", fontWeight: "500", marginBottom: "10px", outline: "none", boxSizing: "border-box" }} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={2000} rows={10}
            style={{ width: "100%", padding: "12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: "1.7", boxSizing: "border-box", marginBottom: "12px" }} />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={cancelEdit} style={{ padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#888" }}>취소</button>
            <button onClick={submitEdit} disabled={submitting}
              style={{ padding: "8px 16px", background: submitting ? "#ccc" : "#E84E3B", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: submitting ? "default" : "pointer" }}>
              {submitting ? "..." : "수정완료"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 카테고리 + 수정/삭제 */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "#f3f4f6", color: "#666" }}>{CAT_LABEL[post.category] || "💬 자유"}</span>
            {post.is_ai === 1 && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#EDE9FE", color: "#7C3AED" }}>AI 자동생성</span>}
            {isAuthor && (
              <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                <button onClick={startEdit} style={{ fontSize: "11px", color: "#888", background: "none", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}>수정</button>
                <button onClick={deletePost} style={{ fontSize: "11px", color: "#E84E3B", background: "none", border: "1px solid #fecaca", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}>삭제</button>
              </div>
            )}
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
        </>
      )}

      {/* 댓글 */}
      {!editing && (
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#333" }}>{c.nickname}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#ccc" }}>{new Date(c.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {user && user.nickname === c.nickname && editingCommentId !== c.id && (
                      <>
                        <button onClick={() => startEditComment(c)} style={{ fontSize: "10px", color: "#aaa", background: "none", border: "none", cursor: "pointer", padding: "0" }}>수정</button>
                        <button onClick={() => deleteComment(c.id)} style={{ fontSize: "10px", color: "#E84E3B", background: "none", border: "none", cursor: "pointer", padding: "0" }}>삭제</button>
                      </>
                    )}
                  </div>
                </div>
                {editingCommentId === c.id ? (
                  <div style={{ marginTop: "6px" }}>
                    <textarea value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} maxLength={500} rows={2}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "6px" }}>
                      <button onClick={cancelEditComment} style={{ fontSize: "11px", color: "#888", background: "none", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "3px 10px", cursor: "pointer" }}>취소</button>
                      <button onClick={() => submitEditComment(c.id)} style={{ fontSize: "11px", color: "#fff", background: "#111", border: "none", borderRadius: "4px", padding: "3px 10px", cursor: "pointer" }}>수정</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#555", margin: 0, lineHeight: "1.5", wordBreak: "break-word" }}>{c.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
