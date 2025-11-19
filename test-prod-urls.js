// Test all production URLs
const https = require('https');

const URLS = [
  'https://web-game-steel.vercel.app',
  'https://web-game-wissems-projects-1d67a1ba.vercel.app',
  'https://web-game-207ncsgyh-wissems-projects-1d67a1ba.vercel.app'
];

function testURL(baseUrl) {
  return new Promise((resolve) => {
    const url = new URL('/api/rooms/create', baseUrl);
    const data = JSON.stringify({ playerName: 'TestPlayer' });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          url: baseUrl,
          status: res.statusCode,
          body: body.substring(0, 200)
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        url: baseUrl,
        status: 'ERROR',
        body: e.message
      });
    });

    req.write(data);
    req.end();
  });
}

async function testAll() {
  console.log('🧪 Testing All Production URLs\n');

  for (const url of URLS) {
    console.log(`Testing: ${url}`);
    const result = await testURL(url);
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      console.log(`  ✅ WORKING!`);
    } else if (result.status === 401) {
      console.log(`  🔒 Protected (Authentication Required)`);
    } else {
      console.log(`  ❌ Error`);
      console.log(`  Response: ${result.body}`);
    }
    console.log('');
  }
}

testAll();
