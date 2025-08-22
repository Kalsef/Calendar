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
    pool: pool,                // conexão do pg
    tableName: "session"       // tabela para armazenar sessões
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    await pool.query(
      'INSERT INTO access_logs (ip, user_agent) VALUES ($1, $2)',
      [ip, userAgent]
    );
  } catch (err) {
    console.error('Erro ao registrar acesso:', err);
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
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(45),
        user_agent TEXT,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // garantir usuário admin (se não existir)
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

// UPLOAD (admin) - envia arquivo e retorna { url }
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

// GET public: retornar músicas agrupadas por data (AAAA-MM-DD)
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

// GET admin raw: lista todas (para painel)
app.get("/api/admin/musicas", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM musicas ORDER BY data DESC, posicao");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro" });
  }
});
// GET admin: listar últimos 100 logs de acesso
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

// ✅ NOVO ENDPOINT: logs agrupados por IP
app.get("/api/admin/logs/grouped", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ip,
             COUNT(*) AS total_acessos,
             MAX(accessed_at) AS ultimo_acesso,
             (ARRAY_AGG(user_agent ORDER BY accessed_at DESC))[1] AS ultimo_user_agent
      FROM access_logs
      GROUP BY ip
      ORDER BY ultimo_acesso DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar logs agrupados:", err);
    res.status(500).json({ error: "Erro ao buscar logs agrupados" });
  }
});



// POST adicionar/editar música (admin)
app.post("/api/musicas", auth, async (req, res) => {
  try {
    const { data, posicao, titulo, audio, letra, capa } = req.body;
    if (!data) return res.status(400).json({ error: "Campo data é obrigatório (AAAA-MM-DD)" });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ error: "Data inválida. Use AAAA-MM-DD" });
    }

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

// DELETE música (admin)
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
