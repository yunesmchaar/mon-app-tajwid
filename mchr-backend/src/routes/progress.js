const express = require("express");
const router = express.Router();
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");

// ─── GET /api/progress — Progression Tajwid complète ───
router.get("/", authMiddleware, async (req, res) => {
  const result = await db.query(
    "SELECT rule_name, progress FROM tajwid_progress WHERE user_id = $1 ORDER BY rule_name",
    [req.user.id]
  );
  res.json(result.rows);
});

// ─── GET /api/progress/weekly — Scores de la semaine ───
router.get("/weekly", authMiddleware, async (req, res) => {
  const weekStart = getWeekStart(new Date());
  const result = await db.query(
    `SELECT day_of_week, score FROM weekly_scores
     WHERE user_id = $1 AND week_start = $2
     ORDER BY day_of_week`,
    [req.user.id, weekStart]
  );

  const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
  const weekly = DAYS.map((day, i) => {
    const found = result.rows.find((r) => r.day_of_week === i);
    return { day, score: found?.score || 0 };
  });

  res.json(weekly);
});

// ─── GET /api/progress/stats — Statistiques globales ───
router.get("/stats", authMiddleware, async (req, res) => {
  const [userRes, sessionRes, badgeRes] = await Promise.all([
    db.query("SELECT streak, total_score, level FROM users WHERE id = $1", [req.user.id]),
    db.query(
      `SELECT COUNT(*) as total, ROUND(AVG(score)) as avg_score, MAX(score) as best_score
       FROM sessions WHERE user_id = $1`,
      [req.user.id]
    ),
    db.query("SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1", [req.user.id]),
  ]);

  res.json({
    streak: userRes.rows[0].streak,
    total_score: userRes.rows[0].total_score,
    level: userRes.rows[0].level,
    total_sessions: parseInt(sessionRes.rows[0].total),
    avg_score: parseInt(sessionRes.rows[0].avg_score) || 0,
    best_score: sessionRes.rows[0].best_score || 0,
    badges_earned: parseInt(badgeRes.rows[0].count),
  });
});

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

module.exports = router;
