// Test game state API
const https = require('https');

const roomId = 'D7450739';
const url = `https://web-game-steel.vercel.app/api/game/state?roomId=${roomId}`;

https.get(url, (res) => {
  let body = '';

  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  res.on('data', chunk => body += chunk);

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(body);
    }
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
