const VacheTaureauGame = require('./game-class');

describe('VacheTaureauGame', () => {
  let game;
  let mockSocket;

  beforeEach(() => {
    game = new VacheTaureauGame('TEST-ROOM');
    mockSocket = { id: 'player-1' };
  });

  describe('constructor', () => {
    test('should initialize with correct properties', () => {
      expect(game.roomId).toBe('TEST-ROOM');
      expect(game.secretNumber).toHaveLength(4);
      expect(game.players).toEqual([]);
      expect(game.gameStarted).toBe(false);
      expect(game.gameEnded).toBe(false);
      expect(game.winner).toBeNull();
      expect(game.attempts).toBeInstanceOf(Map);
      expect(game.createdAt).toBeDefined();
    });
  });

  describe('generateSecretNumber', () => {
    test('should generate a 4-digit number', () => {
      const secret = game.generateSecretNumber();
      expect(secret).toHaveLength(4);
      expect(/^\d{4}$/.test(secret)).toBe(true);
    });

    test('should generate number with unique digits', () => {
      const secret = game.generateSecretNumber();
      const digits = secret.split('');
      const uniqueDigits = new Set(digits);
      expect(uniqueDigits.size).toBe(4);
    });

    test('should not start with 0', () => {
      // Test multiple times to ensure consistency
      for (let i = 0; i < 100; i++) {
        const secret = game.generateSecretNumber();
        expect(secret[0]).not.toBe('0');
      }
    });
  });

  describe('addPlayer', () => {
    test('should successfully add a player', () => {
      const result = game.addPlayer(mockSocket, 'Alice');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Joueur ajouté avec succès');
      expect(game.players).toHaveLength(1);
      expect(game.players[0].name).toBe('Alice');
      expect(game.players[0].id).toBe('player-1');
    });

    test('should prevent adding player after game started', () => {
      game.gameStarted = true;
      const result = game.addPlayer(mockSocket, 'Alice');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Impossible de rejoindre : la partie a déjà commencé');
      expect(game.players).toHaveLength(0);
    });

    test('should prevent adding more than 4 players', () => {
      game.addPlayer({ id: '1' }, 'Player 1');
      game.addPlayer({ id: '2' }, 'Player 2');
      game.addPlayer({ id: '3' }, 'Player 3');
      game.addPlayer({ id: '4' }, 'Player 4');

      const result = game.addPlayer({ id: '5' }, 'Player 5');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Room complète');
      expect(game.players).toHaveLength(4);
    });

    test('should initialize player with correct properties', () => {
      game.addPlayer(mockSocket, 'Bob');
      const player = game.players[0];

      expect(player.id).toBe('player-1');
      expect(player.name).toBe('Bob');
      expect(player.attempts).toEqual([]);
      expect(player.finished).toBe(false);
      expect(player.rank).toBeNull();
      expect(player.score).toBe(0);
    });
  });

  describe('removePlayer', () => {
    test('should remove player successfully', () => {
      game.addPlayer(mockSocket, 'Alice');
      const shouldDelete = game.removePlayer('player-1');

      expect(game.players).toHaveLength(0);
      expect(shouldDelete).toBe(true);
    });

    test('should return false when players remain', () => {
      game.addPlayer({ id: '1' }, 'Alice');
      game.addPlayer({ id: '2' }, 'Bob');

      const shouldDelete = game.removePlayer('1');

      expect(game.players).toHaveLength(1);
      expect(shouldDelete).toBe(false);
    });

    test('should delete player attempts', () => {
      game.addPlayer(mockSocket, 'Alice');
      game.attempts.set('player-1', ['test']);

      game.removePlayer('player-1');

      expect(game.attempts.has('player-1')).toBe(false);
    });
  });

  describe('validateGuess', () => {
    test('should accept valid 4-digit guess with unique digits', () => {
      const result = game.validateGuess('1234');
      expect(result.valid).toBe(true);
    });

    test('should reject non-numeric guess', () => {
      const result = game.validateGuess('abcd');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('4 chiffres');
    });

    test('should reject guess with less than 4 digits', () => {
      const result = game.validateGuess('123');
      expect(result.valid).toBe(false);
    });

    test('should reject guess with more than 4 digits', () => {
      const result = game.validateGuess('12345');
      expect(result.valid).toBe(false);
    });

    test('should reject guess with duplicate digits', () => {
      const result = game.validateGuess('1123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('différents');
    });
  });

  describe('calculateBullsAndCows', () => {
    beforeEach(() => {
      // Set a known secret number for testing
      game.secretNumber = '1234';
    });

    test('should return 4 bulls for exact match', () => {
      const result = game.calculateBullsAndCows('1234');
      expect(result.bulls).toBe(4);
      expect(result.cows).toBe(0);
    });

    test('should return 0 bulls and 4 cows for reversed number', () => {
      const result = game.calculateBullsAndCows('4321');
      expect(result.bulls).toBe(0);
      expect(result.cows).toBe(4);
    });

    test('should return 0 bulls and 0 cows for completely different number', () => {
      const result = game.calculateBullsAndCows('5678');
      expect(result.bulls).toBe(0);
      expect(result.cows).toBe(0);
    });

    test('should correctly count mixed bulls and cows', () => {
      const result = game.calculateBullsAndCows('1243');
      expect(result.bulls).toBe(2); // 1 and 2 in correct position
      expect(result.cows).toBe(2); // 4 and 3 in wrong position
    });

    test('should handle partial matches', () => {
      const result = game.calculateBullsAndCows('5231');
      // Secret is '1234', guess is '5231'
      // Position 1: '2' matches - BULL
      // Position 2: '3' matches - BULL
      // Position 3: '1' is in secret but wrong position - COW
      expect(result.bulls).toBe(2); // 2 and 3 in correct positions
      expect(result.cows).toBe(1); // 1 in wrong position
    });
  });

  describe('makeGuess', () => {
    beforeEach(() => {
      game.addPlayer(mockSocket, 'Alice');
      game.startGame();
      game.secretNumber = '1234';
    });

    test('should reject guess if game not started', () => {
      const newGame = new VacheTaureauGame('TEST');
      newGame.addPlayer(mockSocket, 'Alice');

      const result = newGame.makeGuess('player-1', '1234');

      expect(result.success).toBe(false);
      expect(result.message).toContain('pas encore commencé');
    });

    test('should reject guess if game ended', () => {
      game.gameEnded = true;

      const result = game.makeGuess('player-1', '1234');

      expect(result.success).toBe(false);
      expect(result.message).toContain('terminée');
    });

    test('should reject guess from non-existent player', () => {
      const result = game.makeGuess('non-existent', '1234');

      expect(result.success).toBe(false);
      expect(result.message).toContain('non trouvé');
    });

    test('should reject guess from finished player', () => {
      const player = game.players[0];
      player.finished = true;

      const result = game.makeGuess('player-1', '1234');

      expect(result.success).toBe(false);
      expect(result.message).toContain('déjà terminé');
    });

    test('should reject invalid guess', () => {
      const result = game.makeGuess('player-1', '1123');

      expect(result.success).toBe(false);
    });

    test('should accept valid guess and return result', () => {
      const result = game.makeGuess('player-1', '5678');

      expect(result.success).toBe(true);
      expect(result.attempt).toBeDefined();
      expect(result.attempt.guess).toBe('5678');
      expect(result.attempt.number).toBe(1);
    });

    test('should mark player as finished on winning guess', () => {
      const result = game.makeGuess('player-1', '1234');
      const player = game.players[0];

      expect(result.success).toBe(true);
      expect(result.isWinner).toBe(true);
      expect(result.secretNumber).toBe('1234');
      expect(player.finished).toBe(true);
      expect(player.rank).toBe(1);
    });

    test('should calculate score correctly', () => {
      game.makeGuess('player-1', '1234');
      const player = game.players[0];

      expect(player.score).toBe(1000); // First attempt
    });

    test('should track multiple attempts', () => {
      game.makeGuess('player-1', '5678');
      game.makeGuess('player-1', '9012');

      const player = game.players[0];
      expect(player.attempts).toHaveLength(2);
    });

    test('should end game when all players finish', () => {
      // Create a fresh game for this test to avoid beforeEach conflicts
      const newGame = new VacheTaureauGame('MULTI-TEST');
      newGame.secretNumber = '1234';

      newGame.addPlayer({ id: 'player-1' }, 'Alice');
      const socket2 = { id: 'player-2' };
      newGame.addPlayer(socket2, 'Bob');

      // Start the game after adding both players
      newGame.startGame();

      // Verify both players are in the game
      expect(newGame.players).toHaveLength(2);

      newGame.makeGuess('player-1', '1234');
      expect(newGame.gameEnded).toBe(false);

      newGame.makeGuess('player-2', '1234');
      expect(newGame.gameEnded).toBe(true);
    });
  });

  describe('getNextRank', () => {
    beforeEach(() => {
      game.addPlayer({ id: '1' }, 'Alice');
      game.addPlayer({ id: '2' }, 'Bob');
      game.addPlayer({ id: '3' }, 'Charlie');
    });

    test('should return 1 for first finished player', () => {
      game.players[0].finished = true;
      expect(game.getNextRank()).toBe(1);
    });

    test('should return correct rank for subsequent players', () => {
      game.players[0].finished = true;
      game.players[1].finished = true;
      expect(game.getNextRank()).toBe(2);
    });
  });

  describe('calculateScore', () => {
    test('should return 1000 for 1 attempt', () => {
      expect(game.calculateScore(1)).toBe(1000);
    });

    test('should return 900 for 2 attempts', () => {
      expect(game.calculateScore(2)).toBe(900);
    });

    test('should return minimum 100 points', () => {
      expect(game.calculateScore(100)).toBe(100);
    });
  });

  describe('getGameState', () => {
    beforeEach(() => {
      game.addPlayer(mockSocket, 'Alice');
    });

    test('should return complete game state', () => {
      const state = game.getGameState();

      expect(state.roomId).toBe('TEST-ROOM');
      expect(state.players).toHaveLength(1);
      expect(state.gameStarted).toBe(false);
      expect(state.gameEnded).toBe(false);
      expect(state.canJoin).toBe(true);
    });

    test('should hide secret number until game ends', () => {
      const state = game.getGameState();
      expect(state.secretNumber).toBeNull();
    });

    test('should reveal secret number when game ends', () => {
      game.gameEnded = true;
      const state = game.getGameState();
      expect(state.secretNumber).toBe(game.secretNumber);
    });

    test('should prevent joining when game started', () => {
      game.gameStarted = true;
      const state = game.getGameState();
      expect(state.canJoin).toBe(false);
    });
  });

  describe('startGame', () => {
    test('should start game successfully with at least 1 player', () => {
      game.addPlayer(mockSocket, 'Alice');
      const result = game.startGame();

      expect(result).toBe(true);
      expect(game.gameStarted).toBe(true);
    });

    test('should fail to start game with no players', () => {
      const result = game.startGame();

      expect(result).toBe(false);
      expect(game.gameStarted).toBe(false);
    });
  });
});
