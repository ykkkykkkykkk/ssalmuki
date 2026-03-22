const bar = (w, h) => ({
  width: w,
  height: h,
  borderRadius: "4px",
  background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
  backgroundSize: "200% 100%",
  animation: "skeletonPulse 1.5s ease-in-out infinite",
});

const skeletonStyle = `@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;

export function EventCardSkeleton() {
  return (
    <div style={{ display: "flex", gap: "12px", padding: "14px", background: "#fff", border: "0.5px solid #f0f0f0", borderRadius: "12px" }}>
      <div style={{ ...bar("96px", "64px"), borderRadius: "8px", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
        <div style={bar("80%", "14px")} />
        <div style={bar("50%", "12px")} />
        <div style={bar("35%", "11px")} />
      </div>
      <style>{skeletonStyle}</style>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={bar("60px", "10px")} />
        <div style={bar("90%", "14px")} />
        <div style={bar("40%", "11px")} />
      </div>
      <style>{skeletonStyle}</style>
    </div>
  );
}

export default function Skeleton({ lines = 3, style }) {
  return (
    <div style={{ padding: "16px", ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...bar(i === lines - 1 ? "60%" : "100%", "14px"),
            marginBottom: i < lines - 1 ? "12px" : 0,
          }}
        />
      ))}
      <style>{skeletonStyle}</style>
    </div>
  );
}
