// Test new deployment
const https = require('https');

const BASE_URL = 'https://web-game-steel.vercel.app';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
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
            data: body.substring(0, 300)
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        status: 'ERROR',
        data: e.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testDeployment() {
  console.log('🧪 Testing New Deployment\n');
  console.log('📍 URL:', BASE_URL);
  console.log('');

  try {
    // Test 1: Create room
    console.log('1️⃣  POST /api/rooms/create');
    const createResult = await makeRequest('/api/rooms/create', 'POST', {
      playerName: 'DeploymentTest'
    });
    console.log('   Status:', createResult.status);
    if (createResult.status === 200) {
      console.log('   ✅ API WORKING!');
      console.log('   Room ID:', createResult.data.roomId);
      console.log('   Player ID:', createResult.data.playerId);
    } else if (createResult.status === 401) {
      console.log('   🔒 Still protected - disable deployment protection in Vercel dashboard');
    } else {
      console.log('   ❌ Error:', createResult.data);
    }
    console.log('');

    // Test 2: List rooms
    console.log('2️⃣  GET /api/rooms/list');
    const listResult = await makeRequest('/api/rooms/list', 'GET');
    console.log('   Status:', listResult.status);
    if (listResult.status === 200) {
      console.log('   ✅ Working!');
      console.log('   Rooms:', listResult.data.count);
    } else if (listResult.status === 401) {
      console.log('   🔒 Protected');
    } else {
      console.log('   Response:', listResult.data);
    }
    console.log('');

    console.log('---\n');
    console.log('🌐 Your game URLs:');
    console.log('   • https://web-game-steel.vercel.app');
    console.log('   • https://web-game-wissems-projects-1d67a1ba.vercel.app');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Go to https://vercel.com/dashboard');
    console.log('   2. Select your project: web-game');
    console.log('   3. Settings → Deployment Protection');
    console.log('   4. Disable protection for public access');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeployment();
