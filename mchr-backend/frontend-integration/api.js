// ════════════════════════════════════════════════════
//  MCHR Tajwid — Couche API Front-End (api.js)
//  Remplace toutes les données hardcodées du JSX
// ════════════════════════════════════════════════════

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─── Helper: requête authentifiée ───────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("mchr_token");
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.json();
}

// ════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════

export const authAPI = {
  // Inscription
  register: (name, email, password) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }).then((data) => {
      localStorage.setItem("mchr_token", data.token);
      return data.user;
    }),

  // Connexion
  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => {
      localStorage.setItem("mchr_token", data.token);
      return data.user;
    }),

  // Profil connecté
  me: () => apiFetch("/auth/me"),

  // Déconnexion
  logout: () => localStorage.removeItem("mchr_token"),

  // Modifier profil
  updateProfile: (data) =>
    apiFetch("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
};

// ════════════════════════════════════════════════════
//  SESSIONS / RÉCITATIONS
// ════════════════════════════════════════════════════

export const sessionsAPI = {
  // Soumettre un enregistrement audio
  submit: async (audioBlob, sourate, duration) => {
    const token = localStorage.getItem("mchr_token");
    const formData = new FormData();
    formData.append("audio", audioBlob, "recitation.webm");
    formData.append("sourate_id", sourate.id);
    formData.append("sourate_name", sourate.french);
    formData.append("sourate_arabic", sourate.arabicFull);
    formData.append("sourate_french", sourate.french);
    formData.append("duration", Math.round(duration));

    const res = await fetch(`${BASE_URL}/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Erreur lors de l'analyse");
    return res.json();
  },

  // Historique (remplace SESSIONS hardcodé)
  getHistory: (limit = 10) => apiFetch(`/sessions?limit=${limit}`),

  // Détail session
  getById: (id) => apiFetch(`/sessions/${id}`),
};

// ════════════════════════════════════════════════════
//  PROGRESSION
// ════════════════════════════════════════════════════

export const progressAPI = {
  // Règles Tajwid (remplace TAJWID_RULES hardcodé)
  getTajwidRules: () => apiFetch("/progress"),

  // Scores semaine (remplace WEEKLY hardcodé)
  getWeekly: () => apiFetch("/progress/weekly"),

  // Stats globales
  getStats: () => apiFetch("/progress/stats"),
};

// ════════════════════════════════════════════════════
//  BADGES
// ════════════════════════════════════════════════════

export const badgesAPI = {
  // Tous les badges (remplace BADGES hardcodé)
  getAll: () => apiFetch("/badges"),
};

// ════════════════════════════════════════════════════
//  CLASSEMENT PUBLIC
// ════════════════════════════════════════════════════

export const leaderboardAPI = {
  // Top utilisateurs publics
  getTop: (limit = 20) => apiFetch(`/leaderboard?limit=${limit}`),

  // Mon rang
  getMyRank: () => apiFetch("/leaderboard/me"),

  // Changer visibilité
  setVisibility: (is_public) =>
    apiFetch("/leaderboard/visibility", {
      method: "PATCH",
      body: JSON.stringify({ is_public }),
    }),
};

// ════════════════════════════════════════════════════
//  SOURATES
// ════════════════════════════════════════════════════

export const souratesAPI = {
  getAll: () => apiFetch("/sourates"),
  getById: (id) => apiFetch(`/sourates/${id}`),
};

// ════════════════════════════════════════════════════
//  CHAT EN TEMPS RÉEL (Socket.IO)
// ════════════════════════════════════════════════════

import { io } from "socket.io-client";

export class ChatService {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
  }

  // Connexion avec authentification
  connect() {
    const token = localStorage.getItem("mchr_token");
    if (!token) throw new Error("Non authentifié");

    this.socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });

    this.socket.on("connect", () => console.log("💬 Chat connecté"));
    this.socket.on("connect_error", (err) => console.error("Chat erreur:", err.message));
    return this;
  }

  // Rejoindre une salle
  joinRoom(room, onMessage, onUserJoined) {
    if (!this.socket) this.connect();
    this.currentRoom = room;
    this.socket.emit("join_room", room);
    this.socket.on("new_message", onMessage);
    this.socket.on("user_joined", onUserJoined);
    return this;
  }

  // Envoyer un message
  sendMessage(content) {
    if (!this.socket || !this.currentRoom) return;
    this.socket.emit("send_message", { room: this.currentRoom, content });
  }

  // Indicateur de frappe
  sendTyping() {
    if (!this.socket || !this.currentRoom) return;
    this.socket.emit("typing", { room: this.currentRoom });
  }

  // Écouter la frappe des autres
  onTyping(callback) {
    this.socket?.on("user_typing", callback);
  }

  // Déconnexion propre
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Charger l'historique REST
  getHistory(room) {
    return apiFetch(`/chat/${room}`);
  }
}

export const chatService = new ChatService();
