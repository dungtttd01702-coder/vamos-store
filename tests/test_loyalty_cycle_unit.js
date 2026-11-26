/**
 * VAMOS CLUB - Pure In-Memory Unit Tests (ZERO SQL Server Connections)
 * Covers:
 * - 20 Tier Cycle scenarios (activation, leap-year anchor, bounds, soft landing, multi-cycle rollover)
 * - 365-day Point Expiration & FEFO deduction math
 * - Fail-closed Backfill Replay engine
 * - Mocked-transaction LoyaltyService & Worker lock/retry guarantees
 */

const assert = require('node:assert');
const path = require('node:path');
const pug = require('pug');
const sql = require('mssql');
const loyaltyCycle = require('../src/utils/loyaltyCycle');
const { utc, createSuiteRunner } = require('./helpers/loyalty-test-helpers');

// Guard: prevent any accidental SQL Server pool initialization during pure unit tests
const dbModulePath = path.resolve(__dirname, '../src/config/database.js');
const appConfigPath = path.resolve(__dirname, '../src/config/app.config.js');
const dbGuardPath = path.resolve(__dirname, '../src/config/db-guard.js');

let activePoolFactory = null;
let activeQueryHandler = null;

function installMockDatabaseModule() {
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: {
      query: async (sqlText, params) => {
        if (!activeQueryHandler) {
          throw new Error('UNIT TEST GUARD: Real SQL query() is forbidden in pure unit tests');
        }
        return activeQueryHandler(sqlText, params);
      },
      getPool: async () => {
        if (!activePoolFactory) {
          throw new Error('UNIT TEST GUARD: Real SQL getPool() is forbidden in pure unit tests');
        }
        return activePoolFactory();
      },
      closePool: async () => {}
    }
  };
}

function makeFakeTransaction(queryHandler) {
  const state = { begun: false, committed: false, rolledBack: false };
  class FakeRequest {
    constructor(txOrPool) {
      this.target = txOrPool;
      this.params = {};
    }
    input(name, typeOrVal, maybeVal) {
      this.params[name] = maybeVal === undefined ? typeOrVal : maybeVal;
      return this;
    }
    async query(sqlText) {
      return queryHandler(sqlText, this.params, state);
    }
  }
  return {
    state,
    FakeRequest,
    tx: {
      commit: async () => { state.committed = true; },
      rollback: async () => { state.rolledBack = true; },
      begin: async () => { state.begun = true; }
    }
  };
}

