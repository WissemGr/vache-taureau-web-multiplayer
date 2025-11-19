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
    // Cleanup old rooms
    store.cleanup();

    const allRooms = store.getAllRooms();
    const rooms = allRooms.map(room => ({
      id: room.id,
      playerCount: room.gameInstance ? room.gameInstance.players.size : 0,
      maxPlayers: room.gameInstance ? room.gameInstance.maxPlayers : 4,
      gameStarted: room.game ? room.game.gameStarted : false,
      createdAt: room.createdAt
    }));

    return res.status(200).json({
      success: true,
      rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Error listing rooms:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
