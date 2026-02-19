const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");
const { analyzeRecitation, getGrade, computeNewProgress } = require("../services/tajwidAnalyzer");

// ─── Multer: stockage audio en mémoire ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/webm", "audio/mp4", "audio/wav", "audio/mpeg", "audio/ogg"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ─── POST /api/sessions — Soumettre une récitation ───
router.post("/", authMiddleware, upload.single("audio"), async (req, res) => {
  const { sourate_id, sourate_name, sourate_arabic, sourate_french, duration } = req.body;

  if (!req.file) return res.status(400).json({ error: "Fichier audio requis" });
  if (!sourate_id) return res.status(400).json({ error: "sourate_id requis" });

  try {
    // 1. Analyser avec l'IA
    const sourate = { name: sourate_arabic, french: sourate_french, arabicFull: sourate_arabic };
    const analysis = await analyzeRecitation(req.file.buffer, sourate);

    // 2. Sauvegarder la session
    const sessionResult = await db.query(
      `INSERT INTO sessions (user_id, sourate_id, sourate_name, score, grade, duration, tajwid_details, feedback_ai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        sourate_id,
        sourate_name || sourate_french,
        analysis.score,
        analysis.grade,
        parseInt(duration) || 0,
        JSON.stringify(analysis.rules),
        analysis.feedback,
      ]
    );
    const session = sessionResult.rows[0];

    // 3. Mettre à jour la progression Tajwid
    for (const [ruleName, ruleScore] of Object.entries(analysis.rules)) {
      const existing = await db.query(
        "SELECT progress FROM tajwid_progress WHERE user_id = $1 AND rule_name = $2",
        [req.user.id, ruleName]
      );
      const oldProgress = existing.rows[0]?.progress || 0;
      const newProgress = computeNewProgress(oldProgress, ruleScore);

      await db.query(
        `INSERT INTO tajwid_progress (user_id, rule_name, progress)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, rule_name) DO UPDATE SET progress = $3, updated_at = NOW()`,
        [req.user.id, ruleName, newProgress]
      );
    }

    // 4. Mettre à jour le score total utilisateur
    await db.query(
      "UPDATE users SET total_score = total_score + $1 WHERE id = $2",
      [analysis.score, req.user.id]
    );

    // 5. Sauvegarder le score hebdomadaire
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0=Lundi
    const weekStart = getWeekStart(today);
    await db.query(
      `INSERT INTO weekly_scores (user_id, day_of_week, score, week_start)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, week_start, day_of_week) 
       DO UPDATE SET score = GREATEST(weekly_scores.score, $3)`,
      [req.user.id, dayOfWeek, analysis.score, weekStart]
    );

    // 6. Vérifier et attribuer des badges
    const newBadges = await checkAndAwardBadges(req.user.id, analysis.score, session);

    // 7. Mettre à jour le niveau utilisateur
    await updateUserLevel(req.user.id);

    res.status(201).json({
      session,
      analysis: {
        score: analysis.score,
        grade: analysis.grade,
        rules: analysis.rules,
        feedback: analysis.feedback,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
      },
      newBadges,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'analyse de la récitation" });
  }
});

// ─── GET /api/sessions — Historique de l'utilisateur ───
router.get("/", authMiddleware, async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  const result = await db.query(
    `SELECT id, sourate_name, score, grade, duration, tajwid_details, feedback_ai, created_at
     FROM sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  // Formater la durée
  const sessions = result.rows.map((s) => ({
    ...s,
    durationFormatted: formatDuration(s.duration),
    dateFormatted: formatDate(s.created_at),
  }));

  res.json(sessions);
});

// ─── GET /api/sessions/:id — Détail d'une session ───
router.get("/:id", authMiddleware, async (req, res) => {
  const result = await db.query(
    "SELECT * FROM sessions WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Session introuvable" });
  res.json(result.rows[0]);
});

// ─── Helpers ───
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return `Il y a ${diff} jours`;
}

async function checkAndAwardBadges(userId, score, session) {
  const newBadges = [];
  const sessionCount = await db.query("SELECT COUNT(*) FROM sessions WHERE user_id = $1", [userId]);
  const streak = await db.query("SELECT streak FROM users WHERE id = $1", [userId]);
  const currentStreak = streak.rows[0]?.streak || 0;

  const badgeCriteria = [
    { id: 1, name: "Première Récitation", icon: "🌙", check: () => parseInt(sessionCount.rows[0].count) === 1 },
    { id: 2, name: "7 Jours Consécutifs", icon: "⭐", check: () => currentStreak >= 7 },
    { id: 4, name: "Excellence", icon: "🏆", check: () => score >= 98 },
    { id: 5, name: "30 Jours de Feu", icon: "🔥", check: () => currentStreak >= 30 },
  ];

  for (const badge of badgeCriteria) {
    if (!badge.check()) continue;
    const already = await db.query(
      "SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2",
      [userId, badge.id]
    );
    if (!already.rows.length) {
      await db.query(
        "INSERT INTO user_badges (user_id, badge_id, badge_name) VALUES ($1, $2, $3)",
        [userId, badge.id, badge.name]
      );
      newBadges.push({ id: badge.id, name: badge.name, icon: badge.icon });
    }
  }

  return newBadges;
}

async function updateUserLevel(userId) {
  const result = await db.query("SELECT total_score FROM users WHERE id = $1", [userId]);
  const score = result.rows[0]?.total_score || 0;
  let level = "Débutant";
  if (score >= 5000) level = "Expert";
  else if (score >= 2000) level = "Avancé";
  else if (score >= 500) level = "Intermédiaire";
  await db.query("UPDATE users SET level = $1 WHERE id = $2", [level, userId]);
}

module.exports = router;
