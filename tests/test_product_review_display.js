/**
 * Contract & View Rendering Regression Suite: MEDIUM-02 Product Review Display Mapping
 * Verifies the SQL -> loyaltyService.getProductReviews() -> products/detail.pug contract.
 */

require('./test_bootstrap');

const assert = require('assert');
const path = require('path');
const pug = require('pug');

// Inject deterministic query mock BEFORE loading loyaltyService so zero SQL connection is opened
const dbConfig = require('../src/config/database');
const origQuery = dbConfig.query;

const MOCK_DB_REVIEWS = [
  {
    id: 101,
    rating: 5,
    comment: 'Giày đi rất êm chân, đường may chắc chắn và đúng size.',
    quick_tags: JSON.stringify(['Vừa vặn chuẩn size', 'Đế Phylon cực êm']),
    points_earned: 300,
    created_at: new Date('2026-11-20T08:00:00Z'),
    customer_name: 'Nguyễn Minh Anh',
    masked_email: 'min***@vamos.vn',
    order_code: 'ORD-REV-101'
  },
  {
    id: 102,
    rating: 4,
    comment: 'Màu đẹp, giao hàng nhanh.',
    quick_tags: 'Đẹp như hình, Giao hàng nhanh',
    points_earned: 200,
    created_at: new Date('2026-11-19T08:00:00Z'),
    customer_name: "Lê & <script>alert('xss')</script> Dũng",
    masked_email: 'dun***@vamos.vn',
    order_code: 'ORD-REV-102'
  },
  {
    id: 103,
    rating: 5,
    comment: 'Không chọn tag vẫn hiển thị bình thường.',
    quick_tags: null,
    points_earned: 100,
    created_at: new Date('2026-11-18T08:00:00Z'),
    customer_name: null,
    masked_email: 'ano***@vamos.vn',
    order_code: 'ORD-REV-103'
  }
];

const MOCK_DB_MEDIA = [
  { review_id: 101, media_type: 'IMAGE', media_url: '/uploads/reviews/rev_101_a.jpg', original_filename: 'a.jpg' },
  { review_id: 101, media_type: 'IMAGE', media_url: '/uploads/reviews/rev_101_b.jpg', original_filename: 'b.jpg' }
];

dbConfig.query = async (sqlText) => {
  const q = String(sqlText);
  if (q.includes('FROM reviews r')) {
    return { recordset: MOCK_DB_REVIEWS.map((r) => ({ ...r })) };
  }
  if (q.includes('FROM review_media')) {
    return { recordset: MOCK_DB_MEDIA.map((m) => ({ ...m })) };
  }
  return { recordset: [] };
};

const loyaltyService = require('../src/services/loyalty.service');

const DETAIL_PUG_PATH = path.resolve(__dirname, '../src/views/pages/products/detail.pug');

