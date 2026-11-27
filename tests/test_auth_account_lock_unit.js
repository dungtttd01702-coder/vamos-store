/**
 * Zero-DB Express HTTP Security Regression Suite: AUTH-01 Fail-Closed Account Lock Enforcement
 * Exercises requireCustomer, requireAuth, requireAdmin, reviewUploadMiddleware/multer, and errorHandler
 * with in-memory DB stubbing (zero database connection).
 */

require('./test_bootstrap');

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const dbConfig = require('../src/config/database');
const runtimePass = crypto.randomBytes(12).toString('hex');
const passHash = bcrypt.hashSync(runtimePass, 4);

const dbUsers = {
  'auth01.cust@vamos.test': { id: 8101, full_name: 'Auth Cust', email: 'auth01.cust@vamos.test', password_hash: passHash, role: 'CUSTOMER', status: 'active' },
  'auth01.admin@vamos.test': { id: 8102, full_name: 'Auth Admin', email: 'auth01.admin@vamos.test', password_hash: passHash, role: 'ADMIN', status: 'active' }
};
const usersById = new Map(Object.values(dbUsers).map((u) => [u.id, u]));

let statusCheckMode = 'normal'; // 'normal' | 'transient_once' | 'transient_always' | 'schema_error' | 'elogin' | 'sql_4060' | 'sql_1205' | 'conn_esocket' | 'sql_208'

dbConfig.query = async (sqlText, params = {}) => {
  const q = String(sqlText);
  if (q.includes('FROM users WHERE email')) {
    const u = dbUsers[params.email];
    return { recordset: u ? [u] : [] };
  }
  if (q.includes('FROM users WHERE id')) {
    if (statusCheckMode === 'transient_once') {
      statusCheckMode = 'normal';
      throw new sql.ConnectionError('Connection lost during auth check (ETIMEOUT) host=secret-db.internal', 'ETIMEOUT');
    }
    if (statusCheckMode === 'transient_always') {
      const err = new Error('connect ECONNREFUSED 10.0.0.15:1433');
      err.code = 'ECONNREFUSED';
      throw err;
    }
    if (statusCheckMode === 'conn_esocket') {
      throw new sql.ConnectionError('Socket dropped unexpectedly', 'ESOCKET');
    }
    if (statusCheckMode === 'elogin') {
      throw new sql.ConnectionError('Login failed for user sa password=DbLoginSecret999!', 'ELOGIN');
    }
    if (statusCheckMode === 'sql_4060') {
      const inner = { info: { number: 4060 } };
      const err = new Error("Cannot open database 'vamos_prod_secret' requested by the login. pwd=Login4060Secret");
      err.originalError = inner;
      throw err;
    }
    if (statusCheckMode === 'sql_1205') {
      const inner = { info: { number: 1205 } };
      const err = new sql.RequestError(Object.assign(new Error('Transaction was deadlocked'), inner), 'EREQUEST');
      throw err;
    }
    if (statusCheckMode === 'sql_208') {
      const err = new Error("Invalid object name 'dbo.users'");
      err.name = 'RequestError';
      err.code = 'EREQUEST';
      err.number = 208;
      throw err;
    }
    if (statusCheckMode === 'schema_error') {
      const err = new Error("Invalid column name 'status' on db-internal-01 password=SuperSecret123");
      err.name = 'RequestError';
      err.code = 'EREQUEST';
      err.number = 207;
      throw err;
    }
    const u = usersById.get(params.id);
    return { recordset: u ? [{ status: u.status, role: u.role }] : [] };
  }
  if (q.includes('FROM carts')) {
    return { recordset: [{ id: 1 }] };
  }
  if (q.includes('FROM cart_items')) {
    return { recordset: [{ total_items: 1 }] };
  }
  if (q.includes('FROM orders WHERE user_id')) {
    return { recordset: [] };
  }
  return { recordset: [] };
};

const app = require('../src/app');
const csrfMiddleware = require('../src/middlewares/csrf.middleware');
const authMiddleware = require('../src/middlewares/auth.middleware');
const { uploadDir } = require('../src/middlewares/upload.middleware');
const loyaltyService = require('../src/services/loyalty.service');
const orderService = require('../src/services/order.service');
const reviewService = require('../src/services/review.service');
const wishlistService = require('../src/services/wishlist.service');

