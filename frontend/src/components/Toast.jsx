import { useEffect, useState } from "react";

const COLORS = { success: "#10B981", error: "#EF4444", info: "#3B82F6" };

export default function Toast({ message, type = "info", onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = COLORS[type] || COLORS.info;

  return (
    <div
      style={{
        position: "fixed",
        top: visible ? "20px" : "-80px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "560px",
        background: bg,
        color: "#fff",
        padding: "14px 20px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        zIndex: 9999,
        transition: "top 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 300); }}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "16px",
          cursor: "pointer",
          marginLeft: "12px",
          padding: 0,
          lineHeight: 1,
          opacity: 0.8,
        }}
      >
        ✕
      </button>
    </div>
  );
}
