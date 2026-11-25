/**
 * Zero-DB Express HTTP Security Regression Suite: CRITICAL-01 Multipart Review CSRF
 * Exercises the FULL real Express app middleware stack (csrfMiddleware with _testCsrfEnforce=true,
 * requireCustomer, reviewUploadMiddleware/multer, loyaltyController, errorHandler) with in-memory DB stubbing.
 */

require('./test_bootstrap');

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const pug = require('pug');

// Stub database module BEFORE loading app/controllers/services so zero SQL connection is opened
const dbConfig = require('../src/config/database');
const runtimeUnitPass = crypto.randomBytes(12).toString('hex');
const passHash = bcrypt.hashSync(runtimeUnitPass, 4);

const USERS_BY_EMAIL = {
  'csrf.cust1@vamos.test': { id: 9101, full_name: 'Customer CSRF 1', email: 'csrf.cust1@vamos.test', password_hash: passHash, role: 'CUSTOMER', status: 'active' },
  'csrf.cust2@vamos.test': { id: 9102, full_name: 'Customer CSRF 2', email: 'csrf.cust2@vamos.test', password_hash: passHash, role: 'CUSTOMER', status: 'active' },
  'csrf.admin@vamos.test': { id: 9103, full_name: 'Admin CSRF', email: 'csrf.admin@vamos.test', password_hash: passHash, role: 'ADMIN', status: 'active' }
};
const USERS_BY_ID = Object.fromEntries(Object.values(USERS_BY_EMAIL).map((u) => [u.id, u]));

let handlerCalls = 0;
let walletBalance = 0;

dbConfig.query = async (sqlText, params = {}) => {
  const q = String(sqlText);
  if (q.includes('FROM users WHERE email')) {
    const u = USERS_BY_EMAIL[params.email];
    return { recordset: u ? [u] : [] };
  }
  if (q.includes('FROM users WHERE id')) {
    const u = USERS_BY_ID[params.id];
    return { recordset: u ? [{ status: u.status, role: u.role }] : [] };
  }
  if (q.includes('FROM carts')) {
    return { recordset: [{ id: 1 }] };
  }
  if (q.includes('FROM cart_items')) {
    return { recordset: [{ total_items: 0 }] };
  }
  return { recordset: [] };
};

const app = require('../src/app');
const csrfMiddleware = require('../src/middlewares/csrf.middleware');
const reviewService = require('../src/services/review.service');
const loyaltyService = require('../src/services/loyalty.service');
const { uploadDir, cleanupUploadedFiles } = require('../src/middlewares/upload.middleware');

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

function buildReviewFormData({ csrfToken, productId = 10, rating = 5, comment, quickTags = ['Vừa vặn chuẩn size'], fileBytes = VALID_JPEG_BYTES, filename = 'unit-review.jpg', mimeType = 'image/jpeg' }) {
  const formData = new FormData();
  if (csrfToken !== undefined) {
    formData.append('_csrf', csrfToken);
  }
  formData.append('product_id', String(productId));
  formData.append('rating', String(rating));
  formData.append('comment', comment || 'Giày VAMOS chạy bộ rất êm chân, form ôm gọn gàng và giao hàng nhanh.');
  formData.append('quick_tags', JSON.stringify(quickTags));
  if (fileBytes) {
    formData.append('media', new Blob([fileBytes], { type: mimeType }), filename);
  }
  return formData;
}

async function loginSession(baseUrl, email) {
  const loginPageRes = await fetch(`${baseUrl}/auth/login`, { redirect: 'manual' });
  assert.strictEqual(loginPageRes.status, 200);
  const loginHtml = await loginPageRes.text();
  const initialCookie = extractCookie(loginPageRes.headers.get('set-cookie'));
  const csrfMatch = loginHtml.match(/name="_csrf" value="([^"]+)"/);
  assert.ok(csrfMatch && csrfMatch[1]);

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { Cookie: initialCookie, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password: runtimeUnitPass, _csrf: csrfMatch[1] }).toString(),
    redirect: 'manual'
  });
  assert.strictEqual(loginRes.status, 302);
  const authCookie = extractCookie(loginRes.headers.get('set-cookie')) || initialCookie;

  const homeRes = await fetch(`${baseUrl}/`, { headers: { Cookie: authCookie }, redirect: 'manual' });
  assert.strictEqual(homeRes.status, 200);
  const homeHtml = await homeRes.text();
  const tokenMatch = homeHtml.match(/window\.CSRF_TOKEN = '([^']+)';/);
  assert.ok(tokenMatch && tokenMatch[1]);
  return { cookie: authCookie, csrfToken: tokenMatch[1] };
}

