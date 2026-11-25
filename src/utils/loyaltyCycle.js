/**
 * Pure Domain Engine for VAMOS CLUB:
 * - 12-Month Tier Cycle (immutable cycle_anchor_at, leap-year safe)
 * - Soft Landing (max 1-tier downgrade per ended cycle)
 * - 365-Day Point Batches & FEFO (First-Expiring First-Out)
 * - Pure Historical Ledger Replay for Safe Backfill Verification
 *
 * Zero database or network side effects.
 */

const TIER_ORDER = ['MEMBER', 'SILVER', 'GOLD', 'VIP'];

const TIER_THRESHOLDS = {
  MEMBER: { name: 'VAMOS Member', min: 0, next: 'SILVER', nextMin: 1000, icon: '🥉' },
  SILVER: { name: 'VAMOS Silver', min: 1000, next: 'GOLD', nextMin: 2500, icon: '🥈' },
  GOLD: { name: 'VAMOS Gold', min: 2500, next: 'VIP', nextMin: 5000, icon: '🥇' },
  VIP: { name: 'VAMOS VIP Elite', min: 5000, next: null, nextMin: null, icon: '👑' }
};

const ELIGIBLE_CYCLE_EARN_TYPES = new Set(['REVIEW_REWARD', 'ORDER_PURCHASE']);
const TYPES_REQUIRING_REFERENCE = new Set([
  'REVIEW_REWARD',
  'ORDER_PURCHASE',
  'VOUCHER_REDEMPTION',
  'POINT_EXPIRATION'
]);

