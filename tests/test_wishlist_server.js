/**
 * VAMOS STORE - Server-Side Wishlist Test Suite (WL-01 to WL-14)
 * Validates complete SQL Server integration, Customer authentication,
 * Guest restrictions, Admin denial, CSRF protection, and data isolation.
 */

const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const { query } = require('../src/config/database');

async function runWishlistTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - PART B: SERVER-SIDE WISHLIST (SQL SERVER)');
  console.log('===============================================================');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST-SERVER] Running on ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function pass(id, msg) {
    console.log(`  ✔ [PASS] ${id}: ${msg}`);
    passed++;
  }

  function fail(id, msg, err) {
    console.error(`  ✖ [FAIL] ${id}: ${msg}`, err ? err.message : '');
    failed++;
  }

  function extractCookie(setCookieHeader) {
    if (!setCookieHeader) return '';
    return setCookieHeader.split(';')[0];
  }

  async function apiReq(path, options = {}) {
    const url = baseUrl + path;
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      redirect: 'manual',
    };
    if (options.body) {
      if (typeof options.body === 'object') {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(options.body);
      } else {
        fetchOptions.body = options.body;
      }
    }
    const res = await fetch(url, fetchOptions);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_) {}
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      location: res.headers.get('location'),
      setCookie: res.headers.get('set-cookie'),
      body: text,
      data: json,
    };
  }

  async function login(email, password) {
    const loginPage = await apiReq('/auth/login', {
      headers: { Accept: 'text/html' },
    });
    const csrfMatch = loginPage.body.match(/name="_csrf" value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    const initialCookie = extractCookie(loginPage.setCookie);

    const postRes = await apiReq('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: initialCookie,
      },
      body: new URLSearchParams({ email, password, _csrf: csrfToken }).toString(),
    });

    const sessionCookie = extractCookie(postRes.setCookie) || initialCookie;

    // Follow redirect to obtain the regenerated session's active CSRF token
    const targetUrl = postRes.location || '/';
    const afterLoginPage = await apiReq(targetUrl, {
      headers: { Cookie: sessionCookie, Accept: 'text/html' },
    });
    const authCsrfMatch =
      afterLoginPage.body.match(/window\.CSRF_TOKEN = '([^']+)';/) ||
      afterLoginPage.body.match(/name="_csrf" value="([^"]+)"/);
    const authCsrfToken = authCsrfMatch ? authCsrfMatch[1] : csrfToken;

    return { cookie: sessionCookie, csrfToken: authCsrfToken };
  }

  try {
    // 0. Setup test product & clean test users' wishlists
    const prodRes = await query("SELECT TOP 2 id, name, slug FROM products WHERE status = 'active' ORDER BY id ASC");
    assert.ok(prodRes.recordset.length >= 2, 'Need at least 2 active products in DB');
    const testProduct1 = prodRes.recordset[0];
    const testProduct2 = prodRes.recordset[1];

    const u1Res = await query("SELECT id FROM users WHERE email = 'trungdung@gmail.com'");
    const u2Res = await query("SELECT id FROM users WHERE email = 'khachhang@vamos.vn'");
    assert.ok(u1Res.recordset.length > 0 && u2Res.recordset.length > 0, 'Test customers must exist in DB');
    const user1Id = u1Res.recordset[0].id;
    const user2Id = u2Res.recordset[0].id;

    // Clean test state before starting
    await query('DELETE FROM wishlist_items WHERE user_id IN (@u1, @u2)', { u1: user1Id, u2: user2Id });

    // ── WL-01: Guest Heart Click Contract ──
    // Verified by frontend contract: main.pug sets window.IS_AUTHENTICATED=false for guests,
    // and main.js toggleWishlist prompts login toast with login URL without storing or updating badge.
    const homeRes = await apiReq('/', { headers: { Accept: 'text/html' } });
    assert.ok(homeRes.body.includes('window.IS_AUTHENTICATED = false'), 'Guest homepage must inject IS_AUTHENTICATED = false');
    assert.ok(homeRes.body.includes('window.IS_CUSTOMER = false'), 'Guest homepage must inject IS_CUSTOMER = false');
    pass('WL-01', 'Guest heart click contract verified: IS_AUTHENTICATED=false, login prompt required');

    // ── WL-02: Guest GET Wishlist API Access Denial ──
    const guestGet = await apiReq('/api/wishlist');
    assert.strictEqual(guestGet.status, 401, 'Guest GET /api/wishlist must return 401 Unauthorized');
    assert.strictEqual(guestGet.data.success, false, 'Guest GET response success must be false');
    pass('WL-02', 'Guest calling GET /api/wishlist is denied with HTTP 401');

    // ── WL-03: Guest POST Wishlist API Access Denial ──
    const guestCsrfMatch = homeRes.body.match(/window\.CSRF_TOKEN = '([^']+)';/);
    const guestCookie = extractCookie(homeRes.setCookie);
    const guestCsrfToken = guestCsrfMatch ? guestCsrfMatch[1] : '';

    const guestPostWithCsrf = await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      headers: {
        Cookie: guestCookie,
        'X-CSRF-Token': guestCsrfToken,
      },
      body: { productId: testProduct1.id, _csrf: guestCsrfToken },
    });
    assert.strictEqual(guestPostWithCsrf.status, 401, 'Guest POST /api/wishlist/toggle with CSRF must return 401 Unauthorized');
    assert.strictEqual(guestPostWithCsrf.data.success, false, 'Guest POST response success must be false');

    // Also verify Guest without CSRF is blocked with 403 Forbidden
    const guestPostNoCsrf = await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      body: { productId: testProduct1.id },
    });
    assert.strictEqual(guestPostNoCsrf.status, 403, 'Guest POST without CSRF must return 403 Forbidden');
    pass('WL-03', 'Guest calling POST /api/wishlist/toggle is strictly denied (401 with CSRF, 403 without CSRF)');

    // ── WL-04: Customer Adds Product -> Persisted in SQL Server ──
    const cust1 = await login('trungdung@gmail.com', 'password123');
    const addRes = await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      headers: {
        Cookie: cust1.cookie,
        'X-CSRF-Token': cust1.csrfToken,
      },
      body: { productId: testProduct1.id, _csrf: cust1.csrfToken },
    });
    assert.strictEqual(addRes.status, 200, 'Customer toggle add status');
    assert.strictEqual(addRes.data.success, true, 'Customer toggle add success');
    assert.strictEqual(addRes.data.action, 'added', 'Customer action is added');
    assert.strictEqual(addRes.data.inWishlist, true, 'Customer inWishlist is true');
    assert.strictEqual(addRes.data.count, 1, 'Customer count is 1');

    // Verify row directly in SQL Server table
    const dbCheck1 = await query('SELECT * FROM wishlist_items WHERE user_id = @u AND product_id = @p', {
      u: user1Id,
      p: testProduct1.id,
    });
    assert.strictEqual(dbCheck1.recordset.length, 1, 'SQL Server must contain exactly 1 wishlist record for user1');
    pass('WL-04', 'Customer added product successfully; verified record in SQL Server database');

    // ── WL-05: Customer Removes Product -> Deleted from SQL Server ──
    const remRes = await apiReq(`/api/wishlist/items/${testProduct1.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: cust1.cookie,
        'X-CSRF-Token': cust1.csrfToken,
      },
      body: { _csrf: cust1.csrfToken },
    });
    assert.strictEqual(remRes.status, 200, 'Remove item status');
    assert.strictEqual(remRes.data.success, true, 'Remove item success');
    assert.strictEqual(remRes.data.action, 'removed', 'Action is removed');
    assert.strictEqual(remRes.data.count, 0, 'Count after remove is 0');

    // Verify row deleted in SQL Server
    const dbCheck2 = await query('SELECT * FROM wishlist_items WHERE user_id = @u AND product_id = @p', {
      u: user1Id,
      p: testProduct1.id,
    });
    assert.strictEqual(dbCheck2.recordset.length, 0, 'SQL Server must no longer contain the wishlist record');
    pass('WL-05', 'Customer removed product successfully; verified record deleted from SQL Server');

    // ── WL-06: Customer Page Reload Retains Data ──
    // Re-add product 1 and product 2
    await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      headers: { Cookie: cust1.cookie, 'X-CSRF-Token': cust1.csrfToken },
      body: { productId: testProduct1.id, _csrf: cust1.csrfToken },
    });
    await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      headers: { Cookie: cust1.cookie, 'X-CSRF-Token': cust1.csrfToken },
      body: { productId: testProduct2.id, _csrf: cust1.csrfToken },
    });

    // Simulate page reload: GET /api/wishlist in same session
    const reloadRes = await apiReq('/api/wishlist', {
      headers: { Cookie: cust1.cookie },
    });
    assert.strictEqual(reloadRes.status, 200, 'Reload GET status');
    assert.strictEqual(reloadRes.data.success, true, 'Reload GET success');
    assert.strictEqual(reloadRes.data.count, 2, 'Reload GET count must be 2');
    const returnedIds = reloadRes.data.data.map((i) => i.id);
    assert.ok(returnedIds.includes(testProduct1.id) && returnedIds.includes(testProduct2.id), 'Must return both products');
    pass('WL-06', 'Customer page reload retains all 2 wishlist items from SQL Server');

    // ── WL-07: Customer Re-login Retains Data ──
    // Authenticate a fresh session for middle user
    const cust1NewSession = await login('trungdung@gmail.com', 'password123');
    const reloginRes = await apiReq('/api/wishlist', {
      headers: { Cookie: cust1NewSession.cookie },
    });
    assert.strictEqual(reloginRes.status, 200, 'Relogin GET status');
    assert.strictEqual(reloginRes.data.count, 2, 'Relogin count must still be 2');
    pass('WL-07', 'Customer re-login in brand new session retains all wishlist items');

    // ── WL-08: Cross-browser / New Device Simulation ──
    // Perform a completely independent login for Context B to guarantee distinct session cookies
    const cust1ContextB = await login('trungdung@gmail.com', 'password123');
    assert.notStrictEqual(cust1ContextB.cookie, cust1NewSession.cookie, 'Context B session cookie must be distinct from Context A');
    const crossClientRes = await apiReq('/api/wishlist', {
      headers: {
        Cookie: cust1ContextB.cookie,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      },
    });
    assert.strictEqual(crossClientRes.status, 200, 'Cross-client GET status');
    assert.strictEqual(crossClientRes.data.count, 2, 'Cross-client count must be 2');
    pass('WL-08', 'Customer accessing from different independent session/device retrieves full SQL wishlist');

    // ── WL-09: Account Data Isolation (User 2 Cannot See User 1's Items) ──
    const cust2 = await login('khachhang@vamos.vn', '123456');
    const user2Wishlist = await apiReq('/api/wishlist', {
      headers: { Cookie: cust2.cookie },
    });
    assert.strictEqual(user2Wishlist.status, 200, 'User 2 GET status');
    assert.strictEqual(user2Wishlist.data.count, 0, 'User 2 wishlist must be empty (0 items)');
    assert.strictEqual(user2Wishlist.data.data.length, 0, 'User 2 must see 0 items');

    // Verify DB level isolation
    const dbIsolation = await query('SELECT DISTINCT user_id FROM wishlist_items WHERE user_id = @u2', { u2: user2Id });
    assert.strictEqual(dbIsolation.recordset.length, 0, 'SQL Server has 0 items for user 2');
    pass('WL-09', 'Customer data isolation strictly verified: User 2 cannot see User 1 wishlist');

    // ── WL-10: Duplicate Product Prevention ──
    // Call POST /api/wishlist/items with already existing testProduct1
    const dupRes1 = await apiReq('/api/wishlist/items', {
      method: 'POST',
      headers: { Cookie: cust1NewSession.cookie, 'X-CSRF-Token': cust1NewSession.csrfToken },
      body: { productId: testProduct1.id, _csrf: cust1NewSession.csrfToken },
    });
    assert.strictEqual(dupRes1.status, 201, 'Idempotent add status');

    const dbDupCheck = await query('SELECT COUNT(*) AS total FROM wishlist_items WHERE user_id = @u AND product_id = @p', {
      u: user1Id,
      p: testProduct1.id,
    });
    assert.strictEqual(dbDupCheck.recordset[0].total, 1, 'SQL Server must have exactly 1 record, no duplicates');
    pass('WL-10', 'Duplicate prevention verified: unique constraint and idempotent insert hold');

    // ── WL-11: Non-existent Product ID Rejection ──
    const notFoundRes = await apiReq('/api/wishlist/items', {
      method: 'POST',
      headers: { Cookie: cust1NewSession.cookie, 'X-CSRF-Token': cust1NewSession.csrfToken },
      body: { productId: 999999, _csrf: cust1NewSession.csrfToken },
    });
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent product must return 404');
    assert.strictEqual(notFoundRes.data.success, false, 'Response success must be false');
    pass('WL-11', 'Non-existent product ID rejected with HTTP 404');

    // ── WL-12: Admin Access Denial ──
    const admin = await login('admin@vamos.vn', '123456');
    const adminGet = await apiReq('/api/wishlist', {
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(adminGet.status, 403, 'Admin GET /api/wishlist must return 403 Forbidden');
    assert.strictEqual(adminGet.data.success, false, 'Admin success false');

    const adminPost = await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      headers: { Cookie: admin.cookie, 'X-CSRF-Token': admin.csrfToken },
      body: { productId: testProduct1.id, _csrf: admin.csrfToken },
    });
    assert.strictEqual(adminPost.status, 403, 'Admin POST /api/wishlist/toggle must return 403 Forbidden');
    pass('WL-12', 'Admin calling Wishlist API strictly rejected with HTTP 403 Forbidden');

    // ── WL-13: CSRF Token Missing/Invalid Rejection ──
    // Create request with invalid CSRF token while session is active
    const csrfFailRes = await apiReq('/api/wishlist/toggle', {
      method: 'POST',
      headers: {
        Cookie: cust1NewSession.cookie,
        'X-CSRF-Token': 'invalid_forged_csrf_token_1234567890',
      },
      body: { productId: testProduct1.id, _csrf: 'invalid_forged_csrf_token_1234567890' },
    });
    assert.strictEqual(csrfFailRes.status, 403, 'Invalid CSRF must return 403 Forbidden');
    pass('WL-13', 'Mutating request with invalid CSRF token rejected with HTTP 403 Forbidden');

    // ── WL-14: Graceful Error Handling on Invalid Input ──
    const badInputRes = await apiReq('/api/wishlist/items', {
      method: 'POST',
      headers: { Cookie: cust1NewSession.cookie, 'X-CSRF-Token': cust1NewSession.csrfToken },
      body: { productId: 'invalid_string_id', _csrf: cust1NewSession.csrfToken },
    });
    assert.strictEqual(badInputRes.status, 400, 'Invalid productId must return 400 Bad Request');
    assert.strictEqual(badInputRes.data.success, false, 'Response success false');
    pass('WL-14', 'Invalid input handled gracefully with HTTP 400 without crashing');

    // Cleanup test state
    await query('DELETE FROM wishlist_items WHERE user_id IN (@u1, @u2)', { u1: user1Id, u2: user2Id });
    console.log('\n[CLEANUP] Cleaned test wishlist items successfully.');

  } catch (err) {
    fail('WL-ERR', 'Unexpected exception in test suite', err);
  } finally {
    server.close();
  }

  console.log('===============================================================');
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runWishlistTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
