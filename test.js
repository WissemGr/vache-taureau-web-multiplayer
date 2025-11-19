// Test suite for Vache et Taureau multiplayer game
// This tests both server-side game logic and potential issues

console.log('🧪 Starting Vache et Taureau Test Suite\n');

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

// Test helper functions
function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`✅ PASS: ${message}`);
    return true;
  } else {
    testsFailed++;
    failedTests.push(message);
    console.log(`❌ FAIL: ${message}`);
    return false;
  }
}

function assertEquals(actual, expected, message) {
  const condition = JSON.stringify(actual) === JSON.stringify(expected);
  if (!condition) {
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Got: ${JSON.stringify(actual)}`);
  }
  return assert(condition, message);
}

function assertNotEquals(actual, notExpected, message) {
  const condition = JSON.stringify(actual) !== JSON.stringify(notExpected);
  if (!condition) {
    console.log(`   Should not be: ${JSON.stringify(notExpected)}`);
    console.log(`   Got: ${JSON.stringify(actual)}`);
  }
  return assert(condition, message);
}

// Import the VacheTaureauGame class
const VacheTaureauGame = require('./game-class');

// Mock socket object
function createMockSocket(id) {
  return {
    id: id || `socket-${Math.random().toString(36).substr(2, 9)}`,
    rooms: new Set(),
    join: function(room) { this.rooms.add(room); },
    leave: function(room) { this.rooms.delete(room); }
  };
}

console.log('📋 Test Suite: VacheTaureauGame Class\n');

// Test 1: Game Initialization
console.log('--- Test Group: Game Initialization ---');
const game1 = new VacheTaureauGame('TEST-ROOM-1');
assert(game1.roomId === 'TEST-ROOM-1', 'Game should store room ID correctly');
assert(game1.secretNumber.length === 4, 'Secret number should be 4 digits');
assert(/^\d{4}$/.test(game1.secretNumber), 'Secret number should be 4 numeric digits');
assert(game1.gameStarted === false, 'Game should not be started initially');
assert(game1.gameEnded === false, 'Game should not be ended initially');
assert(game1.players.length === 0, 'Game should have no players initially');
console.log('');

// Test 2: Secret Number Generation
console.log('--- Test Group: Secret Number Generation ---');
const game2 = new VacheTaureauGame('TEST-ROOM-2');
const digits = game2.secretNumber.split('');
const uniqueDigits = new Set(digits);
assert(uniqueDigits.size === 4, 'Secret number should have 4 unique digits');
assert(digits[0] !== '0', 'Secret number should not start with 0');

// Test multiple generations to ensure randomness and uniqueness
const generatedNumbers = new Set();
for (let i = 0; i < 50; i++) {
  const tempGame = new VacheTaureauGame(`TEST-${i}`);
  generatedNumbers.add(tempGame.secretNumber);
  const tempDigits = tempGame.secretNumber.split('');
  assert(new Set(tempDigits).size === 4, `Generated number ${tempGame.secretNumber} should have unique digits`);
}
assert(generatedNumbers.size > 30, 'Should generate diverse random numbers');
console.log('');

// Test 3: Adding Players
console.log('--- Test Group: Adding Players ---');
const game3 = new VacheTaureauGame('TEST-ROOM-3');
const socket1 = createMockSocket('player-1');
const result1 = game3.addPlayer(socket1, 'Alice');
assert(result1.success === true, 'Should successfully add first player');
assert(game3.players.length === 1, 'Game should have 1 player after adding first player');
assert(game3.players[0].name === 'Alice', 'Player name should be stored correctly');

const socket2 = createMockSocket('player-2');
const result2 = game3.addPlayer(socket2, 'Bob');
assert(result2.success === true, 'Should successfully add second player');
assert(game3.players.length === 2, 'Game should have 2 players');
console.log('');

// Test 4: Maximum Players Limit
console.log('--- Test Group: Maximum Players Limit ---');
const MAX_PLAYERS = 4;
const game4 = new VacheTaureauGame('TEST-ROOM-4');
for (let i = 0; i < MAX_PLAYERS; i++) {
  const socket = createMockSocket(`player-${i}`);
  const result = game4.addPlayer(socket, `Player${i}`);
  assert(result.success === true, `Should add player ${i + 1}`);
}
assert(game4.players.length === MAX_PLAYERS, `Game should have ${MAX_PLAYERS} players`);

const extraSocket = createMockSocket('extra-player');
const extraResult = game4.addPlayer(extraSocket, 'Extra');
assert(extraResult.success === false, 'Should reject player when room is full');
assert(game4.players.length === MAX_PLAYERS, 'Player count should not exceed maximum');
console.log('');

// Test 5: Cannot Join After Game Started
console.log('--- Test Group: Game Start Restrictions ---');
const game5 = new VacheTaureauGame('TEST-ROOM-5');
const socket5 = createMockSocket('player-5');
game5.addPlayer(socket5, 'Charlie');
game5.startGame();
assert(game5.gameStarted === true, 'Game should be marked as started');

const lateSocket = createMockSocket('late-player');
const lateResult = game5.addPlayer(lateSocket, 'Late Player');
assert(lateResult.success === false, 'Should reject player after game has started');
console.log('');

// Test 6: Guess Validation
console.log('--- Test Group: Guess Validation ---');
const game6 = new VacheTaureauGame('TEST-ROOM-6');

const validationTests = [
  { guess: '1234', valid: true, desc: 'Valid 4-digit guess' },
  { guess: '123', valid: false, desc: 'Too short (3 digits)' },
  { guess: '12345', valid: false, desc: 'Too long (5 digits)' },
  { guess: 'abcd', valid: false, desc: 'Non-numeric characters' },
  { guess: '1123', valid: false, desc: 'Duplicate digits' },
  { guess: '1111', valid: false, desc: 'All same digits' },
  { guess: '5678', valid: true, desc: 'Valid different guess' }
];

validationTests.forEach(test => {
  const result = game6.validateGuess(test.guess);
  assertEquals(result.valid, test.valid, `Validation: ${test.desc} (${test.guess})`);
});
console.log('');

// Test 7: Bulls and Cows Calculation
console.log('--- Test Group: Bulls and Cows Calculation ---');
const game7 = new VacheTaureauGame('TEST-ROOM-7');
game7.secretNumber = '1234'; // Set a known secret for testing

const bullsCowsTests = [
  { guess: '1234', expected: { bulls: 4, cows: 0 }, desc: 'Perfect match' },
  { guess: '4321', expected: { bulls: 0, cows: 4 }, desc: 'All reversed' },
  { guess: '1243', expected: { bulls: 2, cows: 2 }, desc: '2 bulls, 2 cows' },
  { guess: '1000', expected: { bulls: 1, cows: 0 }, desc: '1 bull, 0 cows' },
  { guess: '5678', expected: { bulls: 0, cows: 0 }, desc: 'No match' },
  { guess: '2143', expected: { bulls: 0, cows: 4 }, desc: '0 bulls, 4 cows' },
  { guess: '1324', expected: { bulls: 2, cows: 2 }, desc: 'Mixed result' }
];

bullsCowsTests.forEach(test => {
  const result = game7.calculateBullsAndCows(test.guess);
  assertEquals(result, test.expected, `Bulls/Cows: ${test.desc} (${test.guess})`);
});
console.log('');

// Test 8: Making Guesses
console.log('--- Test Group: Making Guesses ---');
const game8 = new VacheTaureauGame('TEST-ROOM-8');
game8.secretNumber = '5678';
const socket8 = createMockSocket('player-8');
game8.addPlayer(socket8, 'Dave');
game8.startGame();

const guessResult = game8.makeGuess('player-8', '1234');
assert(guessResult.success === true, 'Valid guess should succeed');
assert(guessResult.attempt !== undefined, 'Should return attempt data');
assert(game8.players[0].attempts.length === 1, 'Player should have 1 attempt recorded');

const winningGuess = game8.makeGuess('player-8', '5678');
assert(winningGuess.success === true, 'Winning guess should succeed');
assert(winningGuess.isWinner === true, 'Should identify winner');
assert(game8.players[0].finished === true, 'Player should be marked as finished');
assert(game8.players[0].rank === 1, 'Winner should have rank 1');
console.log('');

// Test 9: Cannot Guess Before Game Starts
console.log('--- Test Group: Pre-Game Guess Restrictions ---');
const game9 = new VacheTaureauGame('TEST-ROOM-9');
const socket9 = createMockSocket('player-9');
game9.addPlayer(socket9, 'Eve');
// Don't start the game

const preStartGuess = game9.makeGuess('player-9', '1234');
assert(preStartGuess.success === false, 'Should not allow guess before game starts');
console.log('');

// Test 10: Player Removal
console.log('--- Test Group: Player Removal ---');
const game10 = new VacheTaureauGame('TEST-ROOM-10');
const socket10a = createMockSocket('player-10a');
const socket10b = createMockSocket('player-10b');
game10.addPlayer(socket10a, 'Frank');
game10.addPlayer(socket10b, 'Grace');
assert(game10.players.length === 2, 'Should have 2 players');

const shouldDelete1 = game10.removePlayer('player-10a');
assert(shouldDelete1 === false, 'Should not delete room with remaining players');
assert(game10.players.length === 1, 'Should have 1 player after removal');

const shouldDelete2 = game10.removePlayer('player-10b');
assert(shouldDelete2 === true, 'Should delete room when last player leaves');
assert(game10.players.length === 0, 'Should have 0 players');
console.log('');

// Test 11: Score Calculation
console.log('--- Test Group: Score Calculation ---');
const game11 = new VacheTaureauGame('TEST-ROOM-11');
const scores = [
  { attempts: 1, expected: 1000 },
  { attempts: 2, expected: 900 },
  { attempts: 5, expected: 600 },
  { attempts: 10, expected: 100 },
  { attempts: 15, expected: 100 } // Minimum score
];

scores.forEach(test => {
  const score = game11.calculateScore(test.attempts);
  assertEquals(score, test.expected, `Score for ${test.attempts} attempts should be ${test.expected}`);
});
console.log('');

// Test 12: Multiple Players Racing
console.log('--- Test Group: Multiple Players Racing ---');
const game12 = new VacheTaureauGame('TEST-ROOM-12');
game12.secretNumber = '9876';
const socketA = createMockSocket('player-A');
const socketB = createMockSocket('player-B');
const socketC = createMockSocket('player-C');

game12.addPlayer(socketA, 'Player A');
game12.addPlayer(socketB, 'Player B');
game12.addPlayer(socketC, 'Player C');
game12.startGame();

// Player A makes a wrong guess
game12.makeGuess('player-A', '1234');
assert(game12.players[0].finished === false, 'Player A should not be finished');

// Player B wins
const winB = game12.makeGuess('player-B', '9876');
assert(winB.isWinner === true, 'Player B should win');
assert(game12.players[1].rank === 1, 'Player B should have rank 1');
assert(game12.gameEnded === false, 'Game should not end with unfinished players');

// Player C finishes second
const winC = game12.makeGuess('player-C', '9876');
assert(winC.isWinner === true, 'Player C should also finish');
assert(game12.players[2].rank === 2, 'Player C should have rank 2');

// Player A finishes last
const winA = game12.makeGuess('player-A', '9876');
assert(game12.players[0].rank === 3, 'Player A should have rank 3');
assert(game12.gameEnded === true, 'Game should end when all players finish');
console.log('');

// Test 13: Game State
console.log('--- Test Group: Game State ---');
const game13 = new VacheTaureauGame('TEST-ROOM-13');
const socket13 = createMockSocket('player-13');
game13.addPlayer(socket13, 'Helen');

const state = game13.getGameState();
assert(state.roomId === 'TEST-ROOM-13', 'State should include room ID');
assert(state.players.length === 1, 'State should show player count');
assert(state.gameStarted === false, 'State should show game not started');
assert(state.secretNumber === null, 'Secret should be hidden before game ends');

game13.startGame();
const startedState = game13.getGameState();
assert(startedState.gameStarted === true, 'State should show game started');
console.log('');

// Test 14: Finished Player Cannot Guess Again
console.log('--- Test Group: Finished Player Restrictions ---');
const game14 = new VacheTaureauGame('TEST-ROOM-14');
game14.secretNumber = '3456';
const socket14 = createMockSocket('player-14');
game14.addPlayer(socket14, 'Ian');
game14.startGame();

game14.makeGuess('player-14', '3456'); // Win immediately
assert(game14.players[0].finished === true, 'Player should be finished');

const secondGuess = game14.makeGuess('player-14', '1234');
assert(secondGuess.success === false, 'Finished player should not be able to guess again');
console.log('');

// Test 15: Invalid Player ID
console.log('--- Test Group: Invalid Player Handling ---');
const game15 = new VacheTaureauGame('TEST-ROOM-15');
const socket15 = createMockSocket('player-15');
game15.addPlayer(socket15, 'Jane');
game15.startGame();

const invalidGuess = game15.makeGuess('non-existent-player', '1234');
assert(invalidGuess.success === false, 'Should reject guess from non-existent player');
console.log('');

// Test 16: Rank Assignment
console.log('--- Test Group: Rank Assignment ---');
const game16 = new VacheTaureauGame('TEST-ROOM-16');
game16.secretNumber = '2468';
for (let i = 0; i < 4; i++) {
  const socket = createMockSocket(`rank-player-${i}`);
  game16.addPlayer(socket, `Player ${i}`);
}
game16.startGame();

// Players finish in specific order
game16.makeGuess('rank-player-2', '2468'); // 3rd player finishes 1st
assert(game16.players[2].rank === 1, 'Third player should have rank 1');

game16.makeGuess('rank-player-0', '2468'); // 1st player finishes 2nd
assert(game16.players[0].rank === 2, 'First player should have rank 2');

game16.makeGuess('rank-player-3', '2468'); // 4th player finishes 3rd
assert(game16.players[3].rank === 3, 'Fourth player should have rank 3');

game16.makeGuess('rank-player-1', '2468'); // 2nd player finishes 4th
assert(game16.players[1].rank === 4, 'Second player should have rank 4');
console.log('');

// Test 17: Edge Cases - Empty Room Start
console.log('--- Test Group: Edge Cases ---');
const game17 = new VacheTaureauGame('TEST-ROOM-17');
const canStartEmpty = game17.startGame();
assert(canStartEmpty === false, 'Should not start game with 0 players');

const socket17 = createMockSocket('player-17');
game17.addPlayer(socket17, 'Kate');
const canStartWithOne = game17.startGame();
assert(canStartWithOne === true, 'Should allow starting with 1 player');
console.log('');

// Test 18: Attempt History
console.log('--- Test Group: Attempt History ---');
const game18 = new VacheTaureauGame('TEST-ROOM-18');
game18.secretNumber = '7890';
const socket18 = createMockSocket('player-18');
game18.addPlayer(socket18, 'Leo');
game18.startGame();

game18.makeGuess('player-18', '1234');
game18.makeGuess('player-18', '5678');
game18.makeGuess('player-18', '3456');

assert(game18.players[0].attempts.length === 3, 'Should record all attempts');
assert(game18.players[0].attempts[0].number === 1, 'First attempt should be numbered 1');
assert(game18.players[0].attempts[2].number === 3, 'Third attempt should be numbered 3');
console.log('');

// Test 19: Concurrent Games
console.log('--- Test Group: Concurrent Games ---');
const games = [];
for (let i = 0; i < 5; i++) {
  const game = new VacheTaureauGame(`CONCURRENT-${i}`);
  games.push(game);
}

const secretNumbers = games.map(g => g.secretNumber);
assert(new Set(secretNumbers).size >= 3, 'Different games should have different secret numbers');
console.log('');

// Test 20: Game End Detection
console.log('--- Test Group: Game End Detection ---');
const game20 = new VacheTaureauGame('TEST-ROOM-20');
game20.secretNumber = '1357';
const socket20a = createMockSocket('player-20a');
const socket20b = createMockSocket('player-20b');
game20.addPlayer(socket20a, 'Mike');
game20.addPlayer(socket20b, 'Nina');
game20.startGame();

game20.makeGuess('player-20a', '1357');
assert(game20.gameEnded === false, 'Game should not end when one player finishes');

game20.makeGuess('player-20b', '1357');
assert(game20.gameEnded === true, 'Game should end when all players finish');
console.log('');

// Print Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(2)}%`);

if (testsFailed > 0) {
  console.log('\n❌ Failed Tests:');
  failedTests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test}`);
  });
  console.log('\n⚠️ TESTS FAILED - BUGS DETECTED');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}
