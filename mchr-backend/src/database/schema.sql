-- ════════════════════════════════════════════════════
--  MCHR TAJWID — Schéma Base de Données Complet
--  Compatible PostgreSQL / Supabase
-- ════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. Utilisateurs ─────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  streak        INTEGER DEFAULT 0,
  total_score   INTEGER DEFAULT 0,         -- Score cumulé pour le classement
  level         VARCHAR(50) DEFAULT 'Débutant',
  last_session_date DATE,
  is_public     BOOLEAN DEFAULT TRUE,      -- Profil visible dans le classement public
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─── 2. Sessions d'enregistrement ────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sourate_id     INTEGER NOT NULL,
  sourate_name   VARCHAR(100),
  score          INTEGER CHECK (score BETWEEN 0 AND 100),
  grade          VARCHAR(50),             -- Excellent, Très Bien, Bien...
  duration       INTEGER,                 -- durée en secondes
  audio_url      TEXT,                    -- URL Cloudinary
  tajwid_details JSONB DEFAULT '{}',     -- { "Madd": 90, "Ghunna": 75, ... }
  feedback_ai    TEXT,                    -- Retour qualitatif de l'IA
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─── 3. Progression Tajwid par règle ─────────────────
CREATE TABLE IF NOT EXISTS tajwid_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_name   VARCHAR(50) NOT NULL,
  progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, rule_name)
);

-- ─── 4. Badges ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   INTEGER NOT NULL,
  badge_name VARCHAR(100),
  earned_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ─── 5. Classement public (vue) ───────────────────────
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.avatar_url,
  u.streak,
  u.total_score,
  u.level,
  u.created_at,
  COUNT(DISTINCT s.id) AS total_sessions,
  ROUND(AVG(s.score)) AS avg_score,
  COUNT(DISTINCT ub.id) AS badges_count,
  RANK() OVER (ORDER BY u.total_score DESC) AS rank
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.is_public = TRUE
GROUP BY u.id
ORDER BY u.total_score DESC;

-- ─── 6. Messages du chat communautaire ───────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  room       VARCHAR(50) DEFAULT 'general', -- general, debutant, avance
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── 7. Données hebdomadaires par utilisateur ─────────
CREATE TABLE IF NOT EXISTS weekly_scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Lundi
  score      INTEGER DEFAULT 0,
  week_start DATE NOT NULL,
  UNIQUE(user_id, week_start, day_of_week)
);

-- ─── Indexes pour performances ────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tajwid_user ON tajwid_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON users(total_score DESC);

-- ─── Données initiales: règles Tajwid ─────────────────
-- (Insérées automatiquement à la création d'un utilisateur via trigger)
CREATE OR REPLACE FUNCTION init_tajwid_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tajwid_progress (user_id, rule_name, progress)
  VALUES
    (NEW.id, 'Madd', 0), (NEW.id, 'Ghunna', 0), (NEW.id, 'Qalqala', 0),
    (NEW.id, 'Idgham', 0), (NEW.id, 'Ikhfa', 0), (NEW.id, 'Iqlab', 0),
    (NEW.id, 'Izhar', 0), (NEW.id, 'Waqf', 0), (NEW.id, 'Hamza', 0),
    (NEW.id, 'Tafkhim', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_init_tajwid
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION init_tajwid_progress();
