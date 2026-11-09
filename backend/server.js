require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const crypto = require("node:crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const REGISTRATION_INVITE_CODE = process.env.REGISTRATION_INVITE_CODE;
const TOKEN_ISSUER = "hedef-yks-api";
const TOKEN_AUDIENCE = "hedef-yks-client";
const DATA_KEYS = new Set([
  "odak-yks-notes",
  "odak-yks-tasks",
  "odak-yks-exams",
  "odak-yks-calculated-exams",
  "odak-yks-goals",
  "odak-yks-target-profile",
  "odak-yks-resources",
  "odak-yks-question-logs",
  "odak-yks-theme",
  "odak-yks-topic-progress",
]);
const DATABASE_URL = process.env.DATABASE_URL;
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    })
  : null;

app.set("trust proxy", 1);

if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) {
  throw new Error("JWT_SECRET eksik veya çok kısa. Güvenli bir anahtar yapılandırın.");
}

if (!pool && (!AUTH_USERNAME || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(AUTH_PASSWORD_HASH || ""))) {
  throw new Error("Veritabanı ayarlı değil ve tek kullanıcı kimlik bilgileri eksik veya hatalı.");
}

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "256kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin." },
});

function createToken(user) {
  return jwt.sign({ username: user.username }, JWT_SECRET, {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: "1h",
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });
}

function verifyToken(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Geçerli bir Bearer token gerekli." });
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    if (typeof payload.sub !== "string") {
      return res.status(401).json({ error: "Token geçersiz veya bu işlem için kullanılamıyor." });
    }
    const hasUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub);
    if (pool && !hasUserId) {
      return res.status(401).json({ error: "Token geçersiz veya bu işlem için kullanılamıyor." });
    }
    req.user = { id: hasUserId ? payload.sub : null, username: payload.username || payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: "Token geçersiz veya süresi dolmuş." });
  }
}

function validateCredentials(username, password) {
  if (typeof username !== "string" || !/^[a-zA-Z0-9._@+-]{1,64}$/.test(username.trim())) {
    return "Kullanıcı adı 1-64 karakter olmalı; harf, rakam, nokta, _, @, + veya - içerebilir.";
  }
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    return "Şifre en az 12 karakter olmalı ve UTF-8 olarak 72 baytı aşmamalı.";
  }
  return null;
}

function hasValidInviteCode(candidate) {
  if (typeof candidate !== "string") return false;
  const provided = Buffer.from(candidate);
  const configured = Buffer.from(REGISTRATION_INVITE_CODE || "");
  return provided.length === configured.length && crypto.timingSafeEqual(provided, configured);
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data_key TEXT NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, data_key)
    )
  `);

  if (AUTH_USERNAME && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(AUTH_PASSWORD_HASH || "")) {
    const username = AUTH_USERNAME.trim().toLowerCase();
    await pool.query(
      `INSERT INTO users (id, username, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [crypto.randomUUID(), username, AUTH_PASSWORD_HASH],
    );
  }
}

app.get("/api/hello", (req, res) => {
  res.json({ message: "Merhaba, API çalışıyor!" });
});

app.post("/api/register", registerLimiter, async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Kayıt için PostgreSQL veritabanı henüz yapılandırılmadı." });
  }
  if (!REGISTRATION_INVITE_CODE || REGISTRATION_INVITE_CODE.length < 24) {
    return res.status(503).json({ error: "Davetli kayıt henüz yapılandırılmadı." });
  }

  const { username, password, inviteCode } = req.body || {};
  const validationError = validateCredentials(username, password);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!hasValidInviteCode(inviteCode)) {
    return res.status(401).json({ error: "Davet kodu geçersiz." });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = { id: crypto.randomUUID(), username: normalizedUsername };
  try {
    await pool.query(
      "INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)",
      [user.id, user.username, passwordHash],
    );
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Bu kullanıcı adı zaten alınmış." });
    }
    throw error;
  }

  return res.status(201).json({ token: createToken(user), tokenType: "Bearer", expiresIn: 3600, username: user.username });
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli." });
  }

  if (pool) {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username.trim().toLowerCase()],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
    }
    return res.json({ token: createToken(user), tokenType: "Bearer", expiresIn: 3600, username: user.username });
  }

  const passwordMatches = await bcrypt.compare(password, AUTH_PASSWORD_HASH);
  if (username !== AUTH_USERNAME || !passwordMatches) {
    return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
  }

  return res.json({
    token: jwt.sign({ username: AUTH_USERNAME }, JWT_SECRET, {
      algorithm: "HS256",
      subject: AUTH_USERNAME,
      expiresIn: "1h",
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }),
    tokenType: "Bearer",
    expiresIn: 3600,
    username: AUTH_USERNAME,
  });
});

app.get("/api/check-auth", (req, res) => {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ authenticated: false, error: "Geçerli bir Bearer token gerekli." });
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    return res.json({ authenticated: true, username: payload.username || payload.sub });
  } catch {
    return res.status(401).json({ authenticated: false, error: "Token geçersiz veya süresi dolmuş." });
  }
});

app.get("/api/data", verifyToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Veri eşitleme için PostgreSQL veritabanı yapılandırılmadı." });
  const result = await pool.query(
    "SELECT data_key, value FROM user_data WHERE user_id = $1",
    [req.user.id],
  );
  return res.json(Object.fromEntries(result.rows.map((row) => [row.data_key, row.value])));
});

app.put("/api/data/:key", verifyToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Veri eşitleme için PostgreSQL veritabanı yapılandırılmadı." });
  const { key } = req.params;
  if (!DATA_KEYS.has(key) || !Object.hasOwn(req.body || {}, "value")) {
    return res.status(400).json({ error: "Kaydedilecek veri anahtarı veya değeri geçersiz." });
  }

  const serializedValue = JSON.stringify(req.body.value);
  if (Buffer.byteLength(serializedValue, "utf8") > 200 * 1024) {
    return res.status(413).json({ error: "Tek bir veri öğesi en fazla 200 KB olabilir." });
  }
  await pool.query(
    `INSERT INTO user_data (user_id, data_key, value)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (user_id, data_key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [req.user.id, key, serializedValue],
  );
  return res.json({ saved: true });
});

app.use((error, req, res, next) => {
  console.error("API isteği başarısız:", error.message);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: "Sunucu isteği tamamlayamadı. Lütfen tekrar deneyin." });
});

async function startServer() {
  if (pool) {
    await initializeDatabase();
    console.log("PostgreSQL bağlantısı hazır.");
  }
  app.listen(PORT, HOST, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
  });
}

startServer().catch((error) => {
  console.error("Sunucu başlatılamadı:", error.message);
  process.exitCode = 1;
});