function renderProductDetail(reviewsData) {
  return pug.renderFile(DETAIL_PUG_PATH, {
    title: 'VAMOS Stride X1',
    product: {
      id: 42,
      name: 'VAMOS Stride X1',
      slug: 'vamos-stride-x1',
      product_code: 'VS-X1',
      base_price: 1200000,
      sale_price: 990000,
      gender_target: 'UNISEX',
      brand_name: 'VAMOS',
      category_name: 'Running',
      category_slug: 'running',
      description: 'Giày chạy bộ VAMOS',
      images: [{ image_url: '/images/products/vamos-stride-x1.png' }],
      variants: [{ sku: 'VS-X1-41-BLK', size_name: '41', size_order: 1, color_name: 'Đen', hex_code: '#111111', stock_quantity: 5 }]
    },
    availableSizes: [{ id: 1, name: '41' }],
    availableColors: [{ name: 'Đen', hex: '#111111' }],
    relatedProducts: [],
    reviewsData,
    csrfToken: 'unit_test_csrf',
    t: (_k, def) => def,
    currentLocale: 'vi',
    currentPath: '/products/vamos-stride-x1',
    isAuthenticated: false,
    isAdmin: false,
    isCustomer: false,
    user: null,
    cartCount: 0,
    wishlistCount: 0
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - MEDIUM-02 PRODUCT REVIEW DISPLAY TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  async function runCase(name, fn) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  try {
    const serviceData = await loyaltyService.getProductReviews(42);
    const serviceHtml = renderProductDetail(serviceData);

    await runCase('TC01: Renders actual customer_name and uppercase initial from service contract', () => {
      assert.strictEqual(serviceData.reviews[0].customer_name, 'Nguyễn Minh Anh');
      assert.ok(serviceHtml.includes('>Nguyễn Minh Anh</h4>'), 'Actual customer_name must render instead of fallback');
      assert.ok(!serviceHtml.includes('rev.full_name'), 'Compiled template output must not leak raw field names');
    });

    await runCase('TC02: Renders parsed tagsList items individually without raw JSON brackets or quotes', () => {
      assert.deepStrictEqual(serviceData.reviews[0].tagsList, ['Vừa vặn chuẩn size', 'Đế Phylon cực êm']);
      assert.ok(serviceHtml.includes('✓ Vừa vặn chuẩn size'));
      assert.ok(serviceHtml.includes('✓ Đế Phylon cực êm'));
      assert.ok(serviceHtml.includes('✓ Đẹp như hình'));
      assert.ok(serviceHtml.includes('✓ Giao hàng nhanh'));
      assert.ok(!serviceHtml.includes('["Vừa vặn chuẩn size"'), 'Raw JSON brackets must never appear in UI');
      assert.ok(!serviceHtml.includes('Đế Phylon cực êm"]'), 'Trailing JSON bracket must never appear in UI');
    });

    await runCase('TC03: Empty tagsList / null quick_tags renders cleanly without breaking layout', () => {
      const htmlEmpty = renderProductDetail({
        summary: { avgRating: 5, totalReviews: 1, starCounts: { 5: 1 }, starPercentages: { 5: 100 } },
        reviews: [
          {
            id: 201,
            customer_name: 'Phạm Hoàng Nam',
            rating: 5,
            comment: 'Sản phẩm rất tốt.',
            quick_tags: null,
            tagsList: [],
            points_earned: 100,
            created_at: new Date('2026-11-20T00:00:00Z'),
            media: []
          }
        ]
      });
      assert.ok(htmlEmpty.includes('Phạm Hoàng Nam'));
      assert.ok(htmlEmpty.includes('Sản phẩm rất tốt.'));
    });

    await runCase('TC04: Null, whitespace, or non-string fields never leak undefined/null/[object Object]', () => {
      const htmlNullish = renderProductDetail({
        summary: { avgRating: 4.5, totalReviews: 2, starCounts: { 5: 1, 4: 1 }, starPercentages: { 5: 50, 4: 50 } },
        reviews: [
          {
            id: 301,
            customer_name: '   ',
            rating: 5,
            comment: null,
            tagsList: [null, undefined, {}, '  ', 'Form chuẩn'],
            points_earned: 0,
            created_at: null,
            media: null
          },
          {
            id: 302,
            rating: 4,
            tagsList: null,
            media: []
          }
        ]
      });
      const reviewSection = htmlNullish.split('id="product-reviews-section"')[1] || '';
      assert.ok(reviewSection.includes('Khách hàng VAMOS'), 'Missing/blank customer_name should fall back gracefully');
      assert.ok(reviewSection.includes('✓ Form chuẩn'));
      assert.ok(!reviewSection.includes('undefined'), 'Review section must never render "undefined"');
      assert.ok(!reviewSection.includes('>null<'), 'Review section must never render "null"');
      assert.ok(!reviewSection.includes('[object Object]'), 'Review section must never render "[object Object]"');
    });

    await runCase('TC05: Escapes HTML/XSS payloads safely in customer_name and tagsList', () => {
      const xssHtml = renderProductDetail({
        summary: { avgRating: 5, totalReviews: 1, starCounts: { 5: 1 }, starPercentages: { 5: 100 } },
        reviews: [
          {
            id: 401,
            customer_name: '<script>alert("name-xss")</script>',
            rating: 5,
            comment: '<img src=x onerror="alert(1)">',
            tagsList: ['<b onmouseover=alert(1)>Tag XSS</b>'],
            points_earned: 200,
            created_at: new Date('2026-11-20T00:00:00Z'),
            media: []
          }
        ]
      });
      assert.ok(!xssHtml.includes('<script>alert("name-xss")</script>'), 'Raw <script> in customer_name must be escaped');
      assert.ok(!xssHtml.includes('<img src=x onerror="alert(1)">'), 'Raw <img> in comment must be escaped');
      assert.ok(!xssHtml.includes('<b onmouseover=alert(1)>Tag XSS</b>'), 'Raw HTML in tag must be escaped');
      assert.ok(xssHtml.includes('&lt;script&gt;alert(&quot;name-xss&quot;)&lt;/script&gt;'));
      assert.ok(xssHtml.includes('✓ &lt;b onmouseover=alert(1)&gt;Tag XSS&lt;/b&gt;'));
    });

    await runCase('TC06: Preserves review comment text accurately', () => {
      assert.ok(serviceHtml.includes('Giày đi rất êm chân, đường may chắc chắn và đúng size.'));
      assert.ok(serviceHtml.includes('Không chọn tag vẫn hiển thị bình thường.'));
    });

    await runCase('TC07: Preserves summary rating breakdown and per-review point badges', () => {
      assert.strictEqual(serviceData.summary.totalReviews, 3);
      assert.strictEqual(serviceData.summary.avgRating, 4.7);
      assert.ok(serviceHtml.includes('4.7'));
      assert.ok(serviceHtml.includes('(3 đánh giá)'));
      assert.ok(serviceHtml.includes('+300đ'));
    });

    await runCase('TC08: Preserves review ordering and uploaded review media rendering', () => {
      const idx1 = serviceHtml.indexOf('Nguyễn Minh Anh');
      const idx2 = serviceHtml.indexOf('Lê &amp; &lt;script&gt;');
      const idx3 = serviceHtml.indexOf('Không chọn tag vẫn hiển thị bình thường.');
      assert.ok(idx1 > 0 && idx2 > idx1 && idx3 > idx2, 'Reviews order from service (DESC) must remain intact');
      assert.ok(serviceHtml.includes('/uploads/reviews/rev_101_a.jpg'));
      assert.ok(serviceHtml.includes('/uploads/reviews/rev_101_b.jpg'));
    });

    console.log(`\n[MEDIUM-02 REVIEW DISPLAY SUITE]: ALL ${passed}/8 TESTS PASSED!`);
  } finally {
    dbConfig.query = origQuery;
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[MEDIUM-02 REVIEW DISPLAY SUITE FAILED]:', err);
    process.exit(1);
  });
