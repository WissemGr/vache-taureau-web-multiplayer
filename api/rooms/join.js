const { store } = require('../lib/game');
const { v4: uuidv4 } = require('uuid');

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
    const { roomId, playerName } = req.body;

    if (!roomId || !playerName) {
      return res.status(400).json({ error: 'Room ID and player name are required' });
    }

    const room = await store.getRoom(roomId);
    if (!room || !room.gameInstance) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const playerId = uuidv4();
    const result = room.gameInstance.addPlayer(playerId, playerName.trim());

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Update room state
    await store.updateRoom(roomId, {
      game: room.gameInstance.getGameState()
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
      playerName: playerName.trim(),
      gameState: room.gameInstance.getGameState()
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
