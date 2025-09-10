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


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon exige SSL
});

export default pool;


// -------------------- Middlewares --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Config DB (Postgres) --------------------
if (!process.env.DATABASE_URL) {
  console.error("ERRO: defina a variável de ambiente DATABASE_URL");
  process.exit(1);
}


const pgSessionStore = pgSession(session);

app.use(
  session({
    store: new pgSessionStore({
      pool: pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "troque_essa_chave_para_producao",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 3600 * 1000 }, // 1 dia
  })
);

// -------------------- Ensure uploads folder --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// -------------------- Multer (upload) --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      /audio|mpeg|mp3|wav|m4a/.test(file.mimetype) ||
      /\.(mp3|m4a|wav)$/i.test(file.originalname)
    ) {
      cb(null, true);
    } else cb(new Error("Apenas arquivos de áudio são permitidos"));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// -------------------- Auth middleware --------------------
function auth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Não autorizado" });
}



async function sendTelegram(botToken, chatId, message) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch (err) {
    console.error("Erro ao enviar Telegram:", err.message);
  }
}


// -------------------- Rota clique botão --------------------
app.post("/api/button-click", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const { descricao } = req.body;
    const location = "Localização não disponível";

    const mensagem = `👆 Clique detectado:
🔘 Botão: ${descricao}
🌐 IP: ${ip}
📍 Localização: ${location}`;

    // Bot separado só para interações
    await sendTelegram(
      process.env.TELEGRAM_BOT_TOKEN_INTERACOES,
      process.env.TELEGRAM_CHAT_ID_INTERACOES,
      mensagem
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao processar clique:", err);
    res.status(500).json({ error: err.message });
  }
});


// -------------------- Middlewares --------------------
app.use(async (req, res, next) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();
  const userAgent = req.headers["user-agent"] || "desconhecido";

  try {
    await pool.query(
      "INSERT INTO access_logs (ip, user_agent) VALUES ($1, $2)",
      [ip, userAgent]
    );

    const isBotUA = /bot|crawl|spider|slurp|curl|wget/i.test(userAgent);
    const ignoredPrefixes = ["::1","10.","192.168.","172.16.","127.","66.249.","157.55.","216.144"];
    const isIgnoredIP = ignoredPrefixes.some((prefix) => ip.startsWith(prefix));

    if (!isBotUA && !isIgnoredIP) {
      const location = "Localização não disponível";
      const message = `👤 Novo acesso no site!\n📍 IP: ${ip}\n💻 User-Agent: ${userAgent}\n🌍 Localização: ${location}`;

      // Bot separado só para acessos
      await sendTelegram(
        process.env.TELEGRAM_BOT_TOKEN_VISITAS,
        process.env.TELEGRAM_CHAT_ID_VISITAS,
        message
      );
    }
  } catch (err) {
    console.error("Erro ao registrar acesso:", err);
  }

  next();
});


// server.js
app.get("/api/drive-files", async (req, res) => {
  try {
    const resp = await fetch("https://drive-tfxi.onrender.com/arquivos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: "1SVDVg6_hG9Jd2ogNdy9jC4RkIglbEeAu" }),
    });
    const data = await resp.json();
    res.json(data); // agora o front acessa /api/drive-files
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar arquivos do Drive" });
  }
});

