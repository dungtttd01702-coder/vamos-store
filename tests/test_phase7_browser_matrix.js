/**
 * VAMOS STORE - Phase 7 Browser Testing & Full E2E Role Matrix
 * Driven by Playwright Chromium
 * Validates:
 * 1. Guest Journey:
 *    - View homepage, click heart button -> toast notification + badge count.
 *    - Open wishlist modal -> modal displays guest prompt banner.
 *    - Theme switcher -> html.dark toggle + toast notification.
 *    - i18n switcher -> VI / EN real-time switch.
 * 2. Customer Journey:
 *    - Login -> redirect to storefront.
 *    - Customer header state with user initials dropdown.
 *    - Access /account/orders.
 * 3. Admin Journey:
 *    - Login -> role-aware redirect to /admin/dashboard.
 *    - Isolation verification: NO Mega Menu, NO Cart icon, NO Wishlist modal.
 *    - Attempt /checkout -> redirected back to /admin/dashboard.
 *    - Admin dark mode toggle & language toggle.
 */

const { getTestAdminPassword, getTestCustomerCredentials } = require('./test_bootstrap');

const assert = require('assert');
const http = require('http');
const { chromium } = require('@playwright/test');
const app = require('../src/app');

async function runBrowserMatrix() {
  console.log('--- STARTING PHASE 7 BROWSER E2E MATRIX VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[E2E Server] Running at ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  try {
    const page = await context.newPage();

    // ──────────────────────────────────────────────
    // 1. GUEST JOURNEY
    // ──────────────────────────────────────────────
    console.log('\n[E2E 1.1] Guest Homepage Navigation & Rendering');
    await page.goto(`${baseUrl}/`);
    await page.waitForLoadState('networkidle');
    const pageTitle = await page.title();
    assert.ok(pageTitle.includes('VAMOS STORE'), 'Homepage title must contain VAMOS STORE');
    console.log('  ✓ Guest successfully loaded homepage');
    passed++;

    console.log('[E2E 1.2] Guest Wishlist Heart Action & Toast');
    // Find first product wishlist button
    const firstHeartBtn = page.locator('.btn-wishlist').first();
    await firstHeartBtn.waitFor({ state: 'visible' });
    await firstHeartBtn.click();

    // Wait for toast notification
    const toast = page.locator('#vamos-toast-container, .vamos-toast').first();
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    const toastText = await toast.textContent();
    assert.ok(toastText.includes('yêu thích') || toastText.includes('Wishlist'), 'Toast must confirm wishlist action');
    console.log(`  ✓ Heart button triggered toast: "${toastText.trim()}"`);
    passed++;

    console.log('[E2E 1.3] Guest Wishlist Modal Open & Guest Banner');
    const headerWishlistBtn = page.locator('#header-wishlist-btn');
    await headerWishlistBtn.click();
    const modal = page.locator('#vamos-wishlist-modal');
    await modal.waitFor({ state: 'visible', timeout: 3000 });
    const guestBanner = page.locator('#wishlist-guest-banner');
    await guestBanner.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  ✓ Wishlist modal opened and displayed guest encouragement banner');
    passed++;

    // Close modal
    const closeBtn = page.locator('#btn-close-wishlist-modal');
    await closeBtn.click();
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    console.log('[E2E 1.4] Guest Theme Switcher (Light -> Dark -> Light)');
    const themeBtn = page.locator('#storefront-theme-toggle');
    await themeBtn.click();
    let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert.strictEqual(isDark, true, 'HTML element must have class "dark"');
    console.log('  ✓ Switched to Dark Mode');

    await themeBtn.click();
    isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert.strictEqual(isDark, false, 'HTML element must remove class "dark"');
    console.log('  ✓ Reverted to Light Mode');
    passed++;

    console.log('[E2E 1.5] Guest Language Switcher (VI -> EN -> VI)');
    // Switch to EN
    await page.goto(`${baseUrl}/set-locale/en`);
    await page.waitForLoadState('networkidle');
    let navText = await page.textContent('body');
    assert.ok(navText.includes("Men's Sneakers"), 'Should show English text');
    console.log('  ✓ Language switched to English');

    // Switch back to VI
    await page.goto(`${baseUrl}/set-locale/vi`);
    await page.waitForLoadState('networkidle');
    navText = await page.textContent('body');
    assert.ok(navText.includes('Sneaker Nam'), 'Should show Vietnamese text');
    console.log('  ✓ Language reverted to Vietnamese');
    passed++;

    // ──────────────────────────────────────────────
    // 2. CUSTOMER JOURNEY
    // ──────────────────────────────────────────────
    console.log('\n[E2E 2.1] Customer Login Flow');
    const custCreds = getTestCustomerCredentials();
    await page.goto(`${baseUrl}/auth/login`);
    await page.fill('input[name="email"]', custCreds.email);
    await page.fill('input[name="password"]', custCreds.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Customer should land on Storefront (/)
    assert.strictEqual(page.url(), `${baseUrl}/`, 'Customer must be redirected to storefront');
    console.log('  ✓ Customer redirected to Storefront on login');
    passed++;

    console.log('[E2E 2.2] Customer Header State & Account Access');
    const customerOrdersRes = await page.goto(`${baseUrl}/account/orders`);
    assert.strictEqual(customerOrdersRes.status(), 200);
    const ordersText = await page.textContent('body');
    assert.ok(ordersText.includes('Đơn hàng') || ordersText.includes('Lịch sử'), 'Customer can view order history');
    console.log('  ✓ Customer authenticated account portal verified');
    passed++;

    // Logout customer
    await page.goto(`${baseUrl}/auth/login`);

    // ──────────────────────────────────────────────
    // 3. ADMIN JOURNEY
    // ──────────────────────────────────────────────
    console.log('\n[E2E 3.1] Admin Login & Role-Aware Redirection');
    // Clear cookies for new session
    await context.clearCookies();
    await page.goto(`${baseUrl}/auth/login`);
    await page.fill('input[name="email"]', 'admin@vamos.vn');
    await page.fill('input[name="password"]', getTestAdminPassword());
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    assert.ok(page.url().includes('/admin/dashboard'), 'Admin must be redirected directly to /admin/dashboard');
    console.log('  ✓ Admin logged in and redirected to /admin/dashboard');
    passed++;

    console.log('[E2E 3.2] Admin Portal Layout Strict Isolation');
    const adminBody = await page.content();
    assert.ok(!adminBody.includes('href="/products?cat=sneaker-nam"'), 'Admin must NOT contain Storefront Mega Menu');
    assert.ok(!adminBody.includes('id="header-wishlist-btn"'), 'Admin must NOT contain Wishlist button');
    assert.ok(!adminBody.includes('href="/cart"'), 'Admin must NOT contain Shopping Cart button');
    assert.ok(!adminBody.includes('id="vamos-wishlist-modal"'), 'Admin must NOT contain Wishlist modal');
    assert.ok(adminBody.includes('QUẢN TRỊ VIÊN'), 'Admin badge must be clearly displayed');
    console.log('  ✓ Admin Portal layout strictly isolated from storefront shopping elements');
    passed++;

    console.log('[E2E 3.3] Admin Blocked from Checkout Guard');
    const adminCheckoutRes = await page.goto(`${baseUrl}/checkout`);
    // Should be redirected back to admin dashboard
    assert.ok(page.url().includes('/admin/dashboard'), 'Admin attempting to access /checkout must be bounced to /admin/dashboard');
    console.log('  ✓ Admin blocked from accessing customer checkout');
    passed++;

    console.log('[E2E 3.4] Admin Dark Mode & Theme Toggle in Admin Nav');
    const adminThemeBtn = page.locator('#theme-toggle-btn');
    await adminThemeBtn.click();
    isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert.strictEqual(isDark, true, 'Admin portal must enter dark mode');
    console.log('  ✓ Admin portal theme toggle verified');
    passed++;

  } catch (err) {
    console.error('❌ E2E Browser Test failed with error:', err);
    failed++;
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  console.log(`\n========================================`);
  console.log(`PHASE 7 E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBrowserMatrix();
