const express = require("express");
const router = express.Router();
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");

// ─── GET /api/leaderboard — Classement public ───
router.get("/", async (req, res) => {
  const { limit = 20 } = req.query;

  const result = await db.query(
    `SELECT
       id, name, avatar_url, streak, total_score, level,
       total_sessions, avg_score, badges_count, rank
     FROM leaderboard
     LIMIT $1`,
    [limit]
  );

  res.json(result.rows);
});

// ─── GET /api/leaderboard/me — Rang de l'utilisateur connecté ───
router.get("/me", authMiddleware, async (req, res) => {
  const result = await db.query(
    "SELECT rank, total_score, level, streak FROM leaderboard WHERE id = $1",
    [req.user.id]
  );

  if (!result.rows[0]) {
    return res.json({ rank: null, message: "Profil non public ou aucune session" });
  }

  res.json(result.rows[0]);
});

// ─── PATCH /api/leaderboard/visibility — Changer visibilité profil ───
router.patch("/visibility", authMiddleware, async (req, res) => {
  const { is_public } = req.body;
  await db.query("UPDATE users SET is_public = $1 WHERE id = $2", [is_public, req.user.id]);
  res.json({ is_public, message: is_public ? "Profil visible publiquement" : "Profil masqué" });
});

module.exports = router;
