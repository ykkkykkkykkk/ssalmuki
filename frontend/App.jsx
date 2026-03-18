// src/App.jsx
import { useEvents } from "./hooks/useEvents";
import EventCard from "./components/EventCard";
import FilterBar from "./components/FilterBar";

export default function App() {
  const {
    events, stats, loading, error,
    filter, updateFilter,
    page, setPage, totalPages, total,
    reload,
  } = useEvents();

  const lastUpdated = stats?.last_updated
    ? new Date(stats.last_updated).toLocaleString("ko-KR", {
        month: "numeric", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto bg-white min-h-screen shadow-sm">

        {/* 헤더 */}
        <header className="px-4 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                <span className="text-red-500">쌀</span>먹.com
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                유튜버 구독자 이벤트 자동 수집
              </p>
            </div>
            <button
              onClick={reload}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-gray-300"
            >
              새로고침
            </button>
          </div>

          {/* 통계 */}
          {stats && (
            <div className="flex gap-4 mt-3">
              <div className="text-xs">
                <span className="text-red-500 font-medium">{stats.live_count ?? 0}</span>
                <span className="text-gray-400 ml-1">진행중</span>
              </div>
              <div className="text-xs">
                <span className="text-amber-500 font-medium">{stats.soon_count ?? 0}</span>
                <span className="text-gray-400 ml-1">마감임박</span>
              </div>
              <div className="text-xs text-gray-300 ml-auto">
                {lastUpdated && `${lastUpdated} 업데이트`}
              </div>
            </div>
          )}
        </header>

        {/* 필터 */}
        <FilterBar filter={filter} onFilter={updateFilter} />

        {/* 총 개수 */}
        <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-50">
          이벤트 <span className="font-medium text-gray-600">{total}</span>개
        </div>

        {/* 이벤트 목록 */}
        <main className="px-4 py-3 flex flex-col gap-2">
          {loading && (
            <div className="text-center py-16 text-gray-300 text-sm">
              불러오는 중...
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-sm text-gray-400 mb-2">{error}</p>
              <button
                onClick={reload}
                className="text-xs text-blue-500 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-16 text-gray-300 text-sm">
              해당 조건의 이벤트가 없습니다
            </div>
          )}

          {!loading &&
            events.map((event) => (
              <EventCard key={event.id || event.video_id} event={event} />
            ))}
        </main>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-6 border-t border-gray-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              이전
            </button>
            <span className="text-xs text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        )}

        {/* 푸터 */}
        <footer className="text-center py-4 text-[11px] text-gray-300 border-t border-gray-50">
          매 2시간마다 YouTube API로 자동 수집됩니다
        </footer>
      </div>
    </div>
  );
}