async function runZeroDbTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - ZERO-DB MULTIPART CSRF EXPRESS SECURITY SUITE');
  console.log('===============================================================');

  const origCreateReview = reviewService.createReview;
  const origDbQuery = dbConfig.query;
  const savedUnitFiles = [];

  reviewService.createReview = async ({ userId, orderId, productId, rating, comment, quickTags, mediaFiles }) => {
    handlerCalls++;
    if (Number(userId) !== 9101 || Number(orderId) !== 501) {
      cleanupUploadedFiles(mediaFiles);
      throw new Error(`Đơn hàng #${orderId} không tồn tại hoặc không thuộc về tài khoản của bạn.`);
    }
    if (Number.isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      cleanupUploadedFiles(mediaFiles);
      throw new Error('Đánh giá số sao bắt buộc từ 1 đến 5 sao.');
    }
    const pts = loyaltyService.calculateReviewPoints({
      rating: Number(rating),
      comment,
      quickTags,
      hasMedia: Array.isArray(mediaFiles) && mediaFiles.length > 0
    });
    walletBalance += pts;
    return {
      success: true,
      reviewId: 777,
      rating: Number(rating),
      pointsEarned: pts,
      newBalance: walletBalance,
      tierCode: 'MEMBER',
      message: `Đánh giá thành công! Bạn đã nhận được +${pts} điểm VAMOS Club.`
    };
  };

  const testApp = express();
  testApp.use((req, _res, next) => {
    req._testCsrfEnforce = true;
    next();
  });
  testApp.use(app);

  const server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  let passed = 0;

  async function runCase(name, fn) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  try {
    await runCase('UI-CSRF-01: orders.pug renders X-CSRF-Token header in multipart fetch without Content-Type override', () => {
      const rendered = pug.renderFile(path.resolve(__dirname, '../src/views/pages/account/orders.pug'), {
        csrfToken: 'ui_token_check',
        user: { full_name: 'Test', email: 'test@vamos.vn' },
        orders: [],
        t: (_k, d) => d,
        currentLocale: 'vi',
        currentPath: '/account/orders',
        isAuthenticated: true,
        isAdmin: false,
        isCustomer: true,
        cartCount: 0,
        wishlistCount: 0
      });
      assert.ok(rendered.includes("'X-CSRF-Token': csrfToken"));
      assert.ok(!rendered.includes("'Content-Type': 'multipart/form-data'"));
    });

    await runCase('HOOK-01: _testCsrfEnforce=false never bypasses CSRF in NODE_ENV=production', () => {
      const prev = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        let errOut = null;
        csrfMiddleware(
          { method: 'POST', body: {}, headers: {}, session: { csrfToken: 'abc' }, _testCsrfEnforce: false },
          { locals: {} },
          (e) => { errOut = e; }
        );
        assert.ok(errOut && errOut.status === 403);
      } finally {
        process.env.NODE_ENV = prev;
      }
    });

    const cust1 = await loginSession(baseUrl, 'csrf.cust1@vamos.test');
    const cust2 = await loginSession(baseUrl, 'csrf.cust2@vamos.test');
    const admin = await loginSession(baseUrl, 'csrf.admin@vamos.test');

    await runCase('REPRO-01: Multipart with _csrf in FormData ONLY (no X-CSRF-Token header) fails 403 before upload/handler', async () => {
      const beforeFiles = listUploadFiles();
      const beforeCalls = handlerCalls;
      const res = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: cust1.cookie, Accept: 'application/json' },
        body: buildReviewFormData({ csrfToken: cust1.csrfToken })
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(handlerCalls, beforeCalls);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size);
    });

    await runCase('TC01: Valid multipart review upload with X-CSRF-Token passes CSRF and invokes review handler', async () => {
      const beforeFiles = listUploadFiles();
      const beforeCalls = handlerCalls;
      const res = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust1.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': cust1.csrfToken
        },
        body: buildReviewFormData({ csrfToken: cust1.csrfToken })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.pointsEarned, 300);
      assert.strictEqual(handlerCalls, beforeCalls + 1);

      const afterFiles = listUploadFiles();
      assert.strictEqual(afterFiles.size, beforeFiles.size + 1);
      for (const f of afterFiles) {
        if (!beforeFiles.has(f)) savedUnitFiles.push(path.join(uploadDir, f));
      }
    });

    await runCase('TC02: Multipart review upload missing CSRF token returns 403 and blocks upload/handler', async () => {
      const beforeFiles = listUploadFiles();
      const beforeCalls = handlerCalls;
      const res = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: cust1.cookie, Accept: 'application/json' },
        body: buildReviewFormData({ csrfToken: undefined })
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(handlerCalls, beforeCalls);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size);
    });

    await runCase('TC03: Multipart review upload with invalid X-CSRF-Token returns 403 and blocks upload/handler', async () => {
      const beforeFiles = listUploadFiles();
      const beforeCalls = handlerCalls;
      const res = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust1.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': 'forged_csrf_value_123'
        },
        body: buildReviewFormData({ csrfToken: 'forged_csrf_value_123' })
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(handlerCalls, beforeCalls);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size);
    });

    await runCase('TC04: Form POST /auth/login rejects missing CSRF (403) and accepts valid CSRF (302)', async () => {
      const loginPage = await fetch(`${baseUrl}/auth/login`);
      const c = extractCookie(loginPage.headers.get('set-cookie'));
      const html = await loginPage.text();
      const token = html.match(/name="_csrf" value="([^"]+)"/)[1];

      const missingRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { Cookie: c, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: 'csrf.cust1@vamos.test', password: runtimeUnitPass }).toString(),
        redirect: 'manual'
      });
      assert.strictEqual(missingRes.status, 403);

      const okRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { Cookie: c, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: 'csrf.cust1@vamos.test', password: runtimeUnitPass, _csrf: token }).toString(),
        redirect: 'manual'
      });
      assert.strictEqual(okRes.status, 302);
    });

    await runCase('TC05: Upload failure (disguised script or validation rejection) cleans temp files cleanly', async () => {
      const beforeFiles = listUploadFiles();

      const fakeRes = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: cust1.cookie, Accept: 'application/json', 'X-CSRF-Token': cust1.csrfToken },
        body: buildReviewFormData({ csrfToken: cust1.csrfToken, fileBytes: Buffer.from('<?php evil(); ?>'), filename: 'evil.jpg' })
      });
      assert.strictEqual(fakeRes.status, 400);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size);

      const badRatingRes = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: cust1.cookie, Accept: 'application/json', 'X-CSRF-Token': cust1.csrfToken },
        body: buildReviewFormData({ csrfToken: cust1.csrfToken, rating: 99 })
      });
      assert.strictEqual(badRatingRes.status, 400);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size);
    });

    await runCase('TC06: Guest (401), Admin (403), and non-owner Customer (400) boundaries remain enforced with zero temp files', async () => {
      const beforeFiles = listUploadFiles();
      const guestPage = await fetch(`${baseUrl}/`);
      const guestCookie = extractCookie(guestPage.headers.get('set-cookie'));
      const guestToken = (await guestPage.text()).match(/window\.CSRF_TOKEN = '([^']+)';/)[1];

      const guestRes = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: guestCookie, Accept: 'application/json', 'X-CSRF-Token': guestToken },
        body: buildReviewFormData({ csrfToken: guestToken })
      });
      assert.strictEqual(guestRes.status, 401);

      const admRes = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: admin.cookie, Accept: 'application/json', 'X-CSRF-Token': admin.csrfToken },
        body: buildReviewFormData({ csrfToken: admin.csrfToken })
      });
      assert.strictEqual(admRes.status, 403);

      const otherRes = await fetch(`${baseUrl}/account/orders/501/reviews`, {
        method: 'POST',
        headers: { Cookie: cust2.cookie, Accept: 'application/json', 'X-CSRF-Token': cust2.csrfToken },
        body: buildReviewFormData({ csrfToken: cust2.csrfToken })
      });
      assert.strictEqual(otherRes.status, 400);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size);
    });

    console.log(`\n[ZERO-DB CSRF MULTIPART SUITE]: ALL ${passed}/9 TESTS PASSED!`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    reviewService.createReview = origCreateReview;
    dbConfig.query = origDbQuery;
    cleanupUploadedFiles(savedUnitFiles);
  }
}

runZeroDbTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ZERO-DB CSRF SUITE FAILED]:', err);
    process.exit(1);
  });
