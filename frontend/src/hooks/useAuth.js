import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "ssalmuk_token";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem(TOKEN_KEY);

  const authHeaders = useCallback(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  // 앱 시작 시 토큰 검증
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) { setLoading(false); return; }
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((u) => setUser(u))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); })
      .finally(() => setLoading(false));
  }, []);

  const signup = async (nickname, password) => {
    const r = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (nickname, password) => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return { user, loading, signup, login, logout, authHeaders };
}
