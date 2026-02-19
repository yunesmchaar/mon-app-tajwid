require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");
const progressRoutes = require("./routes/progress");
const badgeRoutes = require("./routes/badges");
const souratRoutes = require("./routes/sourates");
const leaderboardRoutes = require("./routes/leaderboard");
const chatRoutes = require("./routes/chat");
const { setupSocketChat } = require("./services/socketChat");

const app = express();
const server = http.createServer(app);

// ─── Socket.IO pour le chat en temps réel ───
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
setupSocketChat(io);

// ─── Middlewares globaux ───
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ─── Routes ───
app.use("/api/auth",        authRoutes);
app.use("/api/sessions",    sessionRoutes);
app.use("/api/progress",    progressRoutes);
app.use("/api/badges",      badgeRoutes);
app.use("/api/sourates",    souratRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/chat",        chatRoutes);

// ─── Route santé ───
app.get("/api/health", (req, res) => res.json({ status: "ok", app: "MCHR Tajwid" }));

// ─── Gestion d'erreurs globale ───
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Erreur serveur" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🕌 MCHR Tajwid — Serveur démarré sur le port ${PORT}`);
  console.log(`📡 Socket.IO actif pour le chat en temps réel\n`);
});
