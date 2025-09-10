// server.js
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import pkg from "pg";
import pgSession from "connect-pg-simple";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- Pool Postgres --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// -------------------- Middlewares --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Session --------------------
const pgSessionStore = pgSession(session);
app.use(
  session({
    store: new pgSessionStore({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET || "troque_essa_chave_para_producao",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 3600 * 1000 }
  })
);

// -------------------- Upload --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (/audio|mpeg|mp3|wav|m4a/.test(file.mimetype) ||
        /\.(mp3|m4a|wav)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error("Apenas arquivos de áudio são permitidos"));
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// -------------------- Auth --------------------
function auth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Não autorizado" });
}

// -------------------- Telegram --------------------
async function sendTelegram(botToken, chatId, message) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
  } catch (err) {
    console.error("Erro ao enviar Telegram:", err.message);
  }
}

// -------------------- Rotas --------------------
// Exemplo simples de rota teste
app.get("/", (req, res) => res.send("Servidor rodando!"));

// -------------------- Inicialização DB --------------------
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
      );
    `);

    const adminRes = await pool.query("SELECT * FROM users WHERE username=$1", ["admin"]);
    if (adminRes.rows.length === 0) {
      const hash = await bcrypt.hash("F1003J", 10);
      await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        ["admin", hash]
      );
      console.log("Usuário admin criado -> usuário: admin / senha: F1003J");
    }

    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Erro inicializando o banco:", err);
    process.exit(1);
  }
})();
