// src/components/EventCard.jsx
export default function EventCard({ event }) {
  const badgeStyle = {
    live: "bg-red-50 text-red-700 border-red-200",
    soon: "bg-amber-50 text-amber-700 border-amber-200",
    ended: "bg-gray-100 text-gray-400 border-gray-200",
  };
  const badgeText = { live: "진행중", soon: "마감임박", ended: "종료" };

  return (
    <a
      href={event.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 transition-colors group"
    >
      {/* 썸네일 */}
      <div className="relative flex-shrink-0 w-[100px] h-[68px] rounded-lg overflow-hidden bg-gray-100">
        {event.thumbnail_url ? (
          <img
            src={event.thumbnail_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
        )}
        {event.subscriber_count && (
          <span className="absolute bottom-1 right-1 text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
            {event.subscriber_count}
          </span>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 flex-1">
            {event.title}
          </p>
          <span
            className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeStyle[event.status] || badgeStyle.live}`}
          >
            {badgeText[event.status] || "진행중"}
          </span>
        </div>

        <p className="text-xs text-gray-400 mb-2">
          {event.channel_name}
          {event.view_count > 0 && (
            <span> · {(event.view_count / 10000).toFixed(1)}만 조회</span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* 조건 */}
          {Array.isArray(event.conditions) && event.conditions.length > 0 && (
            <span className="text-[11px] text-gray-400">
              {event.conditions.join(" + ")}
            </span>
          )}

          {/* 경품 */}
          {event.prize && (
            <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded">
              {event.prize.length > 20 ? event.prize.slice(0, 20) + "…" : event.prize}
            </span>
          )}

          {/* D-Day */}
          {event.dday && (
            <span
              className={`text-[11px] font-medium ml-auto ${
                event.status === "soon" ? "text-amber-600" : "text-gray-400"
              }`}
            >
              {event.dday}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
