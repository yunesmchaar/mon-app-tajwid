const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");

// ─── Générer un JWT ───
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// ─── POST /api/auth/register ───
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Nom trop court"),
    body("email").isEmail().withMessage("Email invalide"),
    body("password").isLength({ min: 6 }).withMessage("Mot de passe: 6 caractères minimum"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      // Vérifier unicité email
      const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length) return res.status(400).json({ error: "Email déjà utilisé" });

      // Hasher le mot de passe
      const password_hash = await bcrypt.hash(password, 12);

      // Créer l'utilisateur (le trigger SQL initialise automatiquement les règles Tajwid)
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) 
         RETURNING id, name, email, streak, level`,
        [name, email, password_hash]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
  }
);

// ─── POST /api/auth/login ───
router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const result = await db.query(
        "SELECT id, name, email, password_hash, streak, level, total_score FROM users WHERE email = $1",
        [email]
      );
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

      // Mettre à jour la streak
      await updateStreak(user.id);

      const token = generateToken(user.id);
      delete user.password_hash;

      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur de connexion" });
    }
  }
);

// ─── GET /api/auth/me ───
router.get("/me", authMiddleware, async (req, res) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.streak, u.level, u.total_score, u.avatar_url, u.is_public,
            COUNT(DISTINCT s.id) AS total_sessions,
            ROUND(AVG(s.score)) AS avg_score
     FROM users u
     LEFT JOIN sessions s ON s.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.user.id]
  );
  res.json(result.rows[0]);
});

// ─── PATCH /api/auth/profile ───
router.patch("/profile", authMiddleware, async (req, res) => {
  const { name, is_public } = req.body;
  const result = await db.query(
    `UPDATE users SET name = COALESCE($1, name), is_public = COALESCE($2, is_public)
     WHERE id = $3 RETURNING id, name, is_public`,
    [name, is_public, req.user.id]
  );
  res.json(result.rows[0]);
});

// ─── Helper: mise à jour streak ───
async function updateStreak(userId) {
  const result = await db.query(
    "SELECT last_session_date, streak FROM users WHERE id = $1",
    [userId]
  );
  const { last_session_date, streak } = result.rows[0];
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = streak;
  if (last_session_date === yesterday) newStreak = streak + 1;
  else if (last_session_date !== today) newStreak = 1;

  await db.query(
    "UPDATE users SET streak = $1, last_session_date = $2 WHERE id = $3",
    [newStreak, today, userId]
  );
}

module.exports = router;
