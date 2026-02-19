import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   MCHR — Application d'apprentissage du Tajwid
   Design: Émeraude profond & Or | Islamique Luxe
   ───────────────────────────────────────────── */

const COLORS = {
  emerald: { 950: "#022c22", 900: "#064e3b", 800: "#065f46", 700: "#047857", 600: "#059669", 500: "#10b981", 400: "#34d399", 300: "#6ee7b7" },
  gold: { 900: "#451a03", 700: "#92400e", 500: "#f59e0b", 400: "#fbbf24", 300: "#fcd34d", 200: "#fde68a" },
  bg: "#030f0b",
  surface: "#071a11",
  card: "#0a2218",
  border: "#0d3d20",
};

const SOURATES = [
  { id: 1, name: "الفاتحة", french: "Al-Fatiha", verses: 7, level: "Débutant", arabicFull: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ" },
  { id: 2, name: "الإخلاص", french: "Al-Ikhlas", verses: 4, level: "Débutant", arabicFull: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ" },
  { id: 3, name: "الفلق", french: "Al-Falaq", verses: 5, level: "Intermédiaire", arabicFull: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِن شَرِّ مَا خَلَقَ\nوَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ" },
  { id: 4, name: "الناس", french: "An-Nas", verses: 6, level: "Intermédiaire", arabicFull: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَٰهِ النَّاسِ\nمِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ" },
];

const TAJWID_RULES = [
  { id: 1, name: "Madd", arabic: "المد", desc: "Prolongation", color: COLORS.emerald[500], progress: 82 },
  { id: 2, name: "Ghunna", arabic: "الغنة", desc: "Nasalisation", color: COLORS.gold[400], progress: 65 },
  { id: 3, name: "Qalqala", arabic: "القلقلة", desc: "Écho", color: "#a78bfa", progress: 91 },
  { id: 4, name: "Idgham", arabic: "الإدغام", desc: "Assimilation", color: "#f87171", progress: 48 },
  { id: 5, name: "Ikhfa", arabic: "الإخفاء", desc: "Occultation", color: "#38bdf8", progress: 73 },
  { id: 6, name: "Iqlab", arabic: "الإقلاب", desc: "Transformation", color: "#fb923c", progress: 59 },
  { id: 7, name: "Izhar", arabic: "الإظهار", desc: "Clarté", color: "#4ade80", progress: 87 },
  { id: 8, name: "Waqf", arabic: "الوقف", desc: "Pause", color: "#e879f9", progress: 44 },
  { id: 9, name: "Hamza", arabic: "الهمزة", desc: "Attaque glottale", color: "#fbbf24", progress: 76 },
  { id: 10, name: "Tafkhim", arabic: "التفخيم", desc: "Emphatisation", color: "#34d399", progress: 52 },
];

const BADGES = [
  { id: 1, icon: "🌙", name: "Première Récitation", desc: "Première session complétée", earned: true },
  { id: 2, icon: "⭐", name: "7 Jours Consécutifs", desc: "Pratique quotidienne régulière", earned: true },
  { id: 3, icon: "📖", name: "Al-Fatiha Maîtrisée", desc: "Score > 90% sur Al-Fatiha", earned: true },
  { id: 4, icon: "🏆", name: "Excellence", desc: "Score parfait obtenu", earned: true },
  { id: 5, icon: "🔥", name: "30 Jours de Feu", desc: "30 jours consécutifs", earned: false },
  { id: 6, icon: "💎", name: "Maître du Madd", desc: "Madd parfait 10 fois", earned: false },
  { id: 7, icon: "🌟", name: "Hafiz Junior", desc: "4 sourates maîtrisées", earned: false },
  { id: 8, icon: "👑", name: "Grand Récitant", desc: "Score moyen > 95%", earned: false },
];

const SESSIONS = [
  { id: 1, sourate: "Al-Fatiha", date: "Aujourd'hui", score: 94, duration: "4:32", grade: "Excellent" },
  { id: 2, sourate: "Al-Ikhlas", date: "Hier", score: 87, duration: "2:18", grade: "Très Bien" },
  { id: 3, sourate: "Al-Falaq", date: "Il y a 2 jours", score: 78, duration: "3:45", grade: "Bien" },
  { id: 4, sourate: "An-Nas", date: "Il y a 3 jours", score: 91, duration: "3:12", grade: "Excellent" },
  { id: 5, sourate: "Al-Fatiha", date: "Il y a 4 jours", score: 82, duration: "5:01", grade: "Très Bien" },
];

const WEEKLY = [
  { day: "L", score: 88 }, { day: "M", score: 92 }, { day: "M", score: 0 },
  { day: "J", score: 85 }, { day: "V", score: 94 }, { day: "S", score: 78 },
  { day: "D", score: 91 },
];

/* ─── Styles globaux ─── */
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #030f0b;
    --surface: #071a11;
    --card: #0a2218;
    --border: #0d3d20;
    --emerald: #10b981;
    --emerald-light: #34d399;
    --gold: #f59e0b;
    --gold-light: #fcd34d;
    --text: #e2fdf2;
    --text-muted: #4d9e70;
    --radius: 16px;
  }

  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: 'Cormorant Garamond', serif; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes waveform { 0%, 100% { height: 4px; } 50% { height: 32px; } }
  @keyframes ringFill { from { stroke-dashoffset: 440; } }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); } 50% { box-shadow: 0 0 40px rgba(16,185,129,0.6), 0 0 60px rgba(245,158,11,0.2); } }
  @keyframes logoRotate { 0% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(5deg) scale(1.05); } 75% { transform: rotate(-5deg) scale(1.05); } 100% { transform: rotate(0deg) scale(1); } }
  @keyframes starFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(180deg); } }
  @keyframes patternFade { from { opacity: 0; } to { opacity: 0.06; } }
  @keyframes streakBounce { 0% { transform: scale(0.8); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
  @keyframes progressFill { from { width: 0; } to { width: var(--target-width); } }
  @keyframes countUp { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
  @keyframes recordPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(239,68,68,0); } }
  @keyframes islamicPattern { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ─── Composant: Pattern islamique ─── */
function IslamicPattern() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, animation: "patternFade 2s ease forwards" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamic" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#10b981" strokeWidth="0.5">
            <polygon points="40,5 75,20 75,60 40,75 5,60 5,20" />
            <polygon points="40,15 65,25 65,55 40,65 15,55 15,25" />
            <circle cx="40" cy="40" r="8" />
            <line x1="40" y1="5" x2="40" y2="15" />
            <line x1="75" y1="20" x2="65" y2="25" />
            <line x1="75" y1="60" x2="65" y2="55" />
            <line x1="40" y1="75" x2="40" y2="65" />
            <line x1="5" y1="60" x2="15" y2="55" />
            <line x1="5" y1="20" x2="15" y2="25" />
            <polygon points="40,0 80,40 40,80 0,40" fill="none" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic)" />
    </svg>
  );
}

