import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export default function EventDetail({ eventId, onBack, user, authHeaders, onRequireLogin }) {
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [winners, setWinners] = useState({ count: 0, winners: [] });
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, cm, wn] = await Promise.all([
        fetch(`${BASE}/api/events/${eventId}`).then((r) => r.json()),
        fetch(`${BASE}/api/events/${eventId}/comments`).then((r) => r.json()),
        fetch(`${BASE}/api/events/${eventId}/winners`).then((r) => r.json()),
      ]);
      setEvent(ev);
      setComments(cm);
      setWinners(wn);
    } catch {}
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const submitComment = async () => {
    if (!user) return onRequireLogin();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content: comment }),
      });
      if (r.ok) {
        setComment("");
        const cm = await fetch(`${BASE}/api/events/${eventId}/comments`).then((r) => r.json());
        setComments(cm);
      } else { const err = await r.json(); alert(err.error); }
    } catch {}
    setSubmitting(false);
  };

  const submitWinner = async () => {
    if (!user) return onRequireLogin();
    try {
      const r = await fetch(`${BASE}/api/events/${eventId}/winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (r.ok) {
        const wn = await fetch(`${BASE}/api/events/${eventId}/winners`).then((r) => r.json());
        setWinners(wn);
      } else { alert(data.error); }
    } catch {}
  };

  const bc = { live: { bg: "#FEF2F2", color: "#B91C1C" }, soon: { bg: "#FFFBEB", color: "#92400E" }, ended: { bg: "#F3F4F6", color: "#9CA3AF" } };
  const bt = { live: "진행중", soon: "마감임박", ended: "종료" };

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>불러오는 중...</div>;
  if (!event) return <div style={{padding:"60px 20px",textAlign:"center"}}><p style={{fontSize:"40px",marginBottom:"8px"}}>🔍</p><p style={{color:"#999",fontSize:"14px"}}>이벤트를 찾을 수 없습니다</p></div>;

  const badge = bc[event.status] || bc.live;
  const conditions = Array.isArray(event.conditions) ? event.conditions : JSON.parse(event.conditions || "[]");

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={{ fontSize: "13px", color: "#999", background: "none", border: "none", cursor: "pointer", padding: "0 0 12px", display: "flex", alignItems: "center", gap: "4px" }}>← 목록으로</button>

      <a href={event.video_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "12px", overflow: "hidden", marginBottom: "16px", background: "#f3f4f6" }}>
        {event.thumbnail_url ? (
          <img src={event.thumbnail_url} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>🎁</div>
        )}
      </a>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111", lineHeight: "1.4", flex: 1, margin: 0 }}>{event.title}</h2>
        <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: "500", padding: "2px 8px", borderRadius: "999px", background: badge.bg, color: badge.color }}>{bt[event.status]}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        {event.channel_thumbnail && <img src={event.channel_thumbnail} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />}
        <span style={{ fontSize: "13px", color: "#666" }}>{event.channel_name}</span>
        {event.subscriber_count && <span style={{ fontSize: "11px", color: "#aaa" }}>구독자 {event.subscriber_count}</span>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
        {conditions.length > 0 && <span style={{ fontSize: "12px", color: "#888", background: "#f3f4f6", padding: "3px 10px", borderRadius: "6px" }}>{conditions.join(" + ")}</span>}
        {event.prize && <span style={{ fontSize: "12px", background: "#F0FDF4", color: "#15803D", padding: "3px 10px", borderRadius: "6px" }}>{event.prize}</span>}
        {event.dday && <span style={{ fontSize: "12px", fontWeight: "500", marginLeft: "auto", color: event.status === "soon" ? "#D97706" : "#aaa" }}>{event.dday}</span>}
      </div>

      <a href={event.video_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "10px", background: "#FF0000", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "500", marginBottom: "20px" }}>
        YouTube에서 참여하기 ▶
      </a>

      {/* ─── 당첨 인증 ─── */}
      <div style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600" }}>🎉 당첨 인증</span>
          <span style={{ fontSize: "12px", color: "#E84E3B", fontWeight: "500" }}>{winners.count}명 당첨</span>
        </div>
        <button onClick={submitWinner} style={{ width: "100%", padding: "10px", border: "1px dashed #ddd", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#666" }}>
          나도 당첨됐어요! 🎊
        </button>
        {winners.winners.length > 0 && (
          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {winners.winners.map((w, i) => (
              <span key={i} style={{ fontSize: "11px", background: "#FEF2F2", color: "#B91C1C", padding: "2px 8px", borderRadius: "999px" }}>🎉 {w.nickname}</span>
            ))}
          </div>
        )}
      </div>

      {/* ─── 댓글/후기 ─── */}
      <div style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: "16px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", display: "block" }}>💬 참여 후기 ({comments.length})</span>

        <div style={{ marginBottom: "16px" }}>
          {user ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="참여 후기를 남겨주세요" maxLength={500} rows={2} style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit" }} />
              <button onClick={submitComment} disabled={submitting} style={{ padding: "8px 16px", background: submitting ? "#ccc" : "#111", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: submitting ? "default" : "pointer", alignSelf: "flex-end", whiteSpace: "nowrap" }}>등록</button>
            </div>
          ) : (
            <button onClick={onRequireLogin} style={{ width: "100%", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "8px", background: "#f9fafb", cursor: "pointer", fontSize: "13px", color: "#aaa" }}>로그인하고 후기 남기기</button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {comments.length === 0 && <div style={{ fontSize: "13px", color: "#ccc", textAlign: "center", padding: "20px 0" }}>아직 후기가 없습니다. 첫 후기를 남겨보세요!</div>}
          {comments.map((c) => (
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
