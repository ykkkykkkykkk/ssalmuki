export function PrimaryButton({ children, onClick, disabled, style, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: "13px",
        color: "#fff",
        padding: "8px 16px",
        border: "none",
        borderRadius: "8px",
        background: disabled ? "#ccc" : "var(--color-primary, #E84E3B)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "500",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.15s ease, opacity 0.15s ease",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, style, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: "13px",
        color: "var(--color-text-secondary, #666)",
        padding: "8px 16px",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        background: "var(--color-card, #fff)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "500",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.15s ease, opacity 0.15s ease",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = "#666", bg = "#f3f4f6", style }) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: "600",
        color,
        background: bg,
        padding: "2px 8px",
        borderRadius: "999px",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
