const productService = require('../services/product.service');

/**
 * Controller for Homepage - Real DB Integration
 */
async function index(req, res, next) {
  try {
    const [banners, categories, latestProducts, flashSaleProducts] = await Promise.all([
      productService.getHomeBanners(),
      productService.getAllCategories(),
      productService.getLatestProducts(8),
      productService.getFlashSaleProducts(4),
    ]);

    // Format products for view
    const formatProduct = (p) => {
      const discountPercent = p.sale_price && p.base_price > p.sale_price
        ? Math.round(((p.base_price - p.sale_price) / p.base_price) * 100)
        : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand_name || 'VAMOS',
        category: p.category_name,
        categorySlug: p.category_slug,
        originalPrice: p.base_price,
        salePrice: p.sale_price || p.base_price,
        hasDiscount: Boolean(p.sale_price && p.sale_price < p.base_price),
        discountPercent,
        imageUrl: p.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        isNew: true,
      };
    };

    const formattedLatest = latestProducts.map(formatProduct);
    const formattedFlashSale = flashSaleProducts.map(formatProduct);

    // Fallback banner if none in DB
    const bannerList = banners.length > 0 ? banners : [
      {
        id: 1,
        title: 'MOVE YOUR WAY - BỘ SƯU TẬP 2026',
        subtitle: 'Thoải mái trong từng bước chân, định hình phong cách đường phố cùng VAMOS',
        image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=80',
        link_url: '/products',
      }
    ];

    res.render('pages/home', {
      title: 'VAMOS STORE - Giày Sneaker & Thể Thao Chính Hãng',
      banners: bannerList,
      categories,
      latestProducts: formattedLatest,
      flashSaleProducts: formattedFlashSale,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to switch language (vi / en) via cookie
 */
function setLocale(req, res) {
  const lang = (req.params.lang || '').toLowerCase();
  const targetLocale = (lang === 'en') ? 'en' : 'vi';

  // Set persistent cookie (1 year)
  res.cookie('vamos_locale', targetLocale, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  });

  // Support JSON/AJAX requests
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, locale: targetLocale });
  }

  // Safe redirect to referrer preventing open redirect
  const ref = req.get('Referrer');
  let redirectUrl = '/';
  if (ref) {
    try {
      if (!ref.startsWith('http://') && !ref.startsWith('https://')) {
        redirectUrl = ref.startsWith('/') ? ref : '/';
      } else {
        const parsed = new URL(ref);
        if (parsed.hostname === req.hostname) {
          redirectUrl = parsed.pathname + parsed.search;
        }
      }
    } catch {
      redirectUrl = '/';
    }
  }

  return res.redirect(redirectUrl);
}

module.exports = {
  index,
  setLocale,
};

