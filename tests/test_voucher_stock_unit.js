/**
 * VAMOS CLUB - MEDIUM-03 Zero-DB Unit & View Contract Tests (TC01-TC08)
 * Verifies atomic voucher stock checks, non-negative stock boundaries, rollback semantics,
 * non-production failure injection guard, and Customer Rewards Pug view stock states.
 */

require('./test_bootstrap');

const assert = require('node:assert');
const path = require('node:path');
const pug = require('pug');
const sql = require('mssql');
const { utc, createSuiteRunner } = require('./helpers/loyalty-test-helpers');

const dbModulePath = path.resolve(__dirname, '../src/config/database.js');
let activePoolFactory = null;
let activeQueryHandler = null;

require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: {
    query: async (sqlText, params) => {
      if (!activeQueryHandler) {
        throw new Error('UNIT TEST GUARD: Real SQL query() is forbidden in zero-DB unit tests');
      }
      return activeQueryHandler(sqlText, params);
    },
    getPool: async () => {
      if (!activePoolFactory) {
        throw new Error('UNIT TEST GUARD: Real SQL getPool() is forbidden in zero-DB unit tests');
      }
      return activePoolFactory();
    },
    closePool: async () => {}
  }
};

const loyaltyService = require('../src/services/loyalty.service');

const REWARDS_VIEW_PATH = path.resolve(__dirname, '../src/views/pages/account/rewards.pug');

async function runMockedRedeem({
  ruleOverride = {},
  walletAvailable = 1000,
  batchesOverride = null,
  simulateStockRaceZero = false,
  options = {}
}) {
  const nowTs = utc('2026-06-01T00:00:00Z');
  const rule = {
    id: 10,
    title: 'Voucher Giảm 50.000đ',
    reward_type: 'VOUCHER',
    points_required: 500,
    discount_type: 'fixed_amount',
    discount_value: 50000,
    min_order_amount: 200000,
    max_discount_amount: 50000,
    voucher_valid_days: 30,
    stock_quantity: 5,
    is_active: true,
    ...ruleOverride
  };

  const state = {
    stockUpdates: 0,
    walletUpdates: 0,
    batchUpdates: 0,
    voucherInserts: 0,
    redemptionInserts: 0,
    pointTxInserts: 0,
    committed: false,
    rolledBack: false,
    queries: []
  };

  const batches = batchesOverride || [
    { id: 101, user_id: 7, remaining_points: walletAvailable, expires_at: utc('2026-12-01T00:00:00Z'), status: 'ACTIVE' }
  ];

  const OrigTx = sql.Transaction;
  const OrigReq = sql.Request;
  activePoolFactory = () => ({ isMockPool: true });

  sql.Transaction = class {
    async begin() {
      // Mocked transaction begin
    }
    async commit() {
      state.committed = true;
    }
    async rollback() {
      state.rolledBack = true;
    }
  };

  sql.Request = class {
    constructor() {
      this.params = {};
    }
    input(k, t, v) {
      this.params[k] = v === undefined ? t : v;
      return this;
    }
    async query(sqlText) {
      const normalized = sqlText.replace(/\s+/g, ' ').trim();
      state.queries.push(normalized);

      if (normalized.includes('SELECT SYSUTCDATETIME()')) {
        return { recordset: [{ db_now: nowTs }] };
      }
      if (normalized.includes('FROM point_reward_rules WITH (UPDLOCK, ROWLOCK)')) {
        return { recordset: [{ ...rule }] };
      }
      if (normalized.includes('FROM user_points_wallets')) {
        return {
          recordset: [{
            user_id: 7,
            available_points: walletAvailable,
            lifetime_redeemed_points: 0,
            tier_code: 'MEMBER'
          }]
        };
      }
      if (normalized.includes('FROM loyalty_point_batches')) {
        return { recordset: batches.filter((b) => b.remaining_points > 0) };
      }
      if (normalized.includes('UPDATE point_reward_rules')) {
        assert.ok(normalized.includes('stock_quantity = stock_quantity - 1'));
        assert.ok(normalized.includes('stock_quantity > 0'));
        assert.ok(normalized.includes('is_active = 1'));
        if (simulateStockRaceZero || rule.stock_quantity <= 0) {
          return { recordset: [], rowsAffected: [0] };
        }
        state.stockUpdates++;
        rule.stock_quantity -= 1;
        return { recordset: [], rowsAffected: [1] };
      }
      if (normalized.includes('UPDATE loyalty_point_batches')) {
        state.batchUpdates++;
        return { recordset: [], rowsAffected: [1] };
      }
      if (normalized.includes('SELECT 1 FROM vouchers')) {
        return { recordset: [] };
      }
      if (normalized.includes('INSERT INTO vouchers')) {
        state.voucherInserts++;
        return { recordset: [{ id: 888 }] };
      }
      if (normalized.includes('INSERT INTO voucher_redemptions')) {
        state.redemptionInserts++;
        return { recordset: [{ id: 999 }] };
      }
      if (normalized.includes('UPDATE user_points_wallets')) {
        state.walletUpdates++;
        return { recordset: [], rowsAffected: [1] };
      }
      if (normalized.includes('INSERT INTO point_transactions')) {
        state.pointTxInserts++;
        return { recordset: [], rowsAffected: [1] };
      }
      return { recordset: [], rowsAffected: [1] };
    }
  };

  try {
    const result = await loyaltyService.redeemVoucher(7, rule.id, { nowOverride: nowTs, ...options });
    return { result, state, finalRuleStock: rule.stock_quantity };
  } catch (error) {
    return { error, state, finalRuleStock: rule.stock_quantity };
  } finally {
    sql.Transaction = OrigTx;
    sql.Request = OrigReq;
    activePoolFactory = null;
  }
}

