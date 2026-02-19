const jwt = require("jsonwebtoken");
const db = require("../database/db");

/**
 * Configure le chat en temps réel via Socket.IO
 * Salles disponibles: general, debutant, avance
 */
function setupSocketChat(io) {
  // ─── Middleware d'authentification Socket.IO ───
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token manquant"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await db.query(
        "SELECT id, name, level, avatar_url FROM users WHERE id = $1",
        [decoded.id]
      );
      if (!result.rows[0]) return next(new Error("Utilisateur introuvable"));
      socket.user = result.rows[0];
      next();
    } catch {
      next(new Error("Token invalide"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`💬 ${user.name} connecté au chat`);

    // ─── Rejoindre une salle ───
    socket.on("join_room", (room) => {
      const validRooms = ["general", "debutant", "avance"];
      if (!validRooms.includes(room)) return;
      socket.join(room);
      // Notifier les autres
      socket.to(room).emit("user_joined", {
        name: user.name,
        level: user.level,
        message: `${user.name} a rejoint la salle`,
      });
    });

    // ─── Envoyer un message ───
    socket.on("send_message", async ({ room, content }) => {
      const validRooms = ["general", "debutant", "avance"];
      if (!validRooms.includes(room)) return;
      if (!content?.trim() || content.length > 500) return;

      try {
        // Sauvegarder en base
        const result = await db.query(
          `INSERT INTO chat_messages (user_id, content, room)
           VALUES ($1, $2, $3) RETURNING id, created_at`,
          [user.id, content.trim(), room]
        );

        const message = {
          id: result.rows[0].id,
          content: content.trim(),
          created_at: result.rows[0].created_at,
          author: user.name,
          level: user.level,
          avatar_url: user.avatar_url,
          user_id: user.id,
        };

        // Envoyer à toute la salle
        io.to(room).emit("new_message", message);
      } catch (err) {
        console.error("Erreur chat:", err);
        socket.emit("error", { message: "Envoi impossible" });
      }
    });

    // ─── Indicateur de frappe ───
    socket.on("typing", ({ room }) => {
      socket.to(room).emit("user_typing", { name: user.name });
    });

    // ─── Déconnexion ───
    socket.on("disconnect", () => {
      console.log(`💬 ${user.name} déconnecté du chat`);
    });
  });
}

module.exports = { setupSocketChat };
