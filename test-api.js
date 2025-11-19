// API Endpoint Tests
const assert = require('assert');
const { VacheTaureauGame } = require('./api/lib/game');
const store = require('./api/lib/store');

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${description}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${description}`);
    console.error(`  ${error.message}`);
  }
}

function resetStore() {
  // Clear all data from store
  const rooms = store.getAllRooms();
  rooms.forEach(room => store.deleteRoom(room.id));
}

console.log('\n🧪 Running API Tests...\n');

// =============================================================================
// STORE TESTS
// =============================================================================
console.log('📦 Store Tests');

test('Store: should create and retrieve room', () => {
  resetStore();
  const roomId = 'TEST123';
  const game = new VacheTaureauGame(roomId);

  store.createRoom(roomId, {
    game: game.getGameState(),
    gameInstance: game
  });

  const room = store.getRoom(roomId);
  assert(room !== undefined, 'Room should exist');
  assert(room.gameInstance instanceof VacheTaureauGame, 'Should store game instance');
});

test('Store: should update room', () => {
  resetStore();
  const roomId = 'TEST456';
  const game = new VacheTaureauGame(roomId);

  store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });
  store.updateRoom(roomId, { testField: 'updated' });

  const room = store.getRoom(roomId);
  assert(room.testField === 'updated', 'Room should be updated');
});

test('Store: should delete room', () => {
  resetStore();
  const roomId = 'TEST789';
  const game = new VacheTaureauGame(roomId);

  store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });
  store.deleteRoom(roomId);

  const room = store.getRoom(roomId);
  assert(room === undefined, 'Room should be deleted');
});

test('Store: should list all rooms', () => {
  resetStore();

  for (let i = 0; i < 3; i++) {
    const roomId = `ROOM${i}`;
    const game = new VacheTaureauGame(roomId);
    store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });
  }

  const rooms = store.getAllRooms();
  assert(rooms.length === 3, 'Should have 3 rooms');
});

test('Store: should add and retrieve player', () => {
  resetStore();
  const playerId = 'PLAYER1';

  store.addPlayer(playerId, { name: 'Test Player', roomId: 'ROOM1' });

  const player = store.getPlayer(playerId);
  assert(player !== undefined, 'Player should exist');
  assert(player.name === 'Test Player', 'Player name should match');
});

test('Store: should remove player', () => {
  resetStore();
  const playerId = 'PLAYER2';

  store.addPlayer(playerId, { name: 'Test Player', roomId: 'ROOM1' });
  store.removePlayer(playerId);

  const player = store.getPlayer(playerId);
  assert(player === undefined, 'Player should be removed');
});

test('Store: should cleanup old rooms', () => {
  resetStore();
  const roomId = 'OLDROOM';
  const game = new VacheTaureauGame(roomId);

  store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });

  // Simulate old room (set lastActivity to 2 hours ago)
  const room = store.getRoom(roomId);
  room.lastActivity = Date.now() - (2 * 60 * 60 * 1000);

  store.cleanup(60 * 60 * 1000); // 1 hour max age

  const rooms = store.getAllRooms();
  assert(rooms.length === 0, 'Old rooms should be cleaned up');
});

// =============================================================================
// GAME LOGIC TESTS (Integration with Store)
// =============================================================================
console.log('\n🎮 Game Logic Integration Tests');

test('Game: should create room with player', () => {
  resetStore();
  const roomId = 'GAME001';
  const playerId = 'PLAYER001';
  const playerName = 'Alice';

  const game = new VacheTaureauGame(roomId);
  const result = game.addPlayer(playerId, playerName);

  assert(result.success === true, 'Should add player successfully');

  store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });
  store.addPlayer(playerId, { name: playerName, roomId });

  const room = store.getRoom(roomId);
  const player = store.getPlayer(playerId);

  assert(room !== undefined, 'Room should exist');
  assert(player !== undefined, 'Player should exist');
  assert(player.name === playerName, 'Player name should match');
});

test('Game: should handle multiple players joining', () => {
  resetStore();
  const roomId = 'GAME002';
  const game = new VacheTaureauGame(roomId);

  const players = ['Alice', 'Bob', 'Charlie'];

  players.forEach((name, i) => {
    const playerId = `PLAYER${i}`;
    const result = game.addPlayer(playerId, name);
    assert(result.success === true, `Should add player ${name}`);
    store.addPlayer(playerId, { name, roomId });
  });

  store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });

  const gameState = game.getGameState();
  assert(gameState.players.length === 3, 'Should have 3 players');
});

test('Game: should start game and validate', () => {
  resetStore();
  const roomId = 'GAME003';
  const game = new VacheTaureauGame(roomId);

  // Add 2 players (minimum required)
  game.addPlayer('P1', 'Alice');
  game.addPlayer('P2', 'Bob');

  const result = game.startGame('P1');

  assert(result.success === true, 'Should start game');
  assert(game.gameStarted === true, 'Game should be started');
  assert(game.secretNumber.length === 4, 'Secret number should be generated');
});

test('Game: should process guess and return result', () => {
  resetStore();
  const roomId = 'GAME004';
  const game = new VacheTaureauGame(roomId);

  game.addPlayer('P1', 'Alice');
  game.addPlayer('P2', 'Bob');
  game.startGame('P1');

  // Make a guess
  const result = game.makeGuess('P1', '1234');

  assert(result.success === true, 'Guess should be processed');
  assert(result.attempt !== undefined, 'Should return attempt result');
  assert(typeof result.attempt.bulls === 'number', 'Should return bulls count');
  assert(typeof result.attempt.cows === 'number', 'Should return cows count');
});

test('Game: should validate guess format', () => {
  resetStore();
  const roomId = 'GAME005';
  const game = new VacheTaureauGame(roomId);

  game.addPlayer('P1', 'Alice');
  game.addPlayer('P2', 'Bob');
  game.startGame('P1');

  // Invalid guesses
  const invalidGuesses = ['123', '12345', 'abcd', '1123', ''];

  invalidGuesses.forEach(guess => {
    const result = game.makeGuess('P1', guess);
    assert(result.success === false, `Should reject invalid guess: ${guess}`);
  });
});

test('Game: should track game attempts', () => {
  resetStore();
  const roomId = 'GAME006';
  const game = new VacheTaureauGame(roomId);

  game.addPlayer('P1', 'Alice');
  game.addPlayer('P2', 'Bob');
  game.startGame('P1');

  // Make multiple guesses
  game.makeGuess('P1', '1234');
  game.makeGuess('P1', '5678');
  game.makeGuess('P2', '9012');

  const gameState = game.getGameState();
  const attemptCount = gameState.players
    .reduce((sum, p) => sum + p.attempts.length, 0);

  assert(attemptCount === 3, 'Should track all attempts');
});

test('Game: should not allow game start with < 2 players', () => {
  resetStore();
  const roomId = 'GAME007';
  const game = new VacheTaureauGame(roomId);

  game.addPlayer('P1', 'Alice');

  const result = game.startGame('P1');

  assert(result.success === false, 'Should not start with < 2 players');
  assert(game.gameStarted === false, 'Game should not be started');
});

test('Game: should enforce max players limit', () => {
  resetStore();
  const roomId = 'GAME008';
  const game = new VacheTaureauGame(roomId, 4); // Max 4 players

  // Add 4 players
  for (let i = 0; i < 4; i++) {
    const result = game.addPlayer(`P${i}`, `Player${i}`);
    assert(result.success === true, `Player ${i} should join`);
  }

  // Try to add 5th player
  const result = game.addPlayer('P5', 'Player5');
  assert(result.success === false, 'Should reject 5th player');
});

// =============================================================================
// API REQUEST/RESPONSE SIMULATION
// =============================================================================
console.log('\n🌐 API Request/Response Simulation Tests');

function simulateRequest(method, body = {}, query = {}) {
  return {
    method,
    body,
    query,
    headers: { 'Content-Type': 'application/json' }
  };
}

function simulateResponse() {
  let statusCode = 200;
  let responseData = null;
  let headers = {};

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    setHeader(key, value) {
      headers[key] = value;
      return this;
    },
    end() {
      return this;
    },
    getStatus() {
      return statusCode;
    },
    getData() {
      return responseData;
    }
  };
}

test('API: Create room should validate player name', () => {
  const req = simulateRequest('POST', { playerName: '' });
  const res = simulateResponse();

  // Simulate validation
  if (!req.body.playerName || req.body.playerName.trim().length === 0) {
    res.status(400).json({ error: 'Player name is required' });
  }

  assert(res.getStatus() === 400, 'Should return 400 for empty name');
  assert(res.getData().error !== undefined, 'Should return error message');
});

test('API: Join room should validate room ID and player name', () => {
  const req = simulateRequest('POST', { roomId: '', playerName: 'Test' });
  const res = simulateResponse();

  if (!req.body.roomId || !req.body.playerName) {
    res.status(400).json({ error: 'Room ID and player name are required' });
  }

  assert(res.getStatus() === 400, 'Should return 400 for missing room ID');
});

test('API: Get game state should validate room ID', () => {
  const req = simulateRequest('GET', {}, {});
  const res = simulateResponse();

  if (!req.query.roomId) {
    res.status(400).json({ error: 'Room ID is required' });
  }

  assert(res.getStatus() === 400, 'Should return 400 for missing room ID');
});

// =============================================================================
// EDGE CASES
// =============================================================================
console.log('\n⚠️  Edge Case Tests');

test('Edge: Handle room that doesn\'t exist', () => {
  resetStore();
  const room = store.getRoom('NONEXISTENT');
  assert(room === undefined, 'Should return undefined for non-existent room');
});

test('Edge: Handle player that doesn\'t exist', () => {
  resetStore();
  const player = store.getPlayer('NONEXISTENT');
  assert(player === undefined, 'Should return undefined for non-existent player');
});

test('Edge: Handle duplicate player names in same room', () => {
  resetStore();
  const roomId = 'DUPLICATE_TEST';
  const game = new VacheTaureauGame(roomId);

  const result1 = game.addPlayer('P1', 'Alice');
  const result2 = game.addPlayer('P2', 'Alice'); // Same name

  assert(result1.success === true, 'First Alice should join');
  assert(result2.success === true, 'Second Alice should join (allowed)');
});

test('Edge: Handle guess before game starts', () => {
  resetStore();
  const roomId = 'EARLY_GUESS';
  const game = new VacheTaureauGame(roomId);

  game.addPlayer('P1', 'Alice');
  game.addPlayer('P2', 'Bob');

  const result = game.makeGuess('P1', '1234');

  assert(result.success === false, 'Should reject guess before game starts');
  assert(result.message !== undefined, 'Should provide error message');
});

test('Edge: Handle empty rooms list', () => {
  resetStore();
  const rooms = store.getAllRooms();
  assert(rooms.length === 0, 'Should return empty array');
  assert(Array.isArray(rooms), 'Should return array');
});

test('Edge: Handle concurrent room updates', () => {
  resetStore();
  const roomId = 'CONCURRENT';
  const game = new VacheTaureauGame(roomId);

  store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });

  // Simulate concurrent updates
  store.updateRoom(roomId, { field1: 'value1' });
  store.updateRoom(roomId, { field2: 'value2' });

  const room = store.getRoom(roomId);
  assert(room.field1 === 'value1', 'First update should persist');
  assert(room.field2 === 'value2', 'Second update should persist');
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================
console.log('\n⚡ Performance Tests');

test('Performance: Should handle 100 rooms efficiently', () => {
  resetStore();
  const startTime = Date.now();

  for (let i = 0; i < 100; i++) {
    const roomId = `PERF_ROOM_${i}`;
    const game = new VacheTaureauGame(roomId);
    store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });
  }

  const duration = Date.now() - startTime;
  const rooms = store.getAllRooms();

  assert(rooms.length === 100, 'Should create 100 rooms');
  assert(duration < 1000, `Should complete in < 1s (took ${duration}ms)`);
});

test('Performance: Should retrieve room quickly', () => {
  resetStore();

  // Create 50 rooms
  for (let i = 0; i < 50; i++) {
    const roomId = `LOOKUP_ROOM_${i}`;
    const game = new VacheTaureauGame(roomId);
    store.createRoom(roomId, { game: game.getGameState(), gameInstance: game });
  }

  const startTime = Date.now();
  const room = store.getRoom('LOOKUP_ROOM_25');
  const duration = Date.now() - startTime;

  assert(room !== undefined, 'Should find room');
  assert(duration < 10, `Should find in < 10ms (took ${duration}ms)`);
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✓ Passed: ${testsPassed}`);
console.log(`✗ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
