import { useState } from "react";

export default function AuthModal({ onClose, onAuth, authFns }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [nick, setNick] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    if (!nick.trim() || !pw) return setError("닉네임과 비밀번호를 입력해주세요");
    if (mode === "signup" && pw !== pwConfirm) return setError("비밀번호가 일치하지 않습니다");
    if (mode === "signup" && pw.length < 4) return setError("비밀번호는 4자 이상이어야 합니다");
    setSubmitting(true);
    try {
      const fn = mode === "signup" ? authFns.signup : authFns.login;
      await fn(nick.trim(), pw);
      onAuth();
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: "380px", background: "#fff", borderRadius: "16px", padding: "28px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        {/* 탭 */}
        <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "1px solid #f0f0f0" }}>
          {[["login", "로그인"], ["signup", "회원가입"]].map(([key, label]) => (
            <button key={key} onClick={() => { setMode(key); setError(""); }}
              style={{ flex: 1, padding: "10px", background: "none", border: "none", cursor: "pointer",
                fontSize: "14px", fontWeight: mode === key ? "600" : "400",
                color: mode === key ? "#E84E3B" : "#aaa",
                borderBottom: mode === key ? "2px solid #E84E3B" : "2px solid transparent",
                marginBottom: "-1px" }}>
              {label}
            </button>
          ))}
        </div>

        {/* 입력 */}
        <input value={nick} onChange={(e) => setNick(e.target.value)} onKeyDown={handleKey}
          placeholder="닉네임" maxLength={20} autoFocus
          style={{ width: "100%", padding: "12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", marginBottom: "10px", outline: "none", boxSizing: "border-box" }} />
        <input value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={handleKey}
          type="password" placeholder="비밀번호"
          style={{ width: "100%", padding: "12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", marginBottom: mode === "signup" ? "10px" : "0", outline: "none", boxSizing: "border-box" }} />
        {mode === "signup" && (
          <input value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} onKeyDown={handleKey}
            type="password" placeholder="비밀번호 확인"
            style={{ width: "100%", padding: "12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        )}

        {error && <p style={{ fontSize: "12px", color: "#E84E3B", margin: "10px 0 0", textAlign: "center" }}>{error}</p>}

        <button onClick={submit} disabled={submitting}
          style={{ width: "100%", padding: "12px", marginTop: "16px", background: submitting ? "#ccc" : "#E84E3B", color: "#fff",
            border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: submitting ? "default" : "pointer" }}>
          {submitting ? "..." : mode === "signup" ? "가입하기" : "로그인"}
        </button>

        <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", marginTop: "12px", marginBottom: 0 }}>
          {mode === "login" ? "계정이 없으신가요? 위의 회원가입 탭을 눌러주세요" : "닉네임 + 비밀번호만 있으면 OK!"}
        </p>
      </div>
    </div>
  );
}
