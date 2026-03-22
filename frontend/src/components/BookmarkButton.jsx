import { useState, useEffect } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export default function BookmarkButton({ eventId, user, authHeaders, onRequireLogin }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !eventId) return;
    fetch(`${BASE}/api/events/${eventId}/bookmark-status`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : { bookmarked: false })
      .then((d) => setBookmarked(d.bookmarked))
      .catch(() => {});
  }, [eventId, user, authHeaders]);

  const toggle = async () => {
    if (!user) return onRequireLogin?.();
    if (loading) return;
    setLoading(true);
    try {
      if (bookmarked) {
        await fetch(`${BASE}/api/bookmarks/${eventId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        setBookmarked(false);
      } else {
        await fetch(`${BASE}/api/bookmarks`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ event_id: eventId }),
        });
        setBookmarked(true);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      disabled={loading}
      style={{
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: loading ? "default" : "pointer",
        padding: "4px",
        lineHeight: 1,
        opacity: loading ? 0.5 : 1,
      }}
      title={bookmarked ? "북마크 해제" : "북마크"}
    >
      {bookmarked ? "★" : "☆"}
    </button>
  );
}
