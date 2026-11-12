const sql = require('mssql');
const config = require('../src/config/app.config');

const productsData = [
  // ── 1. SNEAKER NAM (6 SẢN PHẨM) ──
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
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-05',
    name: 'Giày Sneaker Nam Vamos Chunky Horizon V2',
    slug: 'giay-sneaker-nam-vamos-chunky-horizon-v2',
    description: 'Thiết kế đế Chunky hầm hố chuẩn phong cách Streetwear đương đại. Đệm đế nâng chiều cao 5cm êm ái, bám sàn cực tốt cho chàng trai tự tin.',
    gender_target: 'MEN',
    base_price: 920000,
    sale_price: 780000,
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 16, sku: 'VM-SNK-05-39-BLK' },
      { size: '40', color: 'Đen', stock: 22, sku: 'VM-SNK-05-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SNK-05-41-BLK' },
      { size: '42', color: 'Đen', stock: 14, sku: 'VM-SNK-05-42-BLK' },
      { size: '43', color: 'Đen', stock: 10, sku: 'VM-SNK-05-43-BLK' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-06',
    name: 'Giày Sneaker Da Nam Vamos Minimalist White',
    slug: 'giay-sneaker-da-nam-vamos-minimalist-white',
    description: 'Da PU mềm thuần trắng tinh giản, đế cao su khâu chỉ viền chắc chắn, thanh lịch phù hợp môi trường công sở lẫn dạo phố cuối tuần.',
    gender_target: 'MEN',
    base_price: 890000,
    sale_price: 720000,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 18, sku: 'VM-SNK-06-39-WHT' },
      { size: '40', color: 'Trắng', stock: 25, sku: 'VM-SNK-06-40-WHT' },
      { size: '41', color: 'Trắng', stock: 20, sku: 'VM-SNK-06-41-WHT' },
      { size: '42', color: 'Trắng', stock: 15, sku: 'VM-SNK-06-42-WHT' },
      { size: '43', color: 'Trắng', stock: 12, sku: 'VM-SNK-06-43-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-07',
    name: 'Giày Cổ Cao Nam Vamos Street High Force',
    slug: 'giay-co-cao-nam-vamos-street-high-force',
    description: 'Thiết kế High-Top bảo vệ cổ chân, phối màu tương phản cá tính đậm chất hiphop đường phố, đệm lót memory foam đàn hồi vượt trội.',
    gender_target: 'MEN',
    base_price: 1150000,
    sale_price: 990000,
    images: [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 14, sku: 'VM-SNK-07-40-BLK' },
      { size: '41', color: 'Đen', stock: 18, sku: 'VM-SNK-07-41-BLK' },
      { size: '42', color: 'Đen', stock: 12, sku: 'VM-SNK-07-42-BLK' },
      { size: '43', color: 'Đen', stock: 8, sku: 'VM-SNK-07-43-BLK' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-active',
    product_code: 'VM-SNK-08',
    name: 'Giày Lười Sneaker Nam Vamos Slip-On Knit',
    slug: 'giay-luoi-sneaker-nam-vamos-slip-on-knit',
    description: 'Vải dệt co giãn 4 chiều thông thoáng tuyệt đối, không cần buộc dây, tiện lợi mang vào tháo ra trong 1 giây mà vẫn ôm khít mu bàn chân.',
    gender_target: 'MEN',
    base_price: 650000,
    sale_price: 499000,
    images: [
      'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Xám', stock: 15, sku: 'VM-SNK-08-39-GRY' },
      { size: '40', color: 'Xám', stock: 20, sku: 'VM-SNK-08-40-GRY' },
      { size: '41', color: 'Xám', stock: 22, sku: 'VM-SNK-08-41-GRY' },
      { size: '42', color: 'Xám', stock: 16, sku: 'VM-SNK-08-42-GRY' },
    ]
  },

  // ── 2. SNEAKER NỮ (6 SẢN PHẨM) ──
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
      { size: '40', color: 'Đen', stock: 18, sku: 'VM-SNK-04-40-BLK' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-09',
    name: 'Giày Sneaker Nữ Vamos Rose Blossom Chunky',
    slug: 'giay-sneaker-nu-vamos-rose-blossom-chunky',
    description: 'Tông màu hồng pastel kết hợp trắng tinh tế, đường cong uốn lượn thời thượng, đế tăng chiều cao nhẹ nhàng tôn dáng đôi chân thon thả.',
    gender_target: 'WOMEN',
    base_price: 860000,
    sale_price: 690000,
    images: [
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 18, sku: 'VM-SNK-09-38-WHT' },
      { size: '39', color: 'Trắng', stock: 24, sku: 'VM-SNK-09-39-WHT' },
      { size: '40', color: 'Trắng', stock: 15, sku: 'VM-SNK-09-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-10',
    name: 'Giày Sneaker Nữ Đế Cao Vamos Platform Soft',
    slug: 'giay-sneaker-nu-de-cao-vamos-platform-soft',
    description: 'Đế platform đúc nguyên khối siêu nhẹ, chất liệu da vi sợi kháng nước, dễ dàng lau chùi vệ sinh mỗi ngày.',
    gender_target: 'WOMEN',
    base_price: 790000,
    sale_price: 620000,
    images: [
      'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 14, sku: 'VM-SNK-10-38-WHT' },
      { size: '39', color: 'Trắng', stock: 20, sku: 'VM-SNK-10-39-WHT' },
      { size: '40', color: 'Trắng', stock: 16, sku: 'VM-SNK-10-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-active',
    product_code: 'VM-SNK-11',
    name: 'Giày Thể Thao Nữ Vamos Light Runner Air',
    slug: 'giay-the-thao-nu-vamos-light-runner-air',
    description: 'Trọng lượng siêu nhẹ chỉ 240g, đệm Air trợ lực gót chân, mang lại cảm giác êm như bước trên mây cho nàng năng động suốt cả ngày dài.',
    gender_target: 'WOMEN',
    base_price: 750000,
    sale_price: 580000,
    images: [
      'https://images.unsplash.com/photo-1588117260148-b47818741c74?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 12, sku: 'VM-SNK-11-38-WHT' },
      { size: '39', color: 'Trắng', stock: 18, sku: 'VM-SNK-11-39-WHT' },
      { size: '40', color: 'Trắng', stock: 14, sku: 'VM-SNK-11-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-12',
    name: 'Giày Sneaker Canvas Nữ Vamos Urban Vintage',
    slug: 'giay-sneaker-canvas-nu-vamos-urban-vintage',
    description: 'Vải canvas dệt sợi mộc phong cách vintage Nhật Bản, mũi giày bọc cao su chống va đập, phù hợp học sinh sinh viên phối đồ cực xinh.',
    gender_target: 'WOMEN',
    base_price: 590000,
    sale_price: 450000,
    images: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Đen', stock: 20, sku: 'VM-SNK-12-38-BLK' },
      { size: '39', color: 'Đen', stock: 25, sku: 'VM-SNK-12-39-BLK' },
      { size: '40', color: 'Đen', stock: 16, sku: 'VM-SNK-12-40-BLK' },
    ]
  },

  // ── 3. GIÀY THỂ THAO (6 SẢN PHẨM) ──
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
    sale_price: 749000,
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 15, sku: 'VM-SPT-02-40-BLK' },
      { size: '41', color: 'Đen', stock: 18, sku: 'VM-SPT-02-41-BLK' },
      { size: '42', color: 'Đen', stock: 12, sku: 'VM-SPT-02-42-BLK' },
      { size: '43', color: 'Đen', stock: 10, sku: 'VM-SPT-02-43-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-03',
    name: 'Giày Bóng Rổ Vamos Court Dominator Elite',
    slug: 'giay-bong-ro-vamos-court-dominator-elite',
    description: 'Đệm khí nén kép Zoom Air hỗ trợ bật nhảy tối đa, gai đế hoa văn xương cá bám sân gỗ và sân bê tông cực nhạy chống trơn trượt.',
    gender_target: 'MEN',
    base_price: 1290000,
    sale_price: 1099000,
    images: [
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Xanh Navy', stock: 14, sku: 'VM-SPT-03-40-NVY' },
      { size: '41', color: 'Xanh Navy', stock: 20, sku: 'VM-SPT-03-41-NVY' },
      { size: '42', color: 'Xanh Navy', stock: 16, sku: 'VM-SPT-03-42-NVY' },
      { size: '43', color: 'Xanh Navy', stock: 10, sku: 'VM-SPT-03-43-NVY' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-04',
    name: 'Giày Cầu Lông & Tennis Vamos Control Grip',
    slug: 'giay-cau-long-tennis-vamos-control-grip',
    description: 'Thân giày gia cố sợi TPU chống mài mòn mũi chân khi trượt cứu bóng. Đế cao su sống không để lại vệt sàn nhà thi đấu chuyên nghiệp.',
    gender_target: 'UNISEX',
    base_price: 880000,
    sale_price: 720000,
    images: [
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 15, sku: 'VM-SPT-04-39-WHT' },
      { size: '40', color: 'Trắng', stock: 22, sku: 'VM-SPT-04-40-WHT' },
      { size: '41', color: 'Trắng', stock: 18, sku: 'VM-SPT-04-41-WHT' },
      { size: '42', color: 'Trắng', stock: 14, sku: 'VM-SPT-04-42-WHT' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-05',
    name: 'Giày Đi Bộ Trợ Lực Vamos Walk Ease Cushion',
    slug: 'giay-di-bo-tro-luc-vamos-walk-ease-cushion',
    description: 'Thiết kế form công thái học nâng đỡ hõm chân, giảm áp lực lên khớp gối khi đi bộ đường dài hoặc đứng làm việc cả ngày.',
    gender_target: 'UNISEX',
    base_price: 690000,
    sale_price: 550000,
    images: [
      'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 18, sku: 'VM-SPT-05-39-BLK' },
      { size: '40', color: 'Đen', stock: 25, sku: 'VM-SPT-05-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SPT-05-41-BLK' },
      { size: '42', color: 'Đen', stock: 16, sku: 'VM-SPT-05-42-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-06',
    name: 'Giày Marathon Chuyên Nghiệp Vamos Pace Maker',
    slug: 'giay-marathon-chuyen-nghiep-vamos-pace-maker',
    description: 'Tấm đệm carbon trợ lực đàn hồi đẩy bàn chân về phía trước, vải dệt siêu mỏng thoát nhiệt nhanh trong suốt cự ly 42km.',
    gender_target: 'UNISEX',
    base_price: 1350000,
    sale_price: 1150000,
    images: [
      'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Xanh Navy', stock: 15, sku: 'VM-SPT-06-40-NVY' },
      { size: '41', color: 'Xanh Navy', stock: 22, sku: 'VM-SPT-06-41-NVY' },
      { size: '42', color: 'Xanh Navy', stock: 18, sku: 'VM-SPT-06-42-NVY' },
      { size: '43', color: 'Xanh Navy', stock: 12, sku: 'VM-SPT-06-43-NVY' },
    ]
  },

  // ── 4. SANDAL & DÉP (6 SẢN PHẨM) ──
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
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-03',
    name: 'Sandal Nam Dã Ngoại Vamos Trail Explorer',
    slug: 'sandal-nam-da-ngoai-vamos-trail-explorer',
    description: 'Khóa bấm tiện lợi điều chỉnh 3 vị trí, đế răng cưa sâu chống trượt tuyệt đối khi đi phượt, suối thác hoặc địa hình đá ghồ ghề.',
    gender_target: 'MEN',
    base_price: 480000,
    sale_price: 380000,
    images: [
      'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 20, sku: 'VM-SDL-03-39-BLK' },
      { size: '40', color: 'Đen', stock: 28, sku: 'VM-SDL-03-40-BLK' },
      { size: '41', color: 'Đen', stock: 25, sku: 'VM-SDL-03-41-BLK' },
      { size: '42', color: 'Đen', stock: 18, sku: 'VM-SDL-03-42-BLK' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-04',
    name: 'Sandal Quai Hậu Học Sinh Vamos Basic All-Day',
    slug: 'sandal-quai-hau-hoc-sinh-vamos-basic-all-day',
    description: 'Quai vải dệt mịn không gây xước da chân, đế xốp nén êm ái bền bỉ suốt năm học, phù hợp cả đi học lẫn dạo phố cuối tuần.',
    gender_target: 'UNISEX',
    base_price: 350000,
    sale_price: 279000,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Xanh Navy', stock: 25, sku: 'VM-SDL-04-38-NVY' },
      { size: '39', color: 'Xanh Navy', stock: 30, sku: 'VM-SDL-04-39-NVY' },
      { size: '40', color: 'Xanh Navy', stock: 35, sku: 'VM-SDL-04-40-NVY' },
      { size: '41', color: 'Xanh Navy', stock: 20, sku: 'VM-SDL-04-41-NVY' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-05',
    name: 'Dép Bánh Mì Siêu Êm Vamos Cloud Eva Clog',
    slug: 'dep-banh-mi-sieu-em-vamos-cloud-eva-clog',
    description: 'Chất liệu EVA đúc nguyên khối chống mùi, các lỗ thông hơi thoáng khí phía trên, quai xoay 2 chiều đa năng đi êm chân như dạo trên cát.',
    gender_target: 'UNISEX',
    base_price: 290000,
    sale_price: 219000,
    images: [
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 22, sku: 'VM-SDL-05-38-WHT' },
      { size: '39', color: 'Trắng', stock: 30, sku: 'VM-SDL-05-39-WHT' },
      { size: '40', color: 'Trắng', stock: 28, sku: 'VM-SDL-05-40-WHT' },
      { size: '41', color: 'Trắng', stock: 20, sku: 'VM-SDL-05-41-WHT' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-06',
    name: 'Dép Kẹp Xỏ Ngón Thể Thao Vamos Beach Flow',
    slug: 'dep-kep-xo-ngon-the-thao-vamos-beach-flow',
    description: 'Quai kẹp cao su dẻo mềm không cấn ngón chân, mặt đế có rãnh massage bàn chân, kháng nước 100% phù hợp đi biển hay đi mưa.',
    gender_target: 'UNISEX',
    base_price: 199000,
    sale_price: 149000,
    images: [
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 35, sku: 'VM-SDL-06-39-BLK' },
      { size: '40', color: 'Đen', stock: 40, sku: 'VM-SDL-06-40-BLK' },
      { size: '41', color: 'Đen', stock: 30, sku: 'VM-SDL-06-41-BLK' },
      { size: '42', color: 'Đen', stock: 25, sku: 'VM-SDL-06-42-BLK' },
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
        // Update product metadata & sale price if needed
        await pool.request()
          .input('id', productId)
          .input('desc', prod.description)
          .input('salePrice', prod.sale_price)
          .query(`
            UPDATE products 
            SET description = @desc, sale_price = @salePrice, updated_at = GETDATE()
            WHERE id = @id
          `);
      }

      // Special fix: update primary image for VM-SPT-02 to replace dumbbell image
      if (prod.product_code === 'VM-SPT-02') {
        await pool.request()
          .input('prodId', productId)
          .input('imgUrl', prod.images[0])
          .query(`
            UPDATE product_images 
            SET image_url = @imgUrl 
            WHERE product_id = @prodId AND is_primary = 1
          `);
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
