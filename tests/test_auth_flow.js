const { getTestCustomerCredentials } = require('./test_bootstrap');

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { closePool } = require('../src/config/database');

async function run() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST-SERVER] Running on ${baseUrl}`);

  async function request(path, options = {}) {
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

  try {
    // 1. GET /auth/login as Guest
    console.log('\n=== TEST 1: GET /auth/login as Guest ===');
    const getLoginRes = await request('/auth/login');
    console.log('Status:', getLoginRes.status); // Expect 200
    const csrfMatch = getLoginRes.body.match(/name="_csrf" value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    const guestCookie = getLoginRes.setCookie ? getLoginRes.setCookie.split(';')[0] : '';
    console.log('CSRF Token extracted:', !!csrfToken);
    console.log('Initial Cookie received:', guestCookie.split('=')[0]);

    // 2. POST /auth/login as Guest with invalid email 123@gmail
    console.log('\n=== TEST 2: POST /auth/login as Guest with 123@gmail ===');
    const postLoginInvalid = await request('/auth/login', {
      method: 'POST',
      headers: { Cookie: guestCookie },
      body: `email=123@gmail&password=123456&_csrf=${encodeURIComponent(csrfToken || '')}`,
    });
    console.log('Status:', postLoginInvalid.status); // Expect 200 (re-renders login page)
    console.log('Location:', postLoginInvalid.location); // Expect undefined (no redirect)
    console.log('Has error message:', postLoginInvalid.body.includes('không đúng định dạng'));

    // 3. POST /auth/register as Guest with invalid email 123@gmail
    console.log('\n=== TEST 3: POST /auth/register as Guest with 123@gmail ===');
    const postRegInvalid = await request('/auth/register', {
      method: 'POST',
      headers: { Cookie: guestCookie },
      body: `full_name=Nguyen+Van+A&email=123@gmail&password=123456&confirm_password=123456&_csrf=${encodeURIComponent(csrfToken || '')}`,
    });
    console.log('Status:', postRegInvalid.status); // Expect 200
    console.log('Location:', postRegInvalid.location); // Expect undefined
    console.log('Has error message:', postRegInvalid.body.includes('không đúng định dạng'));

    // 4. Log in successfully as seeded customer fixture: khachhang@vamos.vn
    const custCreds = getTestCustomerCredentials();
    console.log(`\n=== TEST 4: POST /auth/login with seeded customer ${custCreds.email} ===`);
    // First get a fresh login page and CSRF
    const getLoginForReal = await request('/auth/login');
    assert.strictEqual(getLoginForReal.status, 200, 'GET /auth/login should return 200');
    const realCsrf = getLoginForReal.body.match(/name="_csrf" value="([^"]+)"/)[1];
    assert.ok(realCsrf, 'CSRF token must exist on login page');
    const preAuthCookie = getLoginForReal.setCookie.split(';')[0];

    const postLoginValid = await request('/auth/login', {
      method: 'POST',
      headers: { Cookie: preAuthCookie },
      body: `email=${encodeURIComponent(custCreds.email)}&password=${encodeURIComponent(custCreds.password)}&_csrf=${encodeURIComponent(realCsrf)}`,
    });
    console.log('Status:', postLoginValid.status); // Expect 302
    console.log('Redirect Location:', postLoginValid.location); // Expect '/'
    assert.strictEqual(postLoginValid.status, 302, 'Valid customer login must redirect (302)');
    assert.strictEqual(postLoginValid.location, '/', 'Valid customer login must redirect to "/"');
    assert.ok(postLoginValid.setCookie && postLoginValid.setCookie.includes('vamos_sid='), 'Valid login must issue a fresh session cookie');
    const authCookie = postLoginValid.setCookie.split(';')[0];
    console.log('Session regenerated / Cookie received:', authCookie.split('=')[0]);

    // 5. While logged in as Nguyễn Văn Khách: GET /
    console.log('\n=== TEST 5: GET / while logged in ===');
    const getHomeRes = await request('/', {
      headers: { Cookie: authCookie },
    });
    assert.strictEqual(getHomeRes.status, 200, 'Authenticated GET / must return 200');
    // Check if avatar has 'N' (Nguyễn Văn Khách)
    const hasAvatarN = getHomeRes.body.includes('uppercase') && getHomeRes.body.includes('>N<');
    console.log('Rendered Avatar "N":', hasAvatarN);
    console.log('Contains user full name or email:', getHomeRes.body.includes('Thông tin tài khoản'));
    assert.ok(hasAvatarN, 'Authenticated homepage must render Customer avatar initial "N"');
    assert.ok(getHomeRes.body.includes('Thông tin tài khoản'), 'Authenticated homepage must render account menu');

    // 6. While logged in: GET /auth/login -> Expect 302 Redirect to / with Flash Warning
    console.log('\n=== TEST 6: GET /auth/login while already logged in ===');
    const getLoginWhileAuth = await request('/auth/login', {
      headers: { Cookie: authCookie },
    });
    console.log('Status:', getLoginWhileAuth.status); // Expect 302
    console.log('Redirect Location:', getLoginWhileAuth.location); // Expect '/'
    assert.strictEqual(getLoginWhileAuth.status, 302, 'GET /auth/login while authenticated must redirect');
    assert.strictEqual(getLoginWhileAuth.location, '/', 'GET /auth/login while authenticated must redirect to "/"');

    // 7. While logged in: POST /auth/login with 123@gmail -> Blocked with Flash Warning
    console.log('\n=== TEST 7: POST /auth/login with 123@gmail while already logged in ===');
    const getHomeForCsrf = await request('/', { headers: { Cookie: authCookie } });
    const authCsrf = getHomeForCsrf.body.match(/name="_csrf" value="([^"]+)"/)[1];
    assert.ok(authCsrf, 'Authenticated page must contain CSRF token');

    const postLoginWhileAuth = await request('/auth/login', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: `email=123@gmail&password=123456&_csrf=${encodeURIComponent(authCsrf)}`,
    });
    console.log('Status:', postLoginWhileAuth.status); // Expect 302 due to requireGuest
    console.log('Redirect Location:', postLoginWhileAuth.location); // Expect '/'
    assert.strictEqual(postLoginWhileAuth.status, 302, 'POST /auth/login while authenticated must redirect');
    assert.strictEqual(postLoginWhileAuth.location, '/', 'POST /auth/login while authenticated must redirect to "/"');

    // 7b. Follow redirect to / and verify Flash Warning is displayed
    const getHomeAfterRedirect = await request('/', { headers: { Cookie: authCookie } });
    const hasFlashWarning = getHomeAfterRedirect.body.includes('Bạn đang đăng nhập bằng tài khoản hiện tại. Vui lòng đăng xuất trước khi sử dụng tài khoản khác.');
    const hasAvatarNAfterRedirect = getHomeAfterRedirect.body.includes('>N<');
    console.log('Flash warning shown on homepage:', hasFlashWarning);
    console.log('Existing user session (Avatar "N") preserved:', hasAvatarNAfterRedirect);
    assert.ok(hasFlashWarning, 'Flash warning must be displayed on redirect');
    assert.ok(hasAvatarNAfterRedirect, 'Existing authenticated user session must be preserved');

    // 7c. Re-request / to verify Flash Warning is single-use (consumed and disappeared)
    const getHomeSecondTime = await request('/', { headers: { Cookie: authCookie } });
    const hasFlashOnSecondLoad = getHomeSecondTime.body.includes('Bạn đang đăng nhập bằng tài khoản hiện tại. Vui lòng đăng xuất trước khi sử dụng tài khoản khác.');
    console.log('Flash warning consumed (not shown on second load):', !hasFlashOnSecondLoad);
    assert.strictEqual(hasFlashOnSecondLoad, false, 'Flash warning must be single-use');

    // 8. While logged in: POST /auth/register with 123@gmail -> Blocked with redirect
    console.log('\n=== TEST 8: POST /auth/register with 123@gmail while already logged in ===');
    const postRegWhileAuth = await request('/auth/register', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: `full_name=Test&email=123@gmail&password=123456&confirm_password=123456&_csrf=${encodeURIComponent(authCsrf)}`,
    });
    console.log('Status:', postRegWhileAuth.status); // Expect 302 due to requireGuest
    console.log('Redirect Location:', postRegWhileAuth.location); // Expect '/'
    assert.strictEqual(postRegWhileAuth.status, 302, 'POST /auth/register while authenticated must redirect');
    assert.strictEqual(postRegWhileAuth.location, '/', 'POST /auth/register while authenticated must redirect to "/"');

    // 9. Now test Logout
    console.log('\n=== TEST 9: POST /auth/logout ===');
    // First get a fresh page with CSRF
    const getPageWithCsrf = await request('/', { headers: { Cookie: authCookie } });
    const csrfForLogout = getPageWithCsrf.body.match(/name="_csrf" value="([^"]+)"/)[1];

    const postLogoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: `_csrf=${encodeURIComponent(csrfForLogout)}`,
    });
    console.log('Status:', postLogoutRes.status); // Expect 302
    console.log('Redirect Location:', postLogoutRes.location); // Expect '/'
    console.log('Set-Cookie on logout:', postLogoutRes.setCookie); // Expect vamos_sid=; Expires=... (cleared)
    assert.strictEqual(postLogoutRes.status, 302, 'Logout must redirect (302)');
    assert.strictEqual(postLogoutRes.location, '/', 'Logout must redirect to "/"');

    // 10. Verify session destroyed after logout
    console.log('\n=== TEST 10: Verify session is destroyed after logout ===');
    const getHomeAfterLogout = await request('/', {
      headers: { Cookie: authCookie },
    });
    const hasLoginButtonAfterLogout = getHomeAfterLogout.body.includes('Đăng nhập');
    const hasAvatarNAfterLogout = getHomeAfterLogout.body.includes('>N<');
    console.log('Shows "Đăng nhập" button:', hasLoginButtonAfterLogout);
    console.log('Shows Avatar "N":', hasAvatarNAfterLogout);
    assert.ok(hasLoginButtonAfterLogout, 'Homepage after logout must show login button');
    assert.strictEqual(hasAvatarNAfterLogout, false, 'Homepage after logout must not retain user avatar');

    console.log('\n=== ALL 10 TESTS COMPLETED SUCCESSFULLY ===');
    process.exitCode = 0;
  } catch (err) {
    process.exitCode = 1;
    throw err;
  } finally {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => {
      server.close((closeErr) => {
        if (closeErr) {
          console.error('[TEST-SERVER] Close warning:', closeErr.message);
        }
        resolve();
      });
    });
    try {
      await closePool();
    } catch (poolErr) {
      console.error('[TEST-DB] Pool close warning:', poolErr.message);
    }
  }
}

run()
  .then(() => {
    process.exit(process.exitCode ?? 0);
  })
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
    process.exit(1);
  });