/* ─── Composant: Logo MCHR ─── */
function MCHRLogo({ size = 80, animate = false }) {
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: size, height: size,
        background: "linear-gradient(135deg, #064e3b, #022c22)",
        border: `2px solid ${COLORS.gold[400]}`,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 ${size * 0.4}px rgba(245,158,11,0.3), inset 0 0 ${size * 0.3}px rgba(16,185,129,0.1)`,
        animation: animate ? "logoRotate 3s ease-in-out infinite, glow 3s ease-in-out infinite" : "glow 3s ease-in-out infinite",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.15), transparent 60%)" }} />
        <span style={{
          fontFamily: "'Amiri', serif",
          fontSize: size * 0.38,
          color: COLORS.gold[300],
          textShadow: `0 0 20px rgba(245,158,11,0.8)`,
          letterSpacing: "2px",
          direction: "rtl",
          lineHeight: 1,
        }}>م</span>
      </div>
      {animate && (
        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          border: `1px solid rgba(245,158,11,0.3)`,
          animation: "spin 8s linear infinite",
        }}>
          {[0, 60, 120, 180, 240, 300].map(a => (
            <div key={a} style={{
              position: "absolute", width: 4, height: 4, borderRadius: "50%",
              background: COLORS.gold[400],
              top: "50%", left: "50%",
              transform: `rotate(${a}deg) translate(${size / 2 + 6}px) translateY(-50%)`,
              boxShadow: `0 0 6px ${COLORS.gold[400]}`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Écran d'authentification ─── */
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const validate = () => {
    const e = {};
    if (mode === "register" && !form.name.trim()) e.name = "Le nom est requis";
    if (!form.email.includes("@")) e.email = "Email invalide";
    if (form.password.length < 6) e.password = "Minimum 6 caractères";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onAuth({ name: form.name || "Ahmed", email: form.email });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 0%, #064e3b 0%, #030f0b 60%)`,
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <IslamicPattern />

      {/* Étoiles flottantes */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          color: COLORS.gold[400],
          fontSize: `${8 + Math.random() * 12}px`,
          animation: `starFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`,
          opacity: 0.4,
          zIndex: 1,
        }}>✦</div>
      ))}

      <div style={{
        width: "100%", maxWidth: 440, position: "relative", zIndex: 2,
        animation: mounted ? "fadeInUp 0.8s ease forwards" : "none",
        opacity: mounted ? 1 : 0,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <MCHRLogo size={100} animate />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 8 }}>
            {["م", "ح", "ر"].map((letter, i) => (
              <span key={i} style={{
                fontFamily: "'Amiri', serif", fontSize: 28, color: COLORS.gold[300],
                textShadow: `0 0 20px rgba(245,158,11,0.6)`,
                animation: `bounce 2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}>{letter}</span>
            ))}
          </div>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700,
            background: `linear-gradient(135deg, ${COLORS.gold[300]}, ${COLORS.gold[500]}, ${COLORS.gold[300]})`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
            letterSpacing: "0.15em", marginBottom: 6,
          }}>MCHR</h1>
          <p style={{ color: COLORS.text_muted, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: "italic", color: "#4d9e70" }}>
            Maîtrisez le Tajwid avec l'Intelligence Artificielle
          </p>
        </div>

        {/* Card formulaire */}
        <div style={{
          background: "linear-gradient(145deg, #0a2218, #071a11)",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 24,
          padding: 36,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.05)",
          backdropFilter: "blur(20px)",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 32,
            background: "#071a11", borderRadius: 12, padding: 4,
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); }} style={{
                flex: 1, padding: "10px 0",
                background: mode === m ? `linear-gradient(135deg, #059669, #047857)` : "transparent",
                border: mode === m ? `1px solid ${COLORS.emerald[600]}` : "1px solid transparent",
                borderRadius: 10, cursor: "pointer",
                color: mode === m ? "#fff" : "#4d9e70",
                fontFamily: "'Cinzel', serif", fontSize: 12,
                fontWeight: mode === m ? 700 : 400,
                letterSpacing: "0.1em",
                transition: "all 0.3s ease",
                boxShadow: mode === m ? "0 4px 16px rgba(5,150,105,0.3)" : "none",
              }}>{m === "login" ? "CONNEXION" : "INSCRIPTION"}</button>
            ))}
          </div>

          {/* Champs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <Field label="Nom complet" value={form.name} error={errors.name}
                onChange={v => setForm(p => ({ ...p, name: v }))}
                placeholder="Ahmed Al-Rashid" icon="👤" />
            )}
            <Field label="Adresse email" value={form.email} error={errors.email}
              onChange={v => setForm(p => ({ ...p, email: v }))}
              placeholder="ahmed@example.com" icon="✉️" type="email" />
            <Field label="Mot de passe" value={form.password} error={errors.password}
              onChange={v => setForm(p => ({ ...p, password: v }))}
              placeholder="••••••••" icon="🔒" type="password" />
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", marginTop: 28, padding: "15px 0",
            background: loading ? "#064e3b" : `linear-gradient(135deg, #059669, #047857, #065f46)`,
            border: `1px solid ${COLORS.emerald[600]}`,
            borderRadius: 14, cursor: loading ? "not-allowed" : "pointer",
            color: "#fff", fontFamily: "'Cinzel', serif",
            fontSize: 14, fontWeight: 700, letterSpacing: "0.15em",
            boxShadow: loading ? "none" : "0 8px 32px rgba(5,150,105,0.4)",
            transition: "all 0.3s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Vérification...
              </>
            ) : (
              <>{mode === "login" ? "SE CONNECTER" : "CRÉER MON COMPTE"} <span style={{ marginLeft: 4 }}>✦</span></>
            )}
          </button>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#4d9e70" }}>
            {mode === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErrors({}); }}
              style={{ background: "none", border: "none", color: COLORS.gold[400], cursor: "pointer", fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#2d6b48", fontFamily: "'Amiri', serif", direction: "rtl" }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, placeholder, icon, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", color: error ? "#f87171" : "#4d9e70" }}>
        {label.toUpperCase()}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>{icon}</span>
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "12px 14px 12px 42px",
            background: focused ? "#071a11" : "#051610",
            border: `1px solid ${error ? "#f87171" : focused ? COLORS.emerald[600] : COLORS.border}`,
            borderRadius: 10, color: "#e2fdf2",
            fontFamily: "'Cormorant Garamond', serif", fontSize: 15,
            outline: "none", transition: "all 0.3s ease",
            boxShadow: focused ? `0 0 0 3px rgba(5,150,105,0.15)` : "none",
          }}
        />
      </div>
      {error && <p style={{ marginTop: 4, fontSize: 11, color: "#f87171" }}>⚠ {error}</p>}
    </div>
  );
}

/* ─── Navigation ─── */
function Nav({ active, onNav, user, streak }) {
  const items = [
    { id: "dashboard", icon: "◈", label: "Tableau de bord" },
    { id: "practice", icon: "◎", label: "Pratique IA" },
    { id: "progress", icon: "◇", label: "Progression" },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "linear-gradient(180deg, transparent, #030f0b 30%)",
      paddingBottom: 8,
    }}>
      <div style={{
        maxWidth: 600, margin: "0 auto",
        display: "flex", alignItems: "center",
        background: "linear-gradient(145deg, rgba(10,34,24,0.95), rgba(7,26,17,0.95))",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20, padding: "8px 12px",
        backdropFilter: "blur(20px)",
        margin: "0 16px 8px",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.4)",
      }}>
        {items.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 4px", background: "none", border: "none", cursor: "pointer",
            transition: "all 0.3s ease",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: active === item.id ? `linear-gradient(135deg, #059669, #047857)` : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: active === item.id ? "0 4px 16px rgba(5,150,105,0.4)" : "none",
              transition: "all 0.3s ease",
              fontSize: 16,
              color: active === item.id ? "#fff" : "#4d9e70",
            }}>{item.icon}</div>
            <span style={{
              fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: "0.05em",
              color: active === item.id ? COLORS.gold[400] : "#4d9e70",
            }}>{item.label.split(" ")[0].toUpperCase()}</span>
          </button>
        ))}
        <div style={{ width: 1, height: 32, background: COLORS.border, margin: "0 4px" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.gold[700]}, ${COLORS.gold[500]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
            boxShadow: `0 2px 10px rgba(245,158,11,0.4)`,
          }}>{user?.name?.[0]?.toUpperCase() || "A"}</div>
          <span style={{ fontSize: 8, color: COLORS.gold[400], marginTop: 2 }}>🔥 {streak}</span>
        </div>
      </div>
    </nav>
  );
}

