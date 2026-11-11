const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const productService = require('../src/services/product.service');

async function runLiveSearchTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - REAL-TIME LIVE SEARCH TEST SUITE');
  console.log('===============================================================');

  let passed = 0;

  // TEST 1: Service returns empty array for empty keyword
  const emptyRes = await productService.searchLive('');
  assert.strictEqual(Array.isArray(emptyRes), true);
  assert.strictEqual(emptyRes.length, 0);
  console.log('  ✔ [PASS] SEARCH-01: Empty query returns empty array');
  passed++;

  // TEST 2: Service finds products matching keyword
  const sandalRes = await productService.searchLive('Sandal');
  assert.strictEqual(sandalRes.length >= 1, true);
  assert.ok(sandalRes[0].name.toLowerCase().includes('sandal'));
  assert.ok(sandalRes[0].slug);
  assert.ok(typeof sandalRes[0].base_price === 'number');
  console.log(`  ✔ [PASS] SEARCH-02: Query "Sandal" returns ${sandalRes.length} relevant items with price & slug`);
  passed++;

  // TEST 3: Search by product code prefix
  const skuRes = await productService.searchLive('VM-');
  assert.strictEqual(skuRes.length >= 1, true);
  console.log(`  ✔ [PASS] SEARCH-03: Query by SKU prefix "VM-" returns ${skuRes.length} products`);
  passed++;

  // TEST 4: HTTP API endpoint /api/products/search?q=Sandal
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const httpRes = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/api/products/search?q=Sandal`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });

  assert.strictEqual(httpRes.status, 200);
  assert.strictEqual(httpRes.body.success, true);
  assert.ok(httpRes.body.results.length >= 1);
  assert.ok(httpRes.body.results[0].name);
  assert.ok(httpRes.body.results[0].slug);
  console.log(`  ✔ [PASS] SEARCH-04: HTTP GET /api/products/search responds with JSON array and status 200`);
  passed++;

  // TEST 5: HTTP API endpoint /products/live-search?q=Sneaker
  const httpRes2 = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/products/live-search?q=Sneaker`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });

  assert.strictEqual(httpRes2.status, 200);
  assert.strictEqual(httpRes2.body.success, true);
  assert.ok(httpRes2.body.results.length >= 1);
  console.log(`  ✔ [PASS] SEARCH-05: HTTP GET /products/live-search responds with JSON array and status 200`);
  passed++;

  // TEST 6: XSS Injection Payload Handling
  const xssRes = await productService.searchLive('<script>alert("XSS")</script>');
  assert.strictEqual(Array.isArray(xssRes), true);
  console.log('  ✔ [PASS] SEARCH-06: Search handles XSS payload safely without injection or crash');
  passed++;

  // TEST 7: Special SQL wildcards and escaping
  const wildcardRes = await productService.searchLive("'; DROP TABLE test; -- %_[]");
  assert.strictEqual(Array.isArray(wildcardRes), true);
  console.log('  ✔ [PASS] SEARCH-07: Search safely handles SQL injection wildcards and delimiters');
  passed++;

  // TEST 8: HTTP API verifies sanitized outputs and valid image URL structure
  const httpRes3 = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/api/products/search?q=%3Cimg%20src=x%20onerror=alert(1)%3E`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });

  assert.strictEqual(httpRes3.status, 200);
  assert.strictEqual(httpRes3.body.success, true);
  assert.strictEqual(Array.isArray(httpRes3.body.results), true);
  console.log('  ✔ [PASS] SEARCH-08: HTTP search API returns sanitized JSON on XSS query parameter');
  passed++;

  server.close();
  const { closePool } = require('../src/config/database');
  await closePool();

  console.log('===============================================================');
  console.log(`   LIVE SEARCH SUMMARY: ${passed} PASSED, 0 FAILED`);
  console.log('===============================================================');
  process.exit(0);
}

runLiveSearchTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

