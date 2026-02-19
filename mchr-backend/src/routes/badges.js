const express = require("express");
const router = express.Router();
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");

const ALL_BADGES = [
  { id: 1, icon: "🌙", name: "Première Récitation", desc: "Première session complétée" },
  { id: 2, icon: "⭐", name: "7 Jours Consécutifs", desc: "Pratique quotidienne régulière" },
  { id: 3, icon: "📖", name: "Al-Fatiha Maîtrisée", desc: "Score > 90% sur Al-Fatiha" },
  { id: 4, icon: "🏆", name: "Excellence", desc: "Score parfait obtenu" },
  { id: 5, icon: "🔥", name: "30 Jours de Feu", desc: "30 jours consécutifs" },
  { id: 6, icon: "💎", name: "Maître du Madd", desc: "Madd parfait 10 fois" },
  { id: 7, icon: "🌟", name: "Hafiz Junior", desc: "4 sourates maîtrisées" },
  { id: 8, icon: "👑", name: "Grand Récitant", desc: "Score moyen > 95%" },
];

// ─── GET /api/badges — Badges de l'utilisateur ───
router.get("/", authMiddleware, async (req, res) => {
  const earned = await db.query(
    "SELECT badge_id, earned_at FROM user_badges WHERE user_id = $1",
    [req.user.id]
  );

  const earnedIds = new Set(earned.rows.map((r) => r.badge_id));

  const badges = ALL_BADGES.map((b) => ({
    ...b,
    earned: earnedIds.has(b.id),
    earned_at: earned.rows.find((r) => r.badge_id === b.id)?.earned_at || null,
  }));

  res.json(badges);
});

module.exports = router;
