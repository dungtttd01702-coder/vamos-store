/**
 * Zero-DB Unit & View Contract Suite: MEDIUM-01 True Free Shipping
 * Verifies shared pricing engine, legacy fixed_amount compatibility, migration 007 DDL guards,
 * and Pug rendering across checkout, rewards, customer order detail, and admin views.
 */

require('./test_bootstrap');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pug = require('pug');

const orderService = require('../src/services/order.service');
const loyaltyService = require('../src/services/loyalty.service');

const freeShippingVoucher = {
  code: 'VAMOSCLUB-FREESHIP-TEST',
  discount_type: 'free_shipping',
  discount_value: 40000,
  min_order_value: 200000,
  max_discount_amount: 40000
};

const legacyFixedVoucher = {
  code: 'VAMOSCLUB-LEGACY-FIXED40',
  discount_type: 'fixed_amount',
  discount_value: 40000,
  min_order_value: 200000,
  max_discount_amount: 40000
};

const basePugLocals = {
  csrfToken: 'unit_csrf_token',
  t: (_k, def) => def,
  currentLocale: 'vi',
  currentPath: '/',
  isAuthenticated: true,
  isAdmin: false,
  isCustomer: true,
  user: { id: 1, full_name: 'Nguyen Van A', email: 'test@vamos.vn', role: 'CUSTOMER' },
  cartCount: 1,
  wishlistCount: 0
};

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

console.log('===============================================================');
console.log('   VAMOS STORE - MEDIUM-01 TRUE FREE SHIPPING UNIT TEST SUITE');
console.log('===============================================================');

test('TC01-UNIT: Subtotal 300,000 + Ship 30,000 -> shippingDiscount=30,000, productDiscount=0, total=300,000', () => {
  const res = orderService.calculateOrderPricing({ subtotal: 300000, shippingFee: 30000, voucher: freeShippingVoucher });
  assert.strictEqual(res.discountAmount, 0);
  assert.strictEqual(res.shippingDiscountAmount, 30000);
  assert.strictEqual(res.finalShippingFee, 0);
  assert.strictEqual(res.totalAmount, 300000);
});

test('TC02-UNIT: Subtotal 450,000 + Ship 30,000 -> shippingDiscount=30,000, productDiscount=0, total=450,000', () => {
  const res = orderService.calculateOrderPricing({ subtotal: 450000, shippingFee: 30000, voucher: freeShippingVoucher });
  assert.strictEqual(res.discountAmount, 0);
  assert.strictEqual(res.shippingDiscountAmount, 30000);
  assert.strictEqual(res.totalAmount, 450000);
});

test('TC03-UNIT: Subtotal 490,000 + Ship 30,000 -> shippingDiscount=30,000, productDiscount=0, total=490,000', () => {
  const res = orderService.calculateOrderPricing({ subtotal: 490000, shippingFee: 30000, voucher: freeShippingVoucher });
  assert.strictEqual(res.discountAmount, 0);
  assert.strictEqual(res.shippingDiscountAmount, 30000);
  assert.strictEqual(res.totalAmount, 490000);
});

test('TC04-UNIT: Subtotal 500,000 (shippingFee=0) throws exact free-shipping rejection message', () => {
  assert.throws(
    () => orderService.calculateOrderPricing({ subtotal: 500000, shippingFee: 0, voucher: freeShippingVoucher }),
    /Đơn hàng của bạn đã được miễn phí vận chuyển\. Voucher này không thể áp dụng\./
  );
});

test('TC05-UNIT: Subtotal 600,000 (shippingFee=0) rejects FREE_SHIPPING without modifying subtotal', () => {
  assert.throws(
    () => orderService.calculateOrderPricing({ subtotal: 600000, shippingFee: 0, voucher: freeShippingVoucher }),
    /Đơn hàng của bạn đã được miễn phí vận chuyển\. Voucher này không thể áp dụng\./
  );
});