// -------------------- Static --------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

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

      CREATE TABLE IF NOT EXISTS poems (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        date DATE UNIQUE
      );

      CREATE TABLE IF NOT EXISTS avaliacoes (
        id SERIAL PRIMARY KEY,
        data DATE NOT NULL,
        avaliacao TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quadro_palavras (
        id SERIAL PRIMARY KEY,
        palavra TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS today_drawings (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        type TEXT NOT NULL, 
        content TEXT,       
        url TEXT            
      );

      CREATE TABLE IF NOT EXISTS avisos (
        id SERIAL PRIMARY KEY,
        mensagem TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS polls (
        id SERIAL PRIMARY KEY,
        pergunta TEXT NOT NULL,
        opcoes TEXT[] NOT NULL,       -- array de opções
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS poll_votes (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
        opcao TEXT NOT NULL,
        ip VARCHAR(100),              -- pra evitar múltiplos votos do mesmo IP
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );



    `);

    await pool.query(
  "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_data') THEN ALTER TABLE avaliacoes ADD CONSTRAINT unique_data UNIQUE (data); END IF; END $$;"
);


    const adminRes = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      ["admin"]
    );
    if (adminRes.rows.length === 0) {
      const hash = await bcrypt.hash("F1003J", 10);
      await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        ["admin", hash]
      );
      console.log(
        "Usuário admin criado -> usuário: admin / senha: 1234 (altere depois)"
      );
    }

    app.listen(PORT, () =>
      console.log(`Servidor rodando em http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Erro inicializando o banco:", err);
    process.exit(1);
  }
})();

// -------------------- Routes --------------------

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Dados incompletos" });
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
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
    if (!req.file)
      return res.status(400).json({ error: "Arquivo não enviado" });
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
    const { rows } = await pool.query(
      "SELECT * FROM musicas ORDER BY data, posicao"
    );
    const out = {};
    for (const r of rows) {
      if (!out[r.data]) out[r.data] = [];
      out[r.data][r.posicao - 1] = {
        id: r.id,
        titulo: r.titulo,
        audio: r.audio,
        letra: r.letra,
        capa: r.capa,
        posicao: r.posicao,
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
    const { rows } = await pool.query(
      "SELECT * FROM musicas ORDER BY data DESC, posicao"
    );
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
    if (!data)
      return res
        .status(400)
        .json({ error: "Campo data é obrigatório (AAAA-MM-DD)" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
      return res.status(400).json({ error: "Data inválida. Use AAAA-MM-DD" });

    let p;
    if (posicao) {
      p = parseInt(posicao, 10);
      if (isNaN(p) || p < 1)
        return res.status(400).json({ error: "posicao inválida" });
    } else {
      const maxRes = await pool.query(
        "SELECT MAX(posicao) as m FROM musicas WHERE data = $1",
        [data]
      );
      p =
        maxRes.rows[0] && maxRes.rows[0].m
          ? parseInt(maxRes.rows[0].m, 10) + 1
          : 1;
    }

    const upsertSql = `
      INSERT INTO musicas (data, posicao, titulo, audio, letra, capa)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (data, posicao)
      DO UPDATE SET titulo = EXCLUDED.titulo, audio = EXCLUDED.audio, letra = EXCLUDED.letra, capa = EXCLUDED.capa
      RETURNING posicao;
    `;
    const { rows } = await pool.query(upsertSql, [
      data,
      p,
      titulo || null,
      audio || null,
      letra || null,
      capa || null,
    ]);
    res.json({ success: true, posicao: rows[0].posicao });
  } catch (err) {
    console.error("Erro ao salvar música:", err);
    res.status(500).json({ error: "Erro ao salvar música" });
  }
});


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
    const { rows } = await pool.query(
      "SELECT * FROM memories ORDER BY posicao, id"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar lembranças públicas:", err);
    res.status(500).json({ error: "Erro ao buscar lembranças" });
  }
});

// GET admin
app.get("/api/admin/memories", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM memories ORDER BY posicao, id"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar lembranças admin:", err);
    res.status(500).json({ error: "Erro ao buscar lembranças" });
  }
});


