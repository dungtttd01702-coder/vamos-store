/**
 * VAMOS STORE — MEDIUM-05 Zero-DB Timezone Standardization & ICT Display Unit Tests
 * Covers: TC02 (config/static), TC05-TC08 (TZ=UTC vs TZ=Asia/Ho_Chi_Minh),
 *         TC09-TC14 (Admin voucher ICT calendar parsing & fallbacks),
 *         TC27-TC30 (Order code VAMYYMMDD boundaries),
 *         TC31-TC33 (Pug SSR ICT rendering & Admin/Customer parity).
 */

require('./test_bootstrap');

const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');

const appConfig = require('../src/config/app.config');
const dbConfig = require('../src/config/database');
const adminController = require('../src/controllers/admin.controller');
const dateTime = require('../src/utils/dateTime');
const { createSuiteRunner } = require('./helpers/loyalty-test-helpers');

function listFilesRecursive(dirPath, out = []) {
  for (const entry of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, entry);
    if (fs.statSync(full).isDirectory()) {
      listFilesRecursive(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const { test, asyncTest, assertSummary } = createSuiteRunner('VAMOS STORE - MEDIUM-05 TIMEZONE & ICT DISPLAY UNIT TESTS');

  // --- TC02 & Static/Config Guard ---
  test('TC02-STATIC: app.config.js sets useUTC: true and src/ contains zero GETDATE() SQL calls', () => {
    assert.strictEqual(appConfig.db.options.useUTC, true, 'app.config.js db.options.useUTC must be true');

    const srcRoot = path.resolve(__dirname, '../src');
    const srcFiles = listFilesRecursive(srcRoot);
    for (const filePath of srcFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(
        !/\bGETDATE\s*\(/i.test(content),
        `Forbidden GETDATE() found in ${path.relative(srcRoot, filePath)}`
      );
      if (filePath.endsWith('.pug')) {
        assert.ok(
          !/new\s+Date\([^)]*\)\s*\.toLocale(?:String|DateString)\(\s*['"]vi-VN['"]\s*\)/.test(content),
          `Timezone-less vi-VN date formatting found in ${path.relative(srcRoot, filePath)}`
        );
      }
    }
  });

  // --- TC05-TC08: Process Timezone Independence (TZ=UTC vs TZ=Asia/Ho_Chi_Minh vs TZ=America/New_York) ---
  test('TC05-TC08: Date conversion, order prefix & ICT display remain identical across TZ=UTC, TZ=Asia/Ho_Chi_Minh & America/New_York', () => {
    const probeScript = [
      "const dt = require('./src/utils/dateTime');",
      "const sampleUtc = '2026-11-26T10:30:00.000Z';", // 17:30:00 ICT (must NEVER flip to 27/11/2026!)
      "const parsed = dt.parseVietnameseDateInput('2026-11-26');",
      'console.log(JSON.stringify({',
      '  start: parsed.startUtc.toISOString(),',
      '  endExcl: parsed.endExclusiveUtc.toISOString(),',
      "  cal: dt.getVietnameseCalendarDate('2026-11-26T18:00:00.000Z'),", // 01:00 ICT on 27/11
      "  prefix: dt.getVietnameseOrderDatePrefix('2026-11-26T18:00:00.000Z'),",
      '  fmtDate: dt.formatVietnameseDate(sampleUtc),',
      '  fmtDt: dt.formatVietnameseDateTime(sampleUtc),',
      '  fmtVoucherEnd: dt.formatVietnameseVoucherEnd(parsed.endExclusiveUtc)',
      '}));'
    ].join('\n');

    const runInTz = (tz) => {
      const out = execFileSync(process.execPath, ['-e', probeScript], {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env, TZ: tz },
        encoding: 'utf8'
      });
      return JSON.parse(out.trim());
    };

    const utcRes = runInTz('UTC');
    const vnRes = runInTz('Asia/Ho_Chi_Minh');
    const nyRes = runInTz('America/New_York');

    assert.deepStrictEqual(utcRes, vnRes, 'TZ=UTC and TZ=Asia/Ho_Chi_Minh outputs must match identically');
    assert.deepStrictEqual(utcRes, nyRes, 'TZ=UTC and TZ=America/New_York outputs must match identically');

    assert.strictEqual(utcRes.start, '2026-11-25T17:00:00.000Z');
    assert.strictEqual(utcRes.endExcl, '2026-11-26T17:00:00.000Z');
    assert.strictEqual(utcRes.cal, '2026-11-27');
    assert.strictEqual(utcRes.prefix, '261127');
    assert.strictEqual(utcRes.fmtDate, '26/11/2026');
    assert.strictEqual(utcRes.fmtDt, '17:30 26/11/2026');
    assert.strictEqual(utcRes.fmtVoucherEnd, '23:59 26/11/2026');
  });

  // --- TC09-TC14: Admin Voucher Date Parsing, Validation & Fallbacks ---
  await asyncTest('TC09-TC14: parseVietnameseDateInput & postCreateVoucher convert ICT date boundaries and handle empty defaults', async () => {
    const pSame = dateTime.parseVietnameseDateInput('2026-11-26');
    assert.strictEqual(pSame.startUtc.toISOString(), '2026-11-25T17:00:00.000Z');
    assert.strictEqual(pSame.endExclusiveUtc.toISOString(), '2026-11-26T17:00:00.000Z');
    assert.strictEqual(
      pSame.endExclusiveUtc.getTime() - pSame.startUtc.getTime(),
      24 * 60 * 60 * 1000,
      'Single-day voucher must span exactly 24h ICT window'
    );

    // Year-end rollover & leap-day rollover
    const pDec31 = dateTime.parseVietnameseDateInput('2026-12-31');
    assert.strictEqual(pDec31.startUtc.toISOString(), '2026-12-30T17:00:00.000Z');
    assert.strictEqual(pDec31.endExclusiveUtc.toISOString(), '2026-12-31T17:00:00.000Z');

    const pFeb29 = dateTime.parseVietnameseDateInput('2024-02-29');
    assert.strictEqual(pFeb29.startUtc.toISOString(), '2024-02-28T17:00:00.000Z');
    assert.strictEqual(pFeb29.endExclusiveUtc.toISOString(), '2024-02-29T17:00:00.000Z');

    assert.throws(() => dateTime.parseVietnameseDateInput('2026-02-30'), /không tồn tại/);
    assert.throws(() => dateTime.parseVietnameseDateInput('26/11/2026'), /YYYY-MM-DD/);

    // Mock dbConfig.query for postCreateVoucher
    const origQuery = dbConfig.query;
    const origPool = dbConfig.getPool;
    const inserted = [];
    const fakeQuery = async (_sqlText, params) => {
      inserted.push(params);
      return { recordset: [] };
    };
    dbConfig.query = fakeQuery;
    // Patch cached module binding used by admin.controller
    const adminCtrlPath = require.resolve('../src/controllers/admin.controller');
    require.cache[adminCtrlPath] = undefined;
    dbConfig.query = fakeQuery;
    const freshAdminController = require('../src/controllers/admin.controller');

    try {
      // TC09/TC10/TC11/TC12: Same-day voucher through postCreateVoucher
      let redirectedUrl = null;
      await freshAdminController.postCreateVoucher(
        {
          body: {
            code: 'FLASH1126',
            name: 'Flash Sale 26/11',
            discount_type: 'fixed_amount',
            discount_value: '50000',
            start_date: '2026-11-26',
            end_date: '2026-11-26'
          }
        },
        { redirect: (u) => { redirectedUrl = u; } },
        (err) => { throw err; }
      );
      assert.strictEqual(redirectedUrl, '/admin/vouchers?success=created');
      assert.strictEqual(inserted[0].startDate.toISOString(), '2026-11-25T17:00:00.000Z');
      assert.strictEqual(inserted[0].endDate.toISOString(), '2026-11-26T17:00:00.000Z');

      // TC13/TC14: Empty dates fallback to [nowUtc, nowUtc + 30 days]
      const beforeMs = Date.now();
      await freshAdminController.postCreateVoucher(
        {
          body: {
            code: 'DEFAULT30',
            name: 'Default 30d',
            discount_type: 'fixed_amount',
            discount_value: '30000',
            start_date: '',
            end_date: ''
          }
        },
        { redirect: () => {} },
        (err) => { throw err; }
      );
      const afterMs = Date.now();
      const emptyVoucher = inserted[1];
      assert.ok(
        emptyVoucher.startDate.getTime() >= beforeMs - 50 && emptyVoucher.startDate.getTime() <= afterMs + 50,
        'Empty start_date must default to current UTC instant'
      );
      assert.strictEqual(
        emptyVoucher.endDate.getTime() - emptyVoucher.startDate.getTime(),
        30 * 24 * 60 * 60 * 1000,
        'Empty end_date must default to nowUtc + 30 days'
      );

      // Reject end_date earlier than start_date
      let caughtErr = null;
      await freshAdminController.postCreateVoucher(
        {
          body: {
            code: 'INVALID',
            discount_type: 'fixed_amount',
            discount_value: '10000',
            start_date: '2026-12-01',
            end_date: '2026-11-30'
          }
        },
        { redirect: () => {} },
        (err) => { caughtErr = err; }
      );
      assert.ok(caughtErr && /trước ngày bắt đầu/.test(caughtErr.message));
    } finally {
      dbConfig.query = origQuery;
      dbConfig.getPool = origPool;
      require.cache[adminCtrlPath] = undefined;
    }
  });

  // --- TC27-TC30: Order Code VAMYYMMDD Boundaries ---
  test('TC27-TC30: Order code date prefix follows Asia/Ho_Chi_Minh calendar at 23:59, 00:00, 06:59 & 07:00 ICT', () => {
    // 23:59 ICT on 2026-11-26 = 16:59 UTC on 2026-11-26
    assert.strictEqual(dateTime.getVietnameseOrderDatePrefix('2026-11-26T16:59:59.000Z'), '261126');
    // 00:00 ICT on 2026-11-27 = 17:00 UTC on 2026-11-26
    assert.strictEqual(dateTime.getVietnameseOrderDatePrefix('2026-11-26T17:00:00.000Z'), '261127');
    // 06:59 ICT on 2026-11-27 = 23:59 UTC on 2026-11-26
    assert.strictEqual(dateTime.getVietnameseOrderDatePrefix('2026-11-26T23:59:59.000Z'), '261127');
    // 07:00 ICT on 2026-11-27 = 00:00 UTC on 2026-11-27
    assert.strictEqual(dateTime.getVietnameseOrderDatePrefix('2026-11-27T00:00:00.000Z'), '261127');
    // New Year boundary: 00:00 ICT 2027-01-01 = 17:00 UTC 2026-12-31
    assert.strictEqual(dateTime.getVietnameseOrderDatePrefix('2026-12-31T17:00:00.000Z'), '270101');
  });

  // --- TC31-TC33: Pug SSR Rendering ICT Consistency ---
  test('TC31-TC33: Pug views display exact Asia/Ho_Chi_Minh dates/times with zero double +7h shift and Admin/Customer consistency', () => {
    const sampleInstant = new Date('2026-11-26T10:30:15.000Z'); // 17:30:15 26/11/2026 ICT
    const voucherWindow = dateTime.parseVietnameseDateInput('2026-11-26');
    const commonLocals = {
      title: 'Test',
      csrfToken: 'tok',
      t: (_k, d) => d || _k,
      currentLocale: 'vi',
      currentPath: '/account/orders',
      isAuthenticated: true,
      isAdmin: false,
      isCustomer: true,
      user: { id: 1, full_name: 'Tester', email: 't@v.vn', role: 'CUSTOMER' },
      categories: [],
      brands: [],
      cartCount: 0,
      wishlistCount: 0,
      wishlistIds: [],
      success_msg: null,
      error_msg: null,
      warning_msg: null,
      formatVnDate: dateTime.formatVietnameseDate,
      formatVnDateTime: dateTime.formatVietnameseDateTime,
      formatVnVoucherEnd: dateTime.formatVietnameseVoucherEnd
    };

    const customerOrdersHtml = pug.renderFile(
      path.resolve(__dirname, '../src/views/pages/account/orders.pug'),
      {
        ...commonLocals,
        orders: [{
          id: 99,
          order_code: 'VAM261126-1001',
          order_status: 'COMPLETED',
          total_amount: 500000,
          created_at: sampleInstant,
          items: []
        }]
      }
    );
    assert.ok(customerOrdersHtml.includes('17:30 26/11/2026'), 'Customer order page must show 17:30 26/11/2026');
    assert.ok(!customerOrdersHtml.includes('27/11/2026'), '17:30 ICT must NEVER shift to next day 27/11/2026');

    const adminOrderDetailHtml = pug.renderFile(
      path.resolve(__dirname, '../src/views/pages/admin/order-detail.pug'),
      {
        ...commonLocals,
        isAdmin: true,
        isCustomer: false,
        order: {
          id: 99,
          order_code: 'VAM261126-1001',
          order_status: 'COMPLETED',
          payment_status: 'PAID',
          payment_method: 'COD',
          subtotal: 500000,
          discount_amount: 0,
          shipping_fee: 0,
          shipping_discount_amount: 0,
          total_amount: 500000,
          recipient_name_snapshot: 'Tester',
          recipient_phone_snapshot: '0901234567',
          delivery_address_snapshot: 'Hà Nội',
          created_at: sampleInstant,
          items: [],
          histories: [{ new_status: 'COMPLETED', note: 'Giao xong', created_at: sampleInstant }]
        }
      }
    );
    assert.ok(adminOrderDetailHtml.includes('17:30 26/11/2026'), 'Admin order detail must show identical 17:30 26/11/2026');

    const adminVouchersHtml = pug.renderFile(
      path.resolve(__dirname, '../src/views/pages/admin/vouchers.pug'),
      {
        ...commonLocals,
        isAdmin: true,
        isCustomer: false,
        vouchers: [{
          id: 1,
          code: 'DAY26',
          name: 'Day 26',
          discount_type: 'fixed_amount',
          discount_value: 20000,
          min_order_value: 0,
          used_count: 0,
          usage_limit: 10,
          is_active: true,
          start_date: voucherWindow.startUtc,
          end_date: voucherWindow.endExclusiveUtc
        }]
      }
    );
    assert.ok(adminVouchersHtml.includes('00:00 26/11/2026 - 23:59 26/11/2026'));
    assert.ok(!adminVouchersHtml.includes('27/11/2026'), 'Admin single-day voucher end display must not spill to 27/11');

    const rewardsHtml = pug.renderFile(
      path.resolve(__dirname, '../src/views/pages/account/rewards.pug'),
      {
        ...commonLocals,
        wallet: {
          tier_code: 'MEMBER', tierIcon: '🥉', tierName: 'Thành Viên',
          available_points: 500, usable_points: 500, usablePoints: 500,
          qualifying_points_cycle: 500, lifetime_earned_points: 500, lifetime_redeemed_points: 0,
          cycle_number: 1, cycle_end_at: new Date('2027-11-26T10:30:00.000Z'),
          progressPercent: 50, pointsNeeded: 500, nextTierName: 'Bạc',
          nextExpiringBatch: { remaining_points: 500, expires_at: new Date('2027-11-26T10:30:00.000Z') }
        },
        rewardRules: [],
        history: [{ created_at: sampleInstant, transaction_type: 'ORDER_PURCHASE', description: 'Mua', amount: 500, balance_after: 500 }],
        myVouchers: [{
          rule_title: 'FreeShip', redemption_status: 'AVAILABLE', voucher_code: 'VC1',
          discount_type: 'free_shipping', discount_value: 40000, max_discount_amount: 40000, min_order_value: 200000,
          redeemed_at: sampleInstant,
          end_date: new Date('2026-12-11T10:30:15.000Z')
        }],
        successMsg: null,
        errorMsg: null
      }
    );
    assert.ok(rewardsHtml.includes('Đổi lúc: 17:30 26/11/2026'));
    assert.ok(rewardsHtml.includes('HSD: 17:30 11/12/2026'));
    assert.ok(rewardsHtml.includes('17:30:15 26/11/2026'));
  });

  // Preserve unused import check note
  assert.ok(typeof adminController.postCreateVoucher === 'function');
  assertSummary();
}

main().catch((err) => {
  console.error('[FATAL TIMEZONE UNIT SUITE ERROR]:', err);
  process.exitCode = 1;
});
