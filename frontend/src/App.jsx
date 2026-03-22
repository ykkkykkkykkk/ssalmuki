import { useState, useEffect } from "react";
import { useEvents } from "./hooks/useEvents";
import { useAuth } from "./hooks/useAuth";
import { useRouter } from "./hooks/useRouter";
import { useToast } from "./hooks/useToast";
import EventCard from "./components/EventCard";
import FilterBar from "./components/FilterBar";
import EventDetail from "./components/EventDetail";
import ReportButton from "./components/ReportButton";
import Community from "./components/Community";
import PostDetail from "./components/PostDetail";
import WritePost from "./components/WritePost";
import AuthModal from "./components/AuthModal";
import SearchPage from "./components/SearchPage";
import Toast from "./components/Toast";
import Profile from "./components/Profile";
import BookmarkList from "./components/BookmarkList";
import NotificationBell from "./components/NotificationBell";
import AdvancedFilter from "./components/AdvancedFilter";

const TABS = [
  { key: "home", label: "이벤트", emoji: "🎁", path: "/" },
  { key: "community", label: "커뮤니티", emoji: "💬", path: "/community" },
  { key: "bookmarks", label: "저장", emoji: "⭐", path: "/bookmarks" },
];

export default function App() {
  const { events, stats, loading, error, filter, updateFilter, total, reload, refreshing } = useEvents();
  const auth = useAuth();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // 라우트 파싱
  const eventDetailMatch = router.match("/events/:id");
  const postDetailMatch = router.match("/community/:id");
  const isWriting = router.path === "/community/write";
  const isSearch = router.path === "/search";
  const profileMatch = router.match("/profile/:nickname");
  const isBookmarks = router.path === "/bookmarks";
  const isCommunity = router.path === "/community" || router.path.startsWith("/community");
  const _isHome = router.path === "/" || router.path.startsWith("/events");

  // 현재 탭
  const tab = isBookmarks ? "bookmarks" : isCommunity ? "community" : "home";

  // 서브페이지 여부
  const isSubPage = !!eventDetailMatch || !!postDetailMatch || isWriting || isSearch || !!profileMatch;

  const lastUpdated = stats?.last_updated ? new Date(stats.last_updated).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : null;

  const goHome = () => router.push("/");
  const switchTab = (t) => {
    if (t === "home") router.push("/");
    else if (t === "bookmarks") { requireLogin(() => router.push("/bookmarks")); }
    else router.push("/community");
  };

  useEffect(() => { window.scrollTo(0, 0); }, [router.path]);

  const showTabBar = !isSubPage;

  const requireLogin = (callback) => {
    if (auth.user) { callback(); return; }
    setShowAuth(true);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <div style={{maxWidth:"560px",margin:"0 auto",background:"#fff",minHeight:"100vh",paddingBottom: showTabBar ? "56px" : "0"}}>

        {/* --- 헤더 --- */}
        <header style={{padding:"20px 16px 12px",borderBottom:"0.5px solid #f0f0f0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div onClick={goHome} style={{cursor:"pointer"}}>
              <h1 style={{fontSize:"20px",fontWeight:"600",margin:0}}><span style={{color:"#E84E3B"}}>쌀</span>먹이</h1>
              <p style={{fontSize:"12px",color:"#999",marginTop:"2px"}}>유튜버 구독자 이벤트 · 커뮤니티</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              {/* 검색 버튼 */}
              {!isSearch && (
                <button onClick={() => router.push("/search")} style={{fontSize:"16px",padding:"4px 8px",border:"0.5px solid #e0e0e0",borderRadius:"6px",background:"#fff",cursor:"pointer",lineHeight:1}}>🔍</button>
              )}
              {tab === "home" && !eventDetailMatch && !isSearch && (
                <button onClick={reload} disabled={refreshing} style={{fontSize:"12px",color: refreshing ? "#ccc" : "#999",padding:"4px 10px",border:"0.5px solid #e0e0e0",borderRadius:"6px",background:"#fff",cursor: refreshing ? "default" : "pointer"}}>{refreshing ? "수집중..." : "새로고침"}</button>
              )}
              {auth.user ? (
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <NotificationBell user={auth.user} authHeaders={auth.authHeaders} onNavigate={(link) => router.push(link)} />
                  <span onClick={() => router.push(`/profile/${auth.user.nickname}`)} style={{fontSize:"12px",fontWeight:"500",color:"#333",cursor:"pointer"}}>{auth.user.nickname}</span>
                  <button onClick={auth.logout} style={{fontSize:"11px",color:"#aaa",background:"none",border:"none",cursor:"pointer",padding:"0"}}>로그아웃</button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} style={{fontSize:"12px",color:"#fff",padding:"5px 12px",border:"none",borderRadius:"6px",background:"#E84E3B",cursor:"pointer",fontWeight:"500"}}>로그인</button>
              )}
            </div>
          </div>
          {tab === "home" && !eventDetailMatch && !isSearch && stats && (
            <div style={{display:"flex",gap:"16px",marginTop:"10px"}}>
              <div style={{fontSize:"12px"}}><span style={{color:"#E84E3B",fontWeight:"500"}}>{stats.live_count??0}</span><span style={{color:"#999",marginLeft:"4px"}}>진행중</span></div>
              <div style={{fontSize:"12px"}}><span style={{color:"#D97706",fontWeight:"500"}}>{stats.soon_count??0}</span><span style={{color:"#999",marginLeft:"4px"}}>마감임박</span></div>
              {lastUpdated&&<div style={{fontSize:"11px",color:"#ccc",marginLeft:"auto"}}>{lastUpdated} 업데이트</div>}
            </div>
          )}
        </header>

        {/* --- 검색 페이지 --- */}
        {isSearch && (
          <SearchPage
            onSelectEvent={(id) => router.push(`/events/${id}`)}
            onSelectPost={(id) => router.push(`/community/${id}`)}
            onBack={() => router.back()}
          />
        )}

        {/* --- 이벤트 탭 --- */}
        {tab === "home" && !eventDetailMatch && !isSearch && (
          <>
            <div style={{display:"flex",alignItems:"center"}}>
              <div style={{flex:1}}><FilterBar filter={filter} onFilter={updateFilter} /></div>
              <button onClick={() => setShowAdvancedFilter(true)} style={{fontSize:"12px",color:"#555",padding:"5px 10px",border:"0.5px solid #e0e0e0",borderRadius:"6px",background:"#fff",cursor:"pointer",marginRight:"16px",whiteSpace:"nowrap",flexShrink:0}}>상세</button>
            </div>
            <div style={{padding:"6px 16px",fontSize:"12px",color:"#aaa"}}>이벤트 <span style={{fontWeight:"500",color:"#555"}}>{total}</span>개</div>
            <main style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:"8px"}}>
              {loading && <div style={{textAlign:"center",padding:"60px 0",color:"#ccc"}}>불러오는 중...</div>}
              {error && <div style={{textAlign:"center",padding:"60px 0",color:"#aaa"}}>{error}</div>}
              {!loading&&!error&&events.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#ccc"}}>이벤트가 없습니다</div>}
              {!loading&&events.map((e)=><EventCard key={e.id||e.video_id} event={e} onSelect={(id) => router.push(`/events/${id}`)}/>)}
            </main>
          </>
        )}
        {eventDetailMatch && (
          <EventDetail eventId={eventDetailMatch.id} onBack={() => router.back()} user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />
        )}

        {/* --- 커뮤니티 탭 --- */}
        {tab === "community" && !postDetailMatch && !isWriting && !isSearch && (
          <Community onSelectPost={(id) => router.push(`/community/${id}`)} onWrite={() => requireLogin(() => router.push("/community/write"))} />
        )}
        {postDetailMatch && postDetailMatch.id !== "write" && (
          <PostDetail postId={postDetailMatch.id} onBack={() => router.back()} user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} onDeleted={() => { router.replace("/community"); showToast("글이 삭제되었습니다"); }} />
        )}
        {isWriting && (
          <WritePost onBack={() => router.back()} onDone={() => { router.replace("/community"); showToast("글이 작성되었습니다"); }} user={auth.user} authHeaders={auth.authHeaders} />
        )}

        {/* --- 프로필 --- */}
        {profileMatch && (
          <Profile nickname={profileMatch.nickname} onBack={() => router.back()} onSelectPost={(id) => router.push(`/community/${id}`)} currentUser={auth.user} />
        )}

        {/* --- 북마크 --- */}
        {isBookmarks && (
          <BookmarkList user={auth.user} authHeaders={auth.authHeaders} onSelectEvent={(id) => router.push(`/events/${id}`)} onBack={() => router.back()} onRequireLogin={() => setShowAuth(true)} />
        )}
      </div>

      {/* --- 하단 탭바 --- */}
      {showTabBar && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"0.5px solid #e0e0e0", display:"flex", justifyContent:"center", zIndex:200 }}>
          <div style={{ display:"flex", maxWidth:"560px", width:"100%" }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => switchTab(t.key)}
                style={{ flex:1, padding:"8px 0 6px", background:"none", border:"none", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
                  color: tab === t.key ? "#E84E3B" : "#bbb" }}>
                <span style={{ fontSize:"18px" }}>{t.emoji}</span>
                <span style={{ fontSize:"10px", fontWeight: tab === t.key ? "600" : "400" }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "home" && showTabBar && !isSearch && <ReportButton user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />}

      {/* 인증 모달 */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={() => {}} authFns={auth} />}

      {/* 고급 필터 모달 */}
      {showAdvancedFilter && (
        <AdvancedFilter
          onApply={(filters) => { updateFilter(filters); setShowAdvancedFilter(false); }}
          onClose={() => setShowAdvancedFilter(false)}
        />
      )}

      {/* 토스트 */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
