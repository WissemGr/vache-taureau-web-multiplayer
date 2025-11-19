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
    const { roomId, playerId } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({ error: 'Room ID and player ID are required' });
    }

    const room = await store.getRoom(roomId);
    if (!room || !room.gameInstance) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const success = room.gameInstance.startGame();

    // Update room state
    await store.updateRoom(roomId, {
      game: room.gameInstance.getGameState()
    });

    if (!success) {
      return res.status(400).json({
        error: 'Cannot start game - no players in room',
        gameState: room.gameInstance.getGameState()
      });
    }

    return res.status(200).json({
      success: true,
      gameState: room.gameInstance.getGameState()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
