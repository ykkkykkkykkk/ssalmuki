import { useState } from "react";

const BASE = import.meta.env.VITE_API_URL || "";
const CATS = [
  { key: "free", label: "💬 자유" },
  { key: "humor", label: "😂 유머" },
  { key: "youtube", label: "📺 유튜브정보" },
  { key: "winner", label: "🎉 당첨후기" },
];

export default function WritePost({ onBack, onDone, user, authHeaders }) {
  const [cat, setCat] = useState("free");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 모두 입력해주세요");
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ category: cat, title, content }),
      });
      if (r.ok) onDone();
      else { const err = await r.json(); alert(err.error); }
    } catch { alert("전송 실패"); }
    setSubmitting(false);
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <button onClick={onBack} style={{ fontSize: "13px", color: "#999", background: "none", border: "none", cursor: "pointer" }}>← 취소</button>
        <span style={{ fontSize: "15px", fontWeight: "600" }}>글쓰기</span>
        <button onClick={submit} disabled={submitting}
          style={{ fontSize: "13px", fontWeight: "600", color: submitting ? "#ccc" : "#E84E3B", background: "none", border: "none", cursor: submitting ? "default" : "pointer" }}>
          {submitting ? "..." : "완료"}
        </button>
      </div>

      {/* 작성자 표시 */}
      <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
        작성자: <span style={{ fontWeight: "500", color: "#333" }}>{user?.nickname}</span>
      </div>

      {/* 카테고리 */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {CATS.map((c) => (
          <button key={c.key} onClick={() => setCat(c.key)}
            style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "12px", border: "1px solid", cursor: "pointer",
              borderColor: cat === c.key ? "#E84E3B" : "#e0e0e0",
              background: cat === c.key ? "#FEF2F2" : "#fff",
              color: cat === c.key ? "#E84E3B" : "#888" }}>
            {c.label}
          </button>
        ))}
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" maxLength={100}
        style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", fontWeight: "500", marginBottom: "10px", outline: "none", boxSizing: "border-box" }} />

      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요" maxLength={2000} rows={12}
        style={{ width: "100%", padding: "12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: "1.7", boxSizing: "border-box" }} />
    </div>
  );
}
