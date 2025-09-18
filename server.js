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

// -------------------- Middlewares --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function auth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Não autorizado" });
}

function authAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Acesso negado: apenas admins" });
}



// -------------------- Config DB (Postgres) --------------------
// -------------------- Pool Postgres --------------------
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

app.use(
  session({
    store: new pgSessionStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true // <- adiciona esta linha
    }),
    secret: process.env.SESSION_SECRET || "troque_essa_chave_para_producao",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 3600 * 1000 } 
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
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file) return cb(null, true); // permite envio sem arquivo
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos"));
    }
  }
});



const uploadImage = multer({ dest: "uploads/" }); // pasta temporária





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



// -------------------- Static --------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", authAdmin, express.static(path.join(__dirname, "admin")));
app.get("/admin", authAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
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

      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );


      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
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

      ALTER TABLE musicas
        ALTER COLUMN data TYPE DATE
        USING data::date;

      ALTER TABLE quadro_palavras
        ADD COLUMN IF NOT EXISTS image TEXT;

      ALTER TABLE quadro_palavras ALTER COLUMN palavra DROP NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

      INSERT INTO config (key, value) VALUES ('allow_registration', 'true')
      ON CONFLICT (key) DO NOTHING;

      ALTER TABLE access_logs
      DROP CONSTRAINT access_logs_user_id_fkey,
      ADD CONSTRAINT access_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


    `);


    await pool.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name='quadro_palavras' AND column_name='imagem'
    ) THEN
      ALTER TABLE quadro_palavras ADD COLUMN imagem TEXT;
    END IF;
  END;
  $$;
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
    "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
    ["admin", hash, "admin"]
  );
  console.log("Usuário admin criado -> usuário: admin / senha: 1234 (altere depois)");
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
     const { rows } = await pool.query(`
       SELECT id,
         TO_CHAR("data", 'YYYY-MM-DD') as data,
         titulo,
         posicao,
         audio,
         capa,
         letra
  FROM musicas
  ORDER BY "data", posicao
    `);
    const out = {};
for (const r of rows) {
  if (!out[r.data]) out[r.data] = [];
  out[r.data][r.posicao - 1] = {
    id: r.id,
    data: r.data,       // <- adiciona isso
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
app.get("/api/admin/musicas", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id,
             TO_CHAR(data, 'YYYY-MM-DD') as data,
             posicao,
             titulo,
             audio,
             capa,
             letra
      FROM musicas
      ORDER BY data DESC, posicao
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro" });
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
app.get("/api/admin/memories", authAdmin, async (req, res) => {
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

// POST adicionar memória
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
app.get("/api/admin/poems", authAdmin, async (req, res) => {
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
app.post("/api/admin/poem", authAdmin, async (req, res) => {
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

app.delete("/api/admin/poems/:id", authAdmin, async (req, res) => {
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

// GET todas as palavras (público)
app.get("/api/quadro-palavras", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, palavra, image, created_at FROM quadro_palavras ORDER BY id DESC"
    );

    // Nenhuma conversão extra — o link do GitHub já vem pronto
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar quadro de palavras:", err);
    res.status(500).json({ error: "Erro ao buscar quadro de palavras" });
  }
});






// DELETE palavra (admin)
app.delete("/api/admin/quadro-palavras/:id", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM quadro_palavras WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar palavra:", err);
    res.status(500).json({ error: "Erro ao deletar palavra" });
  }
});


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
app.post("/api/admin/today-drawing", authAdmin, async (req, res) => {
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








async function uploadToGitHub(filePath, fileName) {
  const content = fs.readFileSync(filePath, "base64");
  const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/images/${fileName}`;

  // Verifica se o arquivo já existe no repositório
  let sha = null;
  const checkRes = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `token ${process.env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (checkRes.status === 200) {
    const checkData = await checkRes.json();
    sha = checkData.sha; // necessário para atualizar o arquivo
  }

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Authorization": `token ${process.env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      message: `Upload ${fileName}`,
      content: content,
      branch: process.env.GITHUB_BRANCH || "main",
      sha: sha || undefined, // só manda se existir
    }),
  });

  const data = await res.json();
  if (!data.content || !data.content.download_url) {
    throw new Error(data.message || "Erro ao enviar para GitHub");
  }

  return data.content.download_url;
}

