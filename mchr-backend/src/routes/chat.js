const express = require("express");
const router = express.Router();
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");

// ─── GET /api/chat/:room — Historique d'une salle ───
router.get("/:room", authMiddleware, async (req, res) => {
  const { room } = req.params;
  const validRooms = ["general", "debutant", "avance"];
  if (!validRooms.includes(room)) return res.status(400).json({ error: "Salle invalide" });

  const result = await db.query(
    `SELECT m.id, m.content, m.created_at, u.name AS author, u.level, u.avatar_url
     FROM chat_messages m
     JOIN users u ON u.id = m.user_id
     WHERE m.room = $1
     ORDER BY m.created_at DESC
     LIMIT 50`,
    [room]
  );

  res.json(result.rows.reverse());
});

module.exports = router;
