"""
쌀먹.com - YouTube 이벤트 수집기
매 2시간마다 YouTube Data API로 구독자 이벤트 영상을 수집합니다.
"""

import os
import re
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Optional

import requests
from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("ssalmuk")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
BACKEND_SECRET = os.getenv("BACKEND_SECRET", "dev-secret")

# ─── 검색 키워드 ───────────────────────────────────────────────
SEARCH_QUERIES = [
    "구독자 이벤트 기념 경품",
    "만 구독자 기념 이벤트",
    "구독자 이벤트 기프티콘",
    "구독자 이벤트 상품권 나눔",
    "구독자 돌파 이벤트 증정",
    "만명 달성 이벤트",
    "구독자 감사 이벤트 현금",
]

# ─── 이벤트 여부 판단 키워드 ───────────────────────────────────
EVENT_TITLE_KEYWORDS = [
    "이벤트", "나눔", "증정", "경품", "추첨", "기념", "달성", "감사"
]
PRIZE_KEYWORDS = [
    "기프티콘", "상품권", "현금", "치킨", "스타벅스", "아이패드",
    "닌텐도", "에어팟", "갤럭시", "아이폰", "올리브영", "GS", "CU",
    "네이버페이", "카카오페이", "문화상품권"
]
CONDITION_KEYWORDS = {
    "구독": "구독",
    "좋아요": "좋아요",
    "댓글": "댓글",
    "공유": "공유",
    "알림": "알림설정",
}

# ─── 날짜 패턴 ─────────────────────────────────────────────────
DATE_PATTERNS = [
    r"(\d{1,2})[./](\d{1,2})[./](\d{2,4})",          # 12/31/2025
    r"(\d{4})[./](\d{1,2})[./](\d{1,2})",             # 2025/12/31
    r"(\d{1,2})월\s*(\d{1,2})일",                      # 12월 31일
    r"~\s*(\d{1,2})[./](\d{1,2})",                    # ~12/31
    r"까지.*?(\d{1,2})[./](\d{1,2})",                  # 까지 12/31
]

SUB_COUNT_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*(만|천|백)?\s*(구독자?|명|subscribers?)",
    re.IGNORECASE
)


def youtube_search(query: str, max_results: int = 10) -> list[dict]:
    """YouTube Data API v3 search.list 호출"""
    url = "https://www.googleapis.com/youtube/v3/search"
    published_after = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "date",
        "maxResults": max_results,
        "publishedAfter": published_after,
        "regionCode": "KR",
        "relevanceLanguage": "ko",
        "key": YOUTUBE_API_KEY,
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json().get("items", [])


def youtube_video_detail(video_ids: list[str]) -> list[dict]:
    """영상 상세 정보 (설명, 통계) 가져오기"""
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,statistics,contentDetails",
        "id": ",".join(video_ids),
        "key": YOUTUBE_API_KEY,
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json().get("items", [])


