const sql = require('mssql');
const config = require('../src/config/app.config');

const productsData = [
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-01',
    name: 'Giày Sneaker Nam Vamos Air Wave V1',
    slug: 'giay-sneaker-nam-vamos-air-wave-v1',
    description: 'Chất liệu da tổng hợp cao cấp kết hợp đệm khí Air Wave êm ái, nâng đỡ bàn chân tối ưu cho mọi chuyển động hàng ngày. Đế cao su chịu mài mòn cao chống trơn trượt hiệu quả.',
    gender_target: 'MEN',
    base_price: 850000,
    sale_price: 699000,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 15, sku: 'VM-SNK-01-39-BLK' },
      { size: '40', color: 'Đen', stock: 20, sku: 'VM-SNK-01-40-BLK' },
      { size: '41', color: 'Đen', stock: 18, sku: 'VM-SNK-01-41-BLK' },
      { size: '42', color: 'Đen', stock: 10, sku: 'VM-SNK-01-42-BLK' },
      { size: '40', color: 'Trắng', stock: 25, sku: 'VM-SNK-01-40-WHT' },
      { size: '41', color: 'Trắng', stock: 30, sku: 'VM-SNK-01-41-WHT' },
      { size: '42', color: 'Trắng', stock: 12, sku: 'VM-SNK-01-42-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-02',
    name: 'Giày Sneaker Vamos Retro Classic 1988',
    slug: 'giay-sneaker-vamos-retro-classic-1988',
    description: 'Phong cách cổ điển retro thập niên 80s, thiết kế tối giản dễ phối đồ cùng quần jeans hay quần short. Lót giày thoáng khí khử mùi hiệu quả.',
    gender_target: 'MEN',
    base_price: 750000,
    sale_price: 599000,
    images: [
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 14, sku: 'VM-SNK-02-39-WHT' },
      { size: '40', color: 'Trắng', stock: 22, sku: 'VM-SNK-02-40-WHT' },
      { size: '41', color: 'Trắng', stock: 18, sku: 'VM-SNK-02-41-WHT' },
      { size: '42', color: 'Xám', stock: 8, sku: 'VM-SNK-02-42-GRY' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-03',
    name: 'Giày Sneaker Nữ Vamos Pastel Cloud',
    slug: 'giay-sneaker-nu-vamos-pastel-cloud',
    description: 'Thiết kế thanh thoát với gam màu pastel trẻ trung, đế độn 4cm tôn dáng tự nhiên và đệm lót siêu êm ái cho phái đẹp.',
    gender_target: 'WOMEN',
    base_price: 790000,
    sale_price: 650000,
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 15, sku: 'VM-SNK-03-38-WHT' },
      { size: '39', color: 'Trắng', stock: 20, sku: 'VM-SNK-03-39-WHT' },
      { size: '40', color: 'Trắng', stock: 12, sku: 'VM-SNK-03-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-active',
    product_code: 'VM-SNK-04',
    name: 'Giày Nữ Cổ Thấp Vamos Street Walk',
    slug: 'giay-nu-co-thap-vamos-street-walk',
    description: 'Kiểu dáng sneaker năng động, trọng lượng nhẹ nhàng chỉ 280g/chiếc, phù hợp cho bạn gái đi học, đi làm và dạo phố hàng ngày.',
    gender_target: 'WOMEN',
    base_price: 680000,
    sale_price: 520000,
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Đen', stock: 10, sku: 'VM-SNK-04-38-BLK' },
      { size: '39', color: 'Đen', stock: 15, sku: 'VM-SNK-04-39-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-01',
    name: 'Giày Chạy Bộ Vamos Speed Runner Pro',
    slug: 'giay-chay-bo-vamos-speed-runner-pro',
    description: 'Đột phá với công nghệ dệt Fly-Knit thông thoáng khí tối đa, đế giữa EVA đàn hồi cao giúp hoàn trả lực trong từng sải chân chạy bộ.',
    gender_target: 'UNISEX',
    base_price: 950000,
    sale_price: 799000,
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Xanh Navy', stock: 12, sku: 'VM-SPT-01-39-NVY' },
      { size: '40', color: 'Xanh Navy', stock: 18, sku: 'VM-SPT-01-40-NVY' },
      { size: '41', color: 'Xanh Navy', stock: 22, sku: 'VM-SPT-01-41-NVY' },
      { size: '42', color: 'Xanh Navy', stock: 16, sku: 'VM-SPT-01-42-NVY' },
      { size: '40', color: 'Đen', stock: 20, sku: 'VM-SPT-01-40-BLK' },
      { size: '41', color: 'Đen', stock: 25, sku: 'VM-SPT-01-41-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-02',
    name: 'Giày Tập Gym & Kháng Lực Vamos Training X',
    slug: 'giay-tap-gym-vamos-training-x',
    description: 'Đế bằng bản rộng vững chắc hỗ trợ squat và deadlift tối đa, cổ giày ôm sát bảo vệ mắt cá chân chống lật chấn thương khi tập luyện nặng.',
    gender_target: 'MEN',
    base_price: 890000,
    sale_price: null,
    images: [
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 15, sku: 'VM-SPT-02-40-BLK' },
      { size: '41', color: 'Đen', stock: 18, sku: 'VM-SPT-02-41-BLK' },
      { size: '42', color: 'Đen', stock: 12, sku: 'VM-SPT-02-42-BLK' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-01',
    name: 'Sandal Quai Dù Vamos Street Active',
    slug: 'sandal-quai-du-vamos-street-active',
    description: 'Chất liệu quai dù dù cao cấp bền chắc, mau khô khi gặp nước mưa. Đế cao su đúc nguyên khối chống trơn trượt lý tưởng cho thời tiết nhiệt đới.',
    gender_target: 'UNISEX',
    base_price: 420000,
    sale_price: 350000,
    images: [
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Đen', stock: 20, sku: 'VM-SDL-01-38-BLK' },
      { size: '39', color: 'Đen', stock: 25, sku: 'VM-SDL-01-39-BLK' },
      { size: '40', color: 'Đen', stock: 30, sku: 'VM-SDL-01-40-BLK' },
      { size: '41', color: 'Đen', stock: 25, sku: 'VM-SDL-01-41-BLK' },
      { size: '42', color: 'Đen', stock: 15, sku: 'VM-SDL-01-42-BLK' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-02',
    name: 'Dép Quai Ngang Vamos Slide Comfort',
    slug: 'dep-quai-ngang-vamos-slide-comfort',
    description: 'Đế đúc xốp EVA siêu êm ái đàn hồi, quai ngang ôm chân chống nước 100%, tiện lợi mang hàng ngày hoặc đi biển.',
    gender_target: 'UNISEX',
    base_price: 250000,
    sale_price: 199000,
    images: [
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 30, sku: 'VM-SDL-02-39-BLK' },
      { size: '40', color: 'Đen', stock: 35, sku: 'VM-SDL-02-40-BLK' },
      { size: '41', color: 'Đen', stock: 40, sku: 'VM-SDL-02-41-BLK' },
      { size: '40', color: 'Trắng', stock: 25, sku: 'VM-SDL-02-40-WHT' },
    ]
  }
];

async function seed() {
  try {
    const pool = await sql.connect(config.db);
    console.log('Connected to MSSQL. Seeding products...');

    // Fetch lookup maps
    const catRes = await pool.request().query('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(catRes.recordset.map(c => [c.slug, c.id]));

    const brandRes = await pool.request().query('SELECT id, slug FROM brands');
    const brandMap = Object.fromEntries(brandRes.recordset.map(b => [b.slug, b.id]));

    const sizeRes = await pool.request().query('SELECT id, size_name FROM sizes');
    const sizeMap = Object.fromEntries(sizeRes.recordset.map(s => [s.size_name, s.id]));

    const colorRes = await pool.request().query('SELECT id, color_name FROM colors');
    const colorMap = Object.fromEntries(colorRes.recordset.map(c => [c.color_name, c.id]));

    for (const prod of productsData) {
      const categoryId = catMap[prod.category_slug];
      const brandId = brandMap[prod.brand_slug] || null;

      // Check if product exists
      const checkRes = await pool.request()
        .input('code', prod.product_code)
        .query('SELECT id FROM products WHERE product_code = @code');

      let productId;
      if (checkRes.recordset.length === 0) {
        const insertProd = await pool.request()
          .input('categoryId', categoryId)
          .input('brandId', brandId)
          .input('code', prod.product_code)
          .input('name', prod.name)
          .input('slug', prod.slug)
          .input('desc', prod.description)
          .input('gender', prod.gender_target)
          .input('basePrice', prod.base_price)
          .input('salePrice', prod.sale_price)
          .query(`
            INSERT INTO products (category_id, brand_id, product_code, name, slug, description, gender_target, base_price, sale_price, status)
            OUTPUT INSERTED.id
            VALUES (@categoryId, @brandId, @code, @name, @slug, @desc, @gender, @basePrice, @salePrice, 'active')
          `);
        productId = insertProd.recordset[0].id;
        console.log(`Inserted product: ${prod.name} (ID: ${productId})`);
      } else {
        productId = checkRes.recordset[0].id;
      }

      // Insert images
      for (let i = 0; i < prod.images.length; i++) {
        const imgUrl = prod.images[i];
        const isPrimary = i === 0 ? 1 : 0;
        await pool.request()
          .input('prodId', productId)
          .input('imgUrl', imgUrl)
          .input('isPrimary', isPrimary)
          .input('order', i)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @prodId AND image_url = @imgUrl)
            BEGIN
              INSERT INTO product_images (product_id, image_url, is_primary, display_order)
              VALUES (@prodId, @imgUrl, @isPrimary, @order)
            END
          `);
      }

      // Insert variants
      for (const v of prod.variants) {
        const sizeId = sizeMap[v.size];
        const colorId = colorMap[v.color];
        if (sizeId && colorId) {
          await pool.request()
            .input('prodId', productId)
            .input('sizeId', sizeId)
            .input('colorId', colorId)
            .input('sku', v.sku)
            .input('stock', v.stock)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = @sku)
              BEGIN
                INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
                VALUES (@prodId, @sizeId, @colorId, @sku, @stock, 'active')
              END
            `);
        }
      }
    }

    console.log('✅ All sample products, images, and variants seeded successfully!');
    if (require.main === module) {
      await pool.close();
      process.exit(0);
    }
  } catch (err) {
    console.error('SEEDING_ERROR:', err.message);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw err;
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seedProducts: seed };

