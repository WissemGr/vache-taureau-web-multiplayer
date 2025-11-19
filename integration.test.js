const VacheTaureauGame = require('./game-class');
const store = require('./api/lib/store');

describe('Integration Tests', () => {
  beforeEach(() => {
    // Clear store before each test
    const rooms = store.getAllRooms();
    rooms.forEach(room => store.deleteRoom(room.id));
  });

  describe('Complete game flow - Single player', () => {
    test('should complete a full game with one player', () => {
      // 1. Create game
      const roomId = 'INT-TEST-1';
      const game = new VacheTaureauGame(roomId);
      expect(game.roomId).toBe(roomId);

      // 2. Add player
      const playerId = 'player-1';
      const result = game.addPlayer({ id: playerId }, 'Alice');
      expect(result.success).toBe(true);

      // 3. Start game
      const started = game.startGame();
      expect(started).toBe(true);
      expect(game.gameStarted).toBe(true);

      // 4. Set known secret for testing
      game.secretNumber = '1234';

      // 5. Make some guesses
      const guess1 = game.makeGuess(playerId, '5678');
      expect(guess1.success).toBe(true);
      expect(guess1.isWinner).toBe(false);

      const guess2 = game.makeGuess(playerId, '1243');
      expect(guess2.success).toBe(true);
      expect(guess2.isWinner).toBe(false);

      // 6. Win the game
      const winningGuess = game.makeGuess(playerId, '1234');
      expect(winningGuess.success).toBe(true);
      expect(winningGuess.isWinner).toBe(true);
      expect(winningGuess.secretNumber).toBe('1234');

      // 7. Verify game state
      const state = game.getGameState();
      expect(state.gameEnded).toBe(true);
      expect(state.winner).toBeDefined();
      expect(state.winner.name).toBe('Alice');
      expect(state.players[0].rank).toBe(1);
    });
  });

  describe('Complete game flow - Multiple players', () => {
    test('should handle a competitive game with multiple players', () => {
      // 1. Create game
      const game = new VacheTaureauGame('MULTI-GAME');
      game.secretNumber = '5678';

      // 2. Add multiple players
      game.addPlayer({ id: 'p1' }, 'Alice');
      game.addPlayer({ id: 'p2' }, 'Bob');
      game.addPlayer({ id: 'p3' }, 'Charlie');

      expect(game.players).toHaveLength(3);

      // 3. Start game
      game.startGame();

      // 4. Players make guesses
      // Alice makes first guess
      game.makeGuess('p1', '1234');
      expect(game.players[0].attempts).toHaveLength(1);

      // Bob makes first guess
      game.makeGuess('p2', '9012');
      expect(game.players[1].attempts).toHaveLength(1);

      // Charlie makes first guess
      game.makeGuess('p3', '3456');
      expect(game.players[2].attempts).toHaveLength(1);

      // 5. Bob wins first
      const bobWin = game.makeGuess('p2', '5678');
      expect(bobWin.isWinner).toBe(true);
      expect(bobWin.rank).toBe(1);
      expect(game.gameEnded).toBe(false); // Game continues

      // 6. Alice finishes second
      const aliceWin = game.makeGuess('p1', '5678');
      expect(aliceWin.isWinner).toBe(true);
      expect(aliceWin.rank).toBe(2);

      // 7. Charlie finishes last
      const charlieWin = game.makeGuess('p3', '5678');
      expect(charlieWin.isWinner).toBe(true);
      expect(charlieWin.rank).toBe(3);

      // 8. Game should now be ended
      expect(game.gameEnded).toBe(true);

      // 9. Verify final state
      const state = game.getGameState();
      expect(state.gameEnded).toBe(true);
      expect(state.winner.name).toBe('Bob');
      expect(state.secretNumber).toBe('5678');
    });
  });

  describe('Store integration with game', () => {
    test('should manage room lifecycle with store', () => {
      // 1. Create game and store it
      const game = new VacheTaureauGame('STORE-TEST');
      store.createRoom('STORE-TEST', {
        game: game.getGameState(),
        gameInstance: game
      });

      // 2. Retrieve from store
      let room = store.getRoom('STORE-TEST');
      expect(room).toBeDefined();
      expect(room.gameInstance).toBeDefined();

      // 3. Add player through game instance
      const playerId = 'test-player';
      room.gameInstance.addPlayer({ id: playerId }, 'TestPlayer');

      // 4. Add player to store
      store.addPlayer(playerId, {
        name: 'TestPlayer',
        roomId: 'STORE-TEST'
      });

      // 5. Update room state
      store.updateRoom('STORE-TEST', {
        game: room.gameInstance.getGameState()
      });

      // 6. Verify updates
      room = store.getRoom('STORE-TEST');
      expect(room.game.players).toHaveLength(1);

      const player = store.getPlayer(playerId);
      expect(player).toBeDefined();
      expect(player.name).toBe('TestPlayer');

      // 7. Cleanup
      store.removePlayer(playerId);
      store.deleteRoom('STORE-TEST');

      expect(store.getRoom('STORE-TEST')).toBeUndefined();
      expect(store.getPlayer(playerId)).toBeUndefined();
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle player leaving mid-game', () => {
      const game = new VacheTaureauGame('LEAVE-TEST');
      game.addPlayer({ id: 'p1' }, 'Alice');
      game.addPlayer({ id: 'p2' }, 'Bob');
      game.startGame();

      expect(game.players).toHaveLength(2);

      // Player leaves
      const shouldDelete = game.removePlayer('p1');
      expect(shouldDelete).toBe(false); // Bob still there
      expect(game.players).toHaveLength(1);

      // Game can continue
      game.secretNumber = '1234';
      const guess = game.makeGuess('p2', '1234');
      expect(guess.success).toBe(true);
    });

    test('should handle all players leaving', () => {
      const game = new VacheTaureauGame('EMPTY-TEST');
      game.addPlayer({ id: 'p1' }, 'Alice');

      const shouldDelete = game.removePlayer('p1');
      expect(shouldDelete).toBe(true); // No players left
      expect(game.players).toHaveLength(0);
    });

    test('should prevent actions on ended game', () => {
      const game = new VacheTaureauGame('ENDED-TEST');
      game.secretNumber = '1234';
      game.addPlayer({ id: 'p1' }, 'Alice');
      game.startGame();

      // Win the game
      game.makeGuess('p1', '1234');
      expect(game.gameEnded).toBe(true);

      // Try to make another guess
      const result = game.makeGuess('p1', '5678');
      expect(result.success).toBe(false);
      expect(result.message).toContain('terminée');
    });

    test('should handle room capacity correctly', () => {
      const game = new VacheTaureauGame('CAPACITY-TEST');

      // Add maximum players
      for (let i = 1; i <= 4; i++) {
        const result = game.addPlayer({ id: `p${i}` }, `Player${i}`);
        expect(result.success).toBe(true);
      }

      // Try to add 5th player
      const result = game.addPlayer({ id: 'p5' }, 'Player5');
      expect(result.success).toBe(false);
      expect(result.message).toContain('complète');
    });

    test('should calculate scores correctly based on attempts', () => {
      const game = new VacheTaureauGame('SCORE-TEST');
      game.secretNumber = '1234';

      game.addPlayer({ id: 'p1' }, 'Alice');
      game.addPlayer({ id: 'p2' }, 'Bob');
      game.startGame();

      // Alice wins in 1 attempt
      game.makeGuess('p1', '1234');
      expect(game.players[0].score).toBe(1000);

      // Bob wins in 5 attempts
      game.makeGuess('p2', '5678');
      game.makeGuess('p2', '9012');
      game.makeGuess('p2', '3456');
      game.makeGuess('p2', '7890');
      game.makeGuess('p2', '1234');

      expect(game.players[1].score).toBe(600); // 1000 - 4*100
    });
  });

  describe('Store cleanup functionality', () => {
    test('should cleanup old rooms', () => {
      // Create some rooms
      store.createRoom('old-1', { test: true });
      store.createRoom('old-2', { test: true });
      store.createRoom('new-1', { test: true });

      // Manually set old timestamps
      const old1 = store.getRoom('old-1');
      const old2 = store.getRoom('old-2');
      old1.lastActivity = Date.now() - 7200000; // 2 hours ago
      old2.lastActivity = Date.now() - 5400000; // 1.5 hours ago

      // Cleanup rooms older than 1 hour
      store.cleanup(3600000);

      // Old rooms should be deleted
      expect(store.getRoom('old-1')).toBeUndefined();
      expect(store.getRoom('old-2')).toBeUndefined();

      // New room should remain
      expect(store.getRoom('new-1')).toBeDefined();
    });
  });

  describe('Complete end-to-end scenario', () => {
    test('should simulate a realistic game session', () => {
      const roomId = 'E2E-GAME';

      // 1. Room creation
      const game = new VacheTaureauGame(roomId);
      store.createRoom(roomId, {
        game: game.getGameState(),
        gameInstance: game
      });

      // 2. Players join
      const player1Id = 'player-1';
      const player2Id = 'player-2';

      game.addPlayer({ id: player1Id }, 'Alice');
      store.addPlayer(player1Id, { name: 'Alice', roomId });

      game.addPlayer({ id: player2Id }, 'Bob');
      store.addPlayer(player2Id, { name: 'Bob', roomId });

      // 3. Check room state before start
      let state = game.getGameState();
      expect(state.canJoin).toBe(true);
      expect(state.gameStarted).toBe(false);

      // 4. Start game
      game.startGame();
      store.updateRoom(roomId, { game: game.getGameState() });

      state = game.getGameState();
      expect(state.canJoin).toBe(false);
      expect(state.gameStarted).toBe(true);

      // 5. Set secret for testing
      game.secretNumber = '7890';

      // 6. Players make guesses
      game.makeGuess(player1Id, '1234');
      game.makeGuess(player2Id, '5678');
      game.makeGuess(player1Id, '3456');

      // 7. Player 2 wins
      game.makeGuess(player2Id, '7890');

      state = game.getGameState();
      expect(state.winner.name).toBe('Bob');

      // 8. Player 1 finishes
      game.makeGuess(player1Id, '7890');

      // 9. Game ends
      state = game.getGameState();
      expect(state.gameEnded).toBe(true);
      expect(state.secretNumber).toBe('7890');
      expect(state.players[0].rank).toBe(2); // Alice second
      expect(state.players[1].rank).toBe(1); // Bob first

      // 10. Cleanup
      store.removePlayer(player1Id);
      store.removePlayer(player2Id);
      store.deleteRoom(roomId);

      expect(store.getRoom(roomId)).toBeUndefined();
    });
  });
});
