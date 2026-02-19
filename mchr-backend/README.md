# 🕌 MCHR Tajwid — Back-End Complet

**Stack:** Node.js · Express · PostgreSQL (Supabase) · OpenAI · Socket.IO

---

## 📁 Structure des fichiers

```
mchr-backend/
├── src/
│   ├── app.js                    ← Point d'entrée principal
│   ├── database/
│   │   ├── db.js                 ← Connexion PostgreSQL
│   │   └── schema.sql            ← Toutes les tables SQL
│   ├── middleware/
│   │   └── auth.js               ← Vérification JWT
│   ├── routes/
│   │   ├── auth.js               ← Inscription / Connexion
│   │   ├── sessions.js           ← Soumettre récitation + analyse IA
│   │   ├── progress.js           ← Progression Tajwid + stats
│   │   ├── badges.js             ← Système de badges
│   │   ├── leaderboard.js        ← Classement public
│   │   ├── chat.js               ← Historique chat REST
│   │   └── sourates.js           ← Liste des sourates
│   └── services/
│       ├── tajwidAnalyzer.js     ← IA Whisper + GPT-4
│       └── socketChat.js         ← Chat temps réel
└── frontend-integration/
    └── api.js                    ← Client API pour le JSX React
```

---

## 🚀 Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
# Puis remplir chaque variable dans .env
```

### 3. Créer la base de données

**Option A — Supabase (recommandé, gratuit)**
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **SQL Editor** et collez le contenu de `src/database/schema.sql`
4. Copiez l'URL de connexion dans `.env` → `DATABASE_URL`

**Option B — PostgreSQL local**
```bash
psql -U postgres -c "CREATE DATABASE mchr_tajwid;"
psql -U postgres -d mchr_tajwid -f src/database/schema.sql
```

### 4. Obtenir une clé OpenAI
1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez une clé API
3. Collez-la dans `.env` → `OPENAI_API_KEY`

### 5. Lancer le serveur
```bash
# Développement (avec rechargement auto)
npm run dev

# Production
npm start
```

---

## 📡 Endpoints API

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| GET | `/api/auth/me` | Profil connecté |
| **POST** | **`/api/sessions`** | **Soumettre audio → analyse IA** |
| GET | `/api/sessions` | Historique récitations |
| GET | `/api/progress` | Progression par règle Tajwid |
| GET | `/api/progress/weekly` | Scores semaine |
| GET | `/api/progress/stats` | Statistiques globales |
| GET | `/api/badges` | Badges de l'utilisateur |
| GET | `/api/leaderboard` | Classement public |
| GET | `/api/leaderboard/me` | Mon rang |
| GET | `/api/chat/:room` | Historique du chat |
| **WS** | **`Socket.IO`** | **Chat en temps réel** |

---

## 🔌 Intégration dans le JSX React

Copiez `frontend-integration/api.js` dans votre projet React,
puis remplacez les données statiques :

```jsx
// AVANT (données hardcodées)
const SESSIONS = [ { id: 1, sourate: "Al-Fatiha", ... } ];

// APRÈS (données dynamiques)
import { sessionsAPI } from "./api";
const [sessions, setSessions] = useState([]);
useEffect(() => {
  sessionsAPI.getHistory().then(setSessions);
}, []);
```

---

## ☁️ Déploiement

```
API Express  → Railway.app ou Render.com (gratuit)
Base de données → Supabase (gratuit jusqu'à 500MB)
```

### Déployer sur Railway
```bash
npm install -g railway
railway login
railway init
railway up
```

---

## 🤖 Fonctionnement de l'IA

1. L'audio est envoyé via `POST /api/sessions` en `multipart/form-data`
2. **Whisper** transcrit l'audio en arabe
3. **GPT-4** compare la transcription au texte coranique et note chaque règle Tajwid (0-100)
4. Le score global, le feedback et la progression sont sauvegardés en base
5. Les badges sont attribués automatiquement si les critères sont remplis
