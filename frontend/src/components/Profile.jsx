import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export default function Profile({ nickname, onBack, onSelectPost, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMe = currentUser?.nickname === nickname;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [p, ps] = await Promise.all([
        fetch(`${BASE}/api/users/${encodeURIComponent(nickname)}`).then((r) => r.ok ? r.json() : null),
        fetch(`${BASE}/api/users/${encodeURIComponent(nickname)}/posts`).then((r) => r.ok ? r.json() : []),
      ]);
      setProfile(p);
      setPosts(Array.isArray(ps) ? ps : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [nickname]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (loading) return <div style={{ padding: "40px 20px", textAlign: "center", color: "#999", fontSize: "14px" }}>로딩 중...</div>;
  if (!profile) return <div style={{ padding: "40px 20px", textAlign: "center", color: "#999", fontSize: "14px" }}>프로필을 불러올 수 없습니다.</div>;

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
          {isMe ? "내 프로필" : `${nickname}의 프로필`}
        </h2>
      </div>

      {/* 프로필 정보 */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
            👤
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#111" }}>{profile.nickname}</p>
            {profile.created_at && (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#999" }}>
                가입일: {new Date(profile.created_at).toLocaleDateString("ko-KR")}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#111" }}>{profile.post_count ?? 0}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#999" }}>작성글</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#111" }}>{profile.comment_count ?? 0}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#999" }}>댓글</p>
          </div>
        </div>
      </div>

      {/* 작성 글 목록 */}
      <div style={{ padding: "16px 20px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "600", color: "#333" }}>작성한 글</h3>
        {posts.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#999", textAlign: "center", padding: "24px 0" }}>작성한 글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost?.(post.id)}
              style={{ padding: "12px 0", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {post.category && <span style={{ fontSize: "11px", color: "#999", marginBottom: "2px", display: "block" }}>{post.category}</span>}
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#111" }}>{post.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#bbb" }}>
                {post.created_at && new Date(post.created_at).toLocaleDateString("ko-KR")}
                {post.comment_count > 0 && <span> · 댓글 {post.comment_count}</span>}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
