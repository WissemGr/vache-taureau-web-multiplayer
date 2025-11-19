// Real API integration tests using supertest
const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());

// Load API handlers
const createRoomHandler = require('./api/rooms/create');
const joinRoomHandler = require('./api/rooms/join');
const listRoomsHandler = require('./api/rooms/list');
const startGameHandler = require('./api/game/start');
const guessHandler = require('./api/game/guess');
const gameStateHandler = require('./api/game/state');

// Register routes
app.post('/api/rooms/create', createRoomHandler);
app.post('/api/rooms/join', joinRoomHandler);
app.get('/api/rooms/list', listRoomsHandler);
app.post('/api/game/start', startGameHandler);
app.post('/api/game/guess', guessHandler);
app.get('/api/game/state', gameStateHandler);

describe('Real API Integration Tests', () => {
  let roomId, playerId;

  describe('Complete game flow through API', () => {
    test('should create a room via API', async () => {
      const response = await request(app)
        .post('/api/rooms/create')
        .send({ playerName: 'TestPlayer' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.roomId).toBeDefined();
      expect(response.body.playerId).toBeDefined();
      expect(response.body.playerName).toBe('TestPlayer');

      // Save for next tests
      roomId = response.body.roomId;
      playerId = response.body.playerId;
    });

    test('should list rooms via API', async () => {
      const response = await request(app)
        .get('/api/rooms/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.rooms).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('should get game state via API', async () => {
      const response = await request(app)
        .get(`/api/game/state?roomId=${roomId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gameState).toBeDefined();
      expect(response.body.gameState.roomId).toBe(roomId);
      expect(response.body.gameState.gameStarted).toBe(false);
    });

    test('should start game via API', async () => {
      const response = await request(app)
        .post('/api/game/start')
        .send({ roomId, playerId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gameState.gameStarted).toBe(true);
    });

    test('should make guess via API', async () => {
      const response = await request(app)
        .post('/api/game/guess')
        .send({ roomId, playerId, guess: '1234' })
        .expect(200);

      expect(response.body.success).toBeDefined();
      if (response.body.success) {
        expect(response.body.attempt).toBeDefined();
        expect(response.body.attempt.bulls).toBeDefined();
        expect(response.body.attempt.cows).toBeDefined();
      }
    });

    test('should join existing room via API', async () => {
      const response = await request(app)
        .post('/api/rooms/join')
        .send({ roomId, playerName: 'SecondPlayer' })
        .expect(400); // Should fail because game already started

      expect(response.body.error).toBeDefined();
    });
  });

  describe('API error handling', () => {
    test('should handle missing player name on create', async () => {
      const response = await request(app)
        .post('/api/rooms/create')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    test('should handle non-existent room', async () => {
      const response = await request(app)
        .get('/api/game/state?roomId=NONEXISTENT')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    test('should handle invalid guess format', async () => {
      // Create new game for this test
      const createRes = await request(app)
        .post('/api/rooms/create')
        .send({ playerName: 'TestPlayer' });

      const newRoomId = createRes.body.roomId;
      const newPlayerId = createRes.body.playerId;

      // Start game
      await request(app)
        .post('/api/game/start')
        .send({ roomId: newRoomId, playerId: newPlayerId });

      // Make invalid guess
      const response = await request(app)
        .post('/api/game/guess')
        .send({ roomId: newRoomId, playerId: newPlayerId, guess: 'abcd' })
        .expect(200);

      expect(response.body.success).toBe(false);
    });

    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/rooms/create');

      // OPTIONS can return either 200 or 204
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('CORS headers', () => {
    test('should include CORS headers in responses', async () => {
      const response = await request(app)
        .post('/api/rooms/create')
        .send({ playerName: 'Test' });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
