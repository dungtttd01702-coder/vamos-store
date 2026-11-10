const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');

async function seedCustomer() {
  const hash = await bcrypt.hash('123456', 10);
  const res = await query("SELECT id FROM users WHERE email = 'khachhang@vamos.vn'");
  if (res.recordset.length === 0) {
    await query(`
      INSERT INTO users (email, password_hash, full_name, phone, role, status)
      VALUES ('khachhang@vamos.vn', @hash, N'Nguyễn Văn Khách', '0905123456', 'CUSTOMER', 'ACTIVE')
    `, { hash });
    console.log('Customer seeded: khachhang@vamos.vn / 123456');
  } else {
    console.log('Customer already exists');
  }
}

seedCustomer()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error seeding customer:', err);
    process.exit(1);
  });