function renderRewardsPage(rewardRules, usablePoints = 1500, walletOverride = {}) {
  return pug.renderFile(REWARDS_VIEW_PATH, {
    title: 'VAMOS Club',
    activeNav: 'rewards',
    user: { id: 7, full_name: 'Tester', email: 'tester@vamos.vn', role: 'CUSTOMER' },
    wallet: {
      tier_code: 'MEMBER',
      tierCode: 'MEMBER',
      tierName: 'Thành Viên',
      tierIcon: '🏷️',
      available_points: usablePoints,
      usable_points: usablePoints,
      usablePoints,
      expired_pending_points: 0,
      lifetime_earned_points: usablePoints,
      lifetime_redeemed_points: 0,
      qualifying_points_cycle: usablePoints,
      progressPercent: 25,
      pointsNeeded: 1000,
      nextTierName: 'Silver',
      nextExpiringBatch: null,
      ...walletOverride
    },
    rewardRules,
    history: [],
    myVouchers: [],
    csrfToken: 'unit_csrf_token',
    successMsg: null,
    errorMsg: null,
    t: (_k, d) => d,
    lang: 'vi',
    currentLocale: 'vi',
    currentPath: '/account/rewards',
    success_msg: '',
    error_msg: '',
    categories: [],
    brands: [],
    cartCount: 0,
    wishlistCount: 0,
    wishlistIds: []
  });
}

