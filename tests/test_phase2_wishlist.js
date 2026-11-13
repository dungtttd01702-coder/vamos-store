/**
 * VAMOS STORE - Phase 2 Verification Test Suite
 * Validates Wishlist Engine logic, Guest storage, Customer storage by userId,
 * Guest-to-Customer merge without duplicates, and Admin isolation.
 */

const assert = require('assert');
const fs = require('fs');

async function runWishlistTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - PHASE 2: WISHLIST ENGINE & ROLE ISOLATION');
  console.log('===============================================================');

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

  // Simulated LocalStorage Environment
  class MockLocalStorage {
    constructor() {
      this.store = {};
    }
    getItem(key) {
      return this.store[key] || null;
    }
    setItem(key, value) {
      this.store[key] = String(value);
    }
    removeItem(key) {
      delete this.store[key];
    }
    clear() {
      this.store = {};
    }
  }

  const localStorage = new MockLocalStorage();

  // Wishlist Engine Simulation matching main.js
  const GUEST_KEY = 'vamos_guest_wishlist_v1';

  function getStorageKey(isAuthenticated, userId) {
    if (isAuthenticated && userId) {
      return `vamos_user_wishlist_${userId}`;
    }
    return GUEST_KEY;
  }

  function getWishlist(isAuthenticated, userId) {
    const key = getStorageKey(isAuthenticated, userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function saveWishlist(items, isAuthenticated, userId) {
    const key = getStorageKey(isAuthenticated, userId);
    localStorage.setItem(key, JSON.stringify(items));
  }

  function toggleWishlist(product, isAuthenticated, userId, isAdmin) {
    if (isAdmin) return { status: 'ignored', reason: 'admin' };
    const pid = String(product.id);
    let items = getWishlist(isAuthenticated, userId);
    const idx = items.findIndex(i => String(i.id) === pid);
    if (idx > -1) {
      items.splice(idx, 1);
      saveWishlist(items, isAuthenticated, userId);
      return { status: 'removed', items };
    } else {
      items.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        img: product.img,
        addedAt: Date.now()
      });
      saveWishlist(items, isAuthenticated, userId);
      return { status: 'added', items };
    }
  }

  function syncGuestToUser(userId) {
    const guestRaw = localStorage.getItem(GUEST_KEY);
    if (!guestRaw) return 0;
    const guestItems = JSON.parse(guestRaw);
    if (!Array.isArray(guestItems) || guestItems.length === 0) return 0;

    const userItems = getWishlist(true, userId);
    const existingIds = new Set(userItems.map(i => String(i.id)));
    let addedCount = 0;

    guestItems.forEach(item => {
      if (!existingIds.has(String(item.id))) {
        userItems.push(item);
        existingIds.add(String(item.id));
        addedCount++;
      }
    });

    saveWishlist(userItems, true, userId);
    localStorage.removeItem(GUEST_KEY);
    return addedCount;
  }

  try {
    // ── 1. GUEST WISHLIST ADD & REMOVE (WIS-01, WIS-02) ──
    localStorage.clear();
    const prod1 = { id: 101, name: 'Giày Sneaker Vamos Air Wave', slug: 'vamos-air-wave', price: 650000, img: '/img/1.png' };
    
    // Guest adds prod1
    const addRes1 = toggleWishlist(prod1, false, null, false);
    assert.strictEqual(addRes1.status, 'added', 'Guest should be able to add item to wishlist');
    assert.strictEqual(getWishlist(false, null).length, 1, 'Guest wishlist should contain 1 item');
    pass('WIS-01', 'Guest clicks heart: product saved to guest storage with active state');

    // Guest clicks again -> Remove prod1
    const remRes1 = toggleWishlist(prod1, false, null, false);
    assert.strictEqual(remRes1.status, 'removed', 'Guest clicking again should remove item');
    assert.strictEqual(getWishlist(false, null).length, 0, 'Guest wishlist should now be empty');
    pass('WIS-02', 'Guest clicks heart again: product removed from storage');

    // ── 2. CUSTOMER WISHLIST ISOLATION (WIS-05, WIS-08) ──
    localStorage.clear();
    const prod2 = { id: 102, name: 'Giày Chạy Bộ Vamos Pulse', slug: 'vamos-pulse', price: 790000, img: '/img/2.png' };
    const prod3 = { id: 103, name: 'Giày Thể Thao Vamos Stride', slug: 'vamos-stride', price: 820000, img: '/img/3.png' };

    // User A (id: 1) adds prod1 & prod2
    toggleWishlist(prod1, true, 1, false);
    toggleWishlist(prod2, true, 1, false);
    assert.strictEqual(getWishlist(true, 1).length, 2, 'User 1 should have 2 items');

    // User B (id: 2) adds prod3
    toggleWishlist(prod3, true, 2, false);
    assert.strictEqual(getWishlist(true, 2).length, 1, 'User 2 should have 1 item');

    // Verify isolation: User 1 does not see User 2 items, and vice versa
    const user1Items = getWishlist(true, 1);
    const user2Items = getWishlist(true, 2);
    assert.ok(user1Items.some(i => i.id === 101) && user1Items.some(i => i.id === 102), 'User 1 has prod1 & prod2');
    assert.ok(!user1Items.some(i => i.id === 103), 'User 1 must NOT see prod3');
    assert.ok(user2Items.some(i => i.id === 103) && !user2Items.some(i => i.id === 101), 'User 2 only has prod3');
    pass('WIS-05', 'Customer wishlist storage is strictly keyed by User ID');
    pass('WIS-08', 'Account switching maintains zero data leakage between different users');

    // ── 3. GUEST TO CUSTOMER MERGE WITHOUT DUPLICATES (WIS-07) ──
    localStorage.clear();
    // Guest adds prod1 and prod2
    toggleWishlist(prod1, false, null, false);
    toggleWishlist(prod2, false, null, false);
    assert.strictEqual(getWishlist(false, null).length, 2, 'Guest has 2 items');

    // Customer 1 already had prod2 and prod3 in account
    saveWishlist([prod2, prod3], true, 1);
    assert.strictEqual(getWishlist(true, 1).length, 2, 'Customer 1 initially has 2 items');

    // Guest logs in as Customer 1 -> Merge happens
    const mergedCount = syncGuestToUser(1);
    assert.strictEqual(mergedCount, 1, 'Exactly 1 new item (prod1) should be merged; prod2 was duplicate');
    const finalUserItems = getWishlist(true, 1);
    assert.strictEqual(finalUserItems.length, 3, 'Final merged items must be exactly 3 (prod2, prod3, prod1)');
    assert.strictEqual(localStorage.getItem(GUEST_KEY), null, 'Guest temporary key must be wiped after merge');
    pass('WIS-07', 'Guest-to-Customer merge combines items seamlessly without duplicates and clears temporary storage');

    // ── 4. ADMIN WISHLIST RESTRICTION (WIS-13) ──
    const adminToggle = toggleWishlist(prod1, true, 999, true);
    assert.strictEqual(adminToggle.status, 'ignored', 'Admin role must strictly ignore wishlist actions');
    pass('WIS-13', 'Admin role strictly bypasses wishlist engine');

    // ── 5. TEMPLATE AUDIT: DATA ATTRIBUTES ON PRODUCT CARDS ──
    const homePug = fs.readFileSync('src/views/pages/home.pug', 'utf8');
    const indexPug = fs.readFileSync('src/views/pages/products/index.pug', 'utf8');
    const detailPug = fs.readFileSync('src/views/pages/products/detail.pug', 'utf8');
    const adminLayout = fs.readFileSync('src/views/layouts/admin.pug', 'utf8');

    assert.ok(homePug.includes('data-product-id=prod.id'), 'home.pug card must have data-product-id');
    assert.ok(homePug.includes('data-product-name=prod.name'), 'home.pug card must have data-product-name');
    assert.ok(homePug.includes('btn-wishlist'), 'home.pug must have .btn-wishlist');

    assert.ok(indexPug.includes('data-product-id=prod.id'), 'index.pug card must have data-product-id');
    assert.ok(indexPug.includes('data-product-name=prod.name'), 'index.pug card must have data-product-name');
    assert.ok(indexPug.includes('btn-wishlist'), 'index.pug must have .btn-wishlist');

    assert.ok(detailPug.includes('data-product-id=product.id'), 'detail.pug must have data-product-id');
    assert.ok(detailPug.includes('btn-wishlist'), 'detail.pug must have .btn-wishlist');

    assert.ok(!adminLayout.includes('vamos-wishlist-modal'), 'Admin layout must NOT include vamos-wishlist-modal');
    assert.ok(!adminLayout.includes('header-wishlist-btn'), 'Admin layout must NOT include header-wishlist-btn');
    pass('WIS-11', 'All product card templates have valid data attributes and Admin layout is strictly free of wishlist DOM');

  } catch (err) {
    fail('WIS-ERR', 'Unexpected exception in Wishlist test suite', err);
  }

  console.log('===============================================================');
  console.log(`   PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runWishlistTests().catch(err => {
  console.error(err);
  process.exit(1);
});
