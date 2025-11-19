const { VacheTaureauGame, store } = require('../lib/game');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerName } = req.body;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const playerId = uuidv4();

    // Create game instance
    const game = new VacheTaureauGame(roomId);
    const result = game.addPlayer(playerId, playerName.trim());

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Store game state
    await store.createRoom(roomId, {
      game: game.getGameState(),
      gameInstance: game // Store instance for server-side use
    });

    // Store player info
    await store.addPlayer(playerId, {
      name: playerName.trim(),
      roomId: roomId
    });

    return res.status(200).json({
      success: true,
      roomId,
      playerId,
      playerName: playerName.trim()
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
