const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');

async function seedCustomer() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Seed] Skipping customer seed in production environment.');
    return;
  }

  const hash = await bcrypt.hash('123456', 10);
  const res = await query("SELECT id FROM users WHERE email = 'khachhang@vamos.vn'");
  if (res.recordset.length === 0) {
    await query(`
      INSERT INTO users (email, password_hash, full_name, phone, role, status)
      VALUES ('khachhang@vamos.vn', @hash, N'Nguyễn Văn Khách', '0905123456', 'CUSTOMER', 'active')
    `, { hash });
    console.log('Customer seeded: khachhang@vamos.vn (Development test account)');
  } else {
    console.log('Customer already exists');
  }
}

if (require.main === module) {
  seedCustomer()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error seeding customer:', err);
      process.exit(1);
    });
}

module.exports = { seedCustomer };

