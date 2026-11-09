require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_ISSUER = "hedef-yks-api";
const TOKEN_AUDIENCE = "hedef-yks-client";

if (!AUTH_USERNAME || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(AUTH_PASSWORD_HASH || "")) {
  throw new Error("Kimlik bilgileri eksik veya hatalı. Önce `node setup-user.js` komutunu çalıştırın.");
}

if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) {
  throw new Error("JWT_SECRET eksik veya çok kısa. `node setup-user.js` ile güvenli yapılandırma oluşturun.");
}

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." },
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Merhaba, API çalışıyor!" });
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli." });
  }

  const passwordMatches = await bcrypt.compare(password, AUTH_PASSWORD_HASH);
  if (username !== AUTH_USERNAME || !passwordMatches) {
    return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
  }

  const token = jwt.sign({ sub: AUTH_USERNAME }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });

  return res.json({ token, tokenType: "Bearer", expiresIn: 3600 });
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
    return res.json({ authenticated: true, username: payload.sub });
  } catch {
    return res.status(401).json({ authenticated: false, error: "Token geçersiz veya süresi dolmuş." });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
