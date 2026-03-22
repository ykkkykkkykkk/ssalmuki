import { useState, useEffect, useCallback } from "react";
import EventCard from "./EventCard";

const BASE = import.meta.env.VITE_API_URL || "";

export default function BookmarkList({ user, authHeaders, onSelectEvent, onBack, onRequireLogin }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/bookmarks`, { headers: authHeaders() });
      const d = r.ok ? await r.json() : [];
      setBookmarks(Array.isArray(d) ? d : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [user, authHeaders]);

  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  const remove = async (eventId) => {
    try {
      const r = await fetch(`${BASE}/api/bookmarks/${eventId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (r.ok) setBookmarks((prev) => prev.filter((b) => b.id !== eventId && b.event_id !== eventId));
    } catch { /* ignore */ }
  };

  if (!user) {
    onRequireLogin?.();
    return null;
  }

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>북마크</h2>
      </div>

      <div style={{ padding: "12px 20px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: "14px", padding: "40px 0" }}>로딩 중...</p>
        ) : bookmarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
            <p style={{ fontSize: "32px", marginBottom: "8px" }}>☆</p>
            <p style={{ fontSize: "14px", margin: 0 }}>북마크한 이벤트가 없습니다.</p>
            <p style={{ fontSize: "12px", margin: "4px 0 0", color: "#bbb" }}>관심있는 이벤트를 북마크해보세요!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {bookmarks.map((b) => {
              const event = b.event || b;
              return (
                <div key={event.id || b.event_id} style={{ position: "relative" }}>
                  <EventCard event={event} onSelect={onSelectEvent} />
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(event.id || b.event_id); }}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      color: "#999",
                    }}
                    title="북마크 해제"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
