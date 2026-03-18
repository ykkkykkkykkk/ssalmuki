import { useState } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export default function ReportButton({ user, authHeaders, onRequireLogin }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    if (!user) return onRequireLogin();
    setOpen(true);
  };

  const submit = async () => {
    if (!url.trim()) return alert("영상 URL을 입력해주세요");
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ video_url: url, description: desc }),
      });
      const data = await r.json();
      if (r.ok) {
        alert("제보가 접수되었습니다! 감사합니다");
        setOpen(false);
        setUrl("");
        setDesc("");
      } else { alert(data.error); }
    } catch { alert("전송 실패"); }
    setSubmitting(false);
  };

  return (
    <>
      <button onClick={handleOpen}
        style={{
          position: "fixed", bottom: "24px", right: "max(24px, calc((100vw - 560px) / 2 + 16px))",
          width: "52px", height: "52px", borderRadius: "50%",
          background: "#E84E3B", color: "#fff", border: "none",
          fontSize: "22px", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(232,78,59,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100,
        }}
        title="이벤트 제보하기">
        📢
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px", paddingBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>📢 이벤트 제보하기</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#999" }}>✕</button>
            </div>
            <p style={{ fontSize: "12px", color: "#999", marginBottom: "16px", marginTop: 0 }}>
              제보자: <span style={{ color: "#333", fontWeight: "500" }}>{user?.nickname}</span>
            </p>

            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube 영상 URL *" style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", marginBottom: "10px", outline: "none", boxSizing: "border-box" }} />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="간단한 설명 (선택)" maxLength={500} rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />

            <button onClick={submit} disabled={submitting} style={{ width: "100%", padding: "12px", background: submitting ? "#ccc" : "#E84E3B", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: submitting ? "default" : "pointer" }}>
              {submitting ? "전송중..." : "제보하기"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