/* ─── Tableau de bord ─── */
function Dashboard({ user }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const stats = [
    { label: "Sessions", value: "47", icon: "◎", color: COLORS.emerald[500], sub: "+3 cette semaine" },
    { label: "Score Moyen", value: "87%", icon: "◈", color: COLORS.gold[400], sub: "+5% ce mois" },
    { label: "Streak", value: "12j", icon: "🔥", color: "#f97316", sub: "Meilleur: 21j" },
    { label: "Badges", value: "4/8", icon: "⭐", color: "#a78bfa", sub: "4 à débloquer" },
  ];

  return (
    <div style={{ padding: "24px 20px 120px", maxWidth: 600, margin: "0 auto", animation: mounted ? "fadeIn 0.5s ease" : "none" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: COLORS.gold[300], letterSpacing: "0.08em" }}>
            Bismillah ✦
          </h2>
          <p style={{ color: "#4d9e70", fontSize: 15, marginTop: 2 }}>
            {user?.name || "Ahmed"} — Continuez votre progression
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontFamily: "'Amiri', serif", color: COLORS.gold[300], direction: "rtl" }}>مرحباً</div>
          <div style={{ fontSize: 11, color: "#4d9e70" }}>Bienvenue</div>
        </div>
      </div>

      {/* Streak Banner */}
      <div style={{
        background: "linear-gradient(135deg, #431407, #7c2d12)",
        border: "1px solid #ea580c",
        borderRadius: 16, padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24,
        boxShadow: "0 8px 32px rgba(234,88,12,0.25)",
        animation: "streakBounce 0.6s ease",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 28 }}>🔥</span>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: "#fed7aa" }}>12 jours consécutifs</div>
              <div style={{ fontSize: 13, color: "#fb923c" }}>Plus que 9 jours pour le badge "30 Jours de Feu" !</div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {WEEKLY.map((d, i) => (
            <span key={i} style={{
              display: "inline-block", width: 8, height: 8,
              borderRadius: "50%", margin: "0 2px",
              background: d.score > 0 ? "#f97316" : "#1c0a00",
              boxShadow: d.score > 0 ? "0 0 6px rgba(249,115,22,0.6)" : "none",
            }} />
          ))}
          <div style={{ fontSize: 11, color: "#fb923c", marginTop: 4 }}>Cette semaine</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "linear-gradient(145deg, #0a2218, #071a11)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: "18px",
            animation: `fadeInUp 0.5s ease forwards`,
            animationDelay: `${i * 0.1}s`,
            opacity: 0,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -12, right: -12, width: 50, height: 50, borderRadius: "50%", background: `${s.color}15` }} />
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1, animation: "countUp 0.5s ease" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", color: "#4d9e70", marginTop: 4 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: "#2d6b48", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Sessions récentes */}
      <SectionTitle title="Sessions Récentes" arabic="الجلسات الأخيرة" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {SESSIONS.map((s, i) => (
          <div key={s.id} style={{
            background: "linear-gradient(135deg, #0a2218, #071a11)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            animation: `fadeInUp 0.5s ease forwards`,
            animationDelay: `${0.4 + i * 0.1}s`, opacity: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `conic-gradient(${scoreColor(s.score)} ${s.score * 3.6}deg, #0a2218 0)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#0a2218", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#e2fdf2" }}>{s.sourate}</div>
                <div style={{ fontSize: 11, color: "#4d9e70" }}>{s.date} · {s.duration}</div>
              </div>
            </div>
            <span style={{
              fontSize: 11, fontFamily: "'Cinzel', serif",
              color: scoreColor(s.score), letterSpacing: "0.05em",
              padding: "3px 10px", borderRadius: 20,
              background: `${scoreColor(s.score)}15`,
              border: `1px solid ${scoreColor(s.score)}30`,
            }}>{s.grade}</span>
          </div>
        ))}
      </div>

      {/* Règles Tajwid */}
      <SectionTitle title="Maîtrise des Règles" arabic="أحكام التجويد" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TAJWID_RULES.slice(0, 6).map((rule, i) => (
          <div key={rule.id} style={{
            animation: `fadeInUp 0.5s ease forwards`,
            animationDelay: `${0.8 + i * 0.08}s`, opacity: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 14, color: rule.color }}>{rule.arabic}</span>
                <span style={{ fontSize: 12, color: "#e2fdf2" }}>{rule.name}</span>
                <span style={{ fontSize: 11, color: "#4d9e70" }}>· {rule.desc}</span>
              </div>
              <span style={{ fontSize: 12, color: rule.color, fontWeight: 700 }}>{rule.progress}%</span>
            </div>
            <div style={{ height: 6, background: "#071a11", borderRadius: 3, overflow: "hidden", border: "1px solid #0d3d20" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg, ${rule.color}aa, ${rule.color})`,
                width: `${rule.progress}%`,
                animation: `progressFill 1.2s ease forwards`,
                animationDelay: `${1 + i * 0.1}s`,
                boxShadow: `0 0 8px ${rule.color}40`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pratique IA ─── */
function PracticeScreen() {
  const [step, setStep] = useState("select"); // select | record | analyzing | result
  const [selectedSourate, setSelectedSourate] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [waveValues, setWaveValues] = useState(Array(20).fill(4));
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const waveInterval = useRef(null);
  const recognitionRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    waveInterval.current = setInterval(() => {
      setWaveValues(Array(20).fill(0).map(() => Math.random() * 32 + 4));
    }, 100);

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRec();
      recognition.lang = "ar-SA";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          t += e.results[i][0].transcript;
        }
        setTranscript(t);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(waveInterval.current);
    setWaveValues(Array(20).fill(4));
    if (recognitionRef.current) recognitionRef.current.stop();
    setStep("analyzing");
    await analyzeWithAI();
  };

  const analyzeWithAI = async () => {
    const steps = [10, 25, 40, 60, 75, 90, 100];
    for (const p of steps) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      setAnalyzeProgress(p);
    }
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Tu es un expert en Tajwid (règles de récitation du Coran). Analyse cette récitation de la sourate ${selectedSourate?.french}.

Texte récité: "${transcript || "Al-Hamdou lillahi rabbil 'alameen"}"

Génère une analyse JSON structurée avec ces champs exactement:
{
  "score": (nombre entier 60-98),
  "grade": ("Excellent"|"Très Bien"|"Bien"|"À Améliorer"),
  "encouragement": "message d'encouragement en français (2 phrases max)",
  "errors": [
    {"type": "error"|"warning"|"tip", "rule": "nom de règle Tajwid", "detail": "explication courte", "arabic": "مثال عربي"}
  ],
  "rulesAnalyzed": [{"name": "nom", "score": 0-100}]
}

Réponds UNIQUEMENT avec le JSON, sans autre texte.`
          }]
        })
      });
      const data = await resp.json();
      const text = data.content[0].text.replace(/```json|```/g, "").trim();
      setAnalysisResult(JSON.parse(text));
    } catch {
      setAnalysisResult({
        score: 85, grade: "Très Bien",
        encouragement: "Masha'Allah ! Votre récitation est belle et maîtrisée. Continuez à perfectionner le Madd pour atteindre l'excellence.",
        errors: [
          { type: "warning", rule: "Madd Tabii", arabic: "المد الطبيعي", detail: "Prolongez davantage sur les voyelles longues (2 temps minimum)" },
          { type: "error", rule: "Ghunna", arabic: "الغنة", detail: "La nasalisation sur الن et الم doit être plus prononcée" },
          { type: "tip", rule: "Waqf", arabic: "الوقف", detail: "Marquez clairement les pauses en fin d'ayat" },
        ],
        rulesAnalyzed: [{ name: "Madd", score: 78 }, { name: "Ghunna", score: 72 }, { name: "Qalqala", score: 92 }]
      });
    }
    setStep("result");
  };

  return (
    <div style={{ padding: "24px 20px 120px", maxWidth: 600, margin: "0 auto", animation: mounted ? "fadeIn 0.5s ease" : "none" }}>
      {step === "select" && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: COLORS.gold[300], letterSpacing: "0.08em", marginBottom: 4 }}>
              Pratique avec l'IA ✦
            </h2>
            <p style={{ color: "#4d9e70", fontSize: 14 }}>Sélectionnez une sourate et récitez à voix haute</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {SOURATES.map((s, i) => (
              <button key={s.id} onClick={() => { setSelectedSourate(s); setStep("record"); setTranscript(""); }}
                style={{
                  background: "linear-gradient(145deg, #0a2218, #071a11)",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18, padding: "20px 22px",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.3s ease",
                  animation: `fadeInUp 0.5s ease forwards`,
                  animationDelay: `${i * 0.1}s`, opacity: 0,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: "linear-gradient(135deg, #064e3b, #022c22)",
                    border: `1px solid ${COLORS.emerald[700]}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(5,150,105,0.2)",
                  }}>
                    <span style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: COLORS.gold[300], direction: "rtl" }}>{s.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: COLORS.gold[300], direction: "rtl", marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#e2fdf2" }}>{s.french}</div>
                    <div style={{ fontSize: 11, color: "#4d9e70" }}>{s.verses} versets · {s.level}</div>
                  </div>
                </div>
                <span style={{ color: COLORS.emerald[500], fontSize: 20 }}>▷</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "record" && selectedSourate && (
        <RecordScreen
          sourate={selectedSourate}
          isRecording={isRecording}
          transcript={transcript}
          waveValues={waveValues}
          onStart={startRecording}
          onStop={stopRecording}
          onBack={() => { setStep("select"); setIsRecording(false); clearInterval(waveInterval.current); if (recognitionRef.current) recognitionRef.current.stop(); }}
        />
      )}

      {step === "analyzing" && <AnalyzingScreen progress={analyzeProgress} sourate={selectedSourate} />}

      {step === "result" && analysisResult && (
        <ResultScreen
          result={analysisResult}
          sourate={selectedSourate}
          onRetry={() => { setStep("record"); setTranscript(""); setAnalysisResult(null); setAnalyzeProgress(0); }}
          onNewSourate={() => { setStep("select"); setAnalysisResult(null); setTranscript(""); setAnalyzeProgress(0); }}
        />
      )}
    </div>
  );
}

