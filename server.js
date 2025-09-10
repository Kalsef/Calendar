import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

import { pool } from "./config/db.js";

// Rotas
import authRoutes from "./routes/authRoutes.js";
// TODO: importar todas as outras rotas: musicRoutes, memoryRoutes etc.

dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- Middlewares --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Session --------------------
const pgStore = pgSession(session);
app.use(
  session({
    store: new pgStore({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 3600 * 1000 },
  })
);

// -------------------- Uploads --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// -------------------- Rotas --------------------
app.use("/api", authRoutes);
// TODO: app.use("/api", musicRoutes); etc.

// -------------------- Static --------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir));

// -------------------- Inicialização --------------------
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
