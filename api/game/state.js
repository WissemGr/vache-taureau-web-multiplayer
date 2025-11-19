const { store } = require('../lib/game');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const room = await store.getRoom(roomId);
    if (!room || !room.gameInstance) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.status(200).json({
      success: true,
      gameState: room.gameInstance.getGameState(),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
