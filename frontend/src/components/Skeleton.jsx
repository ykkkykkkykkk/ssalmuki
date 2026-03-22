import { useState, useEffect } from "react";

function usePulse() {
  const [opacity, setOpacity] = useState(0.4);
  useEffect(() => {
    let rising = true;
    const id = setInterval(() => {
      setOpacity((prev) => {
        if (rising && prev >= 1) { rising = false; }
        if (!rising && prev <= 0.4) { rising = true; }
        return rising ? prev + 0.06 : prev - 0.06;
      });
    }, 50);
    return () => clearInterval(id);
  }, []);
  return opacity;
}

const bar = (w, h, opacity) => ({
  width: w,
  height: h,
  borderRadius: "4px",
  background: "#e5e7eb",
  opacity,
});

export function EventCardSkeleton() {
  const op = usePulse();
  return (
    <div style={{ display: "flex", gap: "12px", padding: "14px", background: "#fff", border: "0.5px solid #f0f0f0", borderRadius: "12px" }}>
      <div style={{ ...bar("96px", "64px", op), borderRadius: "8px", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
        <div style={bar("80%", "14px", op)} />
        <div style={bar("50%", "12px", op)} />
        <div style={bar("35%", "11px", op)} />
      </div>
    </div>
  );
}

export function PostSkeleton() {
  const op = usePulse();
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={bar("60px", "10px", op)} />
        <div style={bar("90%", "14px", op)} />
        <div style={bar("40%", "11px", op)} />
      </div>
    </div>
  );
}