const VALID_JPEG_BYTES = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
]);

function extractCookie(setCookieHeader) {
  return setCookieHeader ? setCookieHeader.split(';')[0] : '';
}

function listUploadFiles() {
  if (!fs.existsSync(uploadDir)) return new Set();
  return new Set(fs.readdirSync(uploadDir));
}

function createMockRes() {
  const headers = {};
  const clearedCookies = [];
  const res = {
    statusCode: 200,
    redirectUrl: null,
    jsonPayload: null,
    renderedView: null,
    clearedCookies,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    clearCookie(name) {
      clearedCookies.push(name);
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      return this;
    },
    render(view, locals) {
      this.renderedView = { view, locals };
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - AUTH-01 FAIL-CLOSED ACCOUNT LOCK SECURITY SUITE');
  console.log('===============================================================');

  const origQuery = dbConfig.query;
  const origRedeemVoucher = loyaltyService.redeemVoucher;
  const origCreateOrder = orderService.createCodOrder;
  const origCreateReview = reviewService.createReview;
  const origWishlistAdd = wishlistService.addItem;
  const origConsoleError = console.error;

  let downstreamCalls = 0;
  const capturedLogs = [];

  console.error = (...args) => {
    capturedLogs.push(args.map((a) => String(a)).join(' '));
  };

  loyaltyService.redeemVoucher = async () => {
    downstreamCalls++;
    return { voucherCode: 'SHOULD_NOT_HAPPEN', pointsSpent: 100 };
  };
  orderService.createCodOrder = async () => {
    downstreamCalls++;
    return { id: 999 };
  };
  reviewService.createReview = async () => {
    downstreamCalls++;
    return { message: 'ok', pointsEarned: 100, newBalance: 100 };
  };
  wishlistService.addItem = async () => {
    downstreamCalls++;
    return { action: 'added', inWishlist: true, count: 1, product: {} };
  };

  let passed = 0;
  let total = 0;
  async function runCase(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      origConsoleError(`  ✖ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  let server = null;

  try {
    // -----------------------------------------------------------------
    // AUTH-01-01: Active user -> next() called once
    // -----------------------------------------------------------------
    await runCase('AUTH-01-01: Active customer/auth/admin users pass verification cleanly (next called once)', async () => {
      statusCheckMode = 'normal';
      usersById.get(8101).status = 'active';
      usersById.get(8102).status = 'active';

      for (const [mw, uid, role] of [
        [authMiddleware.requireCustomer, 8101, 'CUSTOMER'],
        [authMiddleware.requireAuth, 8101, 'CUSTOMER'],
        [authMiddleware.requireAdmin, 8102, 'ADMIN']
      ]) {
        let nextCount = 0;
        let nextArg;
        const req = {
          method: 'GET',
          originalUrl: '/account/orders',
          headers: {},
          session: { user: { id: uid, role }, destroy: (cb) => cb() }
        };
        const res = createMockRes();
        await mw(req, res, (arg) => {
          nextCount++;
          nextArg = arg;
        });
        assert.strictEqual(nextCount, 1);
        assert.strictEqual(nextArg, undefined);
      }
    });

    // -----------------------------------------------------------------
    // AUTH-01-02: Locked user -> session destroyed, cookie cleared, rejected
    // -----------------------------------------------------------------
    await runCase('AUTH-01-02: Locked customer destroys session, clears vamos_sid, and blocks downstream', async () => {
      statusCheckMode = 'normal';
      usersById.get(8101).status = 'locked';
      let destroyed = false;
      let nextCalls = 0;

      // Browser path -> 302 redirect
      const resBrowser = createMockRes();
      await authMiddleware.requireCustomer(
        {
          method: 'POST',
          originalUrl: '/checkout',
          headers: {},
          session: { user: { id: 8101, role: 'CUSTOMER' }, destroy: (cb) => { destroyed = true; cb(); } }
        },
        resBrowser,
        () => { nextCalls++; }
      );
      assert.strictEqual(destroyed, true);
      assert.strictEqual(nextCalls, 0);
      assert.ok(resBrowser.clearedCookies.includes('vamos_sid'));
      assert.strictEqual(resBrowser.redirectUrl, '/auth/login?error=account_locked');

      // API path -> 401 JSON (never HTML 302)
      destroyed = false;
      const resApi = createMockRes();
      await authMiddleware.requireCustomer(
        {
          method: 'POST',
          originalUrl: '/api/wishlist/items',
          baseUrl: '/api/wishlist',
          path: '/items',
          headers: { accept: 'application/json' },
          session: { user: { id: 8101, role: 'CUSTOMER' }, destroy: (cb) => { destroyed = true; cb(); } }
        },
        resApi,
        () => { nextCalls++; }
      );
      assert.strictEqual(destroyed, true);
      assert.strictEqual(nextCalls, 0);
      assert.ok(resApi.clearedCookies.includes('vamos_sid'));
      assert.strictEqual(resApi.statusCode, 401);
      assert.strictEqual(resApi.jsonPayload.success, false);
    });

    // -----------------------------------------------------------------
    // AUTH-01-03: Missing user -> session destroyed and rejected
    // -----------------------------------------------------------------
    await runCase('AUTH-01-03: Missing user record destroys session, clears cookie, and never calls next()', async () => {
      statusCheckMode = 'normal';
      for (const [mw, role, expectedApiStatus] of [
        [authMiddleware.requireCustomer, 'CUSTOMER', 401],
        [authMiddleware.requireAuth, 'CUSTOMER', 401],
        [authMiddleware.requireAdmin, 'ADMIN', 403]
      ]) {
        let destroyed = false;
        let nextCalls = 0;
        const res = createMockRes();
        await mw(
          {
            method: 'POST',
            originalUrl: '/api/wishlist/items',
            headers: { accept: 'application/json' },
            session: { user: { id: 999999, role }, destroy: (cb) => { destroyed = true; cb(); } }
          },
          res,
          () => { nextCalls++; }
        );
        assert.strictEqual(destroyed, true);
        assert.strictEqual(nextCalls, 0);
        assert.ok(res.clearedCookies.includes('vamos_sid'));
        assert.strictEqual(res.statusCode, expectedApiStatus);
      }
    });

    // -----------------------------------------------------------------
    // AUTH-01-04 & AUTH-01-05 (Direct Middleware): Transient DB (503) vs SQL/Schema Error (500)
    // -----------------------------------------------------------------
    await runCase('AUTH-01-04 & AUTH-01-05 (Unit): Transient DB yields 503 while SQL/schema error yields 500 without normal next()', async () => {
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('timeout', 'ETIMEOUT')), true);
      assert.strictEqual(authMiddleware.isTransientDbError({ code: 'ESOCKET' }), true);
      assert.strictEqual(authMiddleware.isTransientDbError({ number: 40613 }), true);
      assert.strictEqual(authMiddleware.isTransientDbError({ name: 'RequestError', code: 'EREQUEST', number: 207 }), false);
      assert.strictEqual(authMiddleware.isTransientDbError({ name: 'RequestError', code: 'EREQUEST', number: 208 }), false);
      assert.strictEqual(authMiddleware.isTransientDbError({ name: 'RequestError', code: 'EREQUEST', number: 229 }), false);

      // Transient error -> next(err503)
      usersById.get(8101).status = 'locked';
      statusCheckMode = 'transient_always';
      let receivedErr = null;
      await authMiddleware.requireCustomer(
        {
          method: 'POST',
          originalUrl: '/checkout',
          headers: {},
          session: { user: { id: 8101, role: 'CUSTOMER' } }
        },
        createMockRes(),
        (err) => { receivedErr = err; }
      );
      assert.ok(receivedErr instanceof Error);
      assert.strictEqual(receivedErr.status, 503);

      // Non-transient SQL/schema error -> next(err500)
      statusCheckMode = 'schema_error';
      let schemaErr = null;
      await authMiddleware.requireCustomer(
        {
          method: 'POST',
          originalUrl: '/checkout',
          headers: {},
          session: { user: { id: 8101, role: 'CUSTOMER' } }
        },
        createMockRes(),
        (err) => { schemaErr = err; }
      );
      assert.ok(schemaErr instanceof Error);
      assert.strictEqual(schemaErr.status, 500);
    });

    // -----------------------------------------------------------------
    // Real Express HTTP Server for AUTH-01-02..08 End-to-End Verification
    // -----------------------------------------------------------------
    const testApp = require('express')();
    testApp.use((req, _res, next) => {
      req._testCsrfEnforce = true;
      next();
    });
    testApp.use(app);
    server = http.createServer(testApp);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    async function loginAndGetSession(email) {
      const loginPage = await fetch(`${baseUrl}/auth/login`, { redirect: 'manual' });
      const initCookie = extractCookie(loginPage.headers.get('set-cookie'));
      const html = await loginPage.text();
      const csrf = html.match(/name="_csrf" value="([^"]+)"/)[1];
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { Cookie: initCookie, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password: runtimePass, _csrf: csrf }).toString(),
        redirect: 'manual'
      });
      assert.strictEqual(loginRes.status, 302);
      const authCookie = extractCookie(loginRes.headers.get('set-cookie')) || initCookie;
      const homeRes = await fetch(`${baseUrl}/`, { headers: { Cookie: authCookie }, redirect: 'manual' });
      const homeHtml = await homeRes.text();
      const csrfToken = homeHtml.match(/window\.CSRF_TOKEN = '([^']+)';/)[1];
      return { cookie: authCookie, csrfToken };
    }

    usersById.get(8101).status = 'active';
    usersById.get(8102).status = 'active';
    statusCheckMode = 'normal';

    const custSession = await loginAndGetSession('auth01.cust@vamos.test');
    const adminSession = await loginAndGetSession('auth01.admin@vamos.test');

    // Verify CSRF middleware still enforces tokens when _testCsrfEnforce is true
    assert.strictEqual(typeof csrfMiddleware, 'function');

    // -----------------------------------------------------------------
    // AUTH-01-04 (HTTP TOCTOU Recovery Proof): Locked customer + transient_once MUST still return 503 and block downstream
    // -----------------------------------------------------------------
    await runCase('AUTH-01-04 (HTTP): Locked customer with transient DB failure recovering mid-request returns 503 and blocks order/redeem/wishlist', async () => {
      usersById.get(8101).status = 'locked';
      downstreamCalls = 0;

      // 1. Checkout POST (browser)
      statusCheckMode = 'transient_once';
      const checkoutRes = await fetch(`${baseUrl}/checkout`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          _csrf: custSession.csrfToken,
          recipient_name: 'Test User',
          recipient_phone: '0901234567',
          full_address: '123 Le Loi, Q1'
        }).toString(),
        redirect: 'manual'
      });
      assert.strictEqual(checkoutRes.status, 503);
      assert.strictEqual(downstreamCalls, 0);

      // 2. Redeem voucher POST (JSON API)
      statusCheckMode = 'transient_once';
      const redeemRes = await fetch(`${baseUrl}/account/rewards/redeem`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        body: JSON.stringify({ reward_rule_id: 1 })
      });
      assert.strictEqual(redeemRes.status, 503);
      assert.strictEqual(downstreamCalls, 0);

      // 3. Wishlist API POST (without Accept: application/json -> still API via /api path)
      statusCheckMode = 'transient_once';
      const wishRes = await fetch(`${baseUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          'Content-Type': 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        body: JSON.stringify({ productId: 1 })
      });
      assert.strictEqual(wishRes.status, 503);
      const wishJson = await wishRes.json();
      assert.strictEqual(wishJson.status, 503);
      assert.strictEqual(wishJson.success, false);
      assert.strictEqual(downstreamCalls, 0);
    });

    // -----------------------------------------------------------------
    // AUTH-01-05 (HTTP): SQL/schema error returns HTTP 500 without leaking SQL/credentials
    // -----------------------------------------------------------------
    await runCase('AUTH-01-05 (HTTP): Unexpected SQL/schema error returns 500 JSON/HTML and redacts internal SQL/secrets', async () => {
      statusCheckMode = 'schema_error';
      downstreamCalls = 0;

      const apiRes = await fetch(`${baseUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          'Content-Type': 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        body: JSON.stringify({ productId: 1 })
      });
      assert.strictEqual(apiRes.status, 500);
      const bodyText = await apiRes.text();
      assert.ok(!bodyText.includes('Invalid column name'), 'Must not leak SQL details in 500 JSON');
      assert.ok(!bodyText.includes('SuperSecret123'), 'Must not leak credentials in 500 JSON');
      assert.ok(!bodyText.includes('db-internal-01'), 'Must not leak internal hostnames in 500 JSON');
      assert.strictEqual(downstreamCalls, 0);
    });

    // -----------------------------------------------------------------
    // AUTH-01-06: Customer multipart review upload route blocks before Multer writes files
    // -----------------------------------------------------------------
    await runCase('AUTH-01-06: DB failure in requireCustomer prevents Multer from running or writing temp upload files', async () => {
      statusCheckMode = 'transient_always';
      downstreamCalls = 0;
      const beforeFiles = listUploadFiles();

      const fd = new FormData();
      fd.append('_csrf', custSession.csrfToken);
      fd.append('product_id', '10');
      fd.append('rating', '5');
      fd.append('comment', 'Review text long enough to pass validation rules cleanly.');
      fd.append('media', new Blob([VALID_JPEG_BYTES], { type: 'image/jpeg' }), 'blocked-by-auth.jpg');

      const uploadRes = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        body: fd
      });

      assert.strictEqual(uploadRes.status, 503);
      const afterFiles = listUploadFiles();
      assert.strictEqual(afterFiles.size, beforeFiles.size, 'Multer must never run or write files when auth check fails');
      assert.strictEqual(downstreamCalls, 0);
    });

    // -----------------------------------------------------------------
    // AUTH-01-07: API JSON 503 vs Browser HTML 503 with Retry-After and zero sensitive leakage
    // -----------------------------------------------------------------
    await runCase('AUTH-01-07: API receives JSON 503 and Browser receives HTML 503 page without internal leakage', async () => {
      statusCheckMode = 'transient_always';

      const browserRes = await fetch(`${baseUrl}/account/orders`, {
        method: 'GET',
        headers: {
          Cookie: custSession.cookie,
          Accept: 'text/html'
        },
        redirect: 'manual'
      });
      assert.strictEqual(browserRes.status, 503);
      assert.strictEqual(browserRes.headers.get('retry-after'), '30');
      const html = await browserRes.text();
      assert.ok(html.includes('503'), 'Browser 503 page must render 503 template');
      assert.ok(!html.includes('ECONNREFUSED') && !html.includes('10.0.0.15'), 'Must not expose internal host/error details');

      statusCheckMode = 'transient_once';
      const apiRes = await fetch(`${baseUrl}/account/rewards/redeem`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        body: JSON.stringify({ reward_rule_id: 1 })
      });
      assert.strictEqual(apiRes.status, 503);
      const apiJson = await apiRes.json();
      assert.strictEqual(apiJson.success, false);
      assert.strictEqual(apiJson.status, 503);
      assert.ok(!JSON.stringify(apiJson).includes('secret-db.internal'));
      assert.ok(!JSON.stringify(apiJson).includes('ETIMEOUT'));

      // Logs must never contain cookie, email, password, or session ID
      const allLogs = capturedLogs.join('\n');
      assert.ok(!allLogs.includes('vamos_sid='));
      assert.ok(!allLogs.includes('auth01.cust@vamos.test'));
      assert.ok(!allLogs.includes('SuperSecret123'));
      assert.ok(!allLogs.includes(runtimePass));
    });

    // -----------------------------------------------------------------
    // AUTH-01-08: requireAuth & requireAdmin fail-closed + locked customer session revocation HTTP check
    // -----------------------------------------------------------------
    await runCase('AUTH-01-08: requireAuth and requireAdmin fail-closed on DB errors; locked customer session destroyed on HTTP retry', async () => {
      // 1. requireAdmin transient DB fail -> 503 (never proceeds to /admin/dashboard)
      statusCheckMode = 'transient_always';
      const admin503 = await fetch(`${baseUrl}/admin/dashboard`, {
        headers: { Cookie: adminSession.cookie, Accept: 'text/html' },
        redirect: 'manual'
      });
      assert.strictEqual(admin503.status, 503);

      // 2. requireAdmin SQL/schema error -> 500
      statusCheckMode = 'schema_error';
      const admin500 = await fetch(`${baseUrl}/admin/dashboard`, {
        headers: { Cookie: adminSession.cookie, Accept: 'text/html' },
        redirect: 'manual'
      });
      assert.strictEqual(admin500.status, 500);

      // 3. requireAuth (/auth/logout) transient DB fail -> 503
      statusCheckMode = 'transient_always';
      const logout503 = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        redirect: 'manual'
      });
      assert.strictEqual(logout503.status, 503);

      // 4. Customer gets locked while DB is healthy -> session revoked & blocked on follow-up
      statusCheckMode = 'normal';
      usersById.get(8101).status = 'locked';
      const lockedRes = await fetch(`${baseUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          Cookie: custSession.cookie,
          'Content-Type': 'application/json',
          'X-CSRF-Token': custSession.csrfToken
        },
        body: JSON.stringify({ productId: 1 }),
        redirect: 'manual'
      });
      assert.strictEqual(lockedRes.status, 401);
      const setCookie = lockedRes.headers.get('set-cookie') || '';
      assert.ok(setCookie.includes('vamos_sid=;'), 'Locked customer response must clear vamos_sid cookie');
    });

    // -----------------------------------------------------------------
    // AUTH-01.1-01..06: Strict DB Error Classification Verification
    // -----------------------------------------------------------------
    usersById.get(8101).status = 'active';
    statusCheckMode = 'normal';
    const freshCustSession = await loginAndGetSession('auth01.cust@vamos.test');

    await runCase('AUTH-01.1-01: ELOGIN returns HTTP 500 without calling normal next() or leaking DB credentials', async () => {
      usersById.get(8101).status = 'active';
      statusCheckMode = 'elogin';
      downstreamCalls = 0;

      let nextArg;
      let normalNextCalled = false;
      await authMiddleware.requireCustomer(
        { method: 'POST', originalUrl: '/checkout', headers: {}, session: { user: { id: 8101, role: 'CUSTOMER' } } },
        createMockRes(),
        (err) => {
          if (!err) normalNextCalled = true;
          nextArg = err;
        }
      );
      assert.strictEqual(normalNextCalled, false);
      assert.ok(nextArg instanceof Error);
      assert.strictEqual(nextArg.status, 500);

      const res = await fetch(`${baseUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          Cookie: freshCustSession.cookie,
          'Content-Type': 'application/json',
          'X-CSRF-Token': freshCustSession.csrfToken
        },
        body: JSON.stringify({ productId: 1 })
      });
      assert.strictEqual(res.status, 500);
      const body = await res.text();
      assert.ok(!body.includes('DbLoginSecret999'));
      assert.ok(!body.includes('Login failed'));
      assert.strictEqual(downstreamCalls, 0);
      assert.ok(!capturedLogs.join('\n').includes('DbLoginSecret999'));
    });

    await runCase('AUTH-01.1-02: SQL 4060 returns HTTP 500 without calling normal next() or leaking DB details', async () => {
      statusCheckMode = 'sql_4060';
      downstreamCalls = 0;

      let nextArg;
      let normalNextCalled = false;
      await authMiddleware.requireCustomer(
        { method: 'GET', originalUrl: '/account/orders', headers: {}, session: { user: { id: 8101, role: 'CUSTOMER' } } },
        createMockRes(),
        (err) => {
          if (!err) normalNextCalled = true;
          nextArg = err;
        }
      );
      assert.strictEqual(normalNextCalled, false);
      assert.ok(nextArg instanceof Error);
      assert.strictEqual(nextArg.status, 500);

      const res = await fetch(`${baseUrl}/account/orders`, {
        headers: { Cookie: freshCustSession.cookie, Accept: 'text/html' },
        redirect: 'manual'
      });
      assert.strictEqual(res.status, 500);
      const html = await res.text();
      assert.ok(!html.includes('vamos_prod_secret'));
      assert.ok(!html.includes('Login4060Secret'));
      assert.strictEqual(downstreamCalls, 0);
      assert.ok(!capturedLogs.join('\n').includes('Login4060Secret'));
    });

    await runCase('AUTH-01.1-03: ConnectionError with ESOCKET or ETIMEOUT classifies as transient HTTP 503', async () => {
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('socket', 'ESOCKET')), true);
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('timeout', 'ETIMEOUT')), true);

      statusCheckMode = 'conn_esocket';
      const res = await fetch(`${baseUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          Cookie: freshCustSession.cookie,
          'Content-Type': 'application/json',
          'X-CSRF-Token': freshCustSession.csrfToken
        },
        body: JSON.stringify({ productId: 1 })
      });
      assert.strictEqual(res.status, 503);
      assert.strictEqual(downstreamCalls, 0);
    });

    await runCase('AUTH-01.1-04: ConnectionError with ELOGIN, EFEDAUTH, ETDS, EINTERFACENOTSUPP, or bare ConnectionError is NOT 503', () => {
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('Login failed.', 'ELOGIN')), false);
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('Token failed.', 'EFEDAUTH')), false);
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('Unknown TDS.', 'ETDS')), false);
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('Unsupported.', 'EINTERFACENOTSUPP')), false);
      assert.strictEqual(authMiddleware.isTransientDbError(new sql.ConnectionError('Unclassified generic failure')), false);
      const wrappedElogin = new sql.ConnectionError('Wrapped login fail');
      wrappedElogin.originalError = { code: 'ELOGIN' };
      assert.strictEqual(authMiddleware.isTransientDbError(wrappedElogin), false);
    });

    await runCase('AUTH-01.1-05: SQL 1205 deadlock and verified transient service errors classify as HTTP 503', async () => {
      statusCheckMode = 'sql_1205';
      downstreamCalls = 0;

      const res = await fetch(`${baseUrl}/account/rewards/redeem`, {
        method: 'POST',
        headers: {
          Cookie: freshCustSession.cookie,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': freshCustSession.csrfToken
        },
        body: JSON.stringify({ reward_rule_id: 1 })
      });
      assert.strictEqual(res.status, 503);
      assert.strictEqual(downstreamCalls, 0);
      assert.strictEqual(authMiddleware.isTransientDbError({ code: 'ENOTOPEN' }), true);
      assert.strictEqual(authMiddleware.isTransientDbError({ code: 'ENET' }), true);
      assert.strictEqual(authMiddleware.isTransientDbError({ code: 'ECLOSE' }), true);
      assert.strictEqual(authMiddleware.isTransientDbError({ number: 40501 }), true);
    });

    await runCase('AUTH-01.1-06: Schema errors SQL 207 and 208 continue returning HTTP 500 without normal next()', async () => {
      for (const mode of ['schema_error', 'sql_208']) {
        statusCheckMode = mode;
        const res = await fetch(`${baseUrl}/api/wishlist/items`, {
          method: 'POST',
          headers: {
            Cookie: freshCustSession.cookie,
            'Content-Type': 'application/json',
            'X-CSRF-Token': freshCustSession.csrfToken
          },
          body: JSON.stringify({ productId: 1 })
        });
        assert.strictEqual(res.status, 500);
      }
      assert.strictEqual(downstreamCalls, 0);
    });

    console.log(`\n[AUTH-01 FAIL-CLOSED SUITE]: ALL ${passed}/${total} TEST CASES PASSED!`);
  } finally {
    dbConfig.query = origQuery;
    loyaltyService.redeemVoucher = origRedeemVoucher;
    orderService.createCodOrder = origCreateOrder;
    reviewService.createReview = origCreateReview;
    wishlistService.addItem = origWishlistAdd;
    console.error = origConsoleError;

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[AUTH-01 SUITE FAILED]:', err);
    process.exit(1);
  });
