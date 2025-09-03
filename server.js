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

// -------------------- Config DB (Postgres) --------------------
if (!process.env.DATABASE_URL) {
  console.error("ERRO: defina a variável de ambiente DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// -------------------- Config session store --------------------
const pgSessionStore = pgSession(session);

app.use(session({
  store: new pgSessionStore({
    pool: pool,
    tableName: "session"
  }),
  secret: process.env.SESSION_SECRET || "troque_essa_chave_para_producao",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 3600 * 1000 } // 1 dia
}));

// -------------------- Ensure uploads folder --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// -------------------- Multer (upload) --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (/audio|mpeg|mp3|wav|m4a/.test(file.mimetype) || /\.(mp3|m4a|wav)$/i.test(file.originalname)) {
      cb(null, true);
    } else cb(new Error("Apenas arquivos de áudio são permitidos"));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// -------------------- Middlewares --------------------
// -------------------- Middlewares --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const userAgent = req.headers["user-agent"] || "desconhecido";

  try {
    // salva no banco
    await pool.query(
      "INSERT INTO access_logs (ip, user_agent) VALUES ($1, $2)",
      [ip, userAgent]
    );

    // --- Evita notificação para bots ---
    if (!/bot|crawl|spider|slurp|curl|wget/i.test(userAgent)) {
      // tenta pegar info de localização
      let location = "Localização desconhecida";
      try {
        const ipInfoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (ipInfoRes.ok) {
          const ipInfo = await ipInfoRes.json();
          location = `${ipInfo.city || "???"}, ${ipInfo.region || "???"}, ${ipInfo.country_name || "???"}`;
        }
      } catch (err) {
        console.error("Erro ao buscar localização do IP:", err.message);
      }

      // envia alerta pro Telegram
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chat_id = process.env.TELEGRAM_CHAT_ID;
      const message = `👤 Novo acesso no site!\n\n📍 IP: ${ip}\n🌍 Localização: ${location}\n💻 User-Agent: ${userAgent}`;

      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: message }),
        });
      } catch (err) {
        console.error("Erro ao enviar notificação Telegram:", err.message);
      }
    }
  } catch (err) {
    console.error("Erro ao registrar acesso:", err);
  }

  next();
});


// -------------------- Static --------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use("/uploads", express.static(uploadsDir)); // arquivos de áudio públicos

// -------------------- Inicialização do DB (criar tabelas) --------------------
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
      );

      CREATE TABLE IF NOT EXISTS musicas (
        id SERIAL PRIMARY KEY,
        data TEXT NOT NULL,
        posicao INTEGER NOT NULL,
        titulo TEXT,
        audio TEXT,
        letra TEXT,
        capa TEXT,
        UNIQUE(data, posicao)
      );

      CREATE TABLE IF NOT EXISTS memories (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        message TEXT NOT NULL,
        posicao INTEGER
      );

      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(100),
        user_agent TEXT,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const adminRes = await pool.query("SELECT * FROM users WHERE username = $1", ["admin"]);
    if (adminRes.rows.length === 0) {
      const hash = await bcrypt.hash("F1003J", 10);
      await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", ["admin", hash]);
      console.log("Usuário admin criado -> usuário: admin / senha: 1234 (altere depois)");
    }

    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Erro inicializando o banco:", err);
    process.exit(1);
  }
})();

// -------------------- Auth middleware --------------------
function auth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Não autorizado" });
}

// -------------------- Routes --------------------

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Dados incompletos" });
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Usuário ou senha inválidos" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Usuário ou senha inválidos" });
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// UPLOAD (admin)
app.post("/api/upload", auth, upload.single("audio"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro no upload" });
  }
});

// GET músicas públicas
app.get("/api/musicas", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM musicas ORDER BY data, posicao");
    const out = {};
    for (const r of rows) {
      if (!out[r.data]) out[r.data] = [];
      out[r.data][r.posicao - 1] = {
        id: r.id,
        titulo: r.titulo,
        audio: r.audio,
        letra: r.letra,
        capa: r.capa,
        posicao: r.posicao
      };
    }
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar músicas" });
  }
});

// GET admin raw
app.get("/api/admin/musicas", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM musicas ORDER BY data DESC, posicao");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro" });
  }
});

// GET logs admin
app.get("/api/admin/logs", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM access_logs ORDER BY accessed_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar logs:", err);
    res.status(500).json({ error: "Erro ao buscar logs" });
  }
});

// POST adicionar/editar música
app.post("/api/musicas", auth, async (req, res) => {
  try {
    const { data, posicao, titulo, audio, letra, capa } = req.body;
    if (!data) return res.status(400).json({ error: "Campo data é obrigatório (AAAA-MM-DD)" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return res.status(400).json({ error: "Data inválida. Use AAAA-MM-DD" });

    let p;
    if (posicao) {
      p = parseInt(posicao, 10);
      if (isNaN(p) || p < 1) return res.status(400).json({ error: "posicao inválida" });
    } else {
      const maxRes = await pool.query("SELECT MAX(posicao) as m FROM musicas WHERE data = $1", [data]);
      p = (maxRes.rows[0] && maxRes.rows[0].m) ? (parseInt(maxRes.rows[0].m, 10) + 1) : 1;
    }

    const upsertSql = `
      INSERT INTO musicas (data, posicao, titulo, audio, letra, capa)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (data, posicao)
      DO UPDATE SET titulo = EXCLUDED.titulo, audio = EXCLUDED.audio, letra = EXCLUDED.letra, capa = EXCLUDED.capa
      RETURNING posicao;
    `;
    const { rows } = await pool.query(upsertSql, [data, p, titulo || null, audio || null, letra || null, capa || null]);
    res.json({ success: true, posicao: rows[0].posicao });
  } catch (err) {
    console.error("Erro ao salvar música:", err);
    res.status(500).json({ error: "Erro ao salvar música" });
  }
});

// DELETE música
app.delete("/api/musicas/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM musicas WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

// -------------------- Memories --------------------

// GET public
app.get("/api/memories", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM memories ORDER BY posicao, id");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar lembranças públicas:", err);
    res.status(500).json({ error: "Erro ao buscar lembranças" });
  }
});

// GET admin
app.get("/api/admin/memories", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM memories ORDER BY posicao, id");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar lembranças admin:", err);
    res.status(500).json({ error: "Erro ao buscar lembranças" });
  }
});

// POST adicionar memória
app.post("/api/memories", auth, async (req, res) => {
  try {
    const { image, message, posicao } = req.body;
    if (!image || !message) return res.status(400).json({ error: "Campos image e message são obrigatórios" });

    const { rows } = await pool.query(
      "INSERT INTO memories (image, message, posicao) VALUES ($1, $2, $3) RETURNING *",
      [image, message, posicao || null]
    );
    res.json({ success: true, memory: rows[0] });
  } catch (err) {
    console.error("Erro ao adicionar lembrança:", err);
    res.status(500).json({ error: "Erro ao adicionar lembrança" });
  }
});

// DELETE memória
app.delete("/api/memories/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM memories WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar lembrança:", err);
    res.status(500).json({ error: "Erro ao deletar lembrança" });
  }
});
// Telegram
// POST enviar alerta Telegram
app.post("/api/send-telegram-alert", async (req, res) => {
  try {
    const chat_id = process.env.TELEGRAM_CHAT_ID;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const { message } = req.body; // <-- pega a mensagem enviada pelo frontend

    if (!message) {
      return res.status(400).json({ success: false, error: "Mensagem não fornecida" });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: message }),
    });

    const data = await response.json();

    if (data.ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: data.description });
    }
  } catch (err) {
    console.error("Erro ao enviar Telegram:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
