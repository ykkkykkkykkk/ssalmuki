import { useState, useEffect } from "react";
import { useEvents } from "./hooks/useEvents";
import { useAuth } from "./hooks/useAuth";
import EventCard from "./components/EventCard";
import FilterBar from "./components/FilterBar";
import EventDetail from "./components/EventDetail";
import ReportButton from "./components/ReportButton";
import Community from "./components/Community";
import PostDetail from "./components/PostDetail";
import WritePost from "./components/WritePost";
import AuthModal from "./components/AuthModal";

const TABS = [
  { key: "home", label: "이벤트", emoji: "🎁" },
  { key: "community", label: "커뮤니티", emoji: "💬" },
];

export default function App() {
  const { events, stats, loading, error, filter, updateFilter, page, setPage, totalPages, total, reload } = useEvents();
  const auth = useAuth();
  const [tab, setTab] = useState("home");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [writing, setWriting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const lastUpdated = stats?.last_updated ? new Date(stats.last_updated).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : null;

  const goHome = () => { setSelectedEventId(null); setSelectedPostId(null); setWriting(false); };
  const switchTab = (t) => { goHome(); setTab(t); };

  useEffect(() => { window.scrollTo(0, 0); }, [selectedEventId, selectedPostId, writing, tab]);

  const showTabBar = !selectedEventId && !selectedPostId && !writing;

  // 로그인 필요한 액션 시 호출
  const requireLogin = (callback) => {
    if (auth.user) { callback(); return; }
    setShowAuth(true);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <div style={{maxWidth:"560px",margin:"0 auto",background:"#fff",minHeight:"100vh",paddingBottom: showTabBar ? "56px" : "0"}}>

        {/* ─── 헤더 ─── */}
        <header style={{padding:"20px 16px 12px",borderBottom:"0.5px solid #f0f0f0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div onClick={goHome} role="button" aria-label="홈으로 이동" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && goHome()} style={{cursor:"pointer"}}>
              <h1 style={{fontSize:"20px",fontWeight:"600",margin:0}}><span style={{color:"#E84E3B"}}>쌀</span>먹이</h1>
              <p style={{fontSize:"12px",color:"#999",marginTop:"2px"}}>유튜버 구독자 이벤트 · 커뮤니티</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              {tab === "home" && !selectedEventId && (
                <button onClick={reload} aria-label="새로고침" style={{fontSize:"12px",color:"#999",padding:"4px 10px",border:"0.5px solid #e0e0e0",borderRadius:"6px",background:"#fff",cursor:"pointer"}}>새로고침</button>
              )}
              {auth.user ? (
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <span style={{fontSize:"12px",fontWeight:"500",color:"#333"}}>{auth.user.nickname}</span>
                  <button onClick={auth.logout} style={{fontSize:"11px",color:"#aaa",background:"none",border:"none",cursor:"pointer",padding:"0"}}>로그아웃</button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} style={{fontSize:"12px",color:"#fff",padding:"5px 12px",border:"none",borderRadius:"6px",background:"#E84E3B",cursor:"pointer",fontWeight:"500"}}>로그인</button>
              )}
            </div>
          </div>
          {tab === "home" && !selectedEventId && stats && (
            <div style={{display:"flex",gap:"16px",marginTop:"10px"}}>
              <div style={{fontSize:"12px"}}><span style={{color:"#E84E3B",fontWeight:"500"}}>{stats.live_count??0}</span><span style={{color:"#999",marginLeft:"4px"}}>진행중</span></div>
              <div style={{fontSize:"12px"}}><span style={{color:"#D97706",fontWeight:"500"}}>{stats.soon_count??0}</span><span style={{color:"#999",marginLeft:"4px"}}>마감임박</span></div>
              {lastUpdated&&<div style={{fontSize:"11px",color:"#ccc",marginLeft:"auto"}}>{lastUpdated} 업데이트</div>}
            </div>
          )}
        </header>

        {/* ─── 이벤트 탭 ─── */}
        {tab === "home" && !selectedEventId && (
          <>
            <FilterBar filter={filter} onFilter={updateFilter} />
            <div style={{padding:"6px 16px",fontSize:"12px",color:"#aaa"}}>이벤트 <span style={{fontWeight:"500",color:"#555"}}>{total}</span>개</div>
            <main style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:"8px"}}>
              {loading && <div style={{textAlign:"center",padding:"60px 0",color:"#ccc"}}>불러오는 중...</div>}
              {error && <div style={{textAlign:"center",padding:"60px 0",color:"#aaa"}}>{error}</div>}
              {!loading&&!error&&events.length===0&&<div style={{padding:"60px 20px",textAlign:"center"}}><p style={{fontSize:"40px",marginBottom:"8px"}}>📭</p><p style={{color:"#999",fontSize:"14px"}}>이벤트가 없습니다</p></div>}
              {!loading&&events.map((e)=><EventCard key={e.id||e.video_id} event={e} onSelect={setSelectedEventId}/>)}
            </main>
          </>
        )}
        {tab === "home" && selectedEventId && (
          <EventDetail eventId={selectedEventId} onBack={() => setSelectedEventId(null)} user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />
        )}

        {/* ─── 커뮤니티 탭 ─── */}
        {tab === "community" && !selectedPostId && !writing && (
          <Community onSelectPost={setSelectedPostId} onWrite={() => requireLogin(() => setWriting(true))} />
        )}
        {tab === "community" && selectedPostId && (
          <PostDetail postId={selectedPostId} onBack={() => setSelectedPostId(null)} user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />
        )}
        {tab === "community" && writing && (
          <WritePost onBack={() => setWriting(false)} onDone={() => setWriting(false)} user={auth.user} authHeaders={auth.authHeaders} />
        )}
      </div>

      {/* ─── 하단 탭바 ─── */}
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

      {tab === "home" && showTabBar && <ReportButton user={auth.user} authHeaders={auth.authHeaders} onRequireLogin={() => setShowAuth(true)} />}

      {/* 인증 모달 */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={() => {}} authFns={auth} />}
    </div>
  );
}