test('TC06-UNIT: Higher shippingFee 50,000 caps shippingDiscount at 40,000', () => {
  const res = orderService.calculateOrderPricing({ subtotal: 450000, shippingFee: 50000, voucher: freeShippingVoucher });
  assert.strictEqual(res.discountAmount, 0);
  assert.strictEqual(res.shippingDiscountAmount, 40000);
  assert.strictEqual(res.finalShippingFee, 10000);
  assert.strictEqual(res.totalAmount, 460000);
});

test('TC07-UNIT: Subtotal 190,000 (< 200,000 min_order_value) is rejected cleanly', () => {
  assert.throws(
    () => orderService.calculateOrderPricing({ subtotal: 190000, shippingFee: 30000, voucher: freeShippingVoucher }),
    /tối thiểu từ 200[.,]000 đ/
  );
});

test('TC12-UNIT: Legacy fixed_amount 40,000 voucher preserves old semantics on subtotal even when shippingFee=0', () => {
  const res = orderService.calculateOrderPricing({ subtotal: 600000, shippingFee: 0, voucher: legacyFixedVoucher });
  assert.strictEqual(res.discountAmount, 40000);
  assert.strictEqual(res.shippingDiscountAmount, 0);
  assert.strictEqual(res.totalAmount, 560000);
});

test('TC17-UNIT: Integer rounding and never-negative total even when fixed discount >= subtotal', () => {
  const bigLegacy = { code: 'BIG', discount_type: 'fixed_amount', discount_value: 500000, min_order_value: 0, max_discount_amount: 500000 };
  const res = orderService.calculateOrderPricing({ subtotal: 350000, shippingFee: 30000, voucher: bigLegacy });
  assert.strictEqual(res.discountAmount, 350000);
  assert.strictEqual(res.shippingDiscountAmount, 0);
  assert.strictEqual(res.totalAmount, 30000);
});

test('MIG-007: Migration 007 DDL is idempotent, extends discount_type, adds shipping_discount_amount DEFAULT 0, no bulk voucher update', () => {
  const migSql = fs.readFileSync(path.resolve(__dirname, '../database/migrations/007_vamos_club_true_free_shipping.sql'), 'utf8');
  assert.ok(migSql.includes("'free_shipping'"), 'Must allow free_shipping in vouchers check constraint');
  assert.ok(migSql.includes("COL_LENGTH('orders', 'shipping_discount_amount') IS NULL"), 'Must guard orders column add');
  assert.ok(migSql.includes('DEFAULT 0'), 'Must default historical orders shipping_discount_amount to 0');
  assert.ok(migSql.includes('shipping_discount_amount <= shipping_fee'), 'Must constrain shipping discount <= shipping fee');
  assert.ok(!/UPDATE\s+vouchers/i.test(migSql), 'Must never bulk convert existing vouchers');
  assert.ok(!/UPDATE\s+orders/i.test(migSql), 'Must never rewrite historical orders');
});

