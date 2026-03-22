import { useState, useEffect, useCallback } from "react";

export function useRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const push = useCallback((to) => {
    window.history.pushState(null, "", to);
    setPath(to);
  }, []);

  const replace = useCallback((to) => {
    window.history.replaceState(null, "", to);
    setPath(to);
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  // 경로 파싱
  const match = useCallback((pattern) => {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }, [path]);

  return { path, push, replace, back, match };
}
