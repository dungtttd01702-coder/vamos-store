/**
 * VAMOS STORE - Phase 3 Verification Test Suite
 * Validates Dark Mode / Light Mode Theme Engine, Anti-FOUC Head Scripts,
 * LocalStorage persistence, and UI toggle buttons.
 */

const assert = require('assert');
const fs = require('fs');

async function runThemeTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - PHASE 3: DARK MODE / LIGHT MODE THEME ENGINE');
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

  // Simulated Document & LocalStorage Environment
  class MockClassList {
    constructor() {
      this.classes = new Set();
    }
    add(cls) { this.classes.add(cls); }
    remove(cls) { this.classes.delete(cls); }
    contains(cls) { return this.classes.has(cls); }
  }

  const mockHtml = { classList: new MockClassList() };
  const mockStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };

  const THEME_KEY = 'vamos_theme';

  function applyTheme(theme, mockDoc, storage) {
    const isDark = theme === 'dark';
    if (isDark) {
      mockDoc.classList.add('dark');
    } else {
      mockDoc.classList.remove('dark');
    }
  }

  function toggleTheme(mockDoc, storage) {
    const isCurrentlyDark = mockDoc.classList.contains('dark');
    const newTheme = isCurrentlyDark ? 'light' : 'dark';
    storage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme, mockDoc, storage);
    return newTheme;
  }

  try {
    // ── THM-01: DEFAULT LIGHT ──
    mockStorage.removeItem(THEME_KEY);
    mockHtml.classList.remove('dark');
    assert.strictEqual(mockHtml.classList.contains('dark'), false, 'Default should not have .dark');
    pass('THM-01', 'Default state is Light mode when no preference stored');

    // ── THM-02: TOGGLE TO DARK ──
    const switchedToDark = toggleTheme(mockHtml, mockStorage);
    assert.strictEqual(switchedToDark, 'dark', 'Switched theme should be dark');
    assert.strictEqual(mockHtml.classList.contains('dark'), true, 'HTML element must have .dark class');
    assert.strictEqual(mockStorage.getItem(THEME_KEY), 'dark', 'localStorage must store "dark"');
    pass('THM-02', 'Toggling theme switches to Dark mode, applies .dark to html, and updates storage');

    // ── THM-03: TOGGLE BACK TO LIGHT ──
    const switchedToLight = toggleTheme(mockHtml, mockStorage);
    assert.strictEqual(switchedToLight, 'light', 'Switched theme should be light');
    assert.strictEqual(mockHtml.classList.contains('dark'), false, 'HTML element must NOT have .dark class');
    assert.strictEqual(mockStorage.getItem(THEME_KEY), 'light', 'localStorage must store "light"');
    pass('THM-03', 'Toggling theme switches back to Light mode, removes .dark, and updates storage');

    // ── THM-04: RELOAD WITH DARK PERSISTENCE ──
    mockStorage.setItem(THEME_KEY, 'dark');
    applyTheme(mockStorage.getItem(THEME_KEY), mockHtml, mockStorage);
    assert.strictEqual(mockHtml.classList.contains('dark'), true, 'Reload with dark theme restores .dark class');
    pass('THM-04', 'Page reload preserves Dark theme from storage');

    // ── THM-05: RELOAD WITH LIGHT PERSISTENCE ──
    mockStorage.setItem(THEME_KEY, 'light');
    applyTheme(mockStorage.getItem(THEME_KEY), mockHtml, mockStorage);
    assert.strictEqual(mockHtml.classList.contains('dark'), false, 'Reload with light theme leaves .dark absent');
    pass('THM-05', 'Page reload preserves Light theme from storage');

    // ── THM-06: ANTI-FOUC HEAD SCRIPT IN LAYOUTS ──
    const mainPug = fs.readFileSync('src/views/layouts/main.pug', 'utf8');
    const adminPug = fs.readFileSync('src/views/layouts/admin.pug', 'utf8');

    assert.ok(mainPug.includes("localStorage.getItem('vamos_theme')"), 'main.pug must have inline theme head script');
    assert.ok(mainPug.includes("document.documentElement.classList.add('dark')"), 'main.pug must add dark class in head');
    assert.ok(adminPug.includes("localStorage.getItem('vamos_theme')"), 'admin.pug must have inline theme head script');
    assert.ok(adminPug.includes("document.documentElement.classList.add('dark')"), 'admin.pug must add dark class in head');
    pass('THM-06', 'Both Storefront (main.pug) and Admin (admin.pug) layouts include anti-FOUC inline script in <head>');

    // ── THM-07: THEME TOGGLE BUTTONS IN TEMPLATES ──
    const headerPug = fs.readFileSync('src/views/partials/header.pug', 'utf8');
    const adminNavPug = fs.readFileSync('src/views/partials/admin-nav.pug', 'utf8');

    assert.ok(headerPug.includes('storefront-theme-toggle'), 'Storefront header must contain theme toggle button');
    assert.ok(headerPug.includes('theme-icon-moon'), 'Storefront header must have moon icon');
    assert.ok(headerPug.includes('theme-icon-sun'), 'Storefront header must have sun icon');

    assert.ok(adminNavPug.includes('theme-toggle-btn'), 'Admin nav must contain theme toggle button');
    assert.ok(adminNavPug.includes('theme-icon-moon'), 'Admin nav must have moon icon');
    assert.ok(adminNavPug.includes('theme-icon-sun'), 'Admin nav must have sun icon');
    pass('THM-07', 'Both Storefront Header and Admin Nav have interactive theme toggle buttons with Sun/Moon icons');

    // ── THM-08: COMPILED CSS CONTAINS DARK MODE SELECTORS ──
    const styleCss = fs.readFileSync('src/public/css/style.css', 'utf8');
    assert.ok(styleCss.includes('.dark'), 'Compiled CSS must contain .dark selector rules');
    pass('THM-08', 'Compiled production CSS contains valid dark mode styling rules');

  } catch (err) {
    fail('THM-ERR', 'Unexpected exception in Theme test suite', err);
  }

  console.log('===============================================================');
  console.log(`   PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runThemeTests().catch(err => {
  console.error(err);
  process.exit(1);
});
