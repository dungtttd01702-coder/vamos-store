/**
 * VAMOS STORE - WL-08 Cross-Browser Wishlist Synchronization Test
 * Validates real-time, bidirectional SQL Server wishlist synchronization
 * between two completely independent Playwright BrowserContexts (Context A and Context B).
 */

require('./test_bootstrap');

const assert = require('assert');
const { chromium } = require('@playwright/test');
const { query } = require('../src/config/database');

async function runWL08Test() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - FINAL VERIFICATION WL-08 (CROSS-BROWSER E2E)');
  console.log('===============================================================');

  const baseUrl = 'http://localhost:3000';
  const testEmail = 'trungdung@gmail.com';
  const testPassword = 'password123';

  // 1. Fetch user ID and pick a specific active product
  const uRes = await query("SELECT id FROM users WHERE email = @email", { email: testEmail });
  assert.ok(uRes.recordset.length > 0, 'Test customer must exist');
  const userId = uRes.recordset[0].id;

  const prodRes = await query("SELECT TOP 1 id, name, slug FROM products WHERE status = 'active' ORDER BY id DESC");
  assert.ok(prodRes.recordset.length > 0, 'Active product must exist');
  const testProduct = prodRes.recordset[0];
  const productId = testProduct.id;

  console.log(`[SETUP] Test User ID: ${userId} (${testEmail})`);
  console.log(`[SETUP] Test Product: ${testProduct.name} (ID: ${productId})`);

  // Initial clean-up of any previous wishlist item for this user & product
  await query("DELETE FROM wishlist_items WHERE user_id = @userId AND product_id = @productId", { userId, productId });

  // Baseline database verification: Ensure 0 records before starting
  const preCheck = await query("SELECT COUNT(*) AS total FROM wishlist_items WHERE user_id = @userId AND product_id = @productId", { userId, productId });
  assert.strictEqual(preCheck.recordset[0].total, 0, 'Pre-check: SQL Server must have 0 records');
  console.log('  ✔ [SQL STEP 0] Baseline verified: 0 records in SQL Server before test');

  // Launch Playwright Browser
  const browser = await chromium.launch({ headless: true });

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1: CONTEXT A (BROWSER 1)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[PHASE 1] Initializing Browser Context A...');
    const contextA = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome Context-A'
    });
    const pageA = await contextA.newPage();
    pageA.on('console', msg => console.log('  [BROWSER A CONSOLE]:', msg.text()));
    pageA.on('pageerror', err => console.log('  [BROWSER A ERROR]:', err.message));

    // 1. Context A: Login
    console.log('[Context A] Step 1: Navigating to /auth/login and logging in...');
    await pageA.goto(`${baseUrl}/auth/login`);
    await pageA.waitForLoadState('networkidle');
    await pageA.fill('input[name="email"]', testEmail);
    await pageA.fill('input[name="password"]', testPassword);
    await pageA.click('button[type="submit"]');
    await pageA.waitForLoadState('networkidle');
    assert.strictEqual(pageA.url(), `${baseUrl}/`, 'Context A must land on Storefront /');

    const cookiesA = await contextA.cookies();
    const sessionCookieA = cookiesA.find(c => c.name === 'vamos_sid')?.value;
    assert.ok(sessionCookieA, 'Context A must have active session cookie');
    console.log(`  ✔ [Context A] Logged in successfully. Session ID: ${sessionCookieA.substring(0, 12)}...`);

    // 2. Context A: Navigate to Catalog and add product to Wishlist
    console.log(`[Context A] Step 2: Navigating to /products and adding "${testProduct.name}" to Wishlist...`);
    await pageA.goto(`${baseUrl}/products`);
    await pageA.waitForLoadState('networkidle');

    // Find the specific product's wishlist button by data-product-id
    const heartBtnA = pageA.locator(`.btn-wishlist[data-product-id="${productId}"]`).first();
    await heartBtnA.waitFor({ state: 'visible' });

    // Click heart button and wait for the API response
    const [toggleResponseA] = await Promise.all([
      pageA.waitForResponse(resp => resp.url().includes('/api/wishlist/toggle'), { timeout: 8000 }),
      heartBtnA.click(),
    ]);
    const toggleJsonA = await toggleResponseA.json();
    console.log('  ✔ [Context A] API /api/wishlist/toggle response:', toggleJsonA);
    assert.strictEqual(toggleJsonA.success, true, 'API response success must be true');
    assert.strictEqual(toggleJsonA.action, 'added', 'API response action must be added');

    // Wait for toast notification confirming item was added
    const toastA = pageA.locator('#vamos-toast-container').first();
    await toastA.waitFor({ state: 'visible', timeout: 5000 });
    const toastTextA = await toastA.textContent();
    assert.ok(toastTextA.includes('Đã lưu') || toastTextA.includes('yêu thích'), 'Toast A must confirm added');
    console.log(`  ✔ [Context A] UI feedback confirmed: "${toastTextA.trim()}"`);

    // Verify Context A Header Badge count is 1
    const badgeA = pageA.locator('#header-wishlist-badge');
    await badgeA.waitFor({ state: 'visible', timeout: 3000 });
    const badgeCountA = await badgeA.textContent();
    assert.strictEqual(badgeCountA.trim(), '1', 'Context A badge count must be 1');
    console.log(`  ✔ [Context A] Header badge count updated to: ${badgeCountA.trim()}`);

    // Verify Heart icon in Context A has filled red state
    const isFilledA = await heartBtnA.evaluate(el => el.classList.contains('text-red-600'));
    assert.strictEqual(isFilledA, true, 'Context A heart button must have class text-red-600');
    console.log('  ✔ [Context A] Heart button filled with active state');

    // 3. SQL Server Verification after Context A addition
    console.log('\n[SQL VERIFICATION 1] Checking SQL Server database after Context A addition...');
    const sqlCheckA = await query("SELECT * FROM wishlist_items WHERE user_id = @userId AND product_id = @productId", { userId, productId });
    assert.strictEqual(sqlCheckA.recordset.length, 1, 'SQL Server must contain exactly 1 row for user & product');
    console.log(`  ✔ [SQL STEP 1] Database confirmed: Exactly 1 record found (ID: ${sqlCheckA.recordset[0].id}, user_id: ${userId}, product_id: ${productId}, created_at: ${sqlCheckA.recordset[0].created_at})`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 2: CONTEXT B (BROWSER 2 - COMPLETELY INDEPENDENT CONTEXT)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[PHASE 2] Initializing completely independent Browser Context B...');
    const contextB = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Context-B'
    });
    const pageB = await contextB.newPage();
    pageB.on('console', msg => console.log('  [BROWSER B CONSOLE]:', msg.text()));
    pageB.on('pageerror', err => console.log('  [BROWSER B ERROR]:', err.message));

    // Verify Context B starts completely blank with 0 cookies
    const initialCookiesB = await contextB.cookies();
    assert.strictEqual(initialCookiesB.length, 0, 'Context B must start with zero cookies');
    console.log('  ✔ [Context B] Isolation verified: Context B has 0 initial cookies (no cookie sharing)');

    // 1. Context B: Independent login
    console.log('[Context B] Step 1: Performing independent login with same Customer account...');
    await pageB.goto(`${baseUrl}/auth/login`);
    await pageB.waitForLoadState('networkidle');
    await pageB.fill('input[name="email"]', testEmail);
    await pageB.fill('input[name="password"]', testPassword);
    await pageB.click('button[type="submit"]');
    await pageB.waitForLoadState('networkidle');
    assert.strictEqual(pageB.url(), `${baseUrl}/`, 'Context B must land on Storefront /');

    const cookiesB = await contextB.cookies();
    const sessionCookieB = cookiesB.find(c => c.name === 'vamos_sid')?.value;
    assert.ok(sessionCookieB, 'Context B must have its own session cookie');
    assert.notStrictEqual(sessionCookieB, sessionCookieA, 'Context B session ID must be DIFFERENT from Context A session ID');
    console.log(`  ✔ [Context B] Logged in independently. Session ID: ${sessionCookieB.substring(0, 12)}... (Different from Context A)`);

    // 2. Context B: Check Header Badge & Open Modal
    console.log('[Context B] Step 2: Verifying Wishlist synchronization on Context B...');
    const badgeB = pageB.locator('#header-wishlist-badge');
    await badgeB.waitFor({ state: 'visible', timeout: 4000 });
    const badgeCountB = await badgeB.textContent();
    assert.strictEqual(badgeCountB.trim(), '1', 'Context B badge count must automatically reflect the item added in Context A');
    console.log(`  ✔ [Context B] Header badge automatically loaded 1 item from SQL Server`);

    // Open Wishlist Modal in Context B
    const headerWishlistBtnB = pageB.locator('#header-wishlist-btn');
    await headerWishlistBtnB.click();
    const modalB = pageB.locator('#vamos-wishlist-modal');
    await modalB.waitFor({ state: 'visible', timeout: 3000 });

    // Verify product appears in Context B modal
    const modalContainerB = pageB.locator('#wishlist-items-container');
    await modalContainerB.waitFor({ state: 'visible', timeout: 3000 });
    const modalTextB = await modalContainerB.textContent();
    assert.ok(modalTextB.includes(testProduct.name), 'Context B modal must display product added in Context A');
    console.log(`  ✔ [Context B] Wishlist Modal rendered product from SQL Server: "${testProduct.name}"`);

    // Verify modal count badge in Context B
    const modalCountBadgeB = pageB.locator('#wishlist-modal-count');
    const modalCountTextB = await modalCountBadgeB.textContent();
    assert.ok(modalCountTextB.includes('1'), 'Context B modal count must show 1 món');
    console.log(`  ✔ [Context B] Modal count badge verified: "${modalCountTextB.trim()}"`);

    // 3. Context B: Page Reload Persistence
    console.log('[Context B] Step 3: Reloading Context B page to verify persistent hydration...');
    await pageB.reload();
    await pageB.waitForLoadState('networkidle');
    await badgeB.waitFor({ state: 'visible', timeout: 4000 });
    assert.strictEqual((await badgeB.textContent()).trim(), '1', 'Context B badge must still be 1 after reload');
    console.log('  ✔ [Context B] Page reload retains 1 item from SQL Server');

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 3: REVERSE SYNCHRONIZATION (CONTEXT B REMOVES -> CONTEXT A REFLECTS)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[PHASE 3] Reverse Synchronization: Context B removes product...');
    // Open modal in Context B and click remove button
    await headerWishlistBtnB.click();
    await modalB.waitFor({ state: 'visible', timeout: 3000 });

    const removeBtnB = pageB.locator(`.btn-remove-wishlist-item[data-id="${productId}"]`).first();
    await removeBtnB.waitFor({ state: 'visible', timeout: 3000 });

    const [removeResponseB] = await Promise.all([
      pageB.waitForResponse(resp => resp.url().includes('/api/wishlist/items') && resp.request().method() === 'DELETE', { timeout: 8000 }),
      removeBtnB.click(),
    ]);
    const removeJsonB = await removeResponseB.json();
    console.log('  ✔ [Context B] API DELETE response:', removeJsonB);
    assert.strictEqual(removeJsonB.success, true, 'API DELETE response must be success');

    // Verify toast notification in Context B
    const toastRemoveB = pageB.locator('#vamos-toast-container').first();
    await toastRemoveB.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  ✔ [Context B] Removed product from Wishlist Modal');

    // Verify empty state displayed in Context B modal
    const emptyStateB = pageB.locator('#wishlist-empty-state');
    await emptyStateB.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  ✔ [Context B] Modal updated to empty state');

    // 4. SQL Server Verification after Context B removal
    console.log('\n[SQL VERIFICATION 2] Checking SQL Server database after Context B removal...');
    const sqlCheckB = await query("SELECT COUNT(*) AS total FROM wishlist_items WHERE user_id = @userId AND product_id = @productId", { userId, productId });
    assert.strictEqual(sqlCheckB.recordset[0].total, 0, 'SQL Server must have 0 records after Context B removal');
    console.log('  ✔ [SQL STEP 2] Database confirmed: 0 records in SQL Server');

    // 5. Context A: Reload and verify removal reflects in Context A
    console.log('\n[PHASE 4] Verifying Context A reflects removal upon reload...');
    await pageA.reload();
    await pageA.waitForLoadState('networkidle');

    // Badge in Context A should now be hidden or 0
    const badgeAAfter = pageA.locator('#header-wishlist-badge');
    const isBadgeHiddenA = await badgeAAfter.evaluate(el => el.classList.contains('hidden'));
    assert.strictEqual(isBadgeHiddenA, true, 'Context A badge must be hidden (0 items) after Context B removed it');
    console.log('  ✔ [Context A] Header badge updated to 0 (hidden)');

    // In Catalog page on Context A, heart button should be unselected
    await pageA.goto(`${baseUrl}/products`);
    await pageA.waitForLoadState('networkidle');
    const heartBtnAAfter = pageA.locator(`.btn-wishlist[data-product-id="${productId}"]`).first();
    await heartBtnAAfter.waitFor({ state: 'visible' });
    const isFilledAAfter = await heartBtnAAfter.evaluate(el => el.classList.contains('text-red-600'));
    assert.strictEqual(isFilledAAfter, false, 'Context A heart button must revert to unselected text-slate-400');
    console.log('  ✔ [Context A] Heart button reverted to unselected state');

    // Cleanup contexts
    await contextA.close();
    await contextB.close();

    // Final clean database check
    await query("DELETE FROM wishlist_items WHERE user_id = @userId AND product_id = @productId", { userId, productId });
    console.log('\n[CLEANUP] Cleaned test record from SQL Server.');

    console.log('===============================================================');
    console.log('   🎉 WL-08 CROSS-BROWSER SYNCHRONIZATION: 100% VERIFIED PASS!');
    console.log('===============================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n✖ [FAIL] WL-08 Verification Error:', err);
    await browser.close();
    // Safety cleanup
    try {
      await query("DELETE FROM wishlist_items WHERE user_id = @userId AND product_id = @productId", { userId, productId });
    } catch (_) {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runWL08Test().catch(e => {
  console.error(e);
  process.exit(1);
});