''


// POST adicionar palavra ou imagem (ou ambos)
app.post("/api/quadro-palavras", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    // Se veio imagem, sobe pro GitHub
    if (req.file) {
      try {
        imageUrl = await uploadToGitHub(req.file.path, req.file.filename);
        fs.unlinkSync(req.file.path); // remove temporário
      } catch (err) {
        console.error("Erro ao enviar imagem para GitHub:", err);
        return res.status(500).json({ success: false, error: "Erro ao salvar imagem" });
      }
    }

    // Palavra pode vir no body
    const palavra = req.body.palavra && req.body.palavra.trim() !== "" 
      ? req.body.palavra.trim() 
      : null;

    if (!palavra && !imageUrl) {
      return res.status(400).json({ success: false, error: "Envie uma palavra ou uma imagem" });
    }

    // Salva no banco (palavra ou imagem ou ambos)
    const { rows } = await pool.query(
      "INSERT INTO quadro_palavras (palavra, image) VALUES ($1, $2) RETURNING *",
      [palavra, imageUrl]
    );

    res.json({ success: true, item: rows[0] });
  } catch (err) {
    console.error("Erro /api/quadro-palavras:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/api/github-images", async (req, res) => {
  const githubRepo = "Kalsef/galeria-desenhos";
  const githubPath = "images";

  try {
    const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${githubPath}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------- REGISTER --------------------
app.post("/api/register", async (req, res) => {
  try {
    // Checa configuração
    const configRes = await pool.query(
      "SELECT value FROM config WHERE key = 'allow_registration'"
    );
    const allowRegistration = configRes.rows[0]?.value === "true";

    if (!allowRegistration) {
      return res.status(403).json({ error: "Registro desabilitado pelo admin" });
    }

    const { username, password } = req.body;

    // Validação básica
    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: "Usuário deve ter pelo menos 3 caracteres" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword]
    );

    req.session.userId = result.rows[0].id;
    req.session.username = result.rows[0].username;

    res.json({ success: true, message: "Usuário criado com sucesso", user: result.rows[0] });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(500).json({ error: "Erro interno ao registrar usuário" });
  }
});

// -------------------- LOGIN --------------------
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // Cria sessão
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    // Retorna informações do usuário
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username } 
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno ao fazer login" });
  }
});

app.get("/api/me", (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username } });
  } else {
    res.json({ loggedIn: false });
  }
});


// GET todos os usuários (admin)
app.get("/api/admin/users", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, role FROM users ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// POST alterar papel do usuário
app.post("/api/admin/users/:id/role", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // "user" ou "admin"

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Papel inválido" });
    }

    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao atualizar papel:", err);
    res.status(500).json({ error: "Erro ao atualizar papel" });
  }
});

// DELETE usuário
app.delete("/api/admin/users/:id", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // evita deletar o próprio admin logado
    if (parseInt(id) === req.session.userId) {
      return res.status(400).json({ error: "Não é possível deletar você mesmo" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});


app.post("/api/admin/registration", authAdmin, async (req, res) => {
  try {
    const { allow } = req.body; // true ou false

    if (typeof allow !== "boolean") {
      return res.status(400).json({ error: "Campo 'allow' deve ser booleano" });
    }

    await pool.query(
      `INSERT INTO config (key, value) VALUES ('allow_registration', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [allow.toString()]
    );

    res.json({ success: true, allow_registration: allow });
  } catch (err) {
    console.error("Erro ao atualizar configuração de registro:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.get("/api/admin/registration", authAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM config WHERE key = 'allow_registration'"
    );
    res.json({ allow_registration: result.rows[0]?.value === "true" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});



app.post("/api/send-help", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: "Mensagem vazia" });

    try {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN_INTERACOES}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID_INTERACOES,
                text: message
            })
        });
        const data = await response.json();
        if (!data.ok) throw new Error(JSON.stringify(data));
        res.json({ success: true });
    } catch (err) {
        console.error("Erro ao enviar mensagem de ajuda:", err);
        res.status(500).json({ success: false, error: "Erro ao enviar mensagem" });
    }
});
