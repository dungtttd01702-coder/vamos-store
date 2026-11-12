const sql = require('mssql');
const config = require('../src/config/app.config');

const productsData = [
  // ══════════════════════════════════════════════════════════════
  // ── 1. SNEAKER NAM (10 SẢN PHẨM) ──
  // ══════════════════════════════════════════════════════════════
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
    name: 'Giày Sneaker Nam Vamos Retro Classic 1988',
    slug: 'giay-sneaker-nam-vamos-retro-classic-1988',
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
      'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 12, sku: 'VM-SNK-05-39-WHT' },
      { size: '40', color: 'Trắng', stock: 25, sku: 'VM-SNK-05-40-WHT' },
      { size: '41', color: 'Trắng', stock: 20, sku: 'VM-SNK-05-41-WHT' },
      { size: '42', color: 'Trắng', stock: 15, sku: 'VM-SNK-05-42-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-06',
    name: 'Giày Sneaker Cổ Cao Vamos High Court',
    slug: 'giay-sneaker-co-cao-vamos-high-court',
    description: 'Thiết kế cổ cao ôm sát cổ chân, phối màu tương phản đỏ - đen cá tính. Da nhân tạo cao cấp bề mặt phủ màng chống thấm nhẹ.',
    gender_target: 'MEN',
    base_price: 990000,
    sale_price: 850000,
    images: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 18, sku: 'VM-SNK-06-40-BLK' },
      { size: '41', color: 'Đen', stock: 22, sku: 'VM-SNK-06-41-BLK' },
      { size: '42', color: 'Đen', stock: 14, sku: 'VM-SNK-06-42-BLK' },
      { size: '43', color: 'Đen', stock: 10, sku: 'VM-SNK-06-43-BLK' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-07',
    name: 'Giày Sneaker Phối Da Lộn Vamos Suede Urban',
    slug: 'giay-sneaker-phoi-da-lon-vamos-suede-urban',
    description: 'Sự pha trộn tinh tế giữa da lộn tự nhiên và vải lưới thoáng khí, phong cách thanh lịch cho bạn trẻ đi làm và đi chơi.',
    gender_target: 'MEN',
    base_price: 880000,
    sale_price: 720000,
    images: [
      'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Xám', stock: 16, sku: 'VM-SNK-07-39-GRY' },
      { size: '40', color: 'Xám', stock: 20, sku: 'VM-SNK-07-40-GRY' },
      { size: '41', color: 'Xám', stock: 18, sku: 'VM-SNK-07-41-GRY' },
      { size: '42', color: 'Xám', stock: 12, sku: 'VM-SNK-07-42-GRY' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-08',
    name: 'Giày Sneaker Nam Trắng Tối Giản Vamos Clean Minimal',
    slug: 'giay-sneaker-nam-trang-toi-gian-vamos-clean-minimal',
    description: 'Đôi sneaker trắng thuần khiết chuẩn Scandinavian Style, phù hợp với mọi phong cách thời trang từ áo sơ mi công sở đến hoodie đường phố.',
    gender_target: 'MEN',
    base_price: 680000,
    sale_price: 550000,
    images: [
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 20, sku: 'VM-SNK-08-39-WHT' },
      { size: '40', color: 'Trắng', stock: 30, sku: 'VM-SNK-08-40-WHT' },
      { size: '41', color: 'Trắng', stock: 25, sku: 'VM-SNK-08-41-WHT' },
      { size: '42', color: 'Trắng', stock: 15, sku: 'VM-SNK-08-42-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-13',
    name: 'Giày Sneaker Nam Vamos Hunter X Multi-Layer',
    slug: 'giay-sneaker-nam-vamos-hunter-x-multi-layer',
    description: 'Đột phá công nghệ đệm trợ lực Foam+ thế hệ mới kết hợp cấu trúc đa tầng Midnight Black & Kinetic Crimson, siêu bám sàn và cực kỳ nhẹ.',
    gender_target: 'MEN',
    base_price: 1250000,
    sale_price: 989000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNhs1grF21bv6KWMXNcpypG61Q51BgHdNlaVIbjshuFn1lb9KFeUf5KVThK0dtoz2e7_DKiw22n1VtIVLyIdh-7Lq7JVWEqcv_MJPPv55z3DYYN5Uzm7Tc68eGFucVz7UBgjgKCv0u_pNMHXQKsoSkCPtYRuKzZq7xdZZXy5BD349yUPzfqLHX7IsC1s0TkXFjSZOcmQT3yv1mvNwMZvkOlAyDsN751z8AYGFniHE',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 15, sku: 'VM-SNK-13-39-BLK' },
      { size: '40', color: 'Đen', stock: 24, sku: 'VM-SNK-13-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SNK-13-41-BLK' },
      { size: '42', color: 'Đen', stock: 18, sku: 'VM-SNK-13-42-BLK' },
      { size: '43', color: 'Đen', stock: 10, sku: 'VM-SNK-13-43-BLK' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-14',
    name: 'Giày Sneaker Nam Vamos Hunter Street Vintage',
    slug: 'giay-sneaker-nam-vamos-hunter-street-vintage',
    description: 'Sự giao thoa giữa chất liệu da cao cấp mềm mại và đế cao su lưu hóa vulcanized retro cổ điển, mang lại trải nghiệm êm ái tuyệt đối.',
    gender_target: 'MEN',
    base_price: 899000,
    sale_price: 689000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgjzbLAjPAdWLRhbqF0P47jvLwzZV9hwn-wNd1qCdUblFE-Tw15mI1ETYS4Z0T7jw4iGUYzGv5wW_y0hFISZOfP8XOmRYRtDQmDjxDdClWOfPPPjHgyZzskA6sZ8YWZDeIg0TP-szmQn6j0CPGtKvOP27yZavXoo-gu3RTUf2clBKaBySUs2rEgjbQ55B0kDD3QtnH3JejdG0zmbRdtoYjZrerN8wSVxCjD6d-Xoc',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 18, sku: 'VM-SNK-14-39-WHT' },
      { size: '40', color: 'Trắng', stock: 22, sku: 'VM-SNK-14-40-WHT' },
      { size: '41', color: 'Trắng', stock: 16, sku: 'VM-SNK-14-41-WHT' },
      { size: '42', color: 'Trắng', stock: 12, sku: 'VM-SNK-14-42-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SNK-15',
    name: 'Giày Sneaker Nam Vamos Air Boost Shadow',
    slug: 'giay-sneaker-nam-vamos-air-boost-shadow',
    description: 'Thiết kế bóng đêm Shadow Stealth với túi khí kép Air Boost hoàn trả năng lượng tối đa trên từng bước chạy, phản quang an toàn ban đêm.',
    gender_target: 'MEN',
    base_price: 1050000,
    sale_price: 890000,
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 20, sku: 'VM-SNK-15-40-BLK' },
      { size: '41', color: 'Đen', stock: 25, sku: 'VM-SNK-15-41-BLK' },
      { size: '42', color: 'Đen', stock: 15, sku: 'VM-SNK-15-42-BLK' },
    ]
  },
  {
    category_slug: 'sneaker-nam',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-16',
    name: 'Giày Sneaker Nam Vamos Urban Velocity',
    slug: 'giay-sneaker-nam-vamos-urban-velocity',
    description: 'Phong cách đường phố năng động, đế cắt laser công nghệ cao tăng độ linh hoạt khi gập chân, hỗ trợ di chuyển nhanh trong đô thị.',
    gender_target: 'MEN',
    base_price: 920000,
    sale_price: 760000,
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 14, sku: 'VM-SNK-16-39-WHT' },
      { size: '40', color: 'Trắng', stock: 20, sku: 'VM-SNK-16-40-WHT' },
      { size: '41', color: 'Trắng', stock: 18, sku: 'VM-SNK-16-41-WHT' },
      { size: '42', color: 'Trắng', stock: 10, sku: 'VM-SNK-16-42-WHT' },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // ── 2. SNEAKER NỮ (10 SẢN PHẨM) ──
  // ══════════════════════════════════════════════════════════════
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNK-03',
    name: 'Giày Sneaker Nữ Cổ Cao Vamos Canvas High',
    slug: 'giay-sneaker-nu-co-cao-vamos-canvas-high',
    description: 'Vải canvas dệt tự nhiên thoáng mát, form ôm chân tôn dáng. Phù hợp cho nữ sinh, sinh viên phối cùng chân váy hoặc quần baggy.',
    gender_target: 'WOMEN',
    base_price: 650000,
    sale_price: 520000,
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 16, sku: 'VM-SNK-03-38-WHT' },
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
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
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
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNW-01',
    name: 'Giày Sneaker Nữ Pastel Vamos Sweet Daisy',
    slug: 'giay-sneaker-nu-pastel-vamos-sweet-daisy',
    description: 'Tone màu pastel ngọt ngào dịu mắt, đế lót memory foam ôm sát bàn chân, không lo đau gót khi di chuyển cả ngày.',
    gender_target: 'WOMEN',
    base_price: 790000,
    sale_price: 640000,
    images: [
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 14, sku: 'VM-SNW-01-38-WHT' },
      { size: '39', color: 'Trắng', stock: 22, sku: 'VM-SNW-01-39-WHT' },
      { size: '40', color: 'Trắng', stock: 16, sku: 'VM-SNW-01-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNW-02',
    name: 'Giày Sneaker Nữ Chunky Vamos Cloud Walker',
    slug: 'giay-sneaker-nu-chunky-vamos-cloud-walker',
    description: 'Đế bánh mì bồng bềnh như mây, tôn dáng hack chiều cao khéo léo 4.5cm mà bước chân vẫn nhẹ nhàng thanh thoát.',
    gender_target: 'WOMEN',
    base_price: 890000,
    sale_price: 720000,
    images: [
      'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 18, sku: 'VM-SNW-02-38-WHT' },
      { size: '39', color: 'Trắng', stock: 20, sku: 'VM-SNW-02-39-WHT' },
      { size: '40', color: 'Trắng', stock: 12, sku: 'VM-SNW-02-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-originals',
    product_code: 'VM-SNW-03',
    name: 'Giày Sneaker Nữ Thêu Hoa Vamos Floral Retro',
    slug: 'giay-sneaker-nu-theu-hoa-vamos-floral-retro',
    description: 'Họa tiết thêu tay tỉ mỉ phong cách Bohemian vintage, vải canvas cotton cao cấp thân thiện với làn da nhạy cảm.',
    gender_target: 'WOMEN',
    base_price: 680000,
    sale_price: 530000,
    images: [
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 15, sku: 'VM-SNW-03-38-WHT' },
      { size: '39', color: 'Trắng', stock: 18, sku: 'VM-SNW-03-39-WHT' },
      { size: '40', color: 'Trắng', stock: 10, sku: 'VM-SNW-03-40-WHT' },
    ]
  },
  {
    category_slug: 'sneaker-nu',
    brand_slug: 'vamos-active',
    product_code: 'VM-SNW-04',
    name: 'Giày Sneaker Nữ Minimal Vamos Pure White',
    slug: 'giay-sneaker-nu-minimal-vamos-pure-white',
    description: 'Mẫu giày trắng quốc dân không thể thiếu trong tủ đồ mọi cô gái, form ôm gọn chân, đường may tinh xảo từng milimet.',
    gender_target: 'WOMEN',
    base_price: 620000,
    sale_price: 490000,
    images: [
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 22, sku: 'VM-SNW-04-38-WHT' },
      { size: '39', color: 'Trắng', stock: 28, sku: 'VM-SNW-04-39-WHT' },
      { size: '40', color: 'Trắng', stock: 15, sku: 'VM-SNW-04-40-WHT' },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // ── 3. GIÀY THỂ THAO (10 SẢN PHẨM) ──
  // ══════════════════════════════════════════════════════════════
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-01',
    name: 'Giày Chạy Bộ Nam Vamos Speed Runner Pro',
    slug: 'giay-chay-bo-nam-vamos-speed-runner-pro',
    description: 'Chuyên dụng cho chạy bộ cự ly 5km - 21km, đế đệm trợ lực hạt Boost đàn hồi cao, giảm tối đa phản lực lên khớp gối khi tiếp đất.',
    gender_target: 'MEN',
    base_price: 950000,
    sale_price: 799000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfJ1RUOs93WiLIMIiZml_kUCLnoaqceV17eZv68km6nUtxLBKWUyRlOKV0rA-mAif-5O8zNb4BZZMUsUPTPgh62Gb8XBM81j855N30NT25i2YCQQbGb2n9mQgf9i9NU0Kp0pQZJpmEbtfGF01sqDwau42LZOGqbrzSrGEC4h6B7rhgxyhTq9dT__CUF4Feuk9t6wXd426brNHJWvQDU-Tftm-Fq7rC6e2EiVupM',
    ],
    variants: [
      { size: '39', color: 'Xám', stock: 15, sku: 'VM-SPT-01-39-GRY' },
      { size: '40', color: 'Xám', stock: 25, sku: 'VM-SPT-01-40-GRY' },
      { size: '41', color: 'Xám', stock: 30, sku: 'VM-SPT-01-41-GRY' },
      { size: '42', color: 'Xám', stock: 18, sku: 'VM-SPT-01-42-GRY' },
      { size: '43', color: 'Xám', stock: 12, sku: 'VM-SPT-01-43-GRY' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-02',
    name: 'Giày Tập Gym & Kháng Lực Vamos Training X',
    slug: 'giay-tap-gym-khang-luc-vamos-training-x',
    description: 'Thiết kế đế phẳng bám sàn tối đa cho bài tập Deadlift và Squat an toàn. Thân giày gia cố sợi TPU cố định gót chân vững vàng.',
    gender_target: 'MEN',
    base_price: 890000,
    sale_price: 750000,
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 20, sku: 'VM-SPT-02-40-BLK' },
      { size: '41', color: 'Đen', stock: 24, sku: 'VM-SPT-02-41-BLK' },
      { size: '42', color: 'Đen', stock: 15, sku: 'VM-SPT-02-42-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-03',
    name: 'Giày Bóng Rổ Vamos Court Dominator Elite',
    slug: 'giay-bong-ro-vamos-court-dominator-elite',
    description: 'Đệm gót khí kép hấp thụ chấn động khi bật nhảy cao, đế cao su vân xương cá bám sân gỗ và sân bê tông cực chuẩn xác.',
    gender_target: 'MEN',
    base_price: 1250000,
    sale_price: 1050000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCVrfVCEqz9tp7rytnKSYT1p1p4rcR2C6fGdMlGXQ7obTFba57PRTPXErWbnIV4H6jNxmNK8p5FqDsjyjxP5hbXyeBwBWhj9gaHpQ2e7UoxJysWjFvXZb6peELeh5Z233-H8I-4-juU4AbFRBou0rlzuUflKrguJ9220gdnAyOah8hVJZ4WBbu0ryZUPX9VKXVb0IdwVjaEaNLLHbHk5N15g4sT0FT5g-7GOYeN2Cc',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 14, sku: 'VM-SPT-03-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SPT-03-41-BLK' },
      { size: '42', color: 'Đen', stock: 18, sku: 'VM-SPT-03-42-BLK' },
      { size: '43', color: 'Đen', stock: 10, sku: 'VM-SPT-03-43-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-04',
    name: 'Giày Cầu Lông & Tennis Vamos Control Grip',
    slug: 'giay-cau-long-tennis-vamos-control-grip',
    description: 'Đế non-marking không để lại vệt màu trên thảm thi đấu tiêu chuẩn, má chân trong bọc bảo vệ chống mòn khi rê quét chân.',
    gender_target: 'UNISEX',
    base_price: 920000,
    sale_price: 760000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCicI7DjZkvNWVeOx_Tur0Y845H5N_rwyjngFQRGPWNlicnnbFhAfuEbYCC0w5_vuwysyPcM8zGKr4bdUnmh12d4F_mxDoy5cbqjMYQV7135Jvk4U-toKts2P-WaD-6uCXxac-NcA4eRCJlfPFk1t54mpKCE5MNzem-VlZFCk-tjJEjOrhoJ_6ihVD5hYEIO9jxeiVaavqWcGVIdjc6s28tL7L3uWN9eT4p2BpG2to',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 16, sku: 'VM-SPT-04-39-WHT' },
      { size: '40', color: 'Trắng', stock: 22, sku: 'VM-SPT-04-40-WHT' },
      { size: '41', color: 'Trắng', stock: 25, sku: 'VM-SPT-04-41-WHT' },
      { size: '42', color: 'Trắng', stock: 14, sku: 'VM-SPT-04-42-WHT' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-05',
    name: 'Giày Đi Bộ Trợ Lực Vamos Walk Ease Cushion',
    slug: 'giay-di-bo-tro-luc-vamos-walk-ease-cushion',
    description: 'Dành riêng cho người lớn tuổi hoặc nhân viên đứng làm việc nhiều giờ, lót giày vòm chân chỉnh hình giảm mệt mỏi hiệu quả.',
    gender_target: 'UNISEX',
    base_price: 780000,
    sale_price: 630000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBwOZxsx7Czpy-SXNEe-Jhbs5cCdEOF0-B9A-gfBAPX4afZm3NR7ioSA4FylFU7-t_mlWeawuXQIHdsoqimnnECWMuK4sn9I2vFFg9PJawk-FD-Pl3r39jJbBVMoZRal9DSCd3hlxRvYcIKg1-_Uw1ChzSP77D-olpycNq9bZP6RGNtzaadNMWVhbJuJHBnT-Aj7BwaM-jQMkHmeXNjmL0k4rcLrAwELGW2Z_z_Wsg',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 15, sku: 'VM-SPT-05-39-BLK' },
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
      { size: '40', color: 'Đen', stock: 15, sku: 'VM-SPT-06-40-BLK' },
      { size: '41', color: 'Đen', stock: 22, sku: 'VM-SPT-06-41-BLK' },
      { size: '42', color: 'Đen', stock: 18, sku: 'VM-SPT-06-42-BLK' },
      { size: '43', color: 'Đen', stock: 12, sku: 'VM-SPT-06-43-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-07',
    name: 'Giày Thể Thao Vamos Hunter Jogging Lite',
    slug: 'giay-the-thao-vamos-hunter-jogging-lite',
    description: 'Trọng lượng siêu nhẹ chỉ 260g với đệm Foam+ êm như bay, mặt lưới thở đa chiều thoáng mát cả ngày hè nắng nóng.',
    gender_target: 'UNISEX',
    base_price: 899000,
    sale_price: 749000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDKUOUXOxfFe_AhclIxJoedDE9P_FWKhM1J61_DYzTvZwqLMiwNY4GcPDZDfO574ESiWQBgWnS1cuXxvyw6R19GjkLjfB4pdBzdoWplB2zdyvlN_wNwpiKVnhxU9AoP5QAxbxulLOT4SywGbUHHZgpKhrf4X6Z0S-jMGuUT0QZJMIvWKLszxMx3sARUPCobxOlTVHy7vO-H7uKdfNkxir6vauzcGq8WcBCu5V5q2zk',
    ],
    variants: [
      { size: '39', color: 'Xám', stock: 18, sku: 'VM-SPT-07-39-GRY' },
      { size: '40', color: 'Xám', stock: 24, sku: 'VM-SPT-07-40-GRY' },
      { size: '41', color: 'Xám', stock: 20, sku: 'VM-SPT-07-41-GRY' },
      { size: '42', color: 'Xám', stock: 14, sku: 'VM-SPT-07-42-GRY' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-08',
    name: 'Giày Leo Núi & Phượt Vamos Trail Rugged X',
    slug: 'giay-leo-nui-phuot-vamos-trail-rugged-x',
    description: 'Chống thấm nước Gore-Tex tiêu chuẩn cao, gai đế Vibram bám chắc sỏi đá bùn lầy, bảo vệ an toàn ngón chân khi đi địa hình khắc nghiệt.',
    gender_target: 'MEN',
    base_price: 1190000,
    sale_price: 980000,
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Xám', stock: 14, sku: 'VM-SPT-08-40-GRY' },
      { size: '41', color: 'Xám', stock: 20, sku: 'VM-SPT-08-41-GRY' },
      { size: '42', color: 'Xám', stock: 16, sku: 'VM-SPT-08-42-GRY' },
      { size: '43', color: 'Xám', stock: 10, sku: 'VM-SPT-08-43-GRY' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-09',
    name: 'Giày Thể Thao Năng Động Vamos Aero Flex',
    slug: 'giay-the-thao-nang-dong-vamos-aero-flex',
    description: 'Đế xẻ rãnh linh hoạt theo từng chuyển động chân, thích hợp chạy bộ, nhảy dây, tập cardio cường độ cao.',
    gender_target: 'UNISEX',
    base_price: 820000,
    sale_price: 690000,
    images: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 15, sku: 'VM-SPT-09-39-BLK' },
      { size: '40', color: 'Đen', stock: 22, sku: 'VM-SPT-09-40-BLK' },
      { size: '41', color: 'Đen', stock: 18, sku: 'VM-SPT-09-41-BLK' },
    ]
  },
  {
    category_slug: 'giay-the-thao',
    brand_slug: 'vamos-sport',
    product_code: 'VM-SPT-10',
    name: 'Giày Crossfit & Thể Lực Vamos Power Lift',
    slug: 'giay-crossfit-the-luc-vamos-power-lift',
    description: 'Gót giày nâng cao hỗ trợ độ mở hông tối đa, quai dán đan chéo cố định bàn chân tuyệt đối trong các bài cử tạ nặng.',
    gender_target: 'MEN',
    base_price: 990000,
    sale_price: 820000,
    images: [
      'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '40', color: 'Đen', stock: 12, sku: 'VM-SPT-10-40-BLK' },
      { size: '41', color: 'Đen', stock: 18, sku: 'VM-SPT-10-41-BLK' },
      { size: '42', color: 'Đen', stock: 14, sku: 'VM-SPT-10-42-BLK' },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // ── 4. SANDAL & DÉP (10 SẢN PHẨM) ──
  // ══════════════════════════════════════════════════════════════
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
      'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=800&q=80',
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
      'https://images.unsplash.com/photo-1568901578471-a1d5af772617?auto=format&fit=crop&w=800&q=80',
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
      'https://images.unsplash.com/photo-1678541302416-ef3d75fd27dd?auto=format&fit=crop&w=800&q=80',
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
      'https://images.unsplash.com/photo-1585120824848-8a5cd41493d2?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Đen', stock: 25, sku: 'VM-SDL-04-38-BLK' },
      { size: '39', color: 'Đen', stock: 35, sku: 'VM-SDL-04-39-BLK' },
      { size: '40', color: 'Đen', stock: 30, sku: 'VM-SDL-04-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SDL-04-41-BLK' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-05',
    name: 'Dép Bánh Mì Siêu Êm Vamos Cloud Eva Clog',
    slug: 'dep-banh-mi-sieu-em-vamos-cloud-eva-clog',
    description: 'Kiểu dáng bít mũi Clog thời thượng, lỗ thoáng khí thông minh không đọng mồ hôi, đế dày 4cm siêu nhẹ nâng niu gót chân.',
    gender_target: 'UNISEX',
    base_price: 290000,
    sale_price: 219000,
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 20, sku: 'VM-SDL-05-38-WHT' },
      { size: '39', color: 'Trắng', stock: 30, sku: 'VM-SDL-05-39-WHT' },
      { size: '40', color: 'Trắng', stock: 30, sku: 'VM-SDL-05-40-WHT' },
      { size: '41', color: 'Trắng', stock: 20, sku: 'VM-SDL-05-41-WHT' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-06',
    name: 'Dép Kẹp Xỏ Ngón Thể Thao Vamos Beach Flow',
    slug: 'dep-kep-xo-ngon-the-thao-vamos-beach-flow',
    description: 'Quai kẹp silicone mềm mại không đau kẽ ngón, đế cao su rãnh thoát nước chống trượt hoàn hảo cho hồ bơi và bãi biển.',
    gender_target: 'UNISEX',
    base_price: 199000,
    sale_price: 149000,
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 35, sku: 'VM-SDL-06-39-BLK' },
      { size: '40', color: 'Đen', stock: 40, sku: 'VM-SDL-06-40-BLK' },
      { size: '41', color: 'Đen', stock: 35, sku: 'VM-SDL-06-41-BLK' },
      { size: '42', color: 'Đen', stock: 20, sku: 'VM-SDL-06-42-BLK' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-07',
    name: 'Sandal Da Quai Chéo Vamos Urban Leather',
    slug: 'sandal-da-quai-cheo-vamos-urban-leather',
    description: 'Chất liệu da bò sáp cao cấp may thủ công, đế xốp nén êm ái, mang lại vẻ lịch lãm phóng khoáng cho phái mạnh.',
    gender_target: 'MEN',
    base_price: 560000,
    sale_price: 450000,
    images: [
      'https://images.unsplash.com/photo-1504659913281-61817e6e2e9b?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Đen', stock: 15, sku: 'VM-SDL-07-39-BLK' },
      { size: '40', color: 'Đen', stock: 22, sku: 'VM-SDL-07-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SDL-07-41-BLK' },
      { size: '42', color: 'Đen', stock: 12, sku: 'VM-SDL-07-42-BLK' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-08',
    name: 'Dép Đúc Khối Siêu Nhẹ Vamos Recovery Slide',
    slug: 'dep-duc-khoi-sieu-nhe-vamos-recovery-slide',
    description: 'Công nghệ đúc liền khối nguyên hạt nhựa EVA đàn hồi cực cao, giúp thư giãn bàn chân nhanh chóng sau giờ tập thể thao căng thẳng.',
    gender_target: 'UNISEX',
    base_price: 320000,
    sale_price: 260000,
    images: [
      'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '39', color: 'Trắng', stock: 20, sku: 'VM-SDL-08-39-WHT' },
      { size: '40', color: 'Trắng', stock: 30, sku: 'VM-SDL-08-40-WHT' },
      { size: '41', color: 'Trắng', stock: 25, sku: 'VM-SDL-08-41-WHT' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-09',
    name: 'Sandal Nữ Đế Bánh Mì Vamos Sweet Strap',
    slug: 'sandal-nu-de-banh-mi-vamos-sweet-strap',
    description: 'Thiết kế quai mảnh tinh tế phối khóa kim loại sáng bóng, đế bánh mì cao 4cm nhẹ tênh giúp nàng tự tin tỏa sáng.',
    gender_target: 'WOMEN',
    base_price: 390000,
    sale_price: 320000,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmXVhUFUiJ_e1k25cPeN6CvTCvGXkre2IaeQna9nTo7-CwrF0z3m3dfpECfTrgSrT4HjGNoH_TcJyeur6ceWuvR8906osPpOhscyiDBrTYzn0jodEsnDILyLsHanz-cZE2ogqwX6A8dSENxqoVd37myMs9YQz3ffdrJJRnx7ht3FeMRGp3_Mq8e6OSkCxrLvxRUKQyRiUjStDFJ7yK0FLPBys9t_w8-2fsvmCl7fk',
    ],
    variants: [
      { size: '38', color: 'Trắng', stock: 18, sku: 'VM-SDL-09-38-WHT' },
      { size: '39', color: 'Trắng', stock: 24, sku: 'VM-SDL-09-39-WHT' },
      { size: '40', color: 'Trắng', stock: 16, sku: 'VM-SDL-09-40-WHT' },
    ]
  },
  {
    category_slug: 'sandal-dep',
    brand_slug: 'vamos-active',
    product_code: 'VM-SDL-10',
    name: 'Dép Sục Kháng Khuẩn Đi Mưa Vamos Rainy Eva',
    slug: 'dep-suc-khang-khuan-di-mua-vamos-rainy-eva',
    description: 'Chất liệu hạt nhựa nano kháng khuẩn khử mùi, thiết kế thông minh ráo nước nhanh trong 30 giây, chống trơn tuyệt hảo khi trời mưa.',
    gender_target: 'UNISEX',
    base_price: 240000,
    sale_price: 189000,
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { size: '38', color: 'Đen', stock: 20, sku: 'VM-SDL-10-38-BLK' },
      { size: '39', color: 'Đen', stock: 30, sku: 'VM-SDL-10-39-BLK' },
      { size: '40', color: 'Đen', stock: 35, sku: 'VM-SDL-10-40-BLK' },
      { size: '41', color: 'Đen', stock: 20, sku: 'VM-SDL-10-41-BLK' },
    ]
  }
];

async function seed() {
  console.log('--- SEEDING 40 REALISTIC FOOTWEAR PRODUCTS & VARIANTS ---');
  try {
    const pool = await sql.connect(config.db);

    // Get categories map
    const catResult = await pool.request().query('SELECT id, slug FROM categories');
    const catMap = {};
    for (const c of catResult.recordset) {
      catMap[c.slug] = c.id;
    }

    // Get brands map
    const brandResult = await pool.request().query('SELECT id, slug FROM brands');
    const brandMap = {};
    for (const b of brandResult.recordset) {
      brandMap[b.slug] = b.id;
    }

    // Get sizes map
    const sizeResult = await pool.request().query('SELECT id, size_name FROM sizes');
    const sizeMap = {};
    for (const s of sizeResult.recordset) {
      sizeMap[String(s.size_name)] = s.id;
    }

    // Get colors map
    const colorResult = await pool.request().query('SELECT id, color_name FROM colors');
    const colorMap = {};
    for (const clr of colorResult.recordset) {
      colorMap[clr.color_name] = clr.id;
    }

    for (const prod of productsData) {
      const categoryId = catMap[prod.category_slug];
      const brandId = brandMap[prod.brand_slug] || brandMap['vamos-originals'];

      if (!categoryId) {
        console.warn(`Category slug not found: ${prod.category_slug}`);
        continue;
      }

      // Check if product exists by product_code
      let prodCheck = await pool.request()
        .input('code', prod.product_code)
        .query('SELECT id FROM products WHERE product_code = @code');

      let productId;
      if (prodCheck.recordset.length === 0) {
        // Insert product
        const insertRes = await pool.request()
          .input('catId', categoryId)
          .input('brandId', brandId)
          .input('code', prod.product_code)
          .input('name', prod.name)
          .input('slug', prod.slug)
          .input('desc', prod.description)
          .input('gender', prod.gender_target)
          .input('basePrice', prod.base_price)
          .input('salePrice', prod.sale_price)
          .query(`
            INSERT INTO products (category_id, brand_id, product_code, name, slug, description, gender_target, base_price, sale_price, status, created_at, updated_at)
            OUTPUT INSERTED.id
            VALUES (@catId, @brandId, @code, @name, @slug, @desc, @gender, @basePrice, @salePrice, 'active', GETDATE(), GETDATE())
          `);
        productId = insertRes.recordset[0].id;
        console.log(`[INSERTED PRODUCT] ID: ${productId} - ${prod.name}`);
      } else {
        productId = prodCheck.recordset[0].id;
        await pool.request()
          .input('id', productId)
          .input('name', prod.name)
          .input('slug', prod.slug)
          .input('desc', prod.description)
          .input('salePrice', prod.sale_price)
          .input('basePrice', prod.base_price)
          .query(`
            UPDATE products 
            SET name = @name, slug = @slug, description = @desc, base_price = @basePrice, sale_price = @salePrice, updated_at = GETDATE()
            WHERE id = @id
          `);
      }

      // Update/Insert primary image cleanly to ensure accurate footwear visual
      if (prod.images && prod.images.length > 0) {
        const primaryImg = prod.images[0];
        const imgCheck = await pool.request()
          .input('prodId', productId)
          .query('SELECT id FROM product_images WHERE product_id = @prodId AND is_primary = 1');

        if (imgCheck.recordset.length > 0) {
          await pool.request()
            .input('prodId', productId)
            .input('imgUrl', primaryImg)
            .query(`
              UPDATE product_images 
              SET image_url = @imgUrl 
              WHERE product_id = @prodId AND is_primary = 1
            `);
        } else {
          await pool.request()
            .input('prodId', productId)
            .input('imgUrl', primaryImg)
            .query(`
              INSERT INTO product_images (product_id, image_url, is_primary, display_order)
              VALUES (@prodId, @imgUrl, 1, 0)
            `);
        }
      }

      // Insert extra images
      for (let i = 1; i < prod.images.length; i++) {
        const imgUrl = prod.images[i];
        await pool.request()
          .input('prodId', productId)
          .input('imgUrl', imgUrl)
          .input('order', i)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @prodId AND image_url = @imgUrl)
            BEGIN
              INSERT INTO product_images (product_id, image_url, is_primary, display_order)
              VALUES (@prodId, @imgUrl, 0, @order)
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

    console.log('✅ All 40 realistic products, studio images, and variant matrices seeded successfully!');
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
