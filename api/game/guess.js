const { store } = require('../lib/game');

module.exports = async (req, res) => {
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
    const { roomId, playerId, guess } = req.body;

    if (!roomId || !playerId || !guess) {
      return res.status(400).json({ error: 'Room ID, player ID, and guess are required' });
    }

    const room = await store.getRoom(roomId);
    if (!room || !room.gameInstance) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const result = room.gameInstance.makeGuess(playerId, guess);

    // Update room state
    await store.updateRoom(roomId, {
      game: room.gameInstance.getGameState()
    });

    return res.status(200).json({
      success: result.success,
      ...result,
      gameState: room.gameInstance.getGameState()
    });
  } catch (error) {
    console.error('Error making guess:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
