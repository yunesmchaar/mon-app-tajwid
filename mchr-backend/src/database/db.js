const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Requis pour Supabase
});

pool.on("error", (err) => console.error("❌ Erreur DB:", err));

// Tester la connexion au démarrage
pool.query("SELECT 1")
  .then(() => console.log("✅ Connecté à PostgreSQL (Supabase)"))
  .catch((err) => console.error("❌ Connexion DB échouée:", err.message));

module.exports = pool;