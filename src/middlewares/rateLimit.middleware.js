/**
 * In-Memory Sliding-Window Rate Limiter for Sensitive Operations
 * Defends against brute-force, voucher enumeration, and rapid-fire automated attacks
 * Zero external dependencies.
 */

class MemoryRateLimiter {
  constructor({ windowMs = 60 * 1000, maxAttempts = 5, message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
    this.message = message;
    this.attempts = new Map(); // key -> [timestamps]

    // Periodic cleanup of stale keys to avoid unbounded memory growth
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.attempts.entries()) {
        const valid = timestamps.filter(t => now - t < this.windowMs);
        if (valid.length === 0) {
          this.attempts.delete(key);
        } else {
          this.attempts.set(key, valid);
        }
      }
    }, Math.max(windowMs, 60000));
    if (timer.unref) timer.unref();
  }

  isLimited(key) {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.windowMs);
    this.attempts.set(key, valid);
    return valid.length >= this.maxAttempts;
  }

  recordAttempt(key) {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.windowMs);
    valid.push(now);
    this.attempts.set(key, valid);
  }

  reset(key) {
    this.attempts.delete(key);
  }
}

// Limit failed voucher attempts to max 5 within 60s per client (anti-brute-force enumeration)
const voucherLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxAttempts: 5,
  message: 'Bạn đã thử áp dụng mã giảm giá không hợp lệ quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại.'
});

// Limit voucher redemptions to max 10 within 60s per client
const redeemLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxAttempts: 10,
  message: 'Bạn đang thực hiện thao tác đổi thưởng quá nhanh. Vui lòng chờ 1 phút trước khi tiếp tục.'
});

module.exports = {
  MemoryRateLimiter,
  voucherLimiter,
  redeemLimiter
};
