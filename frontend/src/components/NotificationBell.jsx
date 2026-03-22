import { useState, useEffect, useRef } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export default function NotificationBell({ user, authHeaders, onNavigate }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // 읽지 않은 알림 수 폴링
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      fetch(`${BASE}/api/notifications/unread-count`, { headers: authHeaders() })
        .then((r) => r.ok ? r.json() : { count: 0 })
        .then((d) => setCount(d.count ?? 0))
        .catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [user, authHeaders]);

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/notifications`, { headers: authHeaders() });
      if (r.ok) setNotifications(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleToggle = () => {
    if (!open) loadNotifications();
    setOpen(!open);
  };

  const markAllRead = async () => {
    try {
      await fetch(`${BASE}/api/notifications/read-all`, { method: "PUT", headers: authHeaders() });
      setCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleClick = (n) => {
    setOpen(false);
    if (n.link) onNavigate?.(n.link);
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        aria-label="알림"
        style={{
          background: "none",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
          padding: "4px",
          position: "relative",
          lineHeight: 1,
        }}
      >
        🔔
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "-2px",
              background: "#EF4444",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "700",
              minWidth: "16px",
              height: "16px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "36px",
            right: 0,
            width: "300px",
            maxHeight: "400px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            zIndex: 500,
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>알림</span>
            <button onClick={markAllRead} aria-label="모든 알림 읽음 처리" style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", cursor: "pointer", padding: 0 }}>
              모두 읽음
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: "13px" }}>로딩 중...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: "13px" }}>알림이 없습니다.</div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id || i}
                onClick={() => handleClick(n)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f5f5f5",
                  cursor: n.link ? "pointer" : "default",
                  background: n.read ? "#fff" : "#F0F9FF",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "#fff" : "#F0F9FF")}
              >
                <p style={{ margin: 0, fontSize: "13px", color: "#333", lineHeight: 1.4 }}>{n.message}</p>
                {n.created_at && (
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#bbb" }}>
                    {new Date(n.created_at).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
