"""
쌀먹이 - AI 자동 포스팅
Anthropic Claude API로 유머/유튜브 정보 콘텐츠를 생성해서 커뮤니티에 자동 게시합니다.
매 3시간마다 유머 1개 + 유튜브 정보 1개를 올립니다.
"""

import os
import json
import logging
import random
from datetime import datetime

import requests
from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("auto_poster")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
BACKEND_SECRET = os.getenv("BACKEND_SECRET", "dev-secret")

AI_NICKNAMES = ["쌀먹이봇", "이벤트요정", "유튜브박사"]

# ─── 프롬프트 템플릿 ────────────────────────────────────────────

HUMOR_PROMPT = """당신은 유튜브 구독자 이벤트 커뮤니티 '쌀먹이'의 유머 담당입니다.
커뮤니티 멤버들이 웃을 수 있는 짧은 유머 글을 하나 작성해주세요.

주제는 아래 중 랜덤으로 하나를 골라주세요:
- 유튜브 이벤트 참여할 때 공감되는 상황
- 경품 당첨/낙첨 관련 유머
- 구독자 이벤트 밈
- 유튜브 댓글 문화 유머
- 쌀먹(무료 경품 응모) 생활 유머

조건:
- 제목은 15자 이내, 센스있게
- 본문은 3~8줄 이내로 짧고 재밌게
- 한국어 인터넷 커뮤니티 말투 (ㅋㅋㅋ, ㅎㅎ 등 자연스럽게 사용)
- 이모지 적절히 사용
- 불쾌하거나 선정적인 내용 금지

JSON 형식으로만 응답: {"title": "제목", "content": "본문"}"""

YOUTUBE_INFO_PROMPT = """당신은 유튜브 구독자 이벤트 커뮤니티 '쌀먹이'의 정보 담당입니다.
유튜브 이벤트 참여에 도움이 되는 실용적인 꿀팁 글을 하나 작성해주세요.

주제는 아래 중 랜덤으로 하나를 골라주세요:
- 구독자 이벤트 당첨 확률 높이는 법
- 이벤트 사기 구별법
- 유튜브 알림 설정 꿀팁
- 댓글 잘 쓰는 법 (당첨 잘 되는 댓글)
- 경품 수령 시 주의사항
- 이벤트 많이 하는 유튜버 유형 분석
- 구독자 이벤트 트렌드

조건:
- 제목은 20자 이내, 클릭하고 싶게
- 본문은 5~15줄, 실용적이고 구체적으로
- 한국어 자연스러운 말투 (딱딱하지 않게)
- 이모지 적절히 사용
- 확인되지 않은 정보는 쓰지 마세요

JSON 형식으로만 응답: {"title": "제목", "content": "본문"}"""


def call_claude(prompt):
    """Anthropic Claude API 호출"""
    if not ANTHROPIC_API_KEY:
        log.error("ANTHROPIC_API_KEY가 설정되지 않았습니다")
        return None

    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 500,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        r.raise_for_status()
        text = r.json()["content"][0]["text"].strip()
        # JSON 파싱 (코드블록 감싸져 있을 수 있음)
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        log.error(f"Claude API 오류: {e}")
        return None


def post_to_community(category, title, content):
    """커뮤니티에 글 게시"""
    nickname = random.choice(AI_NICKNAMES)
    try:
        r = requests.post(
            f"{BACKEND_URL}/api/posts",
            headers={
                "Content-Type": "application/json",
                "x-secret": BACKEND_SECRET,
            },
            json={
                "category": category,
                "nickname": nickname,
                "title": title,
                "content": content,
                "is_ai": True,
            },
            timeout=10,
        )
        r.raise_for_status()
        log.info(f"게시 완료 [{category}] {title} (by {nickname})")
        return True
    except Exception as e:
        log.error(f"게시 실패: {e}")
        return False


def generate_and_post():
    """유머 1개 + 유튜브정보 1개 생성 후 게시"""
    log.info("=== AI 자동 포스팅 시작 ===")

    # 유머
    humor = call_claude(HUMOR_PROMPT)
    if humor and "title" in humor and "content" in humor:
        post_to_community("humor", humor["title"], humor["content"])
    else:
        log.warning("유머 생성 실패")

    # 유튜브 정보
    info = call_claude(YOUTUBE_INFO_PROMPT)
    if info and "title" in info and "content" in info:
        post_to_community("youtube", info["title"], info["content"])
    else:
        log.warning("유튜브 정보 생성 실패")

    log.info("=== AI 자동 포스팅 완료 ===")


if __name__ == "__main__":
    log.info("쌀먹이 AI 자동 포스터 시작")

    # 시작 시 즉시 1회 실행
    generate_and_post()

    # 이후 3시간마다 실행
    scheduler = BlockingScheduler(timezone="Asia/Seoul")
    scheduler.add_job(generate_and_post, "interval", hours=3)
    log.info("스케줄러 시작: 3시간 간격")
    scheduler.start()
