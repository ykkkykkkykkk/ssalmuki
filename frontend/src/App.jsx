import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useEvents } from "./hooks/useEvents";
import { useAuth } from "./hooks/useAuth";
import { useRouter } from "./hooks/useRouter";
import { useToast } from "./hooks/useToast";
import EventCard from "./components/EventCard";
import FilterBar from "./components/FilterBar";
import ReportButton from "./components/ReportButton";
import WritePost from "./components/WritePost";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";
import NotificationBell from "./components/NotificationBell";
import AdvancedFilter from "./components/AdvancedFilter";

const EventDetail = lazy(() => import("./components/EventDetail"));
const Community = lazy(() => import("./components/Community"));
const PostDetail = lazy(() => import("./components/PostDetail"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const Profile = lazy(() => import("./components/Profile"));
const BookmarkList = lazy(() => import("./components/BookmarkList"));

const BASE = import.meta.env.VITE_API_URL || "";

const TABS = [
  { key: "home", label: "TODAY", emoji: "", path: "/" },
  { key: "community", label: "COMMUNITY", emoji: "", path: "/community" },
  { key: "bookmarks", label: "MY", emoji: "", path: "/bookmarks" },
];

export default function App() {
  const { events, stats, loading, error, filter, updateFilter, total, reload, refreshing } = useEvents();
  const auth = useAuth();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [popularPosts, setPopularPosts] = useState([]);

  const eventDetailMatch = router.match("/events/:id");
  const postDetailMatch = router.match("/community/:id");
  const isWriting = router.path === "/community/write";
  const isSearch = router.path === "/search";
  const profileMatch = router.match("/profile/:nickname");
  const isBookmarks = router.path === "/bookmarks";
  const isCommunity = router.path === "/community" || router.path.startsWith("/community");
  const tab = isBookmarks ? "bookmarks" : isCommunity ? "community" : "home";
  const isSubPage = !!eventDetailMatch || !!postDetailMatch || isWriting || isSearch || !!profileMatch;
  const showTabBar = !isSubPage;

  const goHome = () => router.push("/");
  const switchTab = (t) => {
    if (t === "home") router.push("/");
    else if (t === "bookmarks") { requireLogin(() => router.push("/bookmarks")); }
    else router.push("/community");
  };

  useEffect(() => { window.scrollTo(0, 0); }, [router.path]);

  useEffect(() => {
    fetch(`${BASE}/api/posts?limit=5&sort=popular`)
      .then(r => r.json())
      .then(data => setPopularPosts(data.posts || []))
      .catch(() => {});
  }, []);

  const requireLogin = (callback) => {
    if (auth.user) { callback(); return; }
    setShowAuth(true);
  };

  const todayStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const headlineEvent = events[0] || null;
  const sideEvents = events.slice(1, 4);
  const restEvents = events.slice(4);

  const timeAgo = useCallback((dateStr) => {
    const diff = Date.now() - new Date(dateStr + "Z").getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    return new Date(dateStr).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <div className="paper-wrap" style={{ background: "var(--color-bg)", minHeight: "100vh", paddingBottom: showTabBar ? "52px" : "0" }}>

        {/* ═══ 신문 헤더 ═══ */}
        <header style={{ padding: "16px 20px 0", textAlign: "center", borderBottom: "3px double var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>{todayStr}</span>
              {stats && <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>수집 {total}건</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {!isSearch && (
                <button onClick={() => router.push("/search")} aria-label="검색" style={{ fontSize: "13px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                  검색
                </button>
              )}
              {auth.user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <NotificationBell user={auth.user} authHeaders={auth.authHeaders} onNavigate={(link) => router.push(link)} />
                  <span onClick={() => router.push(`/profile/${auth.user.nickname}`)} style={{ cursor: "pointer", fontWeight: "500", color: "var(--color-text-secondary)" }}>{auth.user.nickname}</span>
                  <button onClick={auth.logout} style={{ fontSize: "11px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>로그아웃</button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} style={{ fontSize: "11px", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}>로그인</button>
              )}
            </div>
          </div>

          {/* 신문 제목 */}
          <div onClick={goHome} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goHome()} style={{ cursor: "pointer", padding: "12px 0 16px" }}>
            <h1 className="paper-header-title" style={{ fontFamily: "var(--font-serif)", fontWeight: "900", letterSpacing: "-1px", margin: 0, color: "var(--color-text)" }}>
              쌀먹일보
            </h1>
            <p className="paper-header-sub" style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px" }}>
              YOUTUBE EVENT COMMUNITY
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div style={{ display: "flex", justifyContent: "center", borderTop: "1px solid var(--color-border-light)" }}>
            {TABS.map((t, i) => (
              <button key={t.key} onClick={() => switchTab(t.key)}
                style={{
                  flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: tab === t.key ? "700" : "400",
                  letterSpacing: "2px", color: tab === t.key ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottom: tab === t.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                  borderRight: i < TABS.length - 1 ? "1px solid var(--color-border-light)" : "none",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* ═══ 검색 페이지 ═══ */}
        {isSearch && (
          <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>로딩 중...</div>}>
            <SearchPage onSelectEvent={(id) => router.push(`/events/${id}`)} onSelectPost={(id) => router.push(`/community/${id}`)} onBack={() => router.back()} />
          </Suspense>
        )}

        {/* ═══ 이벤트 탭 (신문 레이아웃) ═══ */}
        {tab === "home" && !eventDetailMatch && !isSearch && (
          <>
            {/* 필터 바 */}
            <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid var(--color-border-light)", background: "rgba(255,255,255,0.5)" }}>
              <div style={{ display: "flex", gap: "8px", flex: 1, overflowX: "auto" }}>
                <FilterBar filter={filter} onFilter={updateFilter} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => setShowAdvancedFilter(true)} style={{ fontSize: "11px", color: "var(--color-text-muted)", padding: "4px 8px", border: "1px solid var(--color-border)", borderRadius: "2px", background: "transparent", cursor: "pointer" }}>상세</button>
                <button onClick={reload} disabled={refreshing} style={{ fontSize: "11px", color: refreshing ? "#ccc" : "var(--color-text-muted)", padding: "4px 8px", border: "1px solid var(--color-border)", borderRadius: "2px", background: "transparent", cursor: refreshing ? "default" : "pointer" }}>
                  {refreshing ? "수집중..." : "새로고침"}
                </button>
              </div>
            </div>

            {/* 통계 */}
            {stats && (
              <div style={{ display: "flex", gap: "16px", padding: "8px 20px", fontSize: "11px", borderBottom: "1px solid var(--color-border-light)" }}>
                <span><strong style={{ color: "var(--color-primary)" }}>{stats.live_count ?? 0}</strong> 진행중</span>
                <span><strong style={{ color: "#B45309" }}>{stats.soon_count ?? 0}</strong> 마감임박</span>
                <span style={{ marginLeft: "auto", color: "var(--color-text-muted)" }}>총 {total}건</span>
              </div>
            )}

            {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)", fontFamily: "var(--font-serif)" }}>기사를 불러오는 중...</div>}
            {error && <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>{error}</div>}

            {!loading && !error && events.length === 0 && (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--color-text-muted)" }}>등록된 이벤트가 없습니다</p>
              </div>
            )}

            {!loading && !error && events.length > 0 && (
              <div className="paper-body">
                {/* ── 메인 콘텐츠 영역 ── */}
                <div className="paper-main">

                  {/* 헤드라인 이벤트 */}
                  {headlineEvent && (
                    <article
                      onClick={() => router.push(`/events/${headlineEvent.id}`)}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/events/${headlineEvent.id}`)}
                      style={{ cursor: "pointer", marginBottom: "24px", paddingBottom: "24px", borderBottom: "2px solid var(--color-border)" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{
                          fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: "700", letterSpacing: "1px",
                          color: headlineEvent.status === "live" ? "var(--color-primary)" : headlineEvent.status === "soon" ? "#B45309" : "#999",
                        }}>
                          {headlineEvent.status === "live" ? "BREAKING" : headlineEvent.status === "soon" ? "DEADLINE" : "CLOSED"}
                        </span>
                        {headlineEvent.dday && (
                          <span style={{ fontSize: "11px", fontWeight: "600", marginLeft: "8px", color: headlineEvent.status === "soon" ? "#B45309" : "var(--color-text-muted)" }}>{headlineEvent.dday}</span>
                        )}
                      </div>
                      <h2 className="headline-title" style={{ fontFamily: "var(--font-serif)", fontWeight: "900", lineHeight: "1.3", margin: "0 0 12px", color: "var(--color-text)" }}>
                        {headlineEvent.title}
                      </h2>
                      {headlineEvent.thumbnail_url && (
                        <div className="headline-thumb" style={{ width: "100%", borderRadius: "2px", overflow: "hidden", marginBottom: "12px", background: "#e8e0d0" }}>
                          <img src={headlineEvent.thumbnail_url} alt={headlineEvent.title} loading="eager" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
                        <span style={{ fontWeight: "600", color: "var(--color-text-secondary)" }}>{headlineEvent.channel_name}</span>
                        {headlineEvent.subscriber_count && <span>{headlineEvent.subscriber_count}</span>}
                        {headlineEvent.view_count > 0 && <span>조회 {(headlineEvent.view_count / 10000).toFixed(1)}만</span>}
                      </div>
                      <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {headlineEvent.prize && (
                          <span style={{ fontSize: "12px", fontFamily: "var(--font-sans)", fontWeight: "600", color: "var(--color-accent)", background: "#fef2f2", padding: "3px 10px", borderRadius: "2px" }}>
                            {headlineEvent.prize}
                          </span>
                        )}
                        {Array.isArray(headlineEvent.conditions) && headlineEvent.conditions.map((c, i) => (
                          <span key={i} style={{ fontSize: "11px", color: "var(--color-text-muted)", padding: "2px 8px", border: "1px solid var(--color-border-light)", borderRadius: "2px" }}>{c}</span>
                        ))}
                      </div>
                    </article>
                  )}

                  {/* 사이드 이벤트 그리드 */}
                  {sideEvents.length > 0 && (
                    <div className="side-grid" style={{ marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid var(--color-border-light)" }}>
                      {sideEvents.map((ev) => (
                        <article key={ev.id} onClick={() => router.push(`/events/${ev.id}`)} role="button" tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/events/${ev.id}`)}
                          style={{ cursor: "pointer" }}>
                          {ev.thumbnail_url && (
                            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "2px", overflow: "hidden", marginBottom: "8px", background: "#e8e0d0" }}>
                              <img src={ev.thumbnail_url} alt={ev.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                          <span style={{
                            fontSize: "9px", fontWeight: "700", letterSpacing: "0.5px",
                            color: ev.status === "live" ? "var(--color-primary)" : ev.status === "soon" ? "#B45309" : "#999",
                          }}>
                            {ev.status === "live" ? "LIVE" : ev.status === "soon" ? "D-DAY" : "END"}
                          </span>
                          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "13px", fontWeight: "700", lineHeight: "1.3", margin: "4px 0", color: "var(--color-text)" }}>
                            {ev.title.length > 30 ? ev.title.slice(0, 30) + "..." : ev.title}
                          </h3>
                          <p style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{ev.channel_name}</p>
                          {ev.prize && <p style={{ fontSize: "10px", color: "var(--color-accent)", fontWeight: "600", marginTop: "4px" }}>{ev.prize.length > 15 ? ev.prize.slice(0, 15) + "..." : ev.prize}</p>}
                        </article>
                      ))}
                    </div>
                  )}

                  {/* 나머지 이벤트 */}
                  {restEvents.length > 0 && (
                    <section>
                      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: "700", marginBottom: "14px", paddingBottom: "10px", borderBottom: "2px solid var(--color-text)" }}>
                        더 많은 이벤트
                      </h2>
                      <div className="rest-grid">
                        {restEvents.map((ev, i) => (
                          <article key={ev.id} onClick={() => router.push(`/events/${ev.id}`)} role="button" tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && router.push(`/events/${ev.id}`)}
                            style={{
                              display: "flex", gap: "16px", padding: "16px 0", cursor: "pointer",
                              borderBottom: "1px solid var(--color-border-light)",
                            }}>
                            {ev.thumbnail_url && (
                              <div style={{ flexShrink: 0, width: "100px", height: "66px", borderRadius: "2px", overflow: "hidden", background: "#e8e0d0" }}>
                                <img src={ev.thumbnail_url} alt={ev.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <span style={{
                                  fontSize: "9px", fontWeight: "700", letterSpacing: "0.5px",
                                  color: ev.status === "live" ? "var(--color-primary)" : ev.status === "soon" ? "#B45309" : "#999",
                                }}>
                                  {ev.status === "live" ? "LIVE" : ev.status === "soon" ? "SOON" : "END"}
                                </span>
                                {ev.dday && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{ev.dday}</span>}
                              </div>
                              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontWeight: "700", lineHeight: "1.3", margin: "0 0 4px", color: "var(--color-text)" }}>
                                {ev.title.length > 40 ? ev.title.slice(0, 40) + "..." : ev.title}
                              </h3>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                                <span>{ev.channel_name}</span>
                                {ev.prize && <span style={{ color: "var(--color-accent)", fontWeight: "500" }}>{ev.prize.length > 15 ? ev.prize.slice(0, 15) + "..." : ev.prize}</span>}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* ── 사이드바 (커뮤니티 인기글) ── */}
                {popularPosts.length > 0 && (
                  <aside className="paper-sidebar">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: "700", margin: 0 }}>
                        커뮤니티 인기글
                      </h2>
                      <button onClick={() => router.push("/community")} style={{ fontSize: "11px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                        더보기 &rsaquo;
                      </button>
                    </div>
                    {popularPosts.slice(0, 5).map((p, i) => (
                      <div key={p.id} onClick={() => router.push(`/community/${p.id}`)}
                        style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: i < 4 ? "1px solid var(--color-border-light)" : "none", cursor: "pointer" }}>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: "900", color: i < 3 ? "var(--color-primary)" : "var(--color-border)", width: "24px", textAlign: "center", flexShrink: 0, lineHeight: "1" }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--color-text)", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</p>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                            <span>{p.nickname}</span>
                            <span style={{ margin: "0 4px" }}>&middot;</span>
                            <span>{timeAgo(p.created_at)}</span>
                            <span style={{ margin: "0 4px" }}>&middot;</span>
                            <span>좋아요 {p.likes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </aside>
                )}
              </div>
            )}
          </>
        )}

        {/* 이벤트 디테일 */}
        {eventDetailMatch && (
          <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>로딩 중...</div>}>
            <EventDetail eventId={eventDetailMatch.id} onBack={() => router.back()} user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />
          </Suspense>
        )}

        {/* ═══ 커뮤니티 탭 ═══ */}
        {tab === "community" && !postDetailMatch && !isWriting && !isSearch && (
          <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>로딩 중...</div>}>
            <Community onSelectPost={(id) => router.push(`/community/${id}`)} onWrite={() => requireLogin(() => router.push("/community/write"))} />
          </Suspense>
        )}
        {postDetailMatch && postDetailMatch.id !== "write" && (
          <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>로딩 중...</div>}>
            <PostDetail postId={postDetailMatch.id} onBack={() => router.back()} user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} onDeleted={() => { router.replace("/community"); showToast("글이 삭제되었습니다"); }} />
          </Suspense>
        )}
        {isWriting && (
          <WritePost onBack={() => router.back()} onDone={() => { router.replace("/community"); showToast("글이 작성되었습니다"); }} user={auth.user} authHeaders={auth.authHeaders} />
        )}

        {/* 프로필 */}
        {profileMatch && (
          <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>로딩 중...</div>}>
            <Profile nickname={profileMatch.nickname} onBack={() => router.back()} onSelectPost={(id) => router.push(`/community/${id}`)} currentUser={auth.user} />
          </Suspense>
        )}

        {/* 북마크 */}
        {isBookmarks && (
          <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>로딩 중...</div>}>
            <BookmarkList user={auth.user} authHeaders={auth.authHeaders} onSelectEvent={(id) => router.push(`/events/${id}`)} onBack={() => router.back()} onRequireLogin={() => setShowAuth(true)} />
          </Suspense>
        )}

        {/* 하단 푸터 */}
        {tab === "home" && !isSubPage && !loading && events.length > 0 && (
          <footer style={{ padding: "24px 20px", borderTop: "3px double var(--color-border)", textAlign: "center", marginTop: "20px" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: "700", color: "var(--color-text-muted)" }}>쌀먹일보</p>
            <p style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>유튜버 구독자 이벤트 커뮤니티</p>
          </footer>
        )}
      </div>

      {/* ═══ 하단 탭바 ═══ */}
      {showTabBar && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--color-bg)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "center", zIndex: 200 }}>
          <div className="tab-bar-wrap" style={{ display: "flex", width: "100%" }}>
            {TABS.map((t, i) => (
              <button key={t.key} aria-current={tab === t.key ? "page" : undefined} onClick={() => switchTab(t.key)}
                style={{
                  flex: 1, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: tab === t.key ? "700" : "400",
                  letterSpacing: "1.5px", color: tab === t.key ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderRight: i < TABS.length - 1 ? "1px solid var(--color-border-light)" : "none",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "home" && showTabBar && !isSearch && <ReportButton user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={() => {}} authFns={auth} />}

      {showAdvancedFilter && (
        <AdvancedFilter
          onApply={(filters) => { updateFilter(filters); setShowAdvancedFilter(false); }}
          onClose={() => setShowAdvancedFilter(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