const EXPIRATION_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDate(value, label = 'timestamp') {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid Date for ${label}`);
    }
    return new Date(value.getTime());
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  throw new Error(`Invalid ${label}: expected Date or valid timestamp`);
}

/**
 * Add calendar years from an immutable anchor timestamp using UTC components
 * (matches SQL Server DATETIME2 + DATEADD(year, n, anchor) without Feb 29 drift).
 */
function addYearsFromAnchor(anchorInput, years) {
  const anchor = toUtcDate(anchorInput, 'cycle_anchor_at');
  if (!Number.isSafeInteger(years) || years < 0) {
    throw new Error(`Invalid years offset: ${years}`);
  }
  const targetYear = anchor.getUTCFullYear() + years;
  const month = anchor.getUTCMonth();
  const maxDayInTargetMonth = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(anchor.getUTCDate(), maxDayInTargetMonth);

  return new Date(Date.UTC(
    targetYear,
    month,
    clampedDay,
    anchor.getUTCHours(),
    anchor.getUTCMinutes(),
    anchor.getUTCSeconds(),
    anchor.getUTCMilliseconds()
  ));
}

function addDaysUTC(dateInput, days = EXPIRATION_DAYS) {
  const base = toUtcDate(dateInput, 'created_at');
  return new Date(base.getTime() + days * MS_PER_DAY);
}

function computeCycleBounds(anchorInput, cycleNumber) {
  if (!Number.isSafeInteger(cycleNumber) || cycleNumber < 1) {
    throw new Error(`cycleNumber must be >= 1, got ${cycleNumber}`);
  }
  const anchor = toUtcDate(anchorInput, 'cycle_anchor_at');
  return {
    cycle_start_at: addYearsFromAnchor(anchor, cycleNumber - 1),
    cycle_end_at: addYearsFromAnchor(anchor, cycleNumber)
  };
}

function calculateTier(qualifyingPoints) {
  const points = Number(qualifyingPoints) || 0;
  if (points >= 5000) return 'VIP';
  if (points >= 2500) return 'GOLD';
  if (points >= 1000) return 'SILVER';
  return 'MEMBER';
}

function normalizeTier(tierCode) {
  return TIER_THRESHOLDS[tierCode] ? tierCode : 'MEMBER';
}

function maxTier(tierA, tierB) {
  const idxA = TIER_ORDER.indexOf(normalizeTier(tierA));
  const idxB = TIER_ORDER.indexOf(normalizeTier(tierB));
  return TIER_ORDER[Math.max(idxA, idxB)];
}

/**
 * Soft Landing evaluation at cycle end:
 * - If earned qualifying points meet or exceed current tier threshold -> keep/upgrade to earned tier
 * - Otherwise drop at most 1 tier (VIP -> GOLD -> SILVER -> MEMBER -> MEMBER)
 */
function evaluateCycleEndTier(currentTier, qualifyingPointsInCycle) {
  const normalizedCurrent = normalizeTier(currentTier);
  const currentIdx = TIER_ORDER.indexOf(normalizedCurrent);
  const earnedTier = calculateTier(qualifyingPointsInCycle);
  const earnedIdx = TIER_ORDER.indexOf(earnedTier);

  if (earnedIdx >= currentIdx) {
    return earnedTier;
  }
  return TIER_ORDER[Math.max(0, currentIdx - 1)];
}

/**
 * Advance all cycles whose end timestamp has passed strictly before asOfDate
 * (boundary rule: created_at <= cycle_end_at belongs to ending cycle; > cycle_end_at belongs to next cycle).
 */
function rolloverCyclesThroughTimestamp(wallet, asOfInput) {
  const asOf = toUtcDate(asOfInput, 'asOfDate');
  const cycleNumber = Number(wallet.cycle_number || 0);
  const currentTier = normalizeTier(wallet.tier_code);
  const currentQualifying = Math.max(0, Number(wallet.qualifying_points_cycle || 0));

  if (!wallet.cycle_anchor_at || cycleNumber === 0) {
    return {
      changed: false,
      cyclesProcessed: 0,
      tier_code: currentTier,
      cycle_anchor_at: null,
      cycle_number: 0,
      cycle_start_at: null,
      cycle_end_at: null,
      qualifying_points_cycle: 0,
      history: []
    };
  }

  const anchor = toUtcDate(wallet.cycle_anchor_at, 'cycle_anchor_at');
  let activeCycleNumber = cycleNumber;
  let activeTier = currentTier;
  let activeQualifying = currentQualifying;
  let bounds = wallet.cycle_end_at && wallet.cycle_start_at
    ? {
        cycle_start_at: toUtcDate(wallet.cycle_start_at, 'cycle_start_at'),
        cycle_end_at: toUtcDate(wallet.cycle_end_at, 'cycle_end_at')
      }
    : computeCycleBounds(anchor, activeCycleNumber);

  const history = [];

  while (asOf.getTime() > bounds.cycle_end_at.getTime()) {
    const nextTier = evaluateCycleEndTier(activeTier, activeQualifying);
    history.push({
      endedCycleNumber: activeCycleNumber,
      cycleStartAt: bounds.cycle_start_at,
      cycleEndAt: bounds.cycle_end_at,
      qualifyingPoints: activeQualifying,
      tierBefore: activeTier,
      tierAfter: nextTier
    });

    activeTier = nextTier;
    activeQualifying = 0;
    activeCycleNumber += 1;
    bounds = computeCycleBounds(anchor, activeCycleNumber);
  }

  return {
    changed: history.length > 0,
    cyclesProcessed: history.length,
    tier_code: activeTier,
    cycle_anchor_at: anchor,
    cycle_number: activeCycleNumber,
    cycle_start_at: bounds.cycle_start_at,
    cycle_end_at: bounds.cycle_end_at,
    qualifying_points_cycle: activeQualifying,
    history
  };
}

/**
 * Compute updated wallet cycle & tier state for a positive points credit.
 * Only REVIEW_REWARD and ORDER_PURCHASE with amount > 0 activate/advance cycle and increase qualifying_points_cycle.
 */
function applyPositiveEarnToWallet(wallet, amount, txTimeInput, transactionType) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(`Positive earn amount must be a positive integer, got ${amount}`);
  }
  const txTime = toUtcDate(txTimeInput, 'txTime');
  const isQualifyingType = ELIGIBLE_CYCLE_EARN_TYPES.has(transactionType);

  if (!isQualifyingType) {
    return {
      activatedCycle: false,
      cyclesProcessed: 0,
      tier_code: normalizeTier(wallet.tier_code),
      cycle_anchor_at: wallet.cycle_anchor_at ? toUtcDate(wallet.cycle_anchor_at, 'cycle_anchor_at') : null,
      cycle_number: Number(wallet.cycle_number || 0),
      cycle_start_at: wallet.cycle_start_at ? toUtcDate(wallet.cycle_start_at, 'cycle_start_at') : null,
      cycle_end_at: wallet.cycle_end_at ? toUtcDate(wallet.cycle_end_at, 'cycle_end_at') : null,
      qualifying_points_cycle: Math.max(0, Number(wallet.qualifying_points_cycle || 0))
    };
  }

  if (!wallet.cycle_anchor_at || Number(wallet.cycle_number || 0) === 0) {
    const firstBounds = computeCycleBounds(txTime, 1);
    const upgradedTier = maxTier(wallet.tier_code, calculateTier(amount));
    return {
      activatedCycle: true,
      cyclesProcessed: 0,
      tier_code: upgradedTier,
      cycle_anchor_at: txTime,
      cycle_number: 1,
      cycle_start_at: firstBounds.cycle_start_at,
      cycle_end_at: firstBounds.cycle_end_at,
      qualifying_points_cycle: amount
    };
  }

  const rolled = rolloverCyclesThroughTimestamp(wallet, txTime);
  const newQualifying = rolled.qualifying_points_cycle + amount;
  const upgradedTier = maxTier(rolled.tier_code, calculateTier(newQualifying));

  return {
    activatedCycle: false,
    cyclesProcessed: rolled.cyclesProcessed,
    tier_code: upgradedTier,
    cycle_anchor_at: rolled.cycle_anchor_at,
    cycle_number: rolled.cycle_number,
    cycle_start_at: rolled.cycle_start_at,
    cycle_end_at: rolled.cycle_end_at,
    qualifying_points_cycle: newQualifying
  };
}

function getUnexpiredActiveBatches(batches, nowInput = null) {
  const nowMs = nowInput !== undefined && nowInput !== null
    ? toUtcDate(nowInput, 'now').getTime()
    : null;

  return [...batches]
    .filter((b) => {
      if (b.status !== 'ACTIVE' || Number(b.remaining_points) <= 0) {
        return false;
      }
      if (nowMs !== null) {
        return toUtcDate(b.expires_at, 'expires_at').getTime() > nowMs;
      }
      return true;
    })
    .sort((a, b) => {
      const diff = toUtcDate(a.expires_at, 'expires_at').getTime() - toUtcDate(b.expires_at, 'expires_at').getTime();
      if (diff !== 0) return diff;
      return Number(a.id) - Number(b.id);
    });
}

function summarizeUsablePoints(batches, nowInput, walletAvailablePoints = null) {
  const validBatches = getUnexpiredActiveBatches(batches, nowInput);
  const batchUsableSum = validBatches.reduce((sum, b) => sum + Number(b.remaining_points || 0), 0);
  const usablePoints = walletAvailablePoints !== null && walletAvailablePoints !== undefined
    ? Math.min(Math.max(0, Number(walletAvailablePoints) || 0), batchUsableSum)
    : batchUsableSum;

  return {
    usablePoints,
    batchUsableSum,
    validBatches,
    nextExpiringBatch: validBatches[0] || null
  };
}

/**
 * Plan FEFO deduction across active, unexpired point batches sorted by (expires_at ASC, id ASC).
 * Throws if unexpired active batch supply cannot cover pointsRequired.
 */
function planFefoDeduction(batches, pointsRequired, options = {}) {
  if (!Number.isSafeInteger(pointsRequired) || pointsRequired <= 0) {
    throw new Error(`pointsRequired must be a positive integer, got ${pointsRequired}`);
  }

  const sortedActive = getUnexpiredActiveBatches(batches, options.now ?? null);

  let needed = pointsRequired;
  const deductions = [];

  for (const batch of sortedActive) {
    if (needed === 0) break;
    const avail = Number(batch.remaining_points);
    const take = Math.min(avail, needed);
    const newRemaining = avail - take;
    deductions.push({
      id: batch.id,
      take,
      newRemaining,
      newStatus: newRemaining === 0 ? 'EXHAUSTED' : 'ACTIVE'
    });
    needed -= take;
  }

  if (needed > 0) {
    throw new Error(
      `Điểm khả dụng trong các lô điểm không đủ để khấu trừ (thiếu ${needed} điểm). Giao dịch bị từ chối để bảo toàn toàn vẹn sổ cái.`
    );
  }

  return {
    deductions,
    totalDeducted: pointsRequired
  };
}

/**
 * Pure historical ledger replay for safe Backfill preflight & dry-run verification.
 * Never invents batches, never modifies wallet balances, never skips negative transactions.
 */
function replayUserHistory({ userId, wallet, transactions, existingBatchesCount = 0, now }) {
  const asOf = toUtcDate(now, 'now');
  const sortedTxs = [...transactions].sort((a, b) => {
    const timeDiff = toUtcDate(a.created_at, 'tx.created_at').getTime() - toUtcDate(b.created_at, 'tx.created_at').getTime();
    if (timeDiff !== 0) return timeDiff;
    return Number(a.id) - Number(b.id);
  });

  const anomalies = [];
  const seenIdempotencyKeys = new Set();
  const batches = [];

  let simWallet = {
    tier_code: 'MEMBER',
    cycle_anchor_at: null,
    cycle_number: 0,
    cycle_start_at: null,
    cycle_end_at: null,
    qualifying_points_cycle: 0
  };

  if (existingBatchesCount > 0) {
    anomalies.push({
      code: 'EXISTING_BATCHES_PRESENT',
      message: `User ${userId} already has ${existingBatchesCount} batch records in loyalty_point_batches.`
    });
  }

  for (const tx of sortedTxs) {
    if (tx.idempotency_key) {
      if (seenIdempotencyKeys.has(tx.idempotency_key)) {
        anomalies.push({
          code: 'DUPLICATE_IDEMPOTENCY_KEY',
          txId: tx.id,
          message: `Duplicate idempotency_key "${tx.idempotency_key}" at tx #${tx.id}`
        });
      }
      seenIdempotencyKeys.add(tx.idempotency_key);
    }

    if (TYPES_REQUIRING_REFERENCE.has(tx.transaction_type) && (!tx.reference_type || !tx.reference_id)) {
      anomalies.push({
        code: 'MISSING_REFERENCE',
        txId: tx.id,
        message: `Transaction #${tx.id} (${tx.transaction_type}) is missing reference_type or reference_id`
      });
    }

    const txTime = toUtcDate(tx.created_at, `tx#${tx.id}.created_at`);
    const amount = Number(tx.amount);

    if (amount > 0) {
      const expiresAt = addDaysUTC(txTime, EXPIRATION_DAYS);
      batches.push({
        id: batches.length + 1,
        transaction_id: tx.id,
        initial_points: amount,
        remaining_points: amount,
        expires_at: expiresAt,
        status: 'ACTIVE',
        created_at: txTime
      });

      const nextCycleState = applyPositiveEarnToWallet(simWallet, amount, txTime, tx.transaction_type);
      simWallet = {
        tier_code: nextCycleState.tier_code,
        cycle_anchor_at: nextCycleState.cycle_anchor_at,
        cycle_number: nextCycleState.cycle_number,
        cycle_start_at: nextCycleState.cycle_start_at,
        cycle_end_at: nextCycleState.cycle_end_at,
        qualifying_points_cycle: nextCycleState.qualifying_points_cycle
      };
    } else if (amount < 0) {
      let needed = Math.abs(amount);
      if (tx.transaction_type === 'POINT_EXPIRATION' && tx.reference_type === 'POINT_BATCH') {
        const target = batches.find((b) => String(b.id) === String(tx.reference_id) || String(b.transaction_id) === String(tx.reference_id));
        if (!target || target.remaining_points < needed) {
          anomalies.push({
            code: 'EXPIRATION_TARGET_MISMATCH',
            txId: tx.id,
            message: `POINT_EXPIRATION tx #${tx.id} cannot reconcile against target batch`
          });
        } else {
          target.remaining_points -= needed;
          if (target.remaining_points === 0) target.status = 'EXPIRED';
          needed = 0;
        }
      } else {
        try {
          const plan = planFefoDeduction(batches, needed);
          for (const d of plan.deductions) {
            const target = batches.find((b) => b.id === d.id);
            target.remaining_points = d.newRemaining;
            target.status = d.newStatus;
          }
          needed = 0;
        } catch (err) {
          anomalies.push({
            code: 'NEGATIVE_TX_INSUFFICIENT_BATCHES',
            txId: tx.id,
            message: `Tx #${tx.id} (${tx.transaction_type}, ${amount}) exceeds available active batch points`
          });
        }
      }
    }
  }

  const replayedAvailable = batches
    .filter((b) => b.status === 'ACTIVE')
    .reduce((sum, b) => sum + b.remaining_points, 0);

  const walletAvailable = Number(wallet.available_points || 0);
  if (replayedAvailable !== walletAvailable) {
    anomalies.push({
      code: 'WALLET_REPLAY_MISMATCH',
      message: `Replayed batch remaining sum (${replayedAvailable}) does not match wallet.available_points (${walletAvailable})`
    });
  }

  const finalCycleState = rolloverCyclesThroughTimestamp(simWallet, asOf);
  const expiredDueBatches = batches.filter(
    (b) => b.status === 'ACTIVE' && b.remaining_points > 0 && b.expires_at.getTime() <= asOf.getTime()
  );

  return {
    userId,
    reconciled: anomalies.length === 0,
    anomalies,
    ledgerCount: sortedTxs.length,
    walletAvailable,
    replayedAvailable,
    expiredDueBatchesCount: expiredDueBatches.length,
    expiredDuePoints: expiredDueBatches.reduce((sum, b) => sum + b.remaining_points, 0),
    batches,
    cycleState: {
      tier_code: finalCycleState.tier_code,
      cycle_anchor_at: finalCycleState.cycle_anchor_at,
      cycle_number: finalCycleState.cycle_number,
      cycle_start_at: finalCycleState.cycle_start_at,
      cycle_end_at: finalCycleState.cycle_end_at,
      qualifying_points_cycle: finalCycleState.qualifying_points_cycle
    }
  };
}

module.exports = {
  TIER_ORDER,
  TIER_THRESHOLDS,
  ELIGIBLE_CYCLE_EARN_TYPES,
  EXPIRATION_DAYS,
  toUtcDate,
  addYearsFromAnchor,
  addDaysUTC,
  computeCycleBounds,
  calculateTier,
  normalizeTier,
  maxTier,
  evaluateCycleEndTier,
  rolloverCyclesThroughTimestamp,
  applyPositiveEarnToWallet,
  getUnexpiredActiveBatches,
  summarizeUsablePoints,
  planFefoDeduction,
  replayUserHistory
};