async function main() {
  const { asyncTest, test, assertSummary } = createSuiteRunner('VAMOS CLUB - MEDIUM-03 VOUCHER STOCK UNIT TESTS (TC01-TC08)');

  await asyncTest('TC01: Stock > 0 allows redemption and triggers atomic SQL stock decrement', async () => {
    const out = await runMockedRedeem({ ruleOverride: { stock_quantity: 5 }, walletAvailable: 800 });
    assert.ok(!out.error, out.error?.message);
    assert.strictEqual(out.state.committed, true);
    assert.strictEqual(out.state.stockUpdates, 1);
    assert.strictEqual(out.finalRuleStock, 4);
    assert.strictEqual(out.result.remainingStock, 4);
    assert.strictEqual(out.state.voucherInserts, 1);
    assert.strictEqual(out.state.redemptionInserts, 1);
    assert.strictEqual(out.state.walletUpdates, 1);
    assert.strictEqual(out.state.pointTxInserts, 1);
  });

  await asyncTest('TC02: Stock = 0 rejects redemption cleanly without touching wallet or stock', async () => {
    const out = await runMockedRedeem({ ruleOverride: { stock_quantity: 0 }, walletAvailable: 1200 });
    assert.ok(out.error && /Voucher này đã hết lượt đổi\./.test(out.error.message));
    assert.strictEqual(out.state.rolledBack, true);
    assert.strictEqual(out.state.committed, false);
    assert.strictEqual(out.state.stockUpdates, 0);
    assert.strictEqual(out.state.batchUpdates, 0);
    assert.strictEqual(out.state.voucherInserts, 0);
    assert.strictEqual(out.state.walletUpdates, 0);
    assert.strictEqual(out.finalRuleStock, 0);
  });

  await asyncTest('TC03: Stock = 1 decrements cleanly to 0; lost race (rowsAffected=0) aborts safely', async () => {
    const win = await runMockedRedeem({ ruleOverride: { stock_quantity: 1 }, walletAvailable: 700 });
    assert.ok(!win.error, win.error?.message);
    assert.strictEqual(win.finalRuleStock, 0);
    assert.strictEqual(win.result.remainingStock, 0);

    const lose = await runMockedRedeem({
      ruleOverride: { stock_quantity: 1 },
      walletAvailable: 700,
      simulateStockRaceZero: true
    });
    assert.ok(lose.error && /Voucher này đã hết lượt đổi\./.test(lose.error.message));
    assert.strictEqual(lose.state.rolledBack, true);
    assert.strictEqual(lose.state.batchUpdates, 0);
    assert.strictEqual(lose.state.voucherInserts, 0);
    assert.strictEqual(lose.finalRuleStock, 1);
  });

  await asyncTest('TC04: Inactive rule (is_active = 0) rejects and never decrements stock', async () => {
    const out = await runMockedRedeem({ ruleOverride: { is_active: false, stock_quantity: 20 } });
    assert.ok(out.error && /tạm đóng hoặc chưa khả dụng/.test(out.error.message));
    assert.strictEqual(out.state.rolledBack, true);
    assert.strictEqual(out.state.stockUpdates, 0);
    assert.strictEqual(out.finalRuleStock, 20);
  });

  await asyncTest('TC05: Insufficient points rejects and preserves stock quantity', async () => {
    const out = await runMockedRedeem({ ruleOverride: { points_required: 500, stock_quantity: 3 }, walletAvailable: 200 });
    assert.ok(out.error && /Số dư điểm không đủ/.test(out.error.message));
    assert.strictEqual(out.state.rolledBack, true);
    assert.strictEqual(out.state.stockUpdates, 0);
    assert.strictEqual(out.finalRuleStock, 3);
  });

  await asyncTest('TC06: Non-positive / NULL / negative stock values cannot produce negative stock or bypass guard', async () => {
    for (const invalidStock of [0, -1, null, undefined]) {
      const out = await runMockedRedeem({ ruleOverride: { stock_quantity: invalidStock }, walletAvailable: 1000 });
      assert.ok(out.error && /Voucher này đã hết lượt đổi\./.test(out.error.message));
      assert.strictEqual(out.state.stockUpdates, 0);
      assert.strictEqual(out.state.rolledBack, true);
    }

    // Verify failure injection hook cannot execute outside NODE_ENV=test
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const prodOut = await runMockedRedeem({
        ruleOverride: { stock_quantity: 2 },
        walletAvailable: 1000,
        options: { _testFailAt: 'before_voucher_insert' }
      });
      assert.ok(!prodOut.error, 'Failure injection hook must be strictly ignored when NODE_ENV !== test');
      assert.strictEqual(prodOut.state.committed, true);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  await asyncTest('TC07: getRewardsCenterData forwards stock_quantity to view and UI shows remaining stock', async () => {
    activeQueryHandler = async (sqlText) => {
      if (sqlText.includes('FROM user_points_wallets')) {
        return {
          recordset: [{
            user_id: 7, available_points: 1000, lifetime_earned_points: 1000,
            lifetime_redeemed_points: 0, tier_code: 'MEMBER', cycle_number: 1,
            cycle_start_at: utc('2026-01-01T00:00:00Z'), cycle_end_at: utc('2027-01-01T00:00:00Z'),
            qualifying_points_cycle: 1000
          }]
        };
      }
      if (sqlText.includes('SELECT SYSUTCDATETIME()')) {
        return { recordset: [{ db_now: utc('2026-06-01T00:00:00Z') }] };
      }
      if (sqlText.includes('FROM point_reward_rules')) {
        return {
          recordset: [{
            id: 1, title: 'Voucher Còn 15', description: 'Mô tả ưu đãi', reward_type: 'VOUCHER',
            points_required: 500, discount_type: 'fixed_amount', discount_value: 30000,
            min_order_amount: 300000, max_discount_amount: 30000, voucher_valid_days: 30,
            stock_quantity: 15, is_active: true
          }]
        };
      }
      if (sqlText.includes('FROM loyalty_point_batches')) {
        return { recordset: [{ id: 1, remaining_points: 1000, expires_at: utc('2026-12-01T00:00:00Z'), status: 'ACTIVE' }] };
      }
      return { recordset: [] };
    };

    try {
      const data = await loyaltyService.getRewardsCenterData(7);
      assert.strictEqual(data.rewardRules[0].stock_quantity, 15);
      const html = renderRewardsPage(data.rewardRules, data.wallet.usable_points, data.wallet);
      assert.ok(html.includes('Còn 15 lượt đổi'), 'Must show exact remaining stock count');
      assert.ok(html.includes('ĐỔI VOUCHER NGAY'), 'Button must be enabled when stock > 0 and points suffice');
    } finally {
      activeQueryHandler = null;
    }
  });

  test('TC08: UI keeps reward card with stock = 0 visible, renders HẾT LƯỢT ĐỔI, and disables redeem button', () => {
    const html = renderRewardsPage([
      {
        id: 1, title: 'Voucher Hết Kho', description: 'Đã phát hết lượt', reward_type: 'VOUCHER',
        points_required: 500, discount_type: 'fixed_amount', discount_value: 30000,
        min_order_amount: 300000, voucher_valid_days: 30, stock_quantity: 0, is_active: true
      },
      {
        id: 2, title: 'Quà Sắp Mở', description: 'Chưa mở', reward_type: 'PHYSICAL_GIFT',
        points_required: 800, discount_type: 'fixed_amount', discount_value: 0,
        min_order_amount: 0, voucher_valid_days: 30, stock_quantity: 0, is_active: false
      },
      {
        id: 3, title: 'Voucher Thiếu Điểm', description: 'Còn lượt nhưng thiếu điểm', reward_type: 'FREE_SHIPPING',
        points_required: 2500, discount_type: 'free_shipping', discount_value: 40000,
        min_order_amount: 200000, voucher_valid_days: 15, stock_quantity: 12, is_active: true
      }
    ], 1500);

    assert.ok(html.includes('Voucher Hết Kho'), 'Out-of-stock reward card must still render');
    assert.ok(html.includes('HẾT LƯỢT ĐỔI'), 'Out-of-stock label must render');
    assert.ok(!html.includes('action="/account/rewards/redeem"'), 'No active redeem form may render when all active cards are disabled');
    assert.ok(html.includes('🔒 SẮP MỞ ĐỔI QUÀ'), 'Inactive card must remain disabled');
    assert.ok(html.includes('Còn 12 lượt đổi'), 'Available stock card must show remaining stock');
    assert.ok(html.includes('Thiếu 1.000 điểm còn hạn'), 'Insufficient points state must remain intact');
  });

  assertSummary();
}

main().catch((err) => {
  console.error('[FATAL VOUCHER STOCK UNIT TEST ERROR]:', err);
  process.exitCode = 1;
});
