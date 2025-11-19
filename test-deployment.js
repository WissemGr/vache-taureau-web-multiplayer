// Test deployed API
const https = require('https');

const DEPLOYMENT_URL = 'https://web-game-207ncsgyh-wissems-projects-1d67a1ba.vercel.app';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, DEPLOYMENT_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
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

async function testDeployment() {
  console.log('🧪 Testing Deployed Application\n');
  console.log('📍 URL:', DEPLOYMENT_URL);
  console.log('');

  try {
    // Test create room
    console.log('1️⃣  Testing POST /api/rooms/create');
    const createResult = await makeRequest('/api/rooms/create', 'POST', {
      playerName: 'DeploymentTest'
    });
    console.log('   Status:', createResult.status);
    console.log('   Success:', createResult.data.success);
    if (createResult.data.roomId) {
      console.log('   Room ID:', createResult.data.roomId);
    }
    console.log('   ✅', createResult.status === 200 ? 'PASS' : 'FAIL');
    console.log('');

    // Test list rooms
    console.log('2️⃣  Testing GET /api/rooms/list');
    const listResult = await makeRequest('/api/rooms/list', 'GET');
    console.log('   Status:', listResult.status);
    console.log('   Rooms:', listResult.data.count || 0);
    console.log('   ✅', listResult.status === 200 ? 'PASS' : 'FAIL');
    console.log('');

    console.log('✨ Deployment test completed!');
    console.log('');
    console.log('🌐 Your game is live at:');
    console.log('   ', DEPLOYMENT_URL);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDeployment();
