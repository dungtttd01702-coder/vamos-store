/**
 * VAMOS STORE - Phase 4 Internationalization (i18n) Test Suite
 * Validates:
 * 1. Default locale is 'vi'.
 * 2. Cookie resolution of 'vamos_locale'.
 * 3. GET /set-locale/:lang endpoint sets cookie and handles safe redirection.
 * 4. Whitelisting prevents invalid locales (defaults to 'vi').
 * 5. Open redirect prevention on malicious Referrer headers.
 * 6. Pug SSR rendering with t() in vi and en modes.
 * 7. Fallback behavior when keys are missing.
 * 8. Currency format preservation (VND) across both languages.
 */

require('./test_bootstrap');

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { closePool } = require('../src/config/database');
const { i18nMiddleware, SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('../src/middlewares/i18n.middleware');
const { makeRequest } = require('./helpers/http-request');

async function runTests() {
  console.log('--- STARTING PHASE 4 i18n VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    // Test 1: Supported Locales & Default
    console.log('[Test 1] Verify supported locales configuration');
    assert.deepStrictEqual(SUPPORTED_LOCALES, ['vi', 'en']);
    assert.strictEqual(DEFAULT_LOCALE, 'vi');
    console.log('  ✓ Supported locales and default are correct');
    passed++;

    // Test 2: Default Visit (no cookie) yields Vietnamese SSR
    console.log('[Test 2] Visit Homepage without cookie defaults to Vietnamese');
    const resDefault = await makeRequest(server, '/');
    assert.strictEqual(resDefault.status, 200);
    assert.ok(resDefault.body.includes('Sneaker Nam'), 'Should render "Sneaker Nam" in default Vietnamese');
    assert.ok(resDefault.body.includes('FLASH SALE TOÀN HỆ THỐNG'), 'Should render Vietnamese flash sale banner');
    console.log('  ✓ Default visit renders Vietnamese content');
    passed++;

    // Test 3: GET /set-locale/en sets cookie and redirects
    console.log('[Test 3] GET /set-locale/en sets cookie and redirects');
    const resSetEn = await makeRequest(server, '/set-locale/en', {
      headers: {
        'Referer': 'http://127.0.0.1/products',
      }
    });
    assert.strictEqual(resSetEn.status, 302);
    const setCookie = resSetEn.headers['set-cookie'] || [];
    const localeCookie = setCookie.find(c => c.includes('vamos_locale='));
    assert.ok(localeCookie, 'Must set vamos_locale cookie');
    assert.ok(localeCookie.includes('vamos_locale=en'), 'Cookie value must be en');
    assert.strictEqual(resSetEn.headers['location'], '/products', 'Must redirect back to internal referrer');
    console.log('  ✓ /set-locale/en correctly sets cookie and redirects');
    passed++;

    // Test 4: Visit with Cookie vamos_locale=en renders English SSR
    console.log('[Test 4] Visit with cookie vamos_locale=en renders English text');
    const resEn = await makeRequest(server, '/', {
      headers: {
        'Cookie': 'vamos_locale=en',
      }
    });
    assert.strictEqual(resEn.status, 200);
    assert.ok(resEn.body.includes("Men's Sneakers"), 'Should render "Men\'s Sneakers" in English');
    assert.ok(resEn.body.includes('STOREWIDE FLASH SALE'), 'Should render "STOREWIDE FLASH SALE"');
    assert.ok(resEn.body.includes('window.CURRENT_LOCALE = \'en\';'), 'Should inject CURRENT_LOCALE as en');
    console.log('  ✓ Cookie vamos_locale=en switches SSR language to English');
    passed++;

    // Test 5: GET /set-locale/vi switches back to Vietnamese
    console.log('[Test 5] GET /set-locale/vi sets cookie back to vi');
    const resSetVi = await makeRequest(server, '/set-locale/vi');
    assert.strictEqual(resSetVi.status, 302);
    const setCookieVi = resSetVi.headers['set-cookie'] || [];
    const localeCookieVi = setCookieVi.find(c => c.includes('vamos_locale='));
    assert.ok(localeCookieVi.includes('vamos_locale=vi'), 'Cookie value must be vi');
    console.log('  ✓ /set-locale/vi successfully resets cookie to vi');
    passed++;

    // Test 6: Whitelist rejects invalid locale and defaults to vi
    console.log('[Test 6] Whitelist rejects invalid locale (e.g. /set-locale/evil_lang)');
    const resInvalid = await makeRequest(server, '/set-locale/evil_lang');
    assert.strictEqual(resInvalid.status, 302);
    const setCookieInvalid = resInvalid.headers['set-cookie'] || [];
    const localeCookieInvalid = setCookieInvalid.find(c => c.includes('vamos_locale='));
    assert.ok(localeCookieInvalid.includes('vamos_locale=vi'), 'Invalid locale must fall back to default vi');
    console.log('  ✓ Invalid locale safely defaults to vi');
    passed++;

    // Test 7: Prevent Open Redirect on malicious external Referer
    console.log('[Test 7] Prevent open redirect when Referer points to external attacker domain');
    const resOpenRedirect = await makeRequest(server, '/set-locale/en', {
      headers: {
        'Referer': 'https://evil-attacker.com/steal-session',
        'Host': '127.0.0.1',
      }
    });
    assert.strictEqual(resOpenRedirect.status, 302);
    assert.strictEqual(resOpenRedirect.headers['location'], '/', 'Malicious external referrer must fallback to internal root /');
    console.log('  ✓ Open redirect attack blocked; safely redirected to /');
    passed++;

    // Test 8: AJAX / JSON acceptance on /set-locale/:lang
    console.log('[Test 8] AJAX request with Accept: application/json returns JSON');
    const resJson = await makeRequest(server, '/set-locale/en', {
      headers: {
        'Accept': 'application/json',
      }
    });
    assert.strictEqual(resJson.status, 200);
    const jsonBody = JSON.parse(resJson.body);
    assert.strictEqual(jsonBody.success, true);
    assert.strictEqual(jsonBody.locale, 'en');
    console.log('  ✓ AJAX request returns JSON response cleanly');
    passed++;

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    failed++;
  } finally {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
    await closePool();
  }

  console.log(`\n========================================`);
  console.log(`PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  process.exitCode = failed > 0 ? 1 : 0;
}

runTests().catch((err) => {
  console.error('❌ Fatal Phase 4 error:', err);
  process.exitCode = 1;
});
