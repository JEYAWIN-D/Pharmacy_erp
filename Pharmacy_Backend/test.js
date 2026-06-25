const http = require('http');

const testEndpoint = (url) => {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, ok: res.statusCode === 200, length: data.length, text: data.substring(0, 100) });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
};

async function run() {
  console.log("Testing Backend and Frontend endpoints...");
  const results = await Promise.all([
    testEndpoint('http://localhost:5000/api/billing/reports/daily'), // expecting 401 without token, but checks if server is up
    testEndpoint('http://localhost:5173/') // Frontend HTML
  ]);
  console.log(JSON.stringify(results, null, 2));
}

run();