async function main() {
  const { test, asyncTest, assertSummary } = createSuiteRunner('VAMOS CLUB - PURE IN-MEMORY UNIT TESTS');

  // -----------------------------------------------------------------
  // 1. 20 TIER CYCLE SCENARIOS
  // -----------------------------------------------------------------
  test('CYC-01: Inactive account keeps cycle_anchor_at = NULL, cycle_number = 0, tier MEMBER', () => {
    const wallet = {
      tier_code: 'MEMBER',
      cycle_anchor_at: null,
      cycle_start_at: null,
      cycle_end_at: null,
      cycle_number: 0,
      qualifying_points_cycle: 0
    };
    const res = loyaltyCycle.rolloverCyclesThroughTimestamp(wallet, utc('2026-06-01T00:00:00Z'));
    assert.strictEqual(res.changed, false);
    assert.strictEqual(res.cycle_number, 0);
    assert.strictEqual(res.cycle_anchor_at, null);
    assert.strictEqual(res.tier_code, 'MEMBER');
  });

  test('CYC-02: Non-qualifying tx (ADMIN_ADJUSTMENT, VOUCHER_REDEMPTION, POINT_EXPIRATION) never starts cycle', () => {
    for (const type of ['ADMIN_ADJUSTMENT', 'VOUCHER_REDEMPTION', 'POINT_EXPIRATION']) {
      const res = loyaltyCycle.applyPositiveEarnToWallet(
        { tier_code: 'MEMBER', cycle_number: 0, qualifying_points_cycle: 0 },
        1500,
        utc('2026-01-15T10:00:00Z'),
        type
      );
      assert.strictEqual(res.activatedCycle, false, `${type} must not activate cycle`);
      assert.strictEqual(res.cycle_number, 0);
      assert.strictEqual(res.qualifying_points_cycle, 0);
      assert.strictEqual(res.tier_code, 'MEMBER');
    }
  });

  test('CYC-03: Zero-point earn cannot activate cycle (strictly rejects non-positive earn amount)', () => {
    assert.throws(() => {
      loyaltyCycle.applyPositiveEarnToWallet(
        { tier_code: 'MEMBER', cycle_number: 0, qualifying_points_cycle: 0 },
        0,
        utc('2026-01-15T10:00:00Z'),
        'ORDER_PURCHASE'
      );
    }, /Positive earn amount must be a positive integer/);
  });

  test('CYC-04: First REVIEW_REWARD with positive points starts Cycle 1 and sets anchor', () => {
    const txAt = utc('2026-03-10T08:30:15Z');
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      { tier_code: 'MEMBER', cycle_number: 0, qualifying_points_cycle: 0 },
      300,
      txAt,
      'REVIEW_REWARD'
    );
    assert.strictEqual(res.activatedCycle, true);
    assert.strictEqual(res.cycle_number, 1);
    assert.strictEqual(res.cycle_anchor_at.toISOString(), '2026-03-10T08:30:15.000Z');
    assert.strictEqual(res.cycle_start_at.toISOString(), '2026-03-10T08:30:15.000Z');
    assert.strictEqual(res.cycle_end_at.toISOString(), '2027-03-10T08:30:15.000Z');
    assert.strictEqual(res.qualifying_points_cycle, 300);
    assert.strictEqual(res.tier_code, 'MEMBER');
  });

  test('CYC-05: First ORDER_PURCHASE hitting >= 1,000 points activates Cycle 1 and upgrades immediately to SILVER', () => {
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      { tier_code: 'MEMBER', cycle_number: 0, qualifying_points_cycle: 0 },
      1000,
      utc('2026-05-01T12:00:00Z'),
      'ORDER_PURCHASE'
    );
    assert.strictEqual(res.activatedCycle, true);
    assert.strictEqual(res.tier_code, 'SILVER');
    assert.strictEqual(res.qualifying_points_cycle, 1000);
  });

  test('CYC-06: Multiple earns in Cycle 1 upgrade progressively SILVER -> GOLD -> VIP in real time', () => {
    let wallet = { tier_code: 'MEMBER', cycle_number: 0, qualifying_points_cycle: 0 };
    wallet = {
      ...wallet,
      ...loyaltyCycle.applyPositiveEarnToWallet(wallet, 1200, utc('2026-01-01T00:00:00Z'), 'ORDER_PURCHASE')
    };
    assert.strictEqual(wallet.tier_code, 'SILVER');

    wallet = {
      ...wallet,
      ...loyaltyCycle.applyPositiveEarnToWallet(wallet, 1300, utc('2026-02-01T00:00:00Z'), 'ORDER_PURCHASE')
    };
    assert.strictEqual(wallet.tier_code, 'GOLD');
    assert.strictEqual(wallet.qualifying_points_cycle, 2500);

    wallet = {
      ...wallet,
      ...loyaltyCycle.applyPositiveEarnToWallet(wallet, 2500, utc('2026-06-01T00:00:00Z'), 'ORDER_PURCHASE')
    };
    assert.strictEqual(wallet.tier_code, 'VIP');
    assert.strictEqual(wallet.qualifying_points_cycle, 5000);
  });

  test('CYC-07: Exact boundary tx.created_at === cycle_end_at belongs to ending cycle (<=)', () => {
    const anchor = utc('2026-01-15T10:00:00Z');
    const endAt = utc('2027-01-15T10:00:00Z');
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      {
        tier_code: 'MEMBER',
        cycle_anchor_at: anchor,
        cycle_start_at: anchor,
        cycle_end_at: endAt,
        cycle_number: 1,
        qualifying_points_cycle: 800
      },
      200,
      endAt,
      'REVIEW_REWARD'
    );
    assert.strictEqual(res.cyclesProcessed, 0);
    assert.strictEqual(res.cycle_number, 1);
    assert.strictEqual(res.qualifying_points_cycle, 1000);
    assert.strictEqual(res.tier_code, 'SILVER');
  });

  test('CYC-08: 1ms after boundary (tx.created_at > cycle_end_at) rolls Cycle 1 -> Cycle 2 first', () => {
    const anchor = utc('2026-01-15T10:00:00Z');
    const endAt = utc('2027-01-15T10:00:00Z');
    const afterBoundary = utc('2027-01-15T10:00:00.001Z');
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      {
        tier_code: 'GOLD',
        cycle_anchor_at: anchor,
        cycle_start_at: anchor,
        cycle_end_at: endAt,
        cycle_number: 1,
        qualifying_points_cycle: 2600
      },
      300,
      afterBoundary,
      'REVIEW_REWARD'
    );
    assert.strictEqual(res.cyclesProcessed, 1);
    assert.strictEqual(res.cycle_number, 2);
    assert.strictEqual(res.tier_code, 'GOLD');
    assert.strictEqual(res.qualifying_points_cycle, 300);
  });

  test('CYC-09: Mid-cycle upgrade guard - SILVER starting Cycle 2 stays SILVER when earning +300 (cannot drop mid-cycle)', () => {
    const anchor = utc('2025-01-01T00:00:00Z');
    const bounds2 = loyaltyCycle.computeCycleBounds(anchor, 2);
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      {
        tier_code: 'SILVER',
        cycle_anchor_at: anchor,
        cycle_start_at: bounds2.cycle_start_at,
        cycle_end_at: bounds2.cycle_end_at,
        cycle_number: 2,
        qualifying_points_cycle: 0
      },
      300,
      utc('2026-03-01T00:00:00Z'),
      'REVIEW_REWARD'
    );
    assert.strictEqual(res.tier_code, 'SILVER');
    assert.strictEqual(res.qualifying_points_cycle, 300);
  });

  test('CYC-10: Mid-cycle upgrade from protected SILVER to GOLD when Cycle 2 reaches 2,500 qualifying points', () => {
    const anchor = utc('2025-01-01T00:00:00Z');
    const bounds2 = loyaltyCycle.computeCycleBounds(anchor, 2);
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      {
        tier_code: 'SILVER',
        cycle_anchor_at: anchor,
        cycle_start_at: bounds2.cycle_start_at,
        cycle_end_at: bounds2.cycle_end_at,
        cycle_number: 2,
        qualifying_points_cycle: 2200
      },
      300,
      utc('2026-05-01T00:00:00Z'),
      'ORDER_PURCHASE'
    );
    assert.strictEqual(res.tier_code, 'GOLD');
    assert.strictEqual(res.qualifying_points_cycle, 2500);
  });

  test('CYC-11: Leap-year anchor Feb 29 (2024-02-29) stays pinned without drift across 4 years (2025-02-28 -> 2028-02-29)', () => {
    const anchor = utc('2024-02-29T14:22:10Z');
    const c1 = loyaltyCycle.computeCycleBounds(anchor, 1);
    const c2 = loyaltyCycle.computeCycleBounds(anchor, 2);
    const c3 = loyaltyCycle.computeCycleBounds(anchor, 3);
    const c4 = loyaltyCycle.computeCycleBounds(anchor, 4);

    assert.strictEqual(c1.cycle_end_at.toISOString(), '2025-02-28T14:22:10.000Z');
    assert.strictEqual(c2.cycle_start_at.toISOString(), '2025-02-28T14:22:10.000Z');
    assert.strictEqual(c2.cycle_end_at.toISOString(), '2026-02-28T14:22:10.000Z');
    assert.strictEqual(c3.cycle_end_at.toISOString(), '2027-02-28T14:22:10.000Z');
    assert.strictEqual(c4.cycle_end_at.toISOString(), '2028-02-29T14:22:10.000Z');
  });

  test('CYC-12: Cycle retention at cycle end - VIP with 5,000 pts keeps VIP in Cycle 2 with qualifying reset to 0', () => {
    const anchor = utc('2025-01-01T00:00:00Z');
    const c1 = loyaltyCycle.computeCycleBounds(anchor, 1);
    const res = loyaltyCycle.rolloverCyclesThroughTimestamp(
      {
        tier_code: 'VIP',
        cycle_anchor_at: anchor,
        cycle_start_at: c1.cycle_start_at,
        cycle_end_at: c1.cycle_end_at,
        cycle_number: 1,
        qualifying_points_cycle: 5000
      },
      utc('2026-02-01T00:00:00Z')
    );
    assert.strictEqual(res.cyclesProcessed, 1);
    assert.strictEqual(res.tier_code, 'VIP');
    assert.strictEqual(res.qualifying_points_cycle, 0);
    assert.strictEqual(res.cycle_number, 2);
  });

  test('CYC-13: Soft Landing VIP -> GOLD when Cycle 1 qualifying = 0 (< 5,000)', () => {
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('VIP', 0), 'GOLD');
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('VIP', 4999), 'GOLD');
  });

  test('CYC-14: Soft Landing GOLD -> SILVER when Cycle qualifying < 2,500', () => {
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('GOLD', 1200), 'SILVER');
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('GOLD', 2499), 'SILVER');
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('GOLD', 2500), 'GOLD');
  });

  test('CYC-15: Soft Landing SILVER -> MEMBER when Cycle qualifying < 1,000', () => {
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('SILVER', 999), 'MEMBER');
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('SILVER', 1000), 'SILVER');
  });

  test('CYC-16: MEMBER floor never drops below MEMBER', () => {
    assert.strictEqual(loyaltyCycle.evaluateCycleEndTier('MEMBER', 0), 'MEMBER');
  });

  test('CYC-17: Multi-cycle worker downtime catch-up (VIP inactive for 2.5 years -> VIP -> GOLD -> SILVER)', () => {
    const anchor = utc('2024-01-01T00:00:00Z');
    const c1 = loyaltyCycle.computeCycleBounds(anchor, 1);
    const res = loyaltyCycle.rolloverCyclesThroughTimestamp(
      {
        tier_code: 'VIP',
        cycle_anchor_at: anchor,
        cycle_start_at: c1.cycle_start_at,
        cycle_end_at: c1.cycle_end_at,
        cycle_number: 1,
        qualifying_points_cycle: 400
      },
      utc('2026-06-15T00:00:00Z')
    );
    assert.strictEqual(res.cyclesProcessed, 2);
    assert.strictEqual(res.cycle_number, 3);
    assert.strictEqual(res.tier_code, 'SILVER');
    assert.strictEqual(res.qualifying_points_cycle, 0);
    assert.deepStrictEqual(
      res.history.map((h) => [h.endedCycleNumber, h.tierBefore, h.tierAfter]),
      [[1, 'VIP', 'GOLD'], [2, 'GOLD', 'SILVER']]
    );
  });

  test('CYC-18: Rollover stops before future cycle_end_at (at exact cycle_end_at no rollover happens yet)', () => {
    const anchor = utc('2025-01-01T00:00:00Z');
    const c1 = loyaltyCycle.computeCycleBounds(anchor, 1);
    const res = loyaltyCycle.rolloverCyclesThroughTimestamp(
      {
        tier_code: 'GOLD',
        cycle_anchor_at: anchor,
        cycle_start_at: c1.cycle_start_at,
        cycle_end_at: c1.cycle_end_at,
        cycle_number: 1,
        qualifying_points_cycle: 100
      },
      utc('2026-01-01T00:00:00Z')
    );
    assert.strictEqual(res.changed, false);
    assert.strictEqual(res.cyclesProcessed, 0);
    assert.strictEqual(res.tier_code, 'GOLD');
  });

  test('CYC-19: Multi-cycle catch-up then immediate earn upgrades in Cycle 4 if massive purchase hits VIP', () => {
    const anchor = utc('2023-01-01T00:00:00Z');
    const c1 = loyaltyCycle.computeCycleBounds(anchor, 1);
    const res = loyaltyCycle.applyPositiveEarnToWallet(
      {
        tier_code: 'VIP',
        cycle_anchor_at: anchor,
        cycle_start_at: c1.cycle_start_at,
        cycle_end_at: c1.cycle_end_at,
        cycle_number: 1,
        qualifying_points_cycle: 0
      },
      5500,
      utc('2026-03-01T00:00:00Z'),
      'ORDER_PURCHASE'
    );
    assert.strictEqual(res.cyclesProcessed, 3);
    assert.strictEqual(res.cycle_number, 4);
    assert.strictEqual(res.tier_code, 'VIP');
    assert.strictEqual(res.qualifying_points_cycle, 5500);
  });

  test('CYC-20: Voucher redemption & expiration do not reduce qualifying_points_cycle', () => {
    const anchor = utc('2026-01-01T00:00:00Z');
    const c1 = loyaltyCycle.computeCycleBounds(anchor, 1);
    const afterEarn = loyaltyCycle.applyPositiveEarnToWallet(
      {
        tier_code: 'SILVER',
        cycle_anchor_at: anchor,
        cycle_start_at: c1.cycle_start_at,
        cycle_end_at: c1.cycle_end_at,
        cycle_number: 1,
        qualifying_points_cycle: 1100
      },
      500,
      utc('2026-03-01T00:00:00Z'),
      'ORDER_PURCHASE'
    );
    assert.strictEqual(afterEarn.qualifying_points_cycle, 1600);
    assert.strictEqual(afterEarn.tier_code, 'SILVER');
  });

  // -----------------------------------------------------------------
  // 2. POINT EXPIRATION & FEFO DEDUCTION UNIT TESTS
  // -----------------------------------------------------------------
  test('EXP-01: 365-day expiration calculation across leap and non-leap years', () => {
    assert.strictEqual(
      loyaltyCycle.addDaysUTC(utc('2024-01-01T00:00:00Z'), 365).toISOString(),
      '2024-12-31T00:00:00.000Z'
    );
    assert.strictEqual(
      loyaltyCycle.addDaysUTC(utc('2025-01-01T00:00:00Z'), 365).toISOString(),
      '2026-01-01T00:00:00.000Z'
    );
  });

  test('EXP-02: FEFO deduction drains earliest expires_at first, ties broken by id ASC', () => {
    const plan = loyaltyCycle.planFefoDeduction([
      { id: 30, remaining_points: 400, expires_at: utc('2027-02-01T00:00:00Z'), status: 'ACTIVE' },
      { id: 12, remaining_points: 200, expires_at: utc('2027-01-01T00:00:00Z'), status: 'ACTIVE' },
      { id: 10, remaining_points: 300, expires_at: utc('2027-01-01T00:00:00Z'), status: 'ACTIVE' }
    ], 450);

    assert.strictEqual(plan.totalDeducted, 450);
    assert.deepStrictEqual(plan.deductions, [
      { id: 10, take: 300, newRemaining: 0, newStatus: 'EXHAUSTED' },
      { id: 12, take: 150, newRemaining: 50, newStatus: 'ACTIVE' }
    ]);
  });

  test('EXP-03: FEFO skips EXHAUSTED/EXPIRED/zero-point batches and rejects insufficient active sum', () => {
    assert.throws(() => {
      loyaltyCycle.planFefoDeduction([
        { id: 1, remaining_points: 500, expires_at: utc('2025-01-01T00:00:00Z'), status: 'EXPIRED' },
        { id: 2, remaining_points: 0, expires_at: utc('2026-01-01T00:00:00Z'), status: 'EXHAUSTED' },
        { id: 3, remaining_points: 300, expires_at: utc('2027-01-01T00:00:00Z'), status: 'ACTIVE' }
      ], 400);
    }, /Điểm khả dụng trong các lô điểm không đủ để khấu trừ/);
  });

  test('EXP-04: Negative or zero pointsRequired rejected by FEFO planner', () => {
    assert.throws(() => loyaltyCycle.planFefoDeduction([], 0), /pointsRequired must be a positive integer/);
    assert.throws(() => loyaltyCycle.planFefoDeduction([], -10), /pointsRequired must be a positive integer/);
  });

  test('EXP-05: planFefoDeduction with { now } excludes batches at or past expires_at boundary', () => {
    const now = utc('2026-06-01T00:00:00Z');
    assert.throws(() => {
      loyaltyCycle.planFefoDeduction([
        { id: 1, remaining_points: 500, expires_at: utc('2026-06-01T00:00:00Z'), status: 'ACTIVE' },
        { id: 2, remaining_points: 200, expires_at: utc('2026-07-01T00:00:00Z'), status: 'ACTIVE' }
      ], 400, { now });
    }, /Điểm khả dụng trong các lô điểm không đủ/);

    const validPlan = loyaltyCycle.planFefoDeduction([
      { id: 1, remaining_points: 500, expires_at: utc('2026-05-31T23:59:59Z'), status: 'ACTIVE' },
      { id: 2, remaining_points: 200, expires_at: utc('2026-07-01T00:00:00Z'), status: 'ACTIVE' },
      { id: 3, remaining_points: 300, expires_at: utc('2026-08-01T00:00:00Z'), status: 'ACTIVE' }
    ], 400, { now });
    assert.deepStrictEqual(validPlan.deductions, [
      { id: 2, take: 200, newRemaining: 0, newStatus: 'EXHAUSTED' },
      { id: 3, take: 200, newRemaining: 100, newStatus: 'ACTIVE' }
    ]);
  });

  // -----------------------------------------------------------------
  // 3. BACKFILL REPLAY UNIT TESTS
  // -----------------------------------------------------------------
  test('BF-01: Clean user ledger with historical earns + FEFO redemption reconciles cleanly', () => {
    const t1 = utc('2026-01-01T00:00:00Z');
    const t2 = utc('2026-02-01T00:00:00Z');
    const t3 = utc('2026-03-01T00:00:00Z');
    const now = utc('2026-06-01T00:00:00Z');
    const res = loyaltyCycle.replayUserHistory({
      userId: 101,
      wallet: { available_points: 700, tier_code: 'SILVER' },
      transactions: [
        { id: 1, transaction_type: 'ORDER_PURCHASE', amount: 600, reference_type: 'ORDER', reference_id: '10', created_at: t1 },
        { id: 2, transaction_type: 'REVIEW_REWARD', amount: 600, reference_type: 'REVIEW', reference_id: '20', created_at: t2 },
        { id: 3, transaction_type: 'VOUCHER_REDEMPTION', amount: -500, reference_type: 'VOUCHER_REDEMPTION', reference_id: '30', created_at: t3 }
      ],
      existingBatchesCount: 0,
      now
    });

    assert.strictEqual(res.reconciled, true);
    assert.strictEqual(res.anomalies.length, 0);
    assert.strictEqual(res.replayedAvailable, 700);
    assert.strictEqual(res.batches.length, 2);
    assert.strictEqual(res.batches[0].remaining_points, 100);
    assert.strictEqual(res.batches[1].remaining_points, 600);
    assert.strictEqual(res.cycleState.tier_code, 'SILVER');
    assert.strictEqual(res.cycleState.qualifying_points_cycle, 1200);
  });

  test('BF-02: User-agnostic polluted ledger (balance diverges or spend > active batches) fails closed', () => {
    const res = loyaltyCycle.replayUserHistory({
      userId: 999,
      wallet: { available_points: 27000, tier_code: 'VIP' },
      transactions: [
        { id: 1, transaction_type: 'ORDER_PURCHASE', amount: 27700, reference_type: 'ORDER', reference_id: '1', created_at: utc('2026-01-01T00:00:00Z') },
        { id: 2, transaction_type: 'VOUCHER_REDEMPTION', amount: -28000, reference_type: 'VOUCHER_REDEMPTION', reference_id: '2', created_at: utc('2026-01-02T00:00:00Z') }
      ],
      existingBatchesCount: 0,
      now: utc('2026-02-01T00:00:00Z')
    });

    assert.strictEqual(res.reconciled, false);
    assert.ok(res.anomalies.some((a) => a.code === 'NEGATIVE_TX_INSUFFICIENT_BATCHES'));
    assert.ok(res.anomalies.some((a) => a.code === 'WALLET_REPLAY_MISMATCH'));
  });

  test('BF-03: Existing batches > 0 triggers EXISTING_BATCHES_PRESENT fail-closed guard', () => {
    const res = loyaltyCycle.replayUserHistory({
      userId: 102,
      wallet: { available_points: 100, tier_code: 'MEMBER' },
      transactions: [
        { id: 1, transaction_type: 'ORDER_PURCHASE', amount: 100, reference_type: 'ORDER', reference_id: '1', created_at: utc('2026-01-01T00:00:00Z') }
      ],
      existingBatchesCount: 1,
      now: utc('2026-02-01T00:00:00Z')
    });
    assert.strictEqual(res.reconciled, false);
    assert.ok(res.anomalies.some((a) => a.code === 'EXISTING_BATCHES_PRESENT'));
  });

  test('BF-04: Historical earn older than 365 days is flagged expiredDue without mutating wallet', () => {
    const res = loyaltyCycle.replayUserHistory({
      userId: 103,
      wallet: { available_points: 500, tier_code: 'MEMBER' },
      transactions: [
        { id: 1, transaction_type: 'ORDER_PURCHASE', amount: 500, reference_type: 'ORDER', reference_id: '1', created_at: utc('2025-01-01T00:00:00Z') }
      ],
      existingBatchesCount: 0,
      now: utc('2026-06-01T00:00:00Z')
    });
    assert.strictEqual(res.reconciled, true);
    assert.strictEqual(res.expiredDueBatchesCount, 1);
    assert.strictEqual(res.expiredDuePoints, 500);
    assert.strictEqual(res.batches[0].status, 'ACTIVE');
  });

  test('BF-05: Missing reference_type/reference_id on ORDER_PURCHASE/REVIEW_REWARD flags MISSING_REFERENCE', () => {
    const res = loyaltyCycle.replayUserHistory({
      userId: 104,
      wallet: { available_points: 200, tier_code: 'MEMBER' },
      transactions: [
        { id: 1, transaction_type: 'ORDER_PURCHASE', amount: 200, reference_type: null, reference_id: null, created_at: utc('2026-01-01T00:00:00Z') }
      ],
      existingBatchesCount: 0,
      now: utc('2026-02-01T00:00:00Z')
    });
    assert.strictEqual(res.reconciled, false);
    assert.ok(res.anomalies.some((a) => a.code === 'MISSING_REFERENCE'));
  });

  // -----------------------------------------------------------------
  // 4. MOCKED-TRANSACTION SERVICE & WORKER TESTS (0 SQL CONNECTIONS)
  // -----------------------------------------------------------------
  installMockDatabaseModule();
  const loyaltyService = require('../src/services/loyalty.service');
  const worker = require('../src/jobs/processLoyaltyCycle');

  await asyncTest('SVC-01: awardOrderPurchasePoints short-circuits idempotently when idempotency_key already exists', async () => {
    const queries = [];
    const { tx, FakeRequest } = makeFakeTransaction(async (sqlText, params) => {
      queries.push({ sqlText, params });
      if (sqlText.includes('FROM point_transactions WHERE idempotency_key')) {
        return { recordset: [{ id: 88 }] };
      }
      throw new Error('Should not execute INSERT/UPDATE after idempotency match');
    });

    const OrigReq = sql.Request;
    sql.Request = FakeRequest;
    try {
      const res = await loyaltyService.awardOrderPurchasePoints(tx, {
        orderId: 5001,
        userId: 12,
        eligibleAmount: 1000000
      });
      assert.strictEqual(res.idempotent, true);
      assert.strictEqual(res.pointsAwarded, 0);
      assert.strictEqual(queries.length, 1);
    } finally {
      sql.Request = OrigReq;
    }
  });

  await asyncTest('SVC-02: awardOrderPurchasePoints creates ledger + batch + cycle update inside caller transaction', async () => {
    const executed = [];
    const { tx, FakeRequest } = makeFakeTransaction(async (sqlText, params) => {
      executed.push({ sqlText, params });
      if (sqlText.includes('FROM point_transactions WHERE idempotency_key')) {
        return { recordset: [] };
      }
      if (sqlText.includes('SELECT GETDATE() AS db_now')) {
        return { recordset: [{ db_now: utc('2026-04-01T10:00:00Z') }] };
      }
      if (sqlText.includes('FROM user_points_wallets WITH (UPDLOCK, ROWLOCK)')) {
        return {
          recordset: [{
            user_id: 12,
            available_points: 500,
            lifetime_earned_points: 500,
            lifetime_redeemed_points: 0,
            tier_code: 'MEMBER',
            cycle_anchor_at: utc('2026-02-01T00:00:00Z'),
            cycle_start_at: utc('2026-02-01T00:00:00Z'),
            cycle_end_at: utc('2027-02-01T00:00:00Z'),
            cycle_number: 1,
            qualifying_points_cycle: 500
          }]
        };
      }
      if (sqlText.includes('INSERT INTO point_transactions')) {
        return { recordset: [{ id: 701 }] };
      }
      if (sqlText.includes('INSERT INTO loyalty_point_batches')) {
        return { recordset: [{ id: 801 }] };
      }
      if (sqlText.includes('UPDATE user_points_wallets')) {
        return { recordset: [], rowsAffected: [1] };
      }
      throw new Error(`Unexpected SQL: ${sqlText}`);
    });

    const OrigReq = sql.Request;
    sql.Request = FakeRequest;
    try {
      const res = await loyaltyService.awardOrderPurchasePoints(tx, {
        orderId: 5002,
        userId: 12,
        eligibleAmount: 20000 // 3% = 600 points -> 500 + 600 = 1100 -> SILVER
      });
      assert.strictEqual(res.idempotent, false);
      assert.strictEqual(res.pointsAwarded, 600);
      assert.strictEqual(res.transactionId, 701);
      assert.strictEqual(res.batchId, 801);
      assert.strictEqual(res.newBalance, 1100);
      assert.strictEqual(res.tierCode, 'SILVER');
      assert.strictEqual(res.qualifyingPointsCycle, 1100);

      const batchCall = executed.find((q) => q.sqlText.includes('INSERT INTO loyalty_point_batches'));
      assert.ok(batchCall, 'Must insert loyalty_point_batches row');
      assert.strictEqual(batchCall.params.txId, 701);
      assert.strictEqual(batchCall.params.initPts, 600);
      assert.strictEqual(batchCall.params.expiresAt.toISOString(), '2027-04-01T10:00:00.000Z');
    } finally {
      sql.Request = OrigReq;
    }
  });

  await asyncTest('SVC-03: redeemVoucher deducts batches FEFO and rolls back transaction if SQL fails mid-flight', async () => {
    const txStateRef = { rolledBack: false, committed: false };
    const FakeTx = class {
      async begin() {}
      async commit() { txStateRef.committed = true; }
      async rollback() { txStateRef.rolledBack = true; }
    };
    const OrigTx = sql.Transaction;
    const OrigReq = sql.Request;
    activePoolFactory = () => ({ isMockPool: true });
    sql.Transaction = FakeTx;
    sql.Request = class {
      constructor() { this.params = {}; }
      input(k, t, v) { this.params[k] = v === undefined ? t : v; return this; }
      async query(sqlText) {
        if (sqlText.includes('SELECT GETDATE()')) return { recordset: [{ db_now: utc('2026-04-01T00:00:00Z') }] };
        if (sqlText.includes('FROM point_reward_rules')) {
          return {
            recordset: [{
              id: 1, title: 'Voucher 50k', reward_type: 'VOUCHER_FIXED',
              points_required: 500, discount_value: 50000, min_order_value: 200000,
              max_discount_amount: 50000, voucher_valid_days: 30, is_active: true,
              stock_quantity: 10, redeemed_count: 0
            }]
          };
        }
        if (sqlText.includes('FROM user_points_wallets')) {
          return { recordset: [{ user_id: 5, available_points: 700, lifetime_redeemed_points: 0, tier_code: 'MEMBER' }] };
        }
        if (sqlText.includes('FROM loyalty_point_batches')) {
          return {
            recordset: [
              { id: 11, remaining_points: 200, expires_at: utc('2026-08-01T00:00:00Z'), status: 'ACTIVE' },
              { id: 12, remaining_points: 500, expires_at: utc('2027-01-01T00:00:00Z'), status: 'ACTIVE' }
            ]
          };
        }
        if (sqlText.includes('UPDATE loyalty_point_batches')) {
          return { recordset: [], rowsAffected: [1] };
        }
        if (sqlText.includes('INSERT INTO vouchers')) {
          throw new Error('Simulated voucher insert failure');
        }
        return { recordset: [], rowsAffected: [1] };
      }
    };

    try {
      await assert.rejects(
        () => loyaltyService.redeemVoucher(5, 1),
        /Simulated voucher insert failure/
      );
      assert.strictEqual(txStateRef.rolledBack, true);
      assert.strictEqual(txStateRef.committed, false);
    } finally {
      sql.Transaction = OrigTx;
      sql.Request = OrigReq;
      activePoolFactory = null;
    }
  });

  await asyncTest('WRK-01: expireSingleBatch writes POINT_EXPIRATION EXP_BATCH_{id}, rolls back safely on throw & retries idempotently', async () => {
    const dbState = {
      walletAvailable: 800,
      batchStatus: 'ACTIVE',
      batchRemaining: 300,
      ledgerCount: 0
    };
    const OrigTx = sql.Transaction;
    const OrigReq = sql.Request;

    const runWithFailure = (shouldFailOnBatchUpdate) => {
      const staged = { ...dbState };
      let rolledBack = false;
      sql.Transaction = class {
        async begin() {}
        async commit() {
          dbState.walletAvailable = staged.walletAvailable;
          dbState.batchStatus = staged.batchStatus;
          dbState.batchRemaining = staged.batchRemaining;
          dbState.ledgerCount = staged.ledgerCount;
        }
        async rollback() { rolledBack = true; }
      };
      sql.Request = class {
        constructor() { this.params = {}; }
        input(k, t, v) { this.params[k] = v === undefined ? t : v; return this; }
        async query(sqlText) {
          if (sqlText.includes('FROM user_points_wallets')) {
            return { recordset: [{ user_id: 77, available_points: staged.walletAvailable }] };
          }
          if (sqlText.includes('FROM loyalty_point_batches')) {
            return {
              recordset: [{
                id: 901, user_id: 77, initial_points: 300, remaining_points: staged.batchRemaining,
                status: staged.batchStatus, expires_at: utc('2026-01-01T00:00:00Z')
              }]
            };
          }
          if (sqlText.includes('FROM point_transactions WHERE idempotency_key')) {
            return { recordset: staged.ledgerCount > 0 ? [{ id: 1 }] : [] };
          }
          if (sqlText.includes('UPDATE user_points_wallets')) {
            staged.walletAvailable = this.params.avail;
            return { recordset: [] };
          }
          if (sqlText.includes('INSERT INTO point_transactions')) {
            assert.strictEqual(this.params.idem, 'EXP_BATCH_901');
            staged.ledgerCount++;
            return { recordset: [] };
          }
          if (sqlText.includes('UPDATE loyalty_point_batches')) {
            if (shouldFailOnBatchUpdate) throw new Error('Simulated crash mid-batch');
            staged.batchStatus = 'EXPIRED';
            staged.batchRemaining = 0;
            return { recordset: [] };
          }
          return { recordset: [] };
        }
      };
      return () => rolledBack;
    };

    try {
      const wasRolledBack = runWithFailure(true);
      await assert.rejects(
        () => worker.expireSingleBatch({}, 901, 77, utc('2026-05-01T00:00:00Z')),
        /Simulated crash mid-batch/
      );
      assert.strictEqual(wasRolledBack(), true);
      assert.strictEqual(dbState.walletAvailable, 800);
      assert.strictEqual(dbState.batchStatus, 'ACTIVE');
      assert.strictEqual(dbState.ledgerCount, 0);

      runWithFailure(false);
      const retryRes = await worker.expireSingleBatch({}, 901, 77, utc('2026-05-01T00:00:00Z'));
      assert.strictEqual(retryRes.expired, true);
      assert.strictEqual(retryRes.pointsExpired, 300);
      assert.strictEqual(dbState.walletAvailable, 500);
      assert.strictEqual(dbState.batchStatus, 'EXPIRED');
      assert.strictEqual(dbState.ledgerCount, 1);

      // Second retry must be idempotent no-op because status === 'EXPIRED'
      const dupRes = await worker.expireSingleBatch({}, 901, 77, utc('2026-05-01T00:00:00Z'));
      assert.strictEqual(dupRes.expired, false);
      assert.strictEqual(dupRes.skipped, true);
      assert.strictEqual(dbState.walletAvailable, 500);
    } finally {
      sql.Transaction = OrigTx;
      sql.Request = OrigReq;
    }
  });

  // Verify app.config & db-guard paths resolve validly without connecting
  assert.ok(require(appConfigPath));
  assert.ok(require(dbGuardPath));

  const backfill = require('../src/jobs/backfillLoyaltyHistory');

  // Helper to run mocked redeemVoucher tests cleanly
  async function runMockedRedeemScenario(nowTs, { walletAvail, batches, failOnBatchUpdate = false }) {
    const txStateRef = { rolledBack: false, committed: false, queries: [] };
    const FakeTx = class {
      async begin() {}
      async commit() { txStateRef.committed = true; }
      async rollback() { txStateRef.rolledBack = true; }
    };
    const OrigTx = sql.Transaction;
    const OrigReq = sql.Request;
    activePoolFactory = () => ({ isMockPool: true });
    sql.Transaction = FakeTx;
    sql.Request = class {
      constructor() { this.params = {}; }
      input(k, t, v) { this.params[k] = v === undefined ? t : v; return this; }
      async query(sqlText) {
        txStateRef.queries.push({ sqlText, params: { ...this.params } });
        if (sqlText.includes('FROM point_reward_rules')) {
          return {
            recordset: [{
              id: 1, title: 'Voucher 50k', reward_type: 'VOUCHER',
              points_required: 500, discount_type: 'fixed_amount', discount_value: 50000,
              min_order_amount: 200000, max_discount_amount: 50000, voucher_valid_days: 30,
              is_active: true, stock_quantity: 100
            }]
          };
        }
        if (sqlText.includes('FROM user_points_wallets')) {
          return { recordset: [{ user_id: 5, available_points: walletAvail, lifetime_redeemed_points: 0, tier_code: 'MEMBER' }] };
        }
        if (sqlText.includes('FROM loyalty_point_batches')) {
          assert.ok(sqlText.includes('expires_at > @nowTs'), 'redeemVoucher must filter unexpired batches in SQL');
          const cutoff = this.params.nowTs.getTime();
          return {
            recordset: batches.filter((b) => b.status === 'ACTIVE' && b.remaining_points > 0 && b.expires_at.getTime() > cutoff)
          };
        }
        if (sqlText.includes('UPDATE loyalty_point_batches')) {
          assert.ok(sqlText.includes('expires_at > @nowTs'), 'UPDATE batch must also guard expires_at > @nowTs');
          return { recordset: [], rowsAffected: [failOnBatchUpdate ? 0 : 1] };
        }
        if (sqlText.includes('SELECT 1 FROM vouchers')) return { recordset: [] };
        if (sqlText.includes('INSERT INTO vouchers')) return { recordset: [{ id: 88 }] };
        if (sqlText.includes('INSERT INTO voucher_redemptions')) return { recordset: [{ id: 99 }] };
        return { recordset: [], rowsAffected: [1] };
      }
    };
    try {
      const result = await loyaltyService.redeemVoucher(5, 1, { nowOverride: nowTs });
      return { result, txStateRef };
    } catch (err) {
      return { error: err, txStateRef };
    } finally {
      sql.Transaction = OrigTx;
      sql.Request = OrigReq;
      activePoolFactory = null;
    }
  }

  await asyncTest('SVC-04: redeemVoucher rejects expired batches even when wallet.available_points still holds old balance', async () => {
    const out = await runMockedRedeemScenario(utc('2026-06-01T00:00:00Z'), {
      walletAvail: 900,
      batches: [{ id: 1, remaining_points: 900, expires_at: utc('2026-05-01T00:00:00Z'), status: 'ACTIVE' }]
    });
    assert.ok(out.error && /Số dư điểm không đủ/.test(out.error.message));
    assert.strictEqual(out.txStateRef.rolledBack, true);
    assert.strictEqual(out.txStateRef.committed, false);
  });

  await asyncTest('SVC-05: redeemVoucher skips expired batch & drains valid unexpired batches FEFO using consistent nowTs', async () => {
    const nowTs = utc('2026-06-01T00:00:00Z');
    const out = await runMockedRedeemScenario(nowTs, {
      walletAvail: 1000,
      batches: [
        { id: 1, remaining_points: 400, expires_at: utc('2026-05-01T00:00:00Z'), status: 'ACTIVE' },
        { id: 2, remaining_points: 200, expires_at: utc('2026-07-01T00:00:00Z'), status: 'ACTIVE' },
        { id: 3, remaining_points: 400, expires_at: utc('2026-09-01T00:00:00Z'), status: 'ACTIVE' }
      ]
    });
    assert.ok(!out.error, out.error && out.error.message);
    assert.strictEqual(out.txStateRef.committed, true);
    assert.deepStrictEqual(out.result.fefoDeductions, [
      { id: 2, take: 200, newRemaining: 0, newStatus: 'EXHAUSTED' },
      { id: 3, take: 300, newRemaining: 100, newStatus: 'ACTIVE' }
    ]);
  });

  await asyncTest('SVC-06: Concurrent batch exhaustion during redeemVoucher (rowsAffected=0) rolls back cleanly', async () => {
    const out = await runMockedRedeemScenario(utc('2026-06-01T00:00:00Z'), {
      walletAvail: 700,
      batches: [{ id: 2, remaining_points: 700, expires_at: utc('2026-09-01T00:00:00Z'), status: 'ACTIVE' }],
      failOnBatchUpdate: true
    });
    assert.ok(out.error && /Không thể khấu trừ lô điểm/.test(out.error.message));
    assert.strictEqual(out.txStateRef.rolledBack, true);
    assert.strictEqual(out.txStateRef.committed, false);
  });

  await asyncTest('SVC-07: Standalone awardOrderPurchasePoints(orderId) rejects non-COMPLETED or UNPAID order', async () => {
    const txStateRef = { rolledBack: false, committed: false };
    const OrigTx = sql.Transaction;
    const OrigReq = sql.Request;
    activePoolFactory = () => ({ isMockPool: true });
    sql.Transaction = class {
      async begin() {}
      async commit() { txStateRef.committed = true; }
      async rollback() { txStateRef.rolledBack = true; }
    };
    sql.Request = class {
      input() { return this; }
      async query() {
        return { recordset: [{ user_id: 9, subtotal: 1000000, discount_amount: 0, order_status: 'PENDING', payment_status: 'UNPAID' }] };
      }
    };
    try {
      await assert.rejects(
        () => loyaltyService.awardOrderPurchasePoints(777),
        /chưa hoàn tất và thanh toán/
      );
      assert.strictEqual(txStateRef.rolledBack, true);
      assert.strictEqual(txStateRef.committed, false);
    } finally {
      sql.Transaction = OrigTx;
      sql.Request = OrigReq;
      activePoolFactory = null;
    }
  });

  await asyncTest('BF-06: Backfill APPLY locks wallets FIRST in tx, re-reads ledger & rolls back if mutation/anomaly detected', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDbTest = process.env.DB_TEST_NAME;
    process.env.NODE_ENV = 'test';
    process.env.DB_TEST_NAME = 'vamos_store_test_db';
    const appCfg = require(appConfigPath);
    const origDbName = appCfg.db.database;
    appCfg.db.database = 'vamos_store_test_db';

    const OrigPool = sql.ConnectionPool;
    const OrigTx = sql.Transaction;
    const OrigReq = sql.Request;
    let lockReleased = false;
    let txRolledBack = false;
    let insertsAttempted = 0;

    // Simulate concurrent mutation injected right when transaction holds wallet lock
    let concurrentEarnInjected = false;
    let walletLockedBeforeNowFetch = false;
    let walletLockSeen = false;
    sql.ConnectionPool = class {
      async connect() {}
      async close() { lockReleased = true; }
      request() {
        return {
          input() { return this; },
          async query() { return { recordset: [{ lock_result: 0 }] }; }
        };
      }
    };
    sql.Transaction = class {
      async begin() {}
      async commit() { throw new Error('APPLY must not commit when mutated snapshot disagrees'); }
      async rollback() { txRolledBack = true; }
    };
    sql.Request = class {
      input() { return this; }
      async query(sqlText) {
        if (sqlText.includes('FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK)')) {
          walletLockSeen = true;
          return { recordset: [{ user_id: 21, available_points: 500, tier_code: 'MEMBER' }] };
        }
        if (sqlText.includes('SELECT GETDATE() AS db_now')) {
          walletLockedBeforeNowFetch = walletLockSeen;
          return { recordset: [{ db_now: utc('2026-06-01T00:00:00Z') }] };
        }
        if (sqlText.includes('FROM point_transactions WITH (HOLDLOCK)')) {
          const base = [{ id: 1, user_id: 21, transaction_type: 'ORDER_PURCHASE', amount: 500, reference_type: 'ORDER', reference_id: '1', created_at: utc('2026-01-01T00:00:00Z') }];
          if (concurrentEarnInjected) {
            base.push({ id: 2, user_id: 21, transaction_type: 'ORDER_PURCHASE', amount: 300, reference_type: 'ORDER', reference_id: '2', created_at: utc('2026-01-02T00:00:00Z') });
          }
          return { recordset: base };
        }
        if (sqlText.includes('FROM loyalty_point_batches WITH (HOLDLOCK)')) {
          return { recordset: [] };
        }
        if (sqlText.includes('INSERT INTO loyalty_point_batches') || sqlText.includes('UPDATE user_points_wallets')) {
          insertsAttempted++;
        }
        return { recordset: [] };
      }
    };
    activePoolFactory = () => ({
      request: () => ({
        input() { return this; },
        async query() { throw new Error('APPLY must not fetch db_now outside locked transaction'); }
      })
    });

    try {
      const res = await backfill.runLoyaltyBackfill({
        apply: true,
        confirmApply: true,
        testHooks: {
          afterWalletLockInApply: async () => { concurrentEarnInjected = true; }
        }
      });
      assert.strictEqual(res.status, 'ABORTED_PREFLIGHT_FAILED');
      assert.strictEqual(res.applied, false);
      assert.strictEqual(walletLockedBeforeNowFetch, true);
      assert.strictEqual(txRolledBack, true);
      assert.strictEqual(insertsAttempted, 0);
      assert.strictEqual(lockReleased, true);
    } finally {
      sql.ConnectionPool = OrigPool;
      sql.Transaction = OrigTx;
      sql.Request = OrigReq;
      activePoolFactory = null;
      appCfg.db.database = origDbName;
      if (origNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = origNodeEnv;
      if (origDbTest === undefined) delete process.env.DB_TEST_NAME; else process.env.DB_TEST_NAME = origDbTest;
    }
  });

  await asyncTest('BF-07: Backfill DRY_RUN makes zero writes and APPLY without --confirm-apply throws guard error', async () => {
    await assert.rejects(
      () => backfill.runLoyaltyBackfill({ apply: true, confirmApply: false }),
      /BACKFILL GUARD/
    );

    const queriesExecuted = [];
    activePoolFactory = () => ({
      request: () => ({
        async query(sqlText) {
          queriesExecuted.push(sqlText);
          if (sqlText.includes('SELECT GETDATE()')) return { recordset: [{ db_now: utc('2026-06-01T00:00:00Z') }] };
          if (sqlText.includes('FROM user_points_wallets')) return { recordset: [{ user_id: 1, available_points: 0, tier_code: 'MEMBER' }] };
          return { recordset: [] };
        }
      })
    });
    try {
      const dryRes = await backfill.runLoyaltyBackfill({ apply: false });
      assert.strictEqual(dryRes.mode, 'DRY_RUN');
      assert.strictEqual(dryRes.status, 'DRY_RUN_READY');
      assert.strictEqual(dryRes.applied, false);
      assert.ok(queriesExecuted.every((q) => !/\b(INSERT|UPDATE|DELETE)\b/i.test(q)));
    } finally {
      activePoolFactory = null;
    }
  });

  // Helper for getRewardsCenterData() + rewards.pug render tests without real SQL Server
  async function runMockedRewardsCenter({ nowTs, availablePoints, allBatches }) {
    activeQueryHandler = async (sqlText, params) => {
      if (sqlText.includes('FROM user_points_wallets')) {
        return {
          recordset: [{
            user_id: 5,
            available_points: availablePoints,
            lifetime_earned_points: 1000,
            lifetime_redeemed_points: 0,
            tier_code: 'MEMBER',
            cycle_anchor_at: utc('2026-01-01T00:00:00Z'),
            cycle_number: 1,
            cycle_start_at: utc('2026-01-01T00:00:00Z'),
            cycle_end_at: utc('2027-01-01T00:00:00Z'),
            qualifying_points_cycle: 1000
          }]
        };
      }
      if (sqlText.includes('SELECT GETDATE() AS db_now')) {
        return { recordset: [{ db_now: nowTs }] };
      }
      if (sqlText.includes('FROM point_reward_rules')) {
        return {
          recordset: [{
            id: 1, title: 'Voucher 700', reward_type: 'VOUCHER', points_required: 700,
            discount_type: 'fixed_amount', discount_value: 50000, min_order_amount: 0,
            voucher_valid_days: 30, stock_quantity: 15, is_active: true
          }]
        };
      }
      if (sqlText.includes('FROM loyalty_point_batches')) {
        assert.ok(sqlText.includes('expires_at > @nowTs'), 'getRewardsCenterData must filter expires_at > @nowTs');
        const cutoff = params.nowTs.getTime();
        return {
          recordset: allBatches
            .filter((b) => b.status === 'ACTIVE' && b.remaining_points > 0 && b.expires_at.getTime() > cutoff)
            .sort((a, b) => a.expires_at.getTime() - b.expires_at.getTime() || a.id - b.id)
        };
      }
      return { recordset: [] };
    };
    try {
      const data = await loyaltyService.getRewardsCenterData(5);
      const html = pug.renderFile(path.resolve(__dirname, '../src/views/pages/account/rewards.pug'), {
        title: 'Test', activeNav: 'rewards', user: { id: 5, full_name: 'Tester', email: 't@v.vn' },
        wallet: data.wallet, rewardRules: data.rewardRules, history: [], myVouchers: [],
        csrfToken: 'tok', successMsg: null, errorMsg: null,
        t: (k, d) => d || k, lang: 'vi', currentPath: '/account/rewards',
        success_msg: '', error_msg: '', categories: [], brands: [],
        cartCount: 0, wishlistCount: 0, wishlistIds: []
      });
      return { data, html };
    } finally {
      activeQueryHandler = null;
    }
  }

  await asyncTest('SVC-08: Rewards UI shows 600 usable_points when wallet=1000 has 400 expired + 600 valid (worker not run)', async () => {
    const nowTs = utc('2026-06-01T00:00:00Z');
    const { data, html } = await runMockedRewardsCenter({
      nowTs,
      availablePoints: 1000,
      allBatches: [
        { id: 1, remaining_points: 400, expires_at: utc('2026-05-01T00:00:00Z'), status: 'ACTIVE' },
        { id: 2, remaining_points: 600, expires_at: utc('2026-09-01T00:00:00Z'), status: 'ACTIVE' }
      ]
    });
    assert.strictEqual(data.wallet.available_points, 1000);
    assert.strictEqual(data.wallet.usable_points, 600);
    assert.strictEqual(data.wallet.expired_pending_points, 400);
    assert.strictEqual(data.wallet.nextExpiringBatch.id, 2);
    assert.ok(html.includes('600'));
    assert.ok(html.includes('Thiếu 100 điểm còn hạn'));
    assert.ok(!html.includes('1.000 ĐIỂM KHẢ DỤNG'));
  });

  await asyncTest('SVC-09: Rewards UI shows 0 usable_points when all batches expired & wallet balance stale', async () => {
    const nowTs = utc('2026-06-01T00:00:00Z');
    const { data, html } = await runMockedRewardsCenter({
      nowTs,
      availablePoints: 1000,
      allBatches: [
        { id: 1, remaining_points: 400, expires_at: utc('2026-05-01T00:00:00Z'), status: 'ACTIVE' },
        { id: 2, remaining_points: 600, expires_at: utc('2026-06-01T00:00:00Z'), status: 'ACTIVE' }
      ]
    });
    assert.strictEqual(data.wallet.usable_points, 0);
    assert.strictEqual(data.wallet.nextExpiringBatch, null);
    assert.ok(html.includes('Thiếu 700 điểm còn hạn'));
  });

  await asyncTest('SVC-10: Rewards UI sums multiple valid batches accurately (300 + 500 = 800)', async () => {
    const nowTs = utc('2026-06-01T00:00:00Z');
    const { data, html } = await runMockedRewardsCenter({
      nowTs,
      availablePoints: 800,
      allBatches: [
        { id: 10, remaining_points: 300, expires_at: utc('2026-07-01T00:00:00Z'), status: 'ACTIVE' },
        { id: 11, remaining_points: 500, expires_at: utc('2026-10-01T00:00:00Z'), status: 'ACTIVE' }
      ]
    });
    assert.strictEqual(data.wallet.usable_points, 800);
    assert.strictEqual(data.wallet.expired_pending_points, 0);
    assert.strictEqual(data.wallet.nextExpiringBatch.id, 10);
    assert.ok(html.includes('ĐỔI VOUCHER NGAY'));
  });

  await asyncTest('SVC-11: Rewards UI after worker already swept expired batch shows exact 600 without double deduction', async () => {
    const nowTs = utc('2026-06-01T00:00:00Z');
    const { data } = await runMockedRewardsCenter({
      nowTs,
      availablePoints: 600,
      allBatches: [
        { id: 1, remaining_points: 0, expires_at: utc('2026-05-01T00:00:00Z'), status: 'EXPIRED' },
        { id: 2, remaining_points: 600, expires_at: utc('2026-09-01T00:00:00Z'), status: 'ACTIVE' }
      ]
    });
    assert.strictEqual(data.wallet.available_points, 600);
    assert.strictEqual(data.wallet.usable_points, 600);
    assert.strictEqual(data.wallet.expired_pending_points, 0);
  });

  assertSummary();
}

main().catch((err) => {
  console.error('[FATAL UNIT TEST ERROR]:', err);
  process.exitCode = 1;
});
