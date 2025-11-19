// Persistent store using Upstash Redis with in-memory fallback
const VacheTaureauGame = require('../../game-class');

// Initialize Redis client if credentials are available
let redis = null;
let useRedis = false;

// Try to initialize Upstash Redis
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    useRedis = true;
    console.log('✅ Using Upstash Redis for persistent storage');
  } catch (error) {
    console.warn('⚠️  Redis initialization failed, falling back to in-memory storage:', error.message);
  }
} else {
  console.log('ℹ️  No Redis credentials found, using in-memory storage (local dev mode)');
}

// In-memory fallback for local development
const memoryGames = new Map();
const memoryPlayers = new Map();

// Helper: Serialize game instance to JSON
function serializeGame(gameData) {
  if (!gameData.gameInstance) return gameData;

  const instance = gameData.gameInstance;
  return {
    ...gameData,
    gameInstance: {
      roomId: instance.roomId,
      secretNumber: instance.secretNumber,
      players: instance.players,
      gameStarted: instance.gameStarted,
      gameEnded: instance.gameEnded,
      winner: instance.winner,
      attempts: Array.from(instance.attempts.entries()),
      createdAt: instance.createdAt
    }
  };
}

// Helper: Deserialize JSON to game instance
function deserializeGame(data) {
  if (!data || !data.gameInstance) return data;

  const serialized = data.gameInstance;
  const game = new VacheTaureauGame(serialized.roomId);

  game.secretNumber = serialized.secretNumber;
  game.players = serialized.players;
  game.gameStarted = serialized.gameStarted;
  game.gameEnded = serialized.gameEnded;
  game.winner = serialized.winner;
  game.attempts = new Map(serialized.attempts);
  game.createdAt = serialized.createdAt;

  return {
    ...data,
    gameInstance: game
  };
}

module.exports = {
  // Room operations
  async createRoom(roomId, gameData) {
    const data = {
      ...gameData,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    if (useRedis) {
      try {
        await redis.set(`room:${roomId}`, JSON.stringify(serializeGame(data)), { ex: 86400 }); // 24 hour expiry
      } catch (error) {
        console.error('Redis set error:', error);
        memoryGames.set(roomId, data);
      }
    } else {
      memoryGames.set(roomId, data);
    }
  },

  async getRoom(roomId) {
    if (useRedis) {
      try {
        const data = await redis.get(`room:${roomId}`);
        if (!data) return null;

        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const room = deserializeGame(parsed);

        // Update last activity
        room.lastActivity = Date.now();
        await redis.set(`room:${roomId}`, JSON.stringify(serializeGame(room)), { ex: 86400 });

        return room;
      } catch (error) {
        console.error('Redis get error:', error);
        return memoryGames.get(roomId);
      }
    } else {
      const room = memoryGames.get(roomId);
      if (room) {
        room.lastActivity = Date.now();
      }
      return room;
    }
  },

  async updateRoom(roomId, updates) {
    if (useRedis) {
      try {
        const existing = await this.getRoom(roomId);
        if (existing) {
          const updated = { ...existing, ...updates, lastActivity: Date.now() };
          await redis.set(`room:${roomId}`, JSON.stringify(serializeGame(updated)), { ex: 86400 });
        }
      } catch (error) {
        console.error('Redis update error:', error);
        const room = memoryGames.get(roomId);
        if (room) {
          Object.assign(room, updates, { lastActivity: Date.now() });
          memoryGames.set(roomId, room);
        }
      }
    } else {
      const room = memoryGames.get(roomId);
      if (room) {
        Object.assign(room, updates, { lastActivity: Date.now() });
        memoryGames.set(roomId, room);
      }
    }
  },

  async deleteRoom(roomId) {
    if (useRedis) {
      try {
        await redis.del(`room:${roomId}`);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }
    memoryGames.delete(roomId);
  },

  async getAllRooms() {
    if (useRedis) {
      try {
        const keys = await redis.keys('room:*');
        const rooms = [];

        for (const key of keys) {
          const data = await redis.get(key);
          if (data) {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            const roomId = key.replace('room:', '');
            rooms.push({
              id: roomId,
              ...deserializeGame(parsed)
            });
          }
        }

        return rooms;
      } catch (error) {
        console.error('Redis getAllRooms error:', error);
        return Array.from(memoryGames.entries()).map(([id, data]) => ({ id, ...data }));
      }
    } else {
      return Array.from(memoryGames.entries()).map(([id, data]) => ({ id, ...data }));
    }
  },

  // Player operations
  async addPlayer(playerId, playerData) {
    const data = {
      ...playerData,
      connectedAt: Date.now()
    };

    if (useRedis) {
      try {
        await redis.set(`player:${playerId}`, JSON.stringify(data), { ex: 86400 });
      } catch (error) {
        console.error('Redis addPlayer error:', error);
        memoryPlayers.set(playerId, data);
      }
    } else {
      memoryPlayers.set(playerId, data);
    }
  },

  async getPlayer(playerId) {
    if (useRedis) {
      try {
        const data = await redis.get(`player:${playerId}`);
        return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
      } catch (error) {
        console.error('Redis getPlayer error:', error);
        return memoryPlayers.get(playerId);
      }
    } else {
      return memoryPlayers.get(playerId);
    }
  },

  async removePlayer(playerId) {
    if (useRedis) {
      try {
        await redis.del(`player:${playerId}`);
      } catch (error) {
        console.error('Redis removePlayer error:', error);
      }
    }
    memoryPlayers.delete(playerId);
  },

  // Cleanup old rooms (Redis TTL handles this automatically)
  async cleanup(maxAge = 3600000) {
    if (!useRedis) {
      const now = Date.now();
      for (const [roomId, room] of memoryGames.entries()) {
        if (now - room.lastActivity > maxAge) {
          memoryGames.delete(roomId);
        }
      }
    }
    // Redis handles cleanup via TTL (expiration)
  },

  // Utility to check if using Redis
  isUsingRedis() {
    return useRedis;
  }
};
