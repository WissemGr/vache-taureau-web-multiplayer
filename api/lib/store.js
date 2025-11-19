// Simple in-memory store for game state
// Note: This resets on each deployment, suitable for demo
// For production, use Vercel KV or Upstash Redis

const games = new Map();
const players = new Map();

module.exports = {
  // Room operations
  createRoom(roomId, gameData) {
    games.set(roomId, {
      ...gameData,
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
  },

  getRoom(roomId) {
    const room = games.get(roomId);
    if (room) {
      room.lastActivity = Date.now();
    }
    return room;
  },

  updateRoom(roomId, updates) {
    const room = games.get(roomId);
    if (room) {
      Object.assign(room, updates, { lastActivity: Date.now() });
      games.set(roomId, room);
    }
  },

  deleteRoom(roomId) {
    games.delete(roomId);
  },

  getAllRooms() {
    return Array.from(games.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  },

  // Player operations
  addPlayer(playerId, playerData) {
    players.set(playerId, {
      ...playerData,
      connectedAt: Date.now()
    });
  },

  getPlayer(playerId) {
    return players.get(playerId);
  },

  removePlayer(playerId) {
    players.delete(playerId);
  },

  // Cleanup old rooms (call periodically)
  cleanup(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [roomId, room] of games.entries()) {
      if (now - room.lastActivity > maxAge) {
        games.delete(roomId);
      }
    }
  }
};