app.post("/api/memories", auth, async (req, res) => {
  try {
    const { image, message, posicao } = req.body;
    if (!image || !message)
      return res
        .status(400)
        .json({ error: "Campos image e message são obrigatórios" });

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

app.post("/api/send-telegram-alert", async (req, res) => {
  const { message, type } = req.body;
  if (!message) return res.status(400).json({ success: false, error: "Mensagem não fornecida" });

  let token, chat_id;
  if (type === "visitas") {
    token = process.env.TELEGRAM_BOT_TOKEN_VISITAS;
    chat_id = process.env.TELEGRAM_CHAT_ID_VISITAS;
  } else {
    token = process.env.TELEGRAM_BOT_TOKEN_INTERACOES;
    chat_id = process.env.TELEGRAM_CHAT_ID_INTERACOES;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: message }),
    });
    const data = await response.json();
    if (data.ok) res.json({ success: true });
    else res.status(500).json({ success: false, error: data.description });
  } catch (err) {
    console.error("Erro Telegram:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// GET todos os poemas (admin)
app.get("/api/admin/poems", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM poems ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar poemas:", err);
    res.status(500).json({ error: "Erro ao buscar poemas" });
  }
});

// GET poema do dia
app.get("/api/poem", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const result = await pool.query(
      "SELECT content FROM poems WHERE date = $1",
      [today]
    );

    if (result.rows.length > 0) {
      res.json({ poem: result.rows[0].content });
    } else {
      res.json({ poem: "💖 Nenhum poema cadastrado para hoje 💖" });
    }
  } catch (err) {
    console.error("Erro ao buscar poema:", err);
    res.status(500).json({ poem: "Erro ao carregar poema" });
  }
});

// POST adicionar/editar poema diário (admin)
app.post("/api/admin/poem", auth, async (req, res) => {
  try {
    const { content, date } = req.body;
    if (!content || !date) {
      return res
        .status(400)
        .json({ error: "Campos 'content' e 'date' são obrigatórios" });
    }

    // Inserir ou atualizar o poema do dia
    await pool.query(
      `
      INSERT INTO poems (date, content)
      VALUES ($1, $2)
      ON CONFLICT (date)
      DO UPDATE SET content = EXCLUDED.content
    `,
      [date, content]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar poema:", err);
    res.status(500).json({ error: "Erro ao salvar poema" });
  }
});

app.delete("/api/admin/poems/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM poems WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar poema" });
  }
});

// POST adicionar/editar avaliação do dia

// GET avaliação do dia
app.get("/api/avaliacao-dia/:data", async (req, res) => {
  try {
    const { data } = req.params;
    const result = await pool.query(
      "SELECT * FROM avaliacoes WHERE data = $1",
      [data]
    );
    res.json({ avaliacao: result.rows[0]?.avaliacao || null });
  } catch (err) {
    console.error("Erro ao buscar avaliação:", err);
    res.status(500).json({ error: "Erro ao buscar avaliação" });
  }
});

app.post("/api/avaliacao-dia", async (req, res) => {
  try {
    const { data, avaliacao } = req.body;
    if (!data || !avaliacao) {
      return res
        .status(400)
        .json({ error: "Data e avaliação são obrigatórios" });
    }

    // Tenta atualizar primeiro
    const updateRes = await pool.query(
      "UPDATE avaliacoes SET avaliacao = $2 WHERE data = $1 RETURNING *",
      [data, avaliacao]
    );

    let row;
    if (updateRes.rows.length > 0) {
      row = updateRes.rows[0];
    } else {
      // Se não existia, insere
      const insertRes = await pool.query(
        "INSERT INTO avaliacoes (data, avaliacao) VALUES ($1, $2) RETURNING *",
        [data, avaliacao]
      );
      row = insertRes.rows[0];
    }

    res.json({ success: true, avaliacao: row });
  } catch (err) {
    console.error("Erro ao salvar avaliação:", err);
    res.status(500).json({ error: "Erro ao salvar avaliação" });
  }
});

// GET todas as palavras (público ou protegido)
app.get("/api/quadro-palavras", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, palavra FROM quadro_palavras ORDER BY created_at ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar palavras" });
  }
});

// POST adicionar palavra
app.post("/api/quadro-palavras", async (req, res) => {
  try {
    const { palavra } = req.body;
    if (!palavra)
      return res.status(400).json({ error: "Palavra é obrigatória" });

    const { rows } = await pool.query(
      "INSERT INTO quadro_palavras (palavra) VALUES ($1) RETURNING *",
      [palavra]
    );
    res.json({ success: true, palavra: rows[0] });
  } catch (err) {
    console.error("Erro ao salvar palavra:", err);
    res.status(500).json({ error: "Erro ao salvar palavra" });
  }
});

// DELETE palavra (admin)
app.delete("/api/admin/quadro-palavras/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM quadro_palavras WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar palavra:", err);
    res.status(500).json({ error: "Erro ao deletar palavra" });
  }
});