function RecordScreen({ sourate, isRecording, transcript, waveValues, onStart, onStop, onBack }) {
  return (
    <div style={{ animation: "fadeInUp 0.5s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#4d9e70", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Cinzel', serif" }}>
        ← Retour
      </button>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-block", padding: "4px 16px", borderRadius: 20,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          fontSize: 11, color: COLORS.gold[400], fontFamily: "'Cinzel', serif",
          letterSpacing: "0.1em", marginBottom: 12,
        }}>{sourate.level.toUpperCase()}</div>
        <h2 style={{ fontFamily: "'Amiri', serif", fontSize: 36, color: COLORS.gold[300], direction: "rtl", marginBottom: 6, textShadow: "0 0 30px rgba(245,158,11,0.4)" }}>
          {sourate.name}
        </h2>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#e2fdf2" }}>{sourate.french}</p>
        <p style={{ fontSize: 13, color: "#4d9e70", marginTop: 4 }}>{sourate.verses} versets</p>
      </div>

      {/* Texte de référence */}
      <div style={{
        background: "linear-gradient(145deg, #0a2218, #071a11)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18, padding: 20, marginBottom: 24,
        maxHeight: 140, overflowY: "auto",
      }}>
        <p style={{
          fontFamily: "'Amiri', serif", fontSize: 18, color: "#c6f6e4",
          direction: "rtl", textAlign: "right", lineHeight: 2.2,
        }}>{sourate.arabicFull}</p>
      </div>

      {/* Waveform */}
      <div style={{
        background: "#051610", borderRadius: 18, padding: "24px 20px",
        marginBottom: 24, border: `1px solid ${COLORS.border}`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", background: "radial-gradient(ellipse at center, rgba(5,150,105,0.05), transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 60, position: "relative" }}>
          {waveValues.map((h, i) => (
            <div key={i} style={{
              width: 4, borderRadius: 2,
              height: isRecording ? h : 4,
              background: isRecording
                ? `linear-gradient(to top, ${COLORS.emerald[700]}, ${COLORS.emerald[400]})`
                : "#0d3d20",
              transition: "height 0.1s ease",
              boxShadow: isRecording && h > 20 ? `0 0 8px ${COLORS.emerald[500]}60` : "none",
            }} />
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#4d9e70", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>
          {isRecording ? "🔴 ENREGISTREMENT EN COURS" : "Prêt à enregistrer"}
        </p>
      </div>

      {/* Transcript temps réel */}
      {transcript && (
        <div style={{
          background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 14, padding: 16, marginBottom: 24,
          fontFamily: "'Amiri', serif", fontSize: 16, color: "#6ee7b7",
          direction: "rtl", textAlign: "right", lineHeight: 2,
        }}>
          {transcript}
        </div>
      )}

      {/* Bouton enregistrement */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={isRecording ? onStop : onStart}
          style={{
            width: 90, height: 90, borderRadius: "50%",
            background: isRecording
              ? "linear-gradient(135deg, #b91c1c, #7f1d1d)"
              : "linear-gradient(135deg, #059669, #047857)",
            border: `3px solid ${isRecording ? "#ef4444" : COLORS.emerald[500]}`,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: isRecording ? "recordPulse 1.5s ease-in-out infinite" : "glow 3s ease-in-out infinite",
            boxShadow: isRecording
              ? "0 0 0 0 rgba(239,68,68,0.7), 0 12px 40px rgba(185,28,28,0.4)"
              : "0 12px 40px rgba(5,150,105,0.4)",
            transition: "all 0.3s ease",
            fontSize: 32,
          }}>
          {isRecording ? "⏹" : "🎙"}
        </button>
      </div>
      <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#4d9e70" }}>
        {isRecording ? "Appuyez pour terminer et analyser" : "Appuyez pour commencer la récitation"}
      </p>
    </div>
  );
}

function AnalyzingScreen({ progress, sourate }) {
  const steps = ["Traitement audio...", "Analyse phonétique...", "Vérification des règles Tajwid...", "Calcul du score...", "Génération du feedback IA..."];
  const stepIndex = Math.min(Math.floor(progress / 20), steps.length - 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", animation: "fadeIn 0.5s ease" }}>
      <MCHRLogo size={80} animate />
      <div style={{ marginTop: 32, marginBottom: 24, textAlign: "center" }}>
        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: COLORS.gold[300], letterSpacing: "0.1em", marginBottom: 8 }}>
          ANALYSE EN COURS
        </h3>
        <p style={{ color: "#4d9e70", fontSize: 14 }}>Analyse de votre récitation de {sourate?.french}</p>
      </div>

      <div style={{ width: "80%", maxWidth: 300, background: "#071a11", borderRadius: 8, height: 6, marginBottom: 16, border: "1px solid #0d3d20", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 8,
          background: `linear-gradient(90deg, ${COLORS.emerald[700]}, ${COLORS.emerald[400]})`,
          width: `${progress}%`, transition: "width 0.5s ease",
          boxShadow: "0 0 12px rgba(16,185,129,0.4)",
        }} />
      </div>
      <p style={{ fontSize: 13, color: COLORS.emerald[400], fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>
        {steps[stepIndex]}
      </p>

      <div style={{ marginTop: 32, display: "flex", gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: COLORS.emerald[500],
            animation: `pulse 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

function ResultScreen({ result, sourate, onRetry, onNewSourate }) {
  const circumference = 440;
  const offset = circumference - (result.score / 100) * circumference;
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => { setTimeout(() => setShowDetails(true), 500); }, []);

  const typeConfig = {
    error: { color: "#f87171", icon: "✗", label: "Erreur" },
    warning: { color: COLORS.gold[400], icon: "⚠", label: "Attention" },
    tip: { color: COLORS.emerald[400], icon: "✦", label: "Conseil" },
  };

  return (
    <div style={{ animation: "fadeInUp 0.6s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: COLORS.gold[300], letterSpacing: "0.1em", marginBottom: 4 }}>
          RÉSULTAT · {sourate?.french?.toUpperCase()}
        </h2>
        <p style={{ color: "#4d9e70", fontSize: 13 }}>Analyse IA complète</p>
      </div>

      {/* Score Ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="80" cy="80" r="70" fill="none" stroke="#0d3d20" strokeWidth="10" />
            <circle cx="80" cy="80" r="70" fill="none"
              stroke={scoreColor(result.score)} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1.5s ease", filter: `drop-shadow(0 0 8px ${scoreColor(result.score)})` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 36, fontWeight: 900, color: scoreColor(result.score), lineHeight: 1 }}>
              {result.score}
            </span>
            <span style={{ fontSize: 11, color: "#4d9e70", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>SCORE</span>
          </div>
        </div>
      </div>

      {/* Grade + Encouragement */}
      <div style={{
        background: `${scoreColor(result.score)}10`,
        border: `1px solid ${scoreColor(result.score)}30`,
        borderRadius: 16, padding: "18px 20px", marginBottom: 24,
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: scoreColor(result.score), marginBottom: 8, letterSpacing: "0.08em" }}>
          {result.grade} ✦
        </div>
        <p style={{ fontSize: 15, color: "#c6f6e4", fontStyle: "italic", lineHeight: 1.6 }}>{result.encouragement}</p>
      </div>

      {/* Feedback détaillé */}
      <SectionTitle title="Analyse Détaillée" arabic="التحليل التفصيلي" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {result.errors?.map((e, i) => {
          const cfg = typeConfig[e.type] || typeConfig.tip;
          return (
            <div key={i} style={{
              background: "#071a11",
              border: `1px solid ${cfg.color}25`,
              borderLeft: `3px solid ${cfg.color}`,
              borderRadius: "0 12px 12px 0", padding: "14px 16px",
              animation: `fadeInUp 0.4s ease forwards`,
              animationDelay: `${0.2 + i * 0.1}s`, opacity: 0,
              display: "flex", gap: 14,
            }}>
              <div style={{ color: cfg.color, fontSize: 18, flexShrink: 0 }}>{cfg.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: "'Cinzel', serif", color: cfg.color, letterSpacing: "0.1em" }}>{cfg.label.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Amiri', serif", fontSize: 14, color: cfg.color }}>{e.arabic}</span>
                  <span style={{ fontSize: 12, color: "#e2fdf2", fontWeight: 600 }}>{e.rule}</span>
                </div>
                <p style={{ fontSize: 13, color: "#9bbf9b", lineHeight: 1.5 }}>{e.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onRetry} style={{
          flex: 1, padding: "14px", borderRadius: 14,
          background: "linear-gradient(135deg, #059669, #047857)",
          border: `1px solid ${COLORS.emerald[600]}`,
          color: "#fff", cursor: "pointer",
          fontFamily: "'Cinzel', serif", fontSize: 12,
          letterSpacing: "0.08em", fontWeight: 700,
          boxShadow: "0 6px 20px rgba(5,150,105,0.3)",
        }}>↺ RECOMMENCER</button>
        <button onClick={onNewSourate} style={{
          flex: 1, padding: "14px", borderRadius: 14,
          background: "linear-gradient(135deg, #92400e, #451a03)",
          border: `1px solid ${COLORS.gold[600]}`,
          color: COLORS.gold[300], cursor: "pointer",
          fontFamily: "'Cinzel', serif", fontSize: 12,
          letterSpacing: "0.08em", fontWeight: 700,
        }}>✦ AUTRE SOURATE</button>
      </div>
    </div>
  );
}

/* ─── Progression ─── */
function ProgressScreen() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const maxScore = Math.max(...WEEKLY.map(d => d.score));

  return (
    <div style={{ padding: "24px 20px 120px", maxWidth: 600, margin: "0 auto", animation: mounted ? "fadeIn 0.5s ease" : "none" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: COLORS.gold[300], letterSpacing: "0.08em", marginBottom: 4 }}>
          Ma Progression ✦
        </h2>
        <p style={{ color: "#4d9e70", fontSize: 14 }}>Suivez votre évolution dans l'apprentissage du Tajwid</p>
      </div>

      {/* Graphique hebdomadaire */}
      <div style={{
        background: "linear-gradient(145deg, #0a2218, #071a11)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20, padding: 24, marginBottom: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.gold[400], letterSpacing: "0.08em" }}>CETTE SEMAINE</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, color: "#e2fdf2", fontWeight: 700 }}>88%</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.emerald[500] }} />
            <span style={{ fontSize: 11, color: "#4d9e70" }}>Score moyen</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {WEEKLY.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div style={{
                  width: "100%", borderRadius: "6px 6px 0 0",
                  height: d.score === 0 ? 0 : `${(d.score / 100) * 100}%`,
                  background: d.score >= 90
                    ? `linear-gradient(to top, ${COLORS.emerald[700]}, ${COLORS.emerald[400]})`
                    : d.score > 0
                      ? `linear-gradient(to top, #064e3b, #059669)`
                      : "transparent",
                  transition: "height 1s ease",
                  boxShadow: d.score >= 90 ? `0 0 12px ${COLORS.emerald[500]}40` : "none",
                  position: "relative",
                }}>
                  {d.score > 0 && (
                    <div style={{
                      position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                      fontSize: 10, color: d.score >= 90 ? COLORS.emerald[400] : "#4d9e70",
                      fontFamily: "'Cinzel', serif", whiteSpace: "nowrap",
                    }}>{d.score}</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#4d9e70", fontFamily: "'Cinzel', serif" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <SectionTitle title="Accomplissements" arabic="الإنجازات" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {BADGES.map((b, i) => (
          <div key={b.id} style={{
            background: b.earned ? "linear-gradient(145deg, #0a2218, #071a11)" : "linear-gradient(145deg, #051610, #030f0b)",
            border: `1px solid ${b.earned ? COLORS.gold[700] : COLORS.border}`,
            borderRadius: 16, padding: "16px",
            opacity: b.earned ? 1 : 0.6,
            position: "relative", overflow: "hidden",
            animation: `fadeInUp 0.5s ease forwards`,
            animationDelay: `${i * 0.08}s`,
          }}>
            {b.earned && (
              <div style={{ position: "absolute", top: 0, right: 0, width: 40, height: 40, background: "radial-gradient(circle, rgba(245,158,11,0.15), transparent)" }} />
            )}
            <div style={{ fontSize: 28, marginBottom: 8, filter: b.earned ? "none" : "grayscale(100%)" }}>{b.icon}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: b.earned ? COLORS.gold[300] : "#2d6b48", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 700 }}>
              {b.name}
            </div>
            <div style={{ fontSize: 11, color: "#4d9e70", lineHeight: 1.4 }}>{b.desc}</div>
            {b.earned && (
              <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: "50%", background: COLORS.gold[500], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Toutes les règles Tajwid */}
      <SectionTitle title="Maîtrise Tajwid Complète" arabic="إتقان أحكام التجويد" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TAJWID_RULES.map((rule, i) => (
          <div key={rule.id} style={{
            background: "linear-gradient(145deg, #0a2218, #071a11)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: "14px 16px",
            animation: `fadeInUp 0.4s ease forwards`,
            animationDelay: `${0.3 + i * 0.06}s`, opacity: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 16, color: rule.color }}>{rule.arabic}</span>
                <div>
                  <span style={{ fontSize: 13, color: "#e2fdf2", fontWeight: 600 }}>{rule.name}</span>
                  <span style={{ fontSize: 11, color: "#4d9e70", marginLeft: 6 }}>· {rule.desc}</span>
                </div>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700, color: rule.color,
                fontFamily: "'Cinzel', serif",
              }}>{rule.progress}%</span>
            </div>
            <div style={{ height: 8, background: "#051610", borderRadius: 4, overflow: "hidden", border: "1px solid #0d3d20" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: `linear-gradient(90deg, ${rule.color}88, ${rule.color})`,
                width: `${rule.progress}%`,
                boxShadow: `0 0 8px ${rule.color}40`,
                transition: "width 1.2s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function SectionTitle({ title, arabic }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.gold[400], letterSpacing: "0.1em" }}>
        {title.toUpperCase()}
      </h3>
      <span style={{ fontFamily: "'Amiri', serif", fontSize: 15, color: "#2d6b48", direction: "rtl" }}>{arabic}</span>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 90) return COLORS.gold[400];
  if (score >= 80) return COLORS.emerald[400];
  if (score >= 70) return "#60a5fa";
  return "#f87171";
}

/* ─── App principale ─── */
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ minHeight: "100vh", background: COLORS.bg, position: "relative" }}>
        <IslamicPattern />
        {!user ? (
          <AuthScreen onAuth={(u) => setUser(u)} />
        ) : (
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Header fixe */}
            <header style={{
              position: "sticky", top: 0, zIndex: 50,
              background: "linear-gradient(180deg, #030f0b 0%, rgba(3,15,11,0.9) 100%)",
              borderBottom: `1px solid ${COLORS.border}`,
              backdropFilter: "blur(20px)",
              padding: "12px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              maxWidth: "100%",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MCHRLogo size={36} />
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: COLORS.gold[300], letterSpacing: "0.12em" }}>MCHR</div>
                  <div style={{ fontSize: 10, color: "#4d9e70", letterSpacing: "0.08em" }}>TAJWID AVEC IA</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: COLORS.gold[400], fontFamily: "'Amiri', serif" }}>بسم الله</div>
                  <div style={{ fontSize: 10, color: "#4d9e70" }}>🔥 12 jours</div>
                </div>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: `linear-gradient(135deg, #064e3b, #022c22)`,
                  border: `1px solid ${COLORS.gold[600]}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: COLORS.gold[300],
                  fontFamily: "'Cinzel', serif",
                  cursor: "pointer",
                  boxShadow: `0 0 12px rgba(245,158,11,0.2)`,
                }} onClick={() => setUser(null)}>
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </div>
              </div>
            </header>

            {/* Contenu */}
            <main>
              {screen === "dashboard" && <Dashboard user={user} />}
              {screen === "practice" && <PracticeScreen />}
              {screen === "progress" && <ProgressScreen />}
            </main>

            <Nav active={screen} onNav={setScreen} user={user} streak={12} />
          </div>
        )}
      </div>
    </>
  );
}
