import { useState } from "react";

const SUBS_PRESETS = [
  { label: "1만 이하", min: 0, max: 10000 },
  { label: "1~10만", min: 10000, max: 100000 },
  { label: "10~100만", min: 100000, max: 1000000 },
  { label: "100만 이상", min: 1000000, max: "" },
];

export default function AdvancedFilter({ onApply, onClose }) {
  const [q, setQ] = useState("");
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [channel, setChannel] = useState("");

  const selectPreset = (p) => {
    setMinSubs(p.min);
    setMaxSubs(p.max);
  };

  const handleApply = () => {
    const filters = {};
    if (q.trim()) filters.q = q.trim();
    if (minSubs !== "") filters.min_subs = Number(minSubs);
    if (maxSubs !== "") filters.max_subs = Number(maxSubs);
    if (deadlineFrom) filters.deadline_from = deadlineFrom;
    if (deadlineTo) filters.deadline_to = deadlineTo;
    if (channel.trim()) filters.channel = channel.trim();
    onApply?.(filters);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: "500",
    color: "#333",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          padding: "24px 20px",
          paddingBottom: "32px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>상세 검색</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#999" }}>✕</button>
        </div>

        {/* 검색어 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>검색어</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이벤트 제목, 내용 검색" style={inputStyle} />
        </div>

        {/* 구독자 수 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>구독자 수</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {SUBS_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => selectPreset(p)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: minSubs === p.min && maxSubs === p.max ? "#3B82F6" : "#e0e0e0",
                  background: minSubs === p.min && maxSubs === p.max ? "#EFF6FF" : "#fff",
                  color: minSubs === p.min && maxSubs === p.max ? "#3B82F6" : "#555",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="number" value={minSubs} onChange={(e) => setMinSubs(e.target.value)} placeholder="최소" style={{ ...inputStyle, flex: 1 }} />
            <span style={{ color: "#999", fontSize: "13px" }}>~</span>
            <input type="number" value={maxSubs} onChange={(e) => setMaxSubs(e.target.value)} placeholder="최대" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>

        {/* 마감일 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>마감일 범위</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="date" value={deadlineFrom} onChange={(e) => setDeadlineFrom(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <span style={{ color: "#999", fontSize: "13px" }}>~</span>
            <input type="date" value={deadlineTo} onChange={(e) => setDeadlineTo(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>

        {/* 채널명 */}
        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>채널명</label>
          <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="채널 이름" style={inputStyle} />
        </div>

        {/* 적용 버튼 */}
        <button
          onClick={handleApply}
          style={{
            width: "100%",
            padding: "12px",
            background: "#E84E3B",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          적용
        </button>
      </div>
    </div>
  );
}