// Depois os arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use("/uploads", express.static(uploadsDir));

// GET Desenho do Dia
app.get("/api/today-drawing", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const result = await pool.query(
      "SELECT * FROM today_drawings WHERE date = $1",
      [today]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, ...result.rows[0] });
    } else {
      res.json({
        success: false,
        message: "Nenhum desenho cadastrado para hoje.",
      });
    }
  } catch (err) {
    console.error("Erro ao buscar desenho:", err);
    res.status(500).json({ success: false, error: "Erro ao buscar desenho" });
  }
});

// POST adicionar/editar desenho do dia
app.post("/api/admin/today-drawing", auth, async (req, res) => {
  try {
    const { date, type, content, url } = req.body;
    if (!date || !type) {
      return res
        .status(400)
        .json({ error: "Campos 'date' e 'type' são obrigatórios" });
    }

    await pool.query(
      `
      INSERT INTO today_drawings (date, type, content, url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (date)
      DO UPDATE SET type = EXCLUDED.type, content = EXCLUDED.content, url = EXCLUDED.url
    `,
      [date, type, content || null, url || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar desenho:", err);
    res.status(500).json({ error: "Erro ao salvar desenho" });
  }
});

// GET público (todos os avisos)
app.get("/api/avisos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM avisos ORDER BY criado_em DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar avisos:", err);
    res.status(500).json({ error: "Erro ao buscar avisos" });
  }
});

// POST admin (adicionar aviso)
app.post("/api/avisos", auth, async (req, res) => {
  try {
    const { mensagem } = req.body;
    if (!mensagem) return res.status(400).json({ error: "Mensagem obrigatória" });

    await pool.query("INSERT INTO avisos (mensagem) VALUES ($1)", [mensagem]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar aviso:", err);
    res.status(500).json({ error: "Erro ao salvar aviso" });
  }
});

// DELETE admin (remover aviso)
app.delete("/api/avisos/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM avisos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar aviso:", err);
    res.status(500).json({ error: "Erro ao deletar aviso" });
  }
});


// Criar votação (admin)
app.post("/api/polls", auth, async (req, res) => {
  try {
    const { pergunta, opcoes } = req.body;
    if (!pergunta || !opcoes || !Array.isArray(opcoes))
      return res.status(400).json({ error: "Pergunta e opções obrigatórias" });

    const { rows } = await pool.query(
      "INSERT INTO polls (pergunta, opcoes) VALUES ($1, $2) RETURNING *",
      [pergunta, opcoes]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao criar votação:", err);
    res.status(500).json({ error: "Erro ao criar votação" });
  }
});

// Listar votações ativas (público)
app.get("/api/polls", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM polls ORDER BY criado_em DESC LIMIT 5");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar votações" });
  }
});

// Votar (permite múltiplos votos)
app.post("/api/polls/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    const { opcao } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const pollRes = await pool.query("SELECT * FROM polls WHERE id = $1", [id]);
    if (pollRes.rows.length === 0)
      return res.status(404).json({ error: "Votação não encontrada" });

    const poll = pollRes.rows[0];
    if (!poll.opcoes.includes(opcao))
      return res.status(400).json({ error: "Opção inválida" });

    // Agora sempre grava, sem checar IP
    await pool.query(
      "INSERT INTO poll_votes (poll_id, opcao, ip) VALUES ($1, $2, $3)",
      [id, opcao, ip]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao votar:", err);
    res.status(500).json({ error: "Erro ao votar" });
  }
});

// Resultados
app.get("/api/polls/:id/results", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT opcao, COUNT(*) as votos FROM poll_votes WHERE poll_id=$1 GROUP BY opcao",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar resultados" });
  }
});

// DELETE poll (admin)
app.delete("/api/polls/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    // Deleta a poll e todos os votos associados (CASCADE)
    await pool.query("DELETE FROM polls WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar poll:", err);
    res.status(500).json({ error: "Erro ao deletar votação" });
  }
});

// Rota para retornar o IP do cliente
app.get("/api/get-ip", (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();
  res.json({ ip });
});

