/**
 * 쌀먹이 백엔드
 * Express + Turso (libSQL)
 */

const path = require("path");
const express = require("express");
const { createClient } = require("@libsql/client");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "ssalmuk-jwt-secret-2026";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));

// ─── Turso DB 연결 ──────────────────────────────────────────────
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ─── DB 초기화 (테이블 생성) ─────────────────────────────────────
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id            TEXT UNIQUE NOT NULL,
      title               TEXT NOT NULL,
      channel_name        TEXT NOT NULL,
      channel_id          TEXT,
      channel_thumbnail   TEXT,
      subscriber_count    TEXT,
      subscriber_count_raw INTEGER DEFAULT 0,
      thumbnail_url       TEXT,
      video_url           TEXT NOT NULL,
      description         TEXT,
      prize               TEXT,
      conditions          TEXT,       -- JSON array
      deadline            TEXT,       -- YYYY-MM-DD
      view_count          INTEGER DEFAULT 0,
      like_count          INTEGER DEFAULT 0,
      published_at        TEXT,
      collected_at        TEXT,
      status              TEXT DEFAULT 'live',  -- live | soon | ended
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_status    ON events(status);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_deadline  ON events(deadline);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_collected ON events(collected_at DESC);
  `);

  // ─── 유저 테이블 ───
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname   TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ─── 커뮤니티 테이블 ───
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id   INTEGER NOT NULL,
      nickname   TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_comments_event ON comments(event_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS winner_claims (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id   INTEGER NOT NULL,
      nickname   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(event_id, nickname),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      video_url   TEXT NOT NULL,
      nickname    TEXT NOT NULL,
      description TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `);

  // ─── 게시판 테이블 ───
  await db.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      category   TEXT NOT NULL DEFAULT 'free',  -- humor | youtube | free | winner
      nickname   TEXT NOT NULL,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL,
      likes      INTEGER DEFAULT 0,
      is_ai      INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_cat ON posts(category)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id    INTEGER NOT NULL,
      nickname   TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_pc_post ON post_comments(post_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id    INTEGER NOT NULL,
      nickname   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(post_id, nickname),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `);

  console.log("DB 초기화 완료");
}

// ─── 미들웨어: 수집기 인증 ────────────────────────────────────────
function requireSecret(req, res, next) {
  const secret = req.headers["x-secret"];
  if (secret !== process.env.BACKEND_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// ─── 미들웨어: JWT 인증 (선택적) ──────────────────────────────────
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  next();
}
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "세션이 만료되었습니다. 다시 로그인해주세요" });
  }
}

// ─── 마감 상태 자동 업데이트 ─────────────────────────────────────
function computeStatus(deadline) {
  if (!deadline) return "live";
  const today = new Date();
  const end = new Date(deadline);
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "ended";
  if (diffDays <= 2) return "soon";
  return "live";
}

function dDay(deadline) {
  if (!deadline) return null;
  const today = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "마감";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

// ═══════════════════════════════════════════════════════════════
//  인증 API
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/signup  { nickname, password }
 */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname?.trim()) return res.status(400).json({ error: "닉네임을 입력해주세요" });
    if (!password || password.length < 4) return res.status(400).json({ error: "비밀번호는 4자 이상이어야 합니다" });
    if (nickname.length > 20) return res.status(400).json({ error: "닉네임은 20자 이하" });
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname.trim())) {
      return res.status(400).json({ error: "닉네임은 한글, 영문, 숫자, _ 만 가능합니다" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: "INSERT INTO users (nickname, password) VALUES (?, ?)",
      args: [nickname.trim(), hash],
    });
    const token = jwt.sign({ id: Number(result.lastInsertRowid), nickname: nickname.trim() }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: Number(result.lastInsertRowid), nickname: nickname.trim() } });
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ error: "이미 사용 중인 닉네임입니다" });
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/auth/login  { nickname, password }
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname?.trim() || !password) return res.status(400).json({ error: "닉네임과 비밀번호를 입력해주세요" });
    const result = await db.execute({ sql: "SELECT * FROM users WHERE nickname = ?", args: [nickname.trim()] });
    if (!result.rows.length) return res.status(401).json({ error: "닉네임 또는 비밀번호가 틀렸습니다" });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "닉네임 또는 비밀번호가 틀렸습니다" });
    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, nickname: user.nickname } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * GET /api/auth/me  (토큰 검증)
 */
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ id: req.user.id, nickname: req.user.nickname });
});

// ═══════════════════════════════════════════════════════════════
//  API 라우트
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/events
 * 쿼리: status(live|soon|ended), tag(gift|cash|sub), page, limit
 */
app.get("/api/events", async (req, res) => {
  try {
    const { status, tag, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE status != 'ended'";
    const args = [];

    if (status && status !== "all") {
      where += " AND status = ?";
      args.push(status);
    }

    if (tag === "gift") {
      where += ` AND (prize LIKE '%기프티콘%' OR prize LIKE '%상품권%'
                    OR prize LIKE '%스타벅스%' OR prize LIKE '%올리브영%')`;
    } else if (tag === "cash") {
      where += ` AND (prize LIKE '%현금%' OR prize LIKE '%네이버페이%'
                    OR prize LIKE '%카카오페이%' OR prize LIKE '%아이패드%'
                    OR prize LIKE '%닌텐도%' OR prize LIKE '%갤럭시%')`;
    } else if (tag === "sub") {
      where += ` AND conditions LIKE '%구독%'`;
    }

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM events ${where}`,
      args,
    });
    const total = countResult.rows[0].cnt;

    const result = await db.execute({
      sql: `SELECT * FROM events ${where}
            ORDER BY
              CASE status WHEN 'soon' THEN 0 WHEN 'live' THEN 1 ELSE 2 END,
              deadline ASC NULLS LAST,
              view_count DESC
            LIMIT ? OFFSET ?`,
      args: [...args, Number(limit), offset],
    });

    const events = result.rows.map((row) => ({
      ...row,
      conditions: JSON.parse(row.conditions || "[]"),
      dday: dDay(row.deadline),
    }));

    res.json({
      events,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ─── 커뮤니티 API (Express 5: 구체적 경로를 :id 위에 배치) ───

/**
 * GET /api/events/:id/comments
 */
app.get("/api/events/:id/comments", async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM comments WHERE event_id = ? ORDER BY created_at DESC",
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/events/:id/comments
 */
app.post("/api/events/:id/comments", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "내용을 입력해주세요" });
    if (content.length > 500) return res.status(400).json({ error: "내용은 500자 이하" });
    await db.execute({
      sql: "INSERT INTO comments (event_id, nickname, content) VALUES (?, ?, ?)",
      args: [req.params.id, req.user.nickname, content.trim()],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * GET /api/events/:id/winners
 */
app.get("/api/events/:id/winners", async (req, res) => {
  try {
    const countResult = await db.execute({
      sql: "SELECT COUNT(*) as cnt FROM winner_claims WHERE event_id = ?",
      args: [req.params.id],
    });
    const listResult = await db.execute({
      sql: "SELECT nickname, created_at FROM winner_claims WHERE event_id = ? ORDER BY created_at DESC LIMIT 20",
      args: [req.params.id],
    });
    res.json({ count: countResult.rows[0].cnt, winners: listResult.rows });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/events/:id/winners
 */
app.post("/api/events/:id/winners", requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: "INSERT INTO winner_claims (event_id, nickname) VALUES (?, ?)",
      args: [req.params.id, req.user.nickname],
    });
    res.json({ ok: true });
  } catch (err) {
    if (err.message?.includes("UNIQUE")) {
      return res.status(409).json({ error: "이미 인증하셨습니다" });
    }
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * GET /api/events/:id
 */
app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM events WHERE id = ?",
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ error: "not found" });
    const row = result.rows[0];
    res.json({ ...row, conditions: JSON.parse(row.conditions || "[]"), dday: dDay(row.deadline) });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/events  (수집기 전용)
 */
app.post("/api/events", requireSecret, async (req, res) => {
  try {
    const e = req.body;
    const status = computeStatus(e.deadline);
    const conditions = JSON.stringify(e.conditions || []);

    await db.execute({
      sql: `INSERT INTO events
              (video_id, title, channel_name, channel_id, channel_thumbnail,
               subscriber_count, subscriber_count_raw, thumbnail_url, video_url,
               description, prize, conditions, deadline, view_count, like_count,
               published_at, collected_at, status, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
            ON CONFLICT(video_id) DO UPDATE SET
              title               = excluded.title,
              view_count          = excluded.view_count,
              like_count          = excluded.like_count,
              status              = excluded.status,
              prize               = excluded.prize,
              conditions          = excluded.conditions,
              deadline            = excluded.deadline,
              updated_at          = datetime('now')`,
      args: [
        e.video_id, e.title, e.channel_name, e.channel_id,
        e.channel_thumbnail, e.subscriber_count, e.subscriber_count_raw,
        e.thumbnail_url, e.video_url, e.description, e.prize,
        conditions, e.deadline, e.view_count, e.like_count,
        e.published_at, e.collected_at, status,
      ],
    });

    res.json({ ok: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats  (대시보드용)
 */
app.get("/api/stats", async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live_count,
        SUM(CASE WHEN status = 'soon' THEN 1 ELSE 0 END) as soon_count,
        SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) as ended_count,
        MAX(updated_at) as last_updated
      FROM events
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  게시판 API
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/posts
 * 쿼리: category, page, limit, sort(recent|popular)
 */
app.get("/api/posts", async (req, res) => {
  try {
    const { category, page = 1, limit = 20, sort = "recent" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let where = "WHERE 1=1";
    const args = [];
    if (category && category !== "all") {
      where += " AND category = ?";
      args.push(category);
    }
    const order = sort === "popular" ? "likes DESC, created_at DESC" : "created_at DESC";
    const countResult = await db.execute({ sql: `SELECT COUNT(*) as cnt FROM posts ${where}`, args });
    const total = countResult.rows[0].cnt;
    const result = await db.execute({
      sql: `SELECT p.*, (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
            FROM posts p ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
      args: [...args, Number(limit), offset],
    });
    res.json({ posts: result.rows, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * GET /api/posts/:id
 */
app.get("/api/posts/:id", async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT * FROM posts WHERE id = ?", args: [req.params.id] });
    if (!result.rows.length) return res.status(404).json({ error: "not found" });
    const comments = await db.execute({
      sql: "SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at ASC",
      args: [req.params.id],
    });
    res.json({ ...result.rows[0], comments: comments.rows });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/posts  (글쓰기 — 유저 or AI)
 */
app.post("/api/posts", optionalAuth, async (req, res) => {
  try {
    const { category, nickname, title, content, is_ai } = req.body;
    // AI 포스팅은 시크릿으로 인증, 일반 유저는 JWT
    const isAiPost = is_ai && req.headers["x-secret"] === process.env.BACKEND_SECRET;
    if (!isAiPost && !req.user) return res.status(401).json({ error: "로그인이 필요합니다" });
    const authorNick = isAiPost ? nickname : req.user.nickname;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ error: "제목과 내용을 입력해주세요" });
    if (title.length > 100) return res.status(400).json({ error: "제목 100자 이하" });
    if (content.length > 2000) return res.status(400).json({ error: "내용 2000자 이하" });
    const validCats = ["humor", "youtube", "free", "winner"];
    const cat = validCats.includes(category) ? category : "free";
    const result = await db.execute({
      sql: "INSERT INTO posts (category, nickname, title, content, is_ai) VALUES (?, ?, ?, ?, ?)",
      args: [cat, authorNick, title.trim(), content.trim(), isAiPost ? 1 : 0],
    });
    res.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/posts/:id/comments
 */
app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "내용을 입력해주세요" });
    if (content.length > 500) return res.status(400).json({ error: "내용 500자 이하" });
    await db.execute({
      sql: "INSERT INTO post_comments (post_id, nickname, content) VALUES (?, ?, ?)",
      args: [req.params.id, req.user.nickname, content.trim()],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/posts/:id/like
 */
app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: "INSERT INTO post_likes (post_id, nickname) VALUES (?, ?)",
      args: [req.params.id, req.user.nickname],
    });
    await db.execute({
      sql: "UPDATE posts SET likes = likes + 1 WHERE id = ?",
      args: [req.params.id],
    });
    res.json({ ok: true });
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ error: "이미 좋아요 했습니다" });
    res.status(500).json({ error: "서버 오류" });
  }
});

/**
 * POST /api/reports
 */
app.post("/api/reports", requireAuth, async (req, res) => {
  try {
    const { video_url, description } = req.body;
    if (!video_url?.trim()) return res.status(400).json({ error: "영상 URL을 입력해주세요" });
    if (description && description.length > 500) return res.status(400).json({ error: "설명은 500자 이하" });
    await db.execute({
      sql: "INSERT INTO reports (video_url, nickname, description) VALUES (?, ?, ?)",
      args: [video_url.trim(), req.user.nickname, (description || "").trim()],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ─── 프론트엔드 정적 파일 서빙 ──────────────────────────────────
const frontendPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(frontendPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ─── 서버 시작 ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`쌀먹이 실행 중: http://localhost:${PORT}`));
});
