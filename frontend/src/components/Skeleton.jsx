export default function Skeleton({ lines = 3, style }) {
  return (
    <div style={{ padding: "16px", ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "14px",
            borderRadius: "4px",
            marginBottom: i < lines - 1 ? "12px" : 0,
            width: i === lines - 1 ? "60%" : "100%",
            background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "skeletonPulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
