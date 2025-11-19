// Mock the required modules
const { VacheTaureauGame, store } = require('./lib/game');

// Test utilities
function createMockReq(method, body = {}, query = {}) {
  return {
    method,
    body,
    query
  };
}

function createMockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    ended: false
  };

  res.setHeader = (key, value) => {
    res.headers[key] = value;
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    res.body = data;
    return res;
  };

  res.end = () => {
    res.ended = true;
    return res;
  };

  return res;
}

describe('API Endpoints', () => {
  beforeEach(async () => {
    // Clear store before each test
    const rooms = await store.getAllRooms();
    for (const room of rooms) {
      await store.deleteRoom(room.id);
    }
  });

  describe('POST /api/rooms/create', () => {
    const createRoom = require('./rooms/create');

    test('should create room successfully', async () => {
      const req = createMockReq('POST', { playerName: 'Alice' });
      const res = createMockRes();

      await createRoom(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roomId).toBeDefined();
      expect(res.body.playerId).toBeDefined();
      expect(res.body.playerName).toBe('Alice');
    });

    test('should handle OPTIONS request', async () => {
      const req = createMockReq('OPTIONS');
      const res = createMockRes();

      await createRoom(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.ended).toBe(true);
    });

    test('should reject non-POST requests', async () => {
      const req = createMockReq('GET');
      const res = createMockRes();

      await createRoom(req, res);

      expect(res.statusCode).toBe(405);
      expect(res.body.error).toContain('Method not allowed');
    });

    test('should reject empty player name', async () => {
      const req = createMockReq('POST', { playerName: '' });
      const res = createMockRes();

      await createRoom(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should trim player name', async () => {
      const req = createMockReq('POST', { playerName: '  Bob  ' });
      const res = createMockRes();

      await createRoom(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.playerName).toBe('Bob');
    });

    test('should set CORS headers', async () => {
      const req = createMockReq('POST', { playerName: 'Alice' });
      const res = createMockRes();

      await createRoom(req, res);

      expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(res.headers['Access-Control-Allow-Methods']).toBeDefined();
    });
  });

  describe('POST /api/rooms/join', () => {
    const joinRoom = require('./rooms/join');

    test('should join room successfully', async () => {
      // First create a room
      const game = new VacheTaureauGame('TEST-ROOM');
      await store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'TEST-ROOM',
        playerName: 'Bob'
      });
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roomId).toBe('TEST-ROOM');
      expect(res.body.playerId).toBeDefined();
      expect(res.body.playerName).toBe('Bob');
      expect(res.body.gameState).toBeDefined();
    });

    test('should handle OPTIONS request', async () => {
      const req = createMockReq('OPTIONS');
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.ended).toBe(true);
    });

    test('should reject non-POST requests', async () => {
      const req = createMockReq('GET');
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(405);
    });

    test('should reject missing roomId', async () => {
      const req = createMockReq('POST', { playerName: 'Alice' });
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should reject missing playerName', async () => {
      const req = createMockReq('POST', { roomId: 'TEST' });
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should return 404 for non-existent room', async () => {
      const req = createMockReq('POST', {
        roomId: 'NON-EXISTENT',
        playerName: 'Alice'
      });
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('should reject joining started game', async () => {
      const game = new VacheTaureauGame('TEST-ROOM');
      game.addPlayer('p1', 'Player1');
      game.startGame();

      store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'TEST-ROOM',
        playerName: 'Late Player'
      });
      const res = createMockRes();

      await joinRoom(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('déjà commencé');
    });
  });

  describe('GET /api/rooms/list', () => {
    const listRooms = require('./rooms/list');

    test('should list all rooms', async () => {
      // Create some rooms
      const game1 = new VacheTaureauGame('ROOM-1');
      const game2 = new VacheTaureauGame('ROOM-2');

      store.createRoom('ROOM-1', {
        game: game1.getGameState(),
        gameInstance: game1
      });

      store.createRoom('ROOM-2', {
        game: game2.getGameState(),
        gameInstance: game2
      });

      const req = createMockReq('GET');
      const res = createMockRes();

      await listRooms(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rooms).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    test('should return empty list when no rooms', async () => {
      const req = createMockReq('GET');
      const res = createMockRes();

      await listRooms(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.rooms).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    test('should handle OPTIONS request', async () => {
      const req = createMockReq('OPTIONS');
      const res = createMockRes();

      await listRooms(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.ended).toBe(true);
    });

    test('should reject non-GET requests', async () => {
      const req = createMockReq('POST');
      const res = createMockRes();

      await listRooms(req, res);

      expect(res.statusCode).toBe(405);
    });
  });

  describe('GET /api/game/state', () => {
    const getState = require('./game/state');

    test('should get game state successfully', async () => {
      const game = new VacheTaureauGame('TEST-ROOM');
      game.addPlayer('p1', 'Alice');

      store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('GET', {}, { roomId: 'TEST-ROOM' });
      const res = createMockRes();

      await getState(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.gameState).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });

    test('should handle OPTIONS request', async () => {
      const req = createMockReq('OPTIONS');
      const res = createMockRes();

      await getState(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.ended).toBe(true);
    });

    test('should reject non-GET requests', async () => {
      const req = createMockReq('POST');
      const res = createMockRes();

      await getState(req, res);

      expect(res.statusCode).toBe(405);
    });

    test('should require roomId parameter', async () => {
      const req = createMockReq('GET', {}, {});
      const res = createMockRes();

      await getState(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should return 404 for non-existent room', async () => {
      const req = createMockReq('GET', {}, { roomId: 'NON-EXISTENT' });
      const res = createMockRes();

      await getState(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('POST /api/game/start', () => {
    const startGame = require('./game/start');

    test('should start game successfully', async () => {
      const game = new VacheTaureauGame('TEST-ROOM');
      game.addPlayer('p1', 'Alice');

      store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'TEST-ROOM',
        playerId: 'p1'
      });
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.gameState.gameStarted).toBe(true);
    });

    test('should handle OPTIONS request', async () => {
      const req = createMockReq('OPTIONS');
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.ended).toBe(true);
    });

    test('should reject non-POST requests', async () => {
      const req = createMockReq('GET');
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(405);
    });

    test('should require roomId', async () => {
      const req = createMockReq('POST', { playerId: 'p1' });
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should require playerId', async () => {
      const req = createMockReq('POST', { roomId: 'TEST' });
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should return 404 for non-existent room', async () => {
      const req = createMockReq('POST', {
        roomId: 'NON-EXISTENT',
        playerId: 'p1'
      });
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('should fail to start game with no players', async () => {
      const game = new VacheTaureauGame('EMPTY-ROOM');

      store.createRoom('EMPTY-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'EMPTY-ROOM',
        playerId: 'p1'
      });
      const res = createMockRes();

      await startGame(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('no players');
    });
  });

  describe('POST /api/game/guess', () => {
    const makeGuess = require('./game/guess');

    test('should make guess successfully', async () => {
      const game = new VacheTaureauGame('TEST-ROOM');
      game.secretNumber = '1234';
      game.addPlayer({ id: 'p1' }, 'Alice');
      game.startGame();

      store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'TEST-ROOM',
        playerId: 'p1',
        guess: '5678'
      });
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.attempt).toBeDefined();
      expect(res.body.gameState).toBeDefined();
    });

    test('should handle winning guess', async () => {
      const game = new VacheTaureauGame('TEST-ROOM');
      game.secretNumber = '1234';
      game.addPlayer({ id: 'p1' }, 'Alice');
      game.startGame();

      store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'TEST-ROOM',
        playerId: 'p1',
        guess: '1234'
      });
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isWinner).toBe(true);
      expect(res.body.secretNumber).toBe('1234');
    });

    test('should handle OPTIONS request', async () => {
      const req = createMockReq('OPTIONS');
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.ended).toBe(true);
    });

    test('should reject non-POST requests', async () => {
      const req = createMockReq('GET');
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(405);
    });

    test('should require all parameters', async () => {
      const req = createMockReq('POST', { roomId: 'TEST' });
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should return 404 for non-existent room', async () => {
      const req = createMockReq('POST', {
        roomId: 'NON-EXISTENT',
        playerId: 'p1',
        guess: '1234'
      });
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('should reject invalid guess', async () => {
      const game = new VacheTaureauGame('TEST-ROOM');
      game.addPlayer({ id: 'p1' }, 'Alice');
      game.startGame();

      store.createRoom('TEST-ROOM', {
        game: game.getGameState(),
        gameInstance: game
      });

      const req = createMockReq('POST', {
        roomId: 'TEST-ROOM',
        playerId: 'p1',
        guess: '1122' // Duplicate digits
      });
      const res = createMockRes();

      await makeGuess(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });
});
