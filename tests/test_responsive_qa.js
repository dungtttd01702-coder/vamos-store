/**
 * VAMOS STORE - Comprehensive Responsive QA Test Suite (Playwright)
 * Tests Desktop (1440x900), Tablet (768x1024), and Mobile (390x844)
 * Covers Guest, Customer, and Admin across 11 key pages.
 * Captures full screenshots for each viewport.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
const screenshotsDir = path.join(__dirname, '..', 'docs', 'qa', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'tablet', width: 768, height: 1024, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true }
];

const customerCredentials = {
  email: 'trungdung@gmail.com',
  password: 'password123'
};

const adminCredentials = {
  email: 'admin@vamos.vn',
  password: 'password123'
};

async function checkHorizontalOverflow(page, pageName, vpName) {
  const check = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body ? document.body.scrollWidth : docWidth;
    const winWidth = window.innerWidth;
    const maxScroll = Math.max(docWidth, bodyWidth);
    const hasOverflow = maxScroll > winWidth + 2; // 2px tolerance for subpixel rounding

    let culprits = [];
    if (hasOverflow) {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        if (rect.right > winWidth + 2 || rect.width > winWidth + 2) {
          culprits.push({
            tag: el.tagName,
            id: el.id || '',
            className: typeof el.className === 'string' ? el.className.substring(0, 80) : '',
            width: Math.round(rect.width),
            right: Math.round(rect.right)
          });
          if (culprits.length >= 3) break;
        }
      }
    }

    return {
      maxScroll,
      winWidth,
      hasOverflow,
      culprits
    };
  });

  if (check.hasOverflow) {
    console.warn(`  ⚠️ [OVERFLOW] [${vpName.toUpperCase()}] ${pageName}: scrollWidth (${check.maxScroll}px) > window (${check.winWidth}px)`);
  } else {
    console.log(`  ✔ [NO OVERFLOW] [${vpName.toUpperCase()}] ${pageName} width: ${check.winWidth}px`);
  }

  return check;
}

async function runResponsiveQA() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - PART C: RESPONSIVE QA ACROSS 3 VIEWPORTS');
  console.log('   Base URL:', baseUrl);
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n───────────────────────────────────────────────────────────────`);
    console.log(`▶ TESTING VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`───────────────────────────────────────────────────────────────`);

    const contextOptions = {
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      userAgent: vp.name === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : vp.name === 'tablet'
          ? 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    };

    // ───────────────────────────────────────────
    // 1. GUEST CONTEXT
    // ───────────────────────────────────────────
    console.log(`\n[${vp.name}] Section 1: Guest Pages`);
    const guestContext = await browser.newContext(contextOptions);
    const guestPage = await guestContext.newPage();

    // 1. Homepage
    console.log(`  - Navigating to Homepage /...`);
    await guestPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const shotHome = path.join(screenshotsDir, `${vp.name}-01-home.png`);
    await guestPage.screenshot({ path: shotHome, fullPage: false });
    const ovHome = await checkHorizontalOverflow(guestPage, 'Homepage /', vp.name);
    allResults.push({ vp: vp.name, role: 'Guest', page: 'Homepage', file: `${vp.name}-01-home.png`, overflow: ovHome.hasOverflow, details: ovHome });

    // Mobile Menu Toggle
    console.log(`  - Checking Mobile Menu Hamburger Toggle...`);
    const mobileBtn = guestPage.locator('#mobile-menu-btn');
    const isBtnVisible = await mobileBtn.isVisible();
    if (isBtnVisible) {
      try {
        // Use dispatchEvent or force click if obstructed
        await guestPage.evaluate(() => {
          const btn = document.getElementById('mobile-menu-btn');
          if (btn) btn.click();
        });
        await guestPage.waitForTimeout(300);
        const mobileMenu = guestPage.locator('#mobile-menu');
        const isMenuVisible = await mobileMenu.isVisible();
        console.log(`    Mobile menu visibility after click: ${isMenuVisible}`);
        const shotMenu = path.join(screenshotsDir, `${vp.name}-08-mobile-menu.png`);
        await guestPage.screenshot({ path: shotMenu, fullPage: false });
        allResults.push({ vp: vp.name, role: 'Guest', page: 'Mobile Menu', file: `${vp.name}-08-mobile-menu.png`, overflow: false, details: { isMenuVisible } });
        // Close menu
        await guestPage.evaluate(() => {
          const btn = document.getElementById('mobile-menu-btn');
          if (btn) btn.click();
        });
      } catch (err) {
        console.warn('    Mobile menu click warning:', err.message);
      }
    } else {
      console.log(`    Mobile menu button not visible at width ${vp.width}px (Desktop/Tablet default)`);
    }

    // 2. Catalog
    console.log(`  - Navigating to Catalog /products...`);
    await guestPage.goto(`${baseUrl}/products`, { waitUntil: 'networkidle' });
    const shotCatalog = path.join(screenshotsDir, `${vp.name}-02-catalog.png`);
    await guestPage.screenshot({ path: shotCatalog, fullPage: false });
    const ovCatalog = await checkHorizontalOverflow(guestPage, 'Catalog /products', vp.name);
    allResults.push({ vp: vp.name, role: 'Guest', page: 'Catalog', file: `${vp.name}-02-catalog.png`, overflow: ovCatalog.hasOverflow, details: ovCatalog });

    // 3. Product Detail
    console.log(`  - Navigating to Product Detail /products/giay-sneaker-nam-vamos-air-wave-v1...`);
    await guestPage.goto(`${baseUrl}/products/giay-sneaker-nam-vamos-air-wave-v1`, { waitUntil: 'networkidle' });
    const shotDetail = path.join(screenshotsDir, `${vp.name}-03-detail.png`);
    await guestPage.screenshot({ path: shotDetail, fullPage: false });
    const ovDetail = await checkHorizontalOverflow(guestPage, 'Product Detail', vp.name);
    allResults.push({ vp: vp.name, role: 'Guest', page: 'Product Detail', file: `${vp.name}-03-detail.png`, overflow: ovDetail.hasOverflow, details: ovDetail });

    // 4. Login Form
    console.log(`  - Navigating to Login /auth/login...`);
    await guestPage.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });
    const shotLogin = path.join(screenshotsDir, `${vp.name}-04-login.png`);
    await guestPage.screenshot({ path: shotLogin, fullPage: false });
    const ovLogin = await checkHorizontalOverflow(guestPage, 'Login /auth/login', vp.name);
    allResults.push({ vp: vp.name, role: 'Guest', page: 'Login', file: `${vp.name}-04-login.png`, overflow: ovLogin.hasOverflow, details: ovLogin });

    // 5. Register Form
    console.log(`  - Navigating to Register /auth/register...`);
    await guestPage.goto(`${baseUrl}/auth/register`, { waitUntil: 'networkidle' });
    const shotRegister = path.join(screenshotsDir, `${vp.name}-05-register.png`);
    await guestPage.screenshot({ path: shotRegister, fullPage: false });
    const ovRegister = await checkHorizontalOverflow(guestPage, 'Register /auth/register', vp.name);
    allResults.push({ vp: vp.name, role: 'Guest', page: 'Register', file: `${vp.name}-05-register.png`, overflow: ovRegister.hasOverflow, details: ovRegister });

    // 6. Cart
    console.log(`  - Navigating to Cart /cart...`);
    await guestPage.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle' });
    const shotCart = path.join(screenshotsDir, `${vp.name}-06-cart.png`);
    await guestPage.screenshot({ path: shotCart, fullPage: false });
    const ovCart = await checkHorizontalOverflow(guestPage, 'Cart /cart', vp.name);
    allResults.push({ vp: vp.name, role: 'Guest', page: 'Cart', file: `${vp.name}-06-cart.png`, overflow: ovCart.hasOverflow, details: ovCart });

    // 7. Wishlist Modal
    console.log(`  - Triggering Wishlist Modal on Homepage...`);
    await guestPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const wishlistBtn = guestPage.locator('#header-wishlist-btn');
    if (await wishlistBtn.isVisible()) {
      await guestPage.evaluate(() => {
        const btn = document.getElementById('header-wishlist-btn');
        if (btn) btn.click();
      });
      const modal = guestPage.locator('#vamos-wishlist-modal');
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      const shotModal = path.join(screenshotsDir, `${vp.name}-07-wishlist-modal.png`);
      await guestPage.screenshot({ path: shotModal, fullPage: false });
      console.log(`  ✔ Wishlist Modal opened. Screenshot saved: ${vp.name}-07-wishlist-modal.png`);
      allResults.push({ vp: vp.name, role: 'Guest', page: 'Wishlist Modal', file: `${vp.name}-07-wishlist-modal.png`, overflow: false, details: {} });
    }

    await guestContext.close();

    // ───────────────────────────────────────────
    // 2. CUSTOMER CONTEXT
    // ───────────────────────────────────────────
    console.log(`\n[${vp.name}] Section 2: Customer Pages`);
    const custContext = await browser.newContext(contextOptions);
    const custPage = await custContext.newPage();

    // Customer Login
    console.log(`  - Customer logging in...`);
    await custPage.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });
    await custPage.fill('input[name="email"]', customerCredentials.email);
    await custPage.fill('input[name="password"]', customerCredentials.password);
    await custPage.click('button[type="submit"]');
    await custPage.waitForLoadState('networkidle');

    // 8. Checkout COD
    console.log(`  - Navigating to Checkout /checkout...`);
    await custPage.goto(`${baseUrl}/checkout`, { waitUntil: 'networkidle' });
    const shotCheckout = path.join(screenshotsDir, `${vp.name}-09-checkout.png`);
    await custPage.screenshot({ path: shotCheckout, fullPage: false });
    const ovCheckout = await checkHorizontalOverflow(custPage, 'Checkout /checkout', vp.name);
    allResults.push({ vp: vp.name, role: 'Customer', page: 'Checkout COD', file: `${vp.name}-09-checkout.png`, overflow: ovCheckout.hasOverflow, details: ovCheckout });

    // 9. Order History
    console.log(`  - Navigating to Order History /account/orders...`);
    await custPage.goto(`${baseUrl}/account/orders`, { waitUntil: 'networkidle' });
    const shotOrders = path.join(screenshotsDir, `${vp.name}-10-account-orders.png`);
    await custPage.screenshot({ path: shotOrders, fullPage: false });
    const ovOrders = await checkHorizontalOverflow(custPage, 'Order History /account/orders', vp.name);
    allResults.push({ vp: vp.name, role: 'Customer', page: 'Order History', file: `${vp.name}-10-account-orders.png`, overflow: ovOrders.hasOverflow, details: ovOrders });

    await custContext.close();

    // ───────────────────────────────────────────
    // 3. ADMIN CONTEXT
    // ───────────────────────────────────────────
    console.log(`\n[${vp.name}] Section 3: Admin Pages`);
    const adminContext = await browser.newContext(contextOptions);
    const adminPage = await adminContext.newPage();

    // Admin Login
    console.log(`  - Admin logging in...`);
    await adminPage.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('input[name="email"]', 'admin@vamos.vn');
    await adminPage.fill('input[name="password"]', '123456');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForLoadState('networkidle');

    // 10. Admin Dashboard
    console.log(`  - Navigating to Admin Dashboard /admin/dashboard...`);
    await adminPage.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });
    const shotAdminDash = path.join(screenshotsDir, `${vp.name}-11-admin-dashboard.png`);
    await adminPage.screenshot({ path: shotAdminDash, fullPage: false });
    const ovAdminDash = await checkHorizontalOverflow(adminPage, 'Admin Dashboard', vp.name);
    allResults.push({ vp: vp.name, role: 'Admin', page: 'Admin Dashboard', file: `${vp.name}-11-admin-dashboard.png`, overflow: ovAdminDash.hasOverflow, details: ovAdminDash });

    // 11. Admin Products
    console.log(`  - Navigating to Admin Products /admin/products...`);
    await adminPage.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });
    const shotAdminProd = path.join(screenshotsDir, `${vp.name}-12-admin-products.png`);
    await adminPage.screenshot({ path: shotAdminProd, fullPage: false });
    const ovAdminProd = await checkHorizontalOverflow(adminPage, 'Admin Products', vp.name);
    allResults.push({ vp: vp.name, role: 'Admin', page: 'Admin Products', file: `${vp.name}-12-admin-products.png`, overflow: ovAdminProd.hasOverflow, details: ovAdminProd });

    // 12. Admin Orders
    console.log(`  - Navigating to Admin Orders /admin/orders...`);
    await adminPage.goto(`${baseUrl}/admin/orders`, { waitUntil: 'networkidle' });
    const shotAdminOrd = path.join(screenshotsDir, `${vp.name}-13-admin-orders.png`);
    await adminPage.screenshot({ path: shotAdminOrd, fullPage: false });
    const ovAdminOrd = await checkHorizontalOverflow(adminPage, 'Admin Orders', vp.name);
    allResults.push({ vp: vp.name, role: 'Admin', page: 'Admin Orders', file: `${vp.name}-13-admin-orders.png`, overflow: ovAdminOrd.hasOverflow });

    await adminContext.close();
  }

  await browser.close();

  console.log('\n===============================================================');
  console.log('   RESPONSIVE QA TEST COMPLETED SUCCESSFULLY');
  console.log(`   Screenshots saved to: ${screenshotsDir}`);
  console.log('===============================================================');

  const overflowIssues = allResults.filter(r => r.overflow);
  console.log(`Total Pages Inspected: ${allResults.length}`);
  console.log(`Horizontal Overflow Issues: ${overflowIssues.length}`);
  if (overflowIssues.length > 0) {
    console.warn('\nPages with Horizontal Overflow:');
    for (const issue of overflowIssues) {
      console.warn(` - [${issue.vp.toUpperCase()}] ${issue.page} (${issue.file}): scrollWidth ${issue.details.maxScroll}px > ${issue.details.winWidth}px`);
      if (issue.details.culprits) {
        console.warn(`   Culprits:`, JSON.stringify(issue.details.culprits));
      }
    }
  }

  // Save report json
  fs.writeFileSync(path.join(screenshotsDir, 'responsive_results.json'), JSON.stringify(allResults, null, 2));

  return allResults;
}

runResponsiveQA().catch(err => {
  console.error('\n✖ [ERROR] Responsive QA failed:', err);
  process.exit(1);
});