test('UI-RENDER: Checkout, Rewards, Order Detail, Admin Order Detail, and Vouchers views render shipping discount cleanly', () => {
  const checkoutHtml = pug.renderFile(path.resolve(__dirname, '../src/views/pages/checkout/index.pug'), {
    ...basePugLocals,
    title: 'Checkout',
    items: [{ product_name: 'Stride X1', color_name: 'Đen', size_name: '41', quantity: 1, line_total: 300000 }],
    subtotal: 300000,
    shippingFee: 30000,
    totalAmount: 330000,
    addresses: [],
    formData: {}
  });
  assert.ok(checkoutHtml.includes('applyCheckoutVoucher()'));
  assert.ok(checkoutHtml.includes('/checkout/apply-voucher'));
  assert.ok(checkoutHtml.includes('Giảm phí vận chuyển (Voucher):'));

  const rewardsHtml = pug.renderFile(path.resolve(__dirname, '../src/views/pages/account/rewards.pug'), {
    ...basePugLocals,
    title: 'Rewards',
    wallet: {
      available_points: 600,
      usable_points: 600,
      lifetime_earned_points: 600,
      lifetime_redeemed_points: 0,
      tier_code: 'MEMBER',
      cycle_number: 1,
      cycle_start_at: new Date(),
      cycle_end_at: new Date(),
      qualifying_points_cycle: 600,
      ...loyaltyService.getTierMetrics('MEMBER', 600)
    },
    rewardRules: [],
    history: [],
    myVouchers: [
      { rule_title: 'Voucher Miễn Phí Vận Chuyển', redemption_status: 'AVAILABLE', voucher_code: 'VAMOSCLUB-NEWFS', discount_type: 'free_shipping', discount_value: 40000, max_discount_amount: 40000, min_order_value: 200000, redeemed_at: new Date(), end_date: new Date() },
      { rule_title: 'Voucher Miễn Phí Vận Chuyển', redemption_status: 'AVAILABLE', voucher_code: 'VAMOSCLUB-OLDFX', discount_type: 'fixed_amount', discount_value: 40000, max_discount_amount: 40000, min_order_value: 200000, redeemed_at: new Date(), end_date: new Date() }
    ]
  });
  assert.ok(rewardsHtml.includes('phí vận chuyển cho đơn từ 200.000 đ'));
  assert.ok(rewardsHtml.includes('Giảm 40.000 đ cho đơn từ 200.000 đ'));

  const sampleOrderFs = {
    id: 10,
    order_code: 'VAM260101-1001',
    created_at: new Date(),
    order_status: 'COMPLETED',
    payment_status: 'PAID',
    recipient_name_snapshot: 'Test User',
    recipient_phone_snapshot: '0912345678',
    delivery_address_snapshot: 'HCM',
    subtotal: 300000,
    discount_amount: 0,
    shipping_fee: 30000,
    shipping_discount_amount: 30000,
    total_amount: 300000,
    items: [{ product_name_snapshot: 'Shoe', color_snapshot: 'Đen', size_snapshot: '41', sku_snapshot: 'SKU', unit_price: 300000, quantity: 1, line_total: 300000 }],
    histories: []
  };
  const historicalOrder = { ...sampleOrderFs, id: 9, order_code: 'VAM260101-0999', shipping_discount_amount: 0, discount_amount: 40000, total_amount: 290000 };

  const custOrderHtml = pug.renderFile(path.resolve(__dirname, '../src/views/pages/account/order-detail.pug'), { ...basePugLocals, title: 'Order', order: sampleOrderFs });
  assert.ok(custOrderHtml.includes('Giảm phí vận chuyển (Voucher):'));
  const custHistHtml = pug.renderFile(path.resolve(__dirname, '../src/views/pages/account/order-detail.pug'), { ...basePugLocals, title: 'Hist', order: historicalOrder });
  assert.ok(!custHistHtml.includes('Giảm phí vận chuyển (Voucher):'));

  const adminOrderHtml = pug.renderFile(path.resolve(__dirname, '../src/views/pages/admin/order-detail.pug'), { ...basePugLocals, isAdmin: true, isCustomer: false, title: 'Admin Order', order: sampleOrderFs });
  assert.ok(adminOrderHtml.includes('Giảm phí vận chuyển (Voucher):'));

  const adminVouchersHtml = pug.renderFile(path.resolve(__dirname, '../src/views/pages/admin/vouchers.pug'), {
    ...basePugLocals,
    isAdmin: true,
    isCustomer: false,
    title: 'Admin Vouchers',
    vouchers: [{ id: 1, code: 'VAMOSCLUB-FS', name: 'FreeShip', discount_type: 'free_shipping', discount_value: 40000, min_order_value: 200000, used_count: 0, usage_limit: 1, start_date: new Date(), end_date: new Date(), is_active: true }]
  });
  assert.ok(adminVouchersHtml.includes('Miễn phí vận chuyển'));
});

console.log(`\n[MEDIUM-01 FREE SHIPPING UNIT SUITE]: ALL ${passed}/11 TESTS PASSED!`);
