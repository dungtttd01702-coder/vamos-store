/**
 * Security & Regression Test Suite: CRITICAL-01 Multipart Review Upload CSRF Enforcement
 * Exercises the real Express middleware chain (with _testCsrfEnforce = true) against vamos_store_test_db.
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

const app = require('../src/app');
const csrfMiddleware = require('../src/middlewares/csrf.middleware');
const { query, closePool } = require('../src/config/database');
const { uploadDir } = require('../src/middlewares/upload.middleware');
const loyaltyService = require('../src/services/loyalty.service');

// Minimal valid 1x1-style JPEG signature + EOI bytes accepted by isAuthenticImage
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

function buildReviewFormData({ csrfToken, productId, rating = 5, comment, quickTags = ['Vừa vặn chuẩn size'], fileBytes = VALID_JPEG_BYTES, filename = 'test-review.jpg', mimeType = 'image/jpeg' }) {
  const formData = new FormData();
  if (csrfToken !== undefined) {
    formData.append('_csrf', csrfToken);
  }
  formData.append('product_id', String(productId));
  formData.append('rating', String(rating));
  formData.append('comment', comment || 'Giày VAMOS chạy bộ rất êm chân, form ôm gọn gàng và giao hàng nhanh chóng.');
  formData.append('quick_tags', JSON.stringify(quickTags));
  if (fileBytes) {
    formData.append('media', new Blob([fileBytes], { type: mimeType }), filename);
  }
  return formData;
}

async function loginSession(baseUrl, email, password) {
  const loginPageRes = await fetch(`${baseUrl}/auth/login`, { redirect: 'manual' });
  assert.strictEqual(loginPageRes.status, 200, 'GET /auth/login must return 200');
  const loginHtml = await loginPageRes.text();
  const initialCookie = extractCookie(loginPageRes.headers.get('set-cookie'));
  const csrfMatch = loginHtml.match(/name="_csrf" value="([^"]+)"/);
  assert.ok(csrfMatch && csrfMatch[1], 'Login page must render CSRF token');

  const bodyParams = new URLSearchParams({
    email,
    password,
    _csrf: csrfMatch[1]
  });

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      Cookie: initialCookie,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: bodyParams.toString(),
    redirect: 'manual'
  });

  assert.strictEqual(loginRes.status, 302, `Login for ${email} must succeed with 302 under enforced CSRF`);
  const authCookie = extractCookie(loginRes.headers.get('set-cookie')) || initialCookie;

  // Fetch CSRF token tied to the regenerated authenticated session
  const homeRes = await fetch(`${baseUrl}/`, {
    headers: { Cookie: authCookie },
    redirect: 'manual'
  });
  assert.strictEqual(homeRes.status, 200, 'Authenticated GET / must return 200');
  const homeHtml = await homeRes.text();
  const tokenMatch = homeHtml.match(/window\.CSRF_TOKEN = '([^']+)';/);
  assert.ok(tokenMatch && tokenMatch[1], 'Authenticated session must expose window.CSRF_TOKEN');

  return { cookie: authCookie, csrfToken: tokenMatch[1] };
}

async function runTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - CRITICAL-01 MULTIPART CSRF SECURITY SUITE');
  console.log('===============================================================');

  // Guard: strictly connected to test database
  const dbCheck = await query('SELECT DB_NAME() AS current_db');
  const currentDb = dbCheck.recordset[0]?.current_db;
  if (!currentDb || !currentDb.toLowerCase().includes('test')) {
    throw new Error(`[ABORT] test_csrf_multipart_review must run on test DB, got: ${currentDb}`);
  }

  // Mount real Express app behind test-only middleware that enables real CSRF enforcement
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

  const runId = `csrf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdUserIds = [];
  const createdOrderIds = [];
  const createdReviewIds = [];
  const createdUploadFiles = [];
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
    // Seed isolated users & COMPLETED orders
    const passPlain = crypto.randomBytes(12).toString('hex');
    const passHash = await bcrypt.hash(passPlain, 4);

    const cust1Res = await query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      OUTPUT INSERTED.id, INSERTED.email
      VALUES (@email, @hash, N'Khách Hàng CSRF 1', 'CUSTOMER', 'active')
    `, { email: `csrf_u1_${runId}@vamos.test`, hash: passHash });
    const cust1 = cust1Res.recordset[0];
    createdUserIds.push(cust1.id);

    const cust2Res = await query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      OUTPUT INSERTED.id, INSERTED.email
      VALUES (@email, @hash, N'Khách Hàng CSRF 2', 'CUSTOMER', 'active')
    `, { email: `csrf_u2_${runId}@vamos.test`, hash: passHash });
    const cust2 = cust2Res.recordset[0];
    createdUserIds.push(cust2.id);

    const adminRes = await query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      OUTPUT INSERTED.id, INSERTED.email
      VALUES (@email, @hash, N'Admin CSRF Test', 'ADMIN', 'active')
    `, { email: `csrf_adm_${runId}@vamos.test`, hash: passHash });
    const adminUser = adminRes.recordset[0];
    createdUserIds.push(adminUser.id);

    const prodRes = await query(`
      SELECT TOP 1 pv.id AS variant_id, pv.product_id, p.name AS product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE p.status = 'active'
    `);
    const variant = prodRes.recordset[0];
    assert.ok(variant, 'At least one active product variant must exist in test DB');

    async function insertCompletedOrder(userId, suffix) {
      const oRes = await query(`
        INSERT INTO orders (
          order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot,
          delivery_address_snapshot, payment_method, payment_status, order_status,
          subtotal, discount_amount, shipping_fee, total_amount, created_at, updated_at
        )
        OUTPUT INSERTED.id
        VALUES (
          @code, @userId, N'CSRF Order User', '0912345678',
          N'123 Nguyễn Huệ, Quận 1, TP.HCM', 'COD', 'PAID', 'COMPLETED',
          1000000, 0, 0, 1000000, GETDATE(), GETDATE()
        )
      `, { code: `ORD-${runId}-${suffix}`, userId });
      const orderId = oRes.recordset[0].id;
      createdOrderIds.push(orderId);

      await query(`
        INSERT INTO order_items (
          order_id, product_variant_id, product_name_snapshot,
          sku_snapshot, size_snapshot, color_snapshot, unit_price, quantity, line_total
        )
        VALUES (@orderId, @variantId, @prodName, 'SKU-CSRF', '41', N'Đen', 1000000, 1, 1000000)
      `, { orderId, variantId: variant.variant_id, prodName: variant.product_name });

      return orderId;
    }

    const order1Id = await insertCompletedOrder(cust1.id, '01');
    const order2Id = await insertCompletedOrder(cust2.id, '02');

    // UI template check
    await runCase('UI-CSRF-01: orders.pug renders X-CSRF-Token header in multipart fetch without forcing Content-Type', () => {
      const templatePath = path.resolve(__dirname, '../src/views/pages/account/orders.pug');
      const rendered = pug.renderFile(templatePath, {
        csrfToken: 'sample_ui_csrf_token_xyz',
        user: { full_name: 'Test', email: 'test@vamos.vn' },
        orders: [],
        t: (_k, def) => def,
        currentLocale: 'vi',
        currentPath: '/account/orders',
        isAuthenticated: true,
        isAdmin: false,
        isCustomer: true,
        cartCount: 0,
        wishlistCount: 0
      });
      assert.ok(rendered.includes("'X-CSRF-Token': csrfToken"), 'orders.pug submitReviewForm must send X-CSRF-Token header');
      assert.ok(!rendered.includes("'Content-Type': 'multipart/form-data'"), 'orders.pug must not override multipart boundary Content-Type');
    });

    // Test-hook production safety check
    await runCase('HOOK-01: _testCsrfEnforce never weakens or bypasses CSRF in NODE_ENV=production', () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        let capturedErr = null;
        csrfMiddleware(
          { method: 'POST', body: {}, headers: {}, session: { csrfToken: 'secret' }, _testCsrfEnforce: false },
          { locals: {} },
          (err) => { capturedErr = err; }
        );
        assert.ok(capturedErr && capturedErr.status === 403, 'NODE_ENV=production must still enforce 403 even if _testCsrfEnforce is false');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    // Login real sessions under enforced CSRF (also exercises TC04 form POST)
    const cust1Session = await loginSession(baseUrl, cust1.email, passPlain);
    const cust2Session = await loginSession(baseUrl, cust2.email, passPlain);
    const adminSession = await loginSession(baseUrl, adminUser.email, passPlain);

    // Proof of original root cause: FormData _csrf without X-CSRF-Token header returns 403 and writes zero files
    await runCase('REPRO-01: Multipart FormData with _csrf only (no X-CSRF-Token header) is blocked 403 before upload', async () => {
      const beforeFiles = listUploadFiles();
      const formData = buildReviewFormData({ csrfToken: cust1Session.csrfToken, productId: variant.product_id });
      const res = await fetch(`${baseUrl}/account/orders/${order1Id}/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust1Session.cookie,
          Accept: 'application/json'
        },
        body: formData
      });
      const json = await res.json();
      const afterFiles = listUploadFiles();

      assert.strictEqual(res.status, 403, 'Without X-CSRF-Token header, multipart CSRF must return 403');
      assert.strictEqual(json.success, false);
      assert.strictEqual(afterFiles.size, beforeFiles.size, 'No file may be saved to disk on 403 CSRF failure');
    });

    // TC01: Valid multipart request with X-CSRF-Token header succeeds and persists review + media + points
    await runCase('TC01: Valid multipart review upload with X-CSRF-Token passes CSRF, saves image, and awards points', async () => {
      const beforeFiles = listUploadFiles();
      const walletBefore = await loyaltyService.getOrCreateWallet(cust1.id);
      const formData = buildReviewFormData({ csrfToken: cust1Session.csrfToken, productId: variant.product_id });

      const res = await fetch(`${baseUrl}/account/orders/${order1Id}/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust1Session.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': cust1Session.csrfToken
        },
        body: formData
      });
      const json = await res.json();
      const afterFiles = listUploadFiles();

      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}: ${json.message}`);
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.pointsEarned, 300);

      createdReviewIds.push(json.data.reviewId);
      for (const f of afterFiles) {
        if (!beforeFiles.has(f)) {
          createdUploadFiles.push(path.join(uploadDir, f));
        }
      }
      assert.strictEqual(afterFiles.size, beforeFiles.size + 1, 'Exactly one uploaded image should exist on disk');

      const revDb = await query('SELECT id, rating, points_earned FROM reviews WHERE id = @rid', { rid: json.data.reviewId });
      assert.strictEqual(revDb.recordset.length, 1);
      assert.strictEqual(revDb.recordset[0].points_earned, 300);

      const mediaDb = await query('SELECT id FROM review_media WHERE review_id = @rid', { rid: json.data.reviewId });
      assert.strictEqual(mediaDb.recordset.length, 1);

      const walletAfter = await loyaltyService.getOrCreateWallet(cust1.id);
      assert.strictEqual(walletAfter.available_points, walletBefore.available_points + 300);
      assert.strictEqual(walletAfter.qualifying_points_cycle, walletBefore.qualifying_points_cycle, 'Review points must remain non-qualifying');
    });

    // TC02: Missing CSRF token on multipart upload
    await runCase('TC02: Multipart review upload missing CSRF token returns 403 and writes zero files or reviews', async () => {
      const beforeFiles = listUploadFiles();
      const formData = buildReviewFormData({ csrfToken: undefined, productId: variant.product_id });

      const res = await fetch(`${baseUrl}/account/orders/${order2Id}/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust2Session.cookie,
          Accept: 'application/json'
        },
        body: formData
      });
      const json = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(json.success, false);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size, 'No upload file allowed on missing CSRF token');

      const revCheck = await query('SELECT id FROM reviews WHERE order_id = @oid', { oid: order2Id });
      assert.strictEqual(revCheck.recordset.length, 0);
    });

    // TC03: Invalid CSRF token on multipart upload
    await runCase('TC03: Multipart review upload with invalid X-CSRF-Token returns 403 and writes zero files or reviews', async () => {
      const beforeFiles = listUploadFiles();
      const formData = buildReviewFormData({ csrfToken: 'forged_token_abc', productId: variant.product_id });

      const res = await fetch(`${baseUrl}/account/orders/${order2Id}/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust2Session.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': 'forged_token_abc'
        },
        body: formData
      });
      const json = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(json.success, false);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size, 'No upload file allowed on forged CSRF token');

      const revCheck = await query('SELECT id FROM reviews WHERE order_id = @oid', { oid: order2Id });
      assert.strictEqual(revCheck.recordset.length, 0);
    });

    // TC04: Standard JSON & form POST endpoints still require and pass CSRF
    await runCase('TC04: Existing JSON POST endpoint accepts valid CSRF and rejects missing CSRF with 403', async () => {
      const missingRes = await fetch(`${baseUrl}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          Cookie: cust2Session.cookie,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: variant.product_id })
      });
      assert.strictEqual(missingRes.status, 403);

      const validRes = await fetch(`${baseUrl}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          Cookie: cust2Session.cookie,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': cust2Session.csrfToken
        },
        body: JSON.stringify({ productId: variant.product_id, _csrf: cust2Session.csrfToken })
      });
      assert.strictEqual(validRes.status, 200);
      const validJson = await validRes.json();
      assert.strictEqual(validJson.success, true);

      // Remove wishlist entry created during TC04
      await query('DELETE FROM wishlist_items WHERE user_id = @uid', { uid: cust2.id });
    });

    // TC05: Upload failure (disguised script & invalid rating) leaves zero orphan files and zero partial DB rows
    await runCase('TC05: Upload validation failure (bad magic bytes / invalid rating) cleans up files with zero DB leftovers', async () => {
      const beforeFiles = listUploadFiles();

      // 5a: Fake JPEG (magic bytes mismatch)
      const badImageForm = buildReviewFormData({
        csrfToken: cust2Session.csrfToken,
        productId: variant.product_id,
        fileBytes: Buffer.from('<?php echo "evil"; ?>'),
        filename: 'evil.jpg',
        mimeType: 'image/jpeg'
      });
      const badImgRes = await fetch(`${baseUrl}/account/orders/${order2Id}/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust2Session.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': cust2Session.csrfToken
        },
        body: badImageForm
      });
      assert.strictEqual(badImgRes.status, 400);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size, 'Disguised file must be scrubbed on magic-bytes rejection');

      // 5b: Valid JPEG + invalid rating triggers controller/service rollback + cleanupUploadedFiles
      const badRatingForm = buildReviewFormData({
        csrfToken: cust2Session.csrfToken,
        productId: variant.product_id,
        rating: 99
      });
      const badRatingRes = await fetch(`${baseUrl}/account/orders/${order2Id}/reviews`, {
        method: 'POST',
        headers: {
          Cookie: cust2Session.cookie,
          Accept: 'application/json',
          'X-CSRF-Token': cust2Session.csrfToken
        },
        body: badRatingForm
      });
      assert.strictEqual(badRatingRes.status, 400);
      assert.strictEqual(listUploadFiles().size, beforeFiles.size, 'Uploaded JPEG must be cleaned up when reviewService rejects rating');

      const revCheck = await query('SELECT id FROM reviews WHERE order_id = @oid', { oid: order2Id });
      assert.strictEqual(revCheck.recordset.length, 0);
    });

    // TC06: Auth, Ownership, Admin role boundary & unchanged loyalty points
    await runCase('TC06: Auth/Ownership/Admin boundaries remain intact and review points calculation is unchanged', async () => {
      const beforeFiles = listUploadFiles();

      // Guest (valid guest CSRF token, unauthenticated) -> 401
      const guestHomeRes = await fetch(`${baseUrl}/`);
      const guestCookie = extractCookie(guestHomeRes.headers.get('set-cookie'));
      const guestHtml = await guestHomeRes.text();
      const guestToken = guestHtml.match(/window\.CSRF_TOKEN = '([^']+)';/)[1];
      const guestRes = await fetch(`${baseUrl}/account/orders/${order2Id}/reviews`, {
        method: 'POST',
        headers: { Cookie: guestCookie, Accept: 'application/json', 'X-CSRF-Token': guestToken },
        body: buildReviewFormData({ csrfToken: guestToken, productId: variant.product_id })
      });
      assert.strictEqual(guestRes.status, 401, 'Guest must be rejected with 401 even with valid guest CSRF token');

      // Admin -> 403 from requireCustomer
      const adminPostRes = await fetch(`${baseUrl}/account/orders/${order2Id}/reviews`, {
        method: 'POST',
        headers: { Cookie: adminSession.cookie, Accept: 'application/json', 'X-CSRF-Token': adminSession.csrfToken },
        body: buildReviewFormData({ csrfToken: adminSession.csrfToken, productId: variant.product_id })
      });
      assert.strictEqual(adminPostRes.status, 403, 'Admin must be blocked from customer review route');

      // Non-owner customer -> 400 ownership rejection
      const nonOwnerRes = await fetch(`${baseUrl}/account/orders/${order1Id}/reviews`, {
        method: 'POST',
        headers: { Cookie: cust2Session.cookie, Accept: 'application/json', 'X-CSRF-Token': cust2Session.csrfToken },
        body: buildReviewFormData({ csrfToken: cust2Session.csrfToken, productId: variant.product_id })
      });
      assert.strictEqual(nonOwnerRes.status, 400, 'Customer must not review another customer order');
      assert.strictEqual(listUploadFiles().size, beforeFiles.size, 'Auth/ownership rejections must leave zero orphan files');

      // Rating + short comment without tags/media still awards baseline 100 points
      const shortPts = loyaltyService.calculateReviewPoints({ rating: 5, comment: 'Ok', quickTags: [], hasMedia: false });
      assert.strictEqual(shortPts, 100);
    });

    console.log(`\n[CSRF MULTIPART SUITE]: ALL ${passed}/8 TESTS PASSED!`);
  } finally {
    await new Promise((resolve) => server.close(resolve));

    for (const filePath of createdUploadFiles) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (_err) {}
    }

    if (createdReviewIds.length > 0) {
      await query(`DELETE FROM review_media WHERE review_id IN (${createdReviewIds.join(',')})`);
      await query(`DELETE FROM reviews WHERE id IN (${createdReviewIds.join(',')})`);
    }
    if (createdOrderIds.length > 0) {
      await query(`DELETE FROM order_items WHERE order_id IN (${createdOrderIds.join(',')})`);
      await query(`DELETE FROM order_status_histories WHERE order_id IN (${createdOrderIds.join(',')})`);
      await query(`DELETE FROM orders WHERE id IN (${createdOrderIds.join(',')})`);
    }
    if (createdUserIds.length > 0) {
      const ids = createdUserIds.join(',');
      await query(`IF OBJECT_ID('loyalty_point_batches', 'U') IS NOT NULL DELETE FROM loyalty_point_batches WHERE user_id IN (${ids})`);
      await query(`IF OBJECT_ID('loyalty_tier_cycles', 'U') IS NOT NULL DELETE FROM loyalty_tier_cycles WHERE user_id IN (${ids})`);
      await query(`DELETE FROM point_transactions WHERE user_id IN (${ids})`);
      await query(`DELETE FROM user_points_wallets WHERE user_id IN (${ids})`);
      await query(`IF OBJECT_ID('wishlist_items', 'U') IS NOT NULL DELETE FROM wishlist_items WHERE user_id IN (${ids})`);
      await query(`DELETE FROM users WHERE id IN (${ids})`);
    }

    await closePool();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[CSRF MULTIPART TEST FAILED]:', err);
    process.exit(1);
  });
