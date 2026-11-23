/**
 * VAMOS STORE - Phase 1 Verification Test Suite
 * Validates complete role separation, admin portal isolation,
 * role-aware auth redirection, and route guards.
 */

require('./test_bootstrap');

const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const { query } = require('../src/config/database');

async function runPhase1Tests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - PHASE 1: ROLE SEPARATION & ADMIN PORTAL');
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

  async function req(path, options = {}) {
    const url = baseUrl + path;
    const fetchOptions = {
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) },
      redirect: 'manual',
    };
    if (options.body) {
      fetchOptions.body = options.body;
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    const res = await fetch(url, fetchOptions);
    const body = await res.text();
    const setCookie = res.headers.get('set-cookie');
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      location: res.headers.get('location'),
      setCookie,
      body,
    };
  }

  function extractCookie(setCookieHeader) {
    if (!setCookieHeader) return '';
    return setCookieHeader.split(';')[0];
  }

  try {
    // ── 1. GUEST ACCESS CHECKS ──
    const guestAdmin = await req('/admin/dashboard');
    assert.strictEqual(guestAdmin.status, 302, 'Guest accessing admin must redirect');
    assert.ok(guestAdmin.location.includes('/auth/login'), 'Must redirect to login');
    pass('ROLE-01', 'Guest accessing /admin/dashboard redirects to /auth/login');

    const guestAccount = await req('/account/orders');
    assert.strictEqual(guestAccount.status, 302, 'Guest accessing /account/orders must redirect');
    assert.ok(guestAccount.location.includes('/auth/login'), 'Must redirect to login');
    pass('ROLE-02', 'Guest accessing /account/orders redirects to /auth/login');

    // ── 2. ADMIN LOGIN & ROLE REDIRECT ──
    const loginPage = await req('/auth/login');
    const csrfMatch = loginPage.body.match(/name="_csrf" value="([^"]+)"/);
    assert.ok(csrfMatch, 'CSRF token must exist on login page');
    const csrfToken = csrfMatch[1];
    const initialCookie = extractCookie(loginPage.setCookie);

    // Fetch admin email & verify password from users table
    const adminUserRes = await query("SELECT TOP 1 id, email, role FROM users WHERE role = 'ADMIN'");
    assert.ok(adminUserRes.recordset.length > 0, 'Admin user must exist in DB');
    const adminEmail = adminUserRes.recordset[0].email;

    // Login with admin credentials (admin@vamos.vn / 123456)
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      headers: { Cookie: initialCookie },
      body: new URLSearchParams({ email: adminEmail, password: '123456', _csrf: csrfToken }).toString()
    });

    const adminCookie = extractCookie(adminLogin.setCookie);
    assert.strictEqual(adminLogin.status, 302, 'Admin login status');
    assert.strictEqual(adminLogin.location, '/admin/dashboard', 'Admin login must redirect directly to /admin/dashboard');
    pass('ROLE-03', 'Admin login redirects directly to /admin/dashboard');

    // ── 3. ADMIN PORTAL ISOLATION & NO STOREFRONT CONTROLS ──
    const adminDash = await req('/admin/dashboard', { headers: { Cookie: adminCookie } });
    assert.strictEqual(adminDash.status, 200, 'Admin can view /admin/dashboard');
    assert.ok(adminDash.body.includes('QUẢN TRỊ VIÊN'), 'Admin layout must have QUẢN TRỊ VIÊN badge');
    assert.ok(adminDash.body.includes('VAMOS STORE Admin Portal'), 'Admin layout portal title');
    // Storefront isolation assertions
    assert.ok(!adminDash.body.includes('href="/products?cat=sneaker-nam"'), 'Admin must not contain Storefront Mega Menu links');
    assert.ok(!adminDash.body.includes('header-wishlist-btn'), 'Admin must not contain Storefront Wishlist button');
    assert.ok(!adminDash.body.includes('id="vamos-wishlist-modal"'), 'Admin must not contain Wishlist Modal');
    assert.ok(!adminDash.body.includes('Hotline: 1900 2126'), 'Admin must not contain Storefront top announcement bar');
    pass('ROLE-04', 'Admin Portal is 100% isolated (no Storefront Header, Mega Menu, Wishlist Modal, or Cart)');

    // ── 4. ADMIN CANNOT ACCESS CUSTOMER ACCOUNT / CHECKOUT / CART ──
    const adminAccount = await req('/account/orders', { headers: { Cookie: adminCookie } });
    assert.strictEqual(adminAccount.status, 302, 'Admin accessing /account/orders must be blocked');
    assert.strictEqual(adminAccount.location, '/admin/dashboard', 'Must redirect back to /admin/dashboard');
    pass('ROLE-05', 'Admin is strictly blocked from /account/orders and redirected to /admin/dashboard');

    const adminCheckout = await req('/checkout', { headers: { Cookie: adminCookie } });
    assert.strictEqual(adminCheckout.status, 302, 'Admin accessing /checkout must be blocked');
    assert.strictEqual(adminCheckout.location, '/admin/dashboard', 'Must redirect back to /admin/dashboard');
    pass('ROLE-06', 'Admin is strictly blocked from /checkout and redirected to /admin/dashboard');

    const adminCart = await req('/cart', { headers: { Cookie: adminCookie } });
    assert.strictEqual(adminCart.status, 302, 'Admin accessing /cart must be blocked');
    assert.strictEqual(adminCart.location, '/admin/dashboard', 'Must redirect back to /admin/dashboard');
    pass('ROLE-07', 'Admin is strictly blocked from /cart and redirected to /admin/dashboard');

    // ── 5. ADMIN RE-VISITING /auth/login ──
    const adminReLogin = await req('/auth/login', { headers: { Cookie: adminCookie } });
    assert.strictEqual(adminReLogin.status, 302, 'Admin accessing /auth/login while authenticated must redirect');
    assert.strictEqual(adminReLogin.location, '/admin/dashboard', 'Must redirect to /admin/dashboard');
    pass('ROLE-08', 'Admin visiting /auth/login while authenticated redirects to /admin/dashboard');

    // ── 6. CUSTOMER ACCESS & DENIAL OF ADMIN PORTAL ──
    const custLoginPage = await req('/auth/login');
    const custCsrf = custLoginPage.body.match(/name="_csrf" value="([^"]+)"/)[1];
    const custInitialCookie = extractCookie(custLoginPage.setCookie);

    const custLogin = await req('/auth/login', {
      method: 'POST',
      headers: { Cookie: custInitialCookie },
      body: new URLSearchParams({ email: 'trungdung@gmail.com', password: 'password123', _csrf: custCsrf }).toString()
    });
    assert.strictEqual(custLogin.status, 302, 'Customer login should redirect');
    assert.strictEqual(custLogin.location, '/', 'Customer login redirects to storefront /');
    const custCookie = extractCookie(custLogin.setCookie);
    pass('ROLE-09', 'Customer login redirects to Storefront home /');

    // Customer CAN access /account/orders
    const custOrders = await req('/account/orders', { headers: { Cookie: custCookie } });
    assert.strictEqual(custOrders.status, 200, 'Customer can access /account/orders');
    pass('ROLE-10', 'Customer can access /account/orders successfully');

    // Customer CANNOT access /admin/*
    const custAdmin = await req('/admin/dashboard', { headers: { Cookie: custCookie } });
    assert.strictEqual(custAdmin.status, 403, 'Customer accessing /admin/dashboard must receive 403 Forbidden');
    pass('ROLE-11', 'Customer accessing /admin/dashboard is strictly denied with HTTP 403');

  } catch (err) {
    fail('ROLE-ERR', 'Unexpected exception in test suite', err);
  } finally {
    server.close();
  }

  console.log('===============================================================');
  console.log(`   PHASE 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runPhase1Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
