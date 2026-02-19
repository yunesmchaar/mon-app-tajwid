const OpenAI = require("openai");
const fs = require("fs");

// Instanciation lazy — évite le crash au démarrage
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant dans .env");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ─── Règles Tajwid à évaluer ───
const TAJWID_RULES = [
  "Madd", "Ghunna", "Qalqala", "Idgham",
  "Ikhfa", "Iqlab", "Izhar", "Waqf", "Hamza", "Tafkhim"
];

/**
 * Analyse une récitation audio avec l'IA
 * @param {Buffer} audioBuffer - Fichier audio en mémoire
 * @param {Object} sourate - { name, arabicFull }
 * @returns {Object} { score, rules, feedback, grade }
 */
async function analyzeRecitation(audioBuffer, sourate) {
  try {
    // ── Étape 1: Transcription avec Whisper ──
    const transcriptResponse = await getOpenAI().audio.transcriptions.create({
      file: new File([audioBuffer], "recitation.webm", { type: "audio/webm" }),
      model: "whisper-1",
      language: "ar",
      response_format: "text",
    });
    const transcript = transcriptResponse.trim();

    // ── Étape 2: Analyse Tajwid avec GPT-4 ──
    const prompt = `Tu es un expert en Tajwid du Coran avec 30 ans d'expérience.

Sourate: ${sourate.french} (${sourate.name})
Texte coranique attendu:
${sourate.arabicFull}

Transcription de la récitation de l'élève:
${transcript || "[Transcription non disponible]"}

Évalue la récitation selon les règles du Tajwid. Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:
{
  "rules": {
    "Madd": <score 0-100>,
    "Ghunna": <score 0-100>,
    "Qalqala": <score 0-100>,
    "Idgham": <score 0-100>,
    "Ikhfa": <score 0-100>,
    "Iqlab": <score 0-100>,
    "Izhar": <score 0-100>,
    "Waqf": <score 0-100>,
    "Hamza": <score 0-100>,
    "Tafkhim": <score 0-100>
  },
  "feedback": "<retour qualitatif en français, 2-3 phrases encourageantes avec points à améliorer>",
  "strengths": ["<point fort 1>", "<point fort 2>"],
  "improvements": ["<à améliorer 1>", "<à améliorer 2>"]
}

Si la transcription n'est pas disponible, donne des scores de 0 et un feedback demandant de réessayer.`;

    const gptResponse = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = gptResponse.choices[0].message.content.trim();
    const analysis = JSON.parse(raw);

    // ── Étape 3: Calculer le score global ──
    const ruleScores = Object.values(analysis.rules);
    const globalScore = Math.round(ruleScores.reduce((a, b) => a + b, 0) / ruleScores.length);

    return {
      score: globalScore,
      grade: getGrade(globalScore),
      rules: analysis.rules,
      feedback: analysis.feedback,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      transcript,
    };
  } catch (err) {
    console.error("Erreur analyse Tajwid:", err);
    // Retour de secours si l'IA échoue
    return {
      score: 0,
      grade: "Erreur",
      rules: Object.fromEntries(TAJWID_RULES.map(r => [r, 0])),
      feedback: "Analyse impossible. Veuillez réessayer avec un audio plus clair.",
      strengths: [],
      improvements: ["Vérifiez votre microphone et réessayez"],
      transcript: "",
    };
  }
}

// ─── Correspondance score → grade ───
function getGrade(score) {
  if (score >= 95) return "Parfait";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Très Bien";
  if (score >= 70) return "Bien";
  if (score >= 60) return "Assez Bien";
  if (score >= 50) return "Passable";
  return "À retravailler";
}

// ─── Calculer la nouvelle progression Tajwid ───
function computeNewProgress(oldProgress, newRuleScore) {
  // Moyenne pondérée: 70% ancienne progression + 30% nouveau score
  return Math.round(oldProgress * 0.7 + newRuleScore * 0.3);
}

module.exports = { analyzeRecitation, getGrade, computeNewProgress };
