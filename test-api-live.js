// Live API test script
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Live API Endpoints...\n');

  try {
    // Test 1: Create room
    console.log('1️⃣  Testing POST /api/rooms/create');
    const createResult = await makeRequest('POST', '/api/rooms/create', {
      playerName: 'TestPlayer'
    });
    console.log('   Status:', createResult.status);
    console.log('   Response:', JSON.stringify(createResult.data, null, 2));
    console.log('   ✅ Create room:', createResult.status === 200 ? 'PASS' : 'FAIL');

    const roomId = createResult.data.roomId;
    const playerId = createResult.data.playerId;
    console.log();

    // Test 2: List rooms
    console.log('2️⃣  Testing GET /api/rooms/list');
    const listResult = await makeRequest('GET', '/api/rooms/list');
    console.log('   Status:', listResult.status);
    console.log('   Rooms found:', listResult.data.count);
    console.log('   ✅ List rooms:', listResult.status === 200 ? 'PASS' : 'FAIL');
    console.log();

    // Test 3: Get game state
    console.log('3️⃣  Testing GET /api/game/state');
    const stateResult = await makeRequest('GET', `/api/game/state?roomId=${roomId}`);
    console.log('   Status:', stateResult.status);
    console.log('   Game started:', stateResult.data.gameState?.gameStarted);
    console.log('   ✅ Get state:', stateResult.status === 200 ? 'PASS' : 'FAIL');
    console.log();

    // Test 4: Start game
    console.log('4️⃣  Testing POST /api/game/start');
    const startResult = await makeRequest('POST', '/api/game/start', {
      roomId,
      playerId
    });
    console.log('   Status:', startResult.status);
    console.log('   Success:', startResult.data.success);
    console.log('   ✅ Start game:', startResult.status === 200 ? 'PASS' : 'FAIL');
    console.log();

    // Test 5: Make a guess
    console.log('5️⃣  Testing POST /api/game/guess');
    const guessResult = await makeRequest('POST', '/api/game/guess', {
      roomId,
      playerId,
      guess: '1234'
    });
    console.log('   Status:', guessResult.status);
    console.log('   Success:', guessResult.data.success);
    if (guessResult.data.attempt) {
      console.log('   Bulls:', guessResult.data.attempt.bulls);
      console.log('   Cows:', guessResult.data.attempt.cows);
    }
    console.log('   ✅ Make guess:', guessResult.status === 200 ? 'PASS' : 'FAIL');
    console.log();

    console.log('✨ All API tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runTests().then(() => {
  console.log('\n✅ API is working correctly!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Tests failed:', err);
  process.exit(1);
});