def youtube_channel_detail(channel_id: str) -> Optional[dict]:
    """채널 구독자 수 가져오기"""
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {
        "part": "statistics,snippet",
        "id": channel_id,
        "key": YOUTUBE_API_KEY,
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json().get("items", [])
    return items[0] if items else None


def is_event_video(title: str, description: str) -> bool:
    """이벤트 영상인지 판단"""
    text = (title + " " + description).lower()
    has_event = any(k in text for k in EVENT_TITLE_KEYWORDS)
    has_prize = any(k in text for k in PRIZE_KEYWORDS)
    return has_event and has_prize


def extract_prize(text: str) -> Optional[str]:
    """경품 추출"""
    for keyword in PRIZE_KEYWORDS:
        idx = text.find(keyword)
        if idx != -1:
            snippet = text[max(0, idx-10):idx+20].strip()
            return snippet
    return None


def extract_deadline(text: str) -> Optional[str]:
    """마감일 추출 - ISO 날짜 문자열 반환"""
    now = datetime.now()
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            groups = match.groups()
            try:
                if len(groups) == 3:
                    y, m, d = int(groups[0]), int(groups[1]), int(groups[2])
                    if y < 100:
                        y += 2000
                    dt = datetime(y, m, d)
                elif len(groups) == 2:
                    m, d = int(groups[0]), int(groups[1])
                    dt = datetime(now.year, m, d)
                    if dt < now:
                        dt = datetime(now.year + 1, m, d)
                else:
                    continue
                if dt > now:
                    return dt.strftime("%Y-%m-%d")
            except (ValueError, IndexError):
                continue
    return None


def extract_conditions(text: str) -> list[str]:
    """참여 조건 추출"""
    found = []
    for keyword, label in CONDITION_KEYWORDS.items():
        if keyword in text:
            found.append(label)
    return found if found else ["댓글"]


def format_sub_count(count_str: str) -> str:
    """구독자 수 포맷 (1234567 → 123만)"""
    try:
        n = int(count_str)
        if n >= 10000:
            return f"{n // 10000}만"
        elif n >= 1000:
            return f"{n / 1000:.0f}천"
        return str(n)
    except (ValueError, TypeError):
        return count_str


def process_video(item: dict) -> Optional[dict]:
    """영상 1개를 이벤트 객체로 변환"""
    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})
    title = snippet.get("title", "")
    description = snippet.get("description", "")

    if not is_event_video(title, description):
        return None

    text = title + "\n" + description
    deadline = extract_deadline(text)
    conditions = extract_conditions(text)
    prize = extract_prize(text)

    channel_id = snippet.get("channelId", "")
    channel_info = youtube_channel_detail(channel_id)
    sub_count_raw = ""
    channel_thumb = ""
    if channel_info:
        sub_count_raw = channel_info.get("statistics", {}).get("subscriberCount", "")
        channel_thumb = (
            channel_info.get("snippet", {})
            .get("thumbnails", {})
            .get("default", {})
            .get("url", "")
        )

    video_id = item.get("id", "")
    published_at = snippet.get("publishedAt", "")

    return {
        "video_id": video_id,
        "title": title,
        "channel_name": snippet.get("channelTitle", ""),
        "channel_id": channel_id,
        "channel_thumbnail": channel_thumb,
        "subscriber_count": format_sub_count(sub_count_raw),
        "subscriber_count_raw": int(sub_count_raw) if sub_count_raw.isdigit() else 0,
        "thumbnail_url": (
            snippet.get("thumbnails", {}).get("medium", {}).get("url", "")
        ),
        "video_url": f"https://www.youtube.com/watch?v={video_id}",
        "description": description[:500],
        "prize": prize,
        "conditions": conditions,
        "deadline": deadline,
        "view_count": int(stats.get("viewCount", 0)),
        "like_count": int(stats.get("likeCount", 0)),
        "published_at": published_at,
        "collected_at": datetime.utcnow().isoformat(),
        "status": "live" if deadline else "unknown",
    }


def upsert_to_backend(event: dict):
    """백엔드 API로 이벤트 저장"""
    resp = requests.post(
        f"{BACKEND_URL}/api/events",
        json=event,
        headers={"x-secret": BACKEND_SECRET},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def collect_all():
    """전체 수집 실행"""
    log.info("=== 수집 시작 ===")
    seen_video_ids: set[str] = set()
    collected = 0
    skipped = 0

    for query in SEARCH_QUERIES:
        log.info(f"검색: {query}")
        try:
            search_items = youtube_search(query, max_results=10)
            video_ids = [
                item["id"]["videoId"]
                for item in search_items
                if item.get("id", {}).get("kind") == "youtube#video"
            ]
            video_ids = [vid for vid in video_ids if vid not in seen_video_ids]
            if not video_ids:
                continue

            details = youtube_video_detail(video_ids)
            for item in details:
                vid = item.get("id", "")
                seen_video_ids.add(vid)
                try:
                    event = process_video(item)
                    if event:
                        upsert_to_backend(event)
                        log.info(f"  저장: {event['title'][:40]}...")
                        collected += 1
                    else:
                        skipped += 1
                except Exception as e:
                    log.warning(f"  처리 실패 ({vid}): {e}")

            time.sleep(0.5)  # API 속도 제한 방지

        except Exception as e:
            log.error(f"검색 실패 ({query}): {e}")

    log.info(f"=== 수집 완료: {collected}개 저장, {skipped}개 스킵 ===")


def main():
    if not YOUTUBE_API_KEY:
        log.error("YOUTUBE_API_KEY 환경변수가 없습니다.")
        return

    scheduler = BlockingScheduler(timezone="Asia/Seoul")
    scheduler.add_job(collect_all, "interval", hours=2, next_run_time=datetime.now())
    log.info("스케줄러 시작 (2시간 간격)")
    try:
        scheduler.start()
    except KeyboardInterrupt:
        log.info("종료")


if __name__ == "__main__":
    main()
