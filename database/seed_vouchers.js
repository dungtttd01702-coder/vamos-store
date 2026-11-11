const { query } = require('../src/config/database');

async function seedVouchers() {
  const vouchers = [
    {
      code: 'VAMOS50K',
      name: 'Giảm 50.000đ cho đơn từ 500k',
      discount_type: 'fixed_amount',
      discount_value: 50000,
      min_order_value: 500000,
      max_discount_amount: 50000,
      start_date: '2025-01-01',
      end_date: '2027-12-31',
      usage_limit: 1000,
      used_count: 0,
      is_active: 1,
    },
    {
      code: 'VAMOS100',
      name: 'Giảm 100.000đ cho đơn từ 1 triệu',
      discount_type: 'fixed_amount',
      discount_value: 100000,
      min_order_value: 1000000,
      max_discount_amount: 100000,
      start_date: '2025-01-01',
      end_date: '2027-12-31',
      usage_limit: 500,
      used_count: 0,
      is_active: 1,
    },
    {
      code: 'FREESHIP',
      name: 'Miễn phí vận chuyển cho đơn từ 300k',
      discount_type: 'fixed_amount',
      discount_value: 30000,
      min_order_value: 300000,
      max_discount_amount: 30000,
      start_date: '2025-01-01',
      end_date: '2027-12-31',
      usage_limit: 1000,
      used_count: 0,
      is_active: 1,
    },
  ];

  for (const v of vouchers) {
    const existing = await query('SELECT id FROM vouchers WHERE code = @code', { code: v.code });
    if (existing.recordset.length === 0) {
      await query(`
        INSERT INTO vouchers (
          code, name, discount_type, discount_value, min_order_value,
          max_discount_amount, start_date, end_date, usage_limit, used_count, is_active
        )
        VALUES (
          @code, @name, @discount_type, @discount_value, @min_order_value,
          @max_discount_amount, @start_date, @end_date, @usage_limit, @used_count, @is_active
        )
      `, v);
      console.log(`Seeded voucher: ${v.code}`);
    }
  }
}

seedVouchers()
  .then(() => {
    console.log('Vouchers seed completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding vouchers:', err);
    process.exit(1);
  });
