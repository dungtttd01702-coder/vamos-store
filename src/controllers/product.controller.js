const productService = require('../services/product.service');

class ProductController {
  /**
   * Display product catalog with filtering
   */
  async index(req, res, next) {
    try {
      const { cat, gender, size, sale, minPrice, maxPrice, q, sort, page } = req.query;

      const [catalogData, categories] = await Promise.all([
        productService.getCatalog({
          categorySlug: cat,
          gender,
          size,
          sale,
          minPrice,
          maxPrice,
          search: q,
          sort,
          page: parseInt(page, 10) || 1,
          limit: 12,
        }),
        productService.getAllCategories(),
      ]);

      // Find current category title
      let currentCategory = null;
      if (cat) {
        currentCategory = categories.find(c => c.slug === cat);
      }

      const pageTitle = sale === '1' || sale === 'true'
        ? 'Sản Phẩm Khuyến Mãi HOT'
        : (currentCategory ? currentCategory.name : 'Tất Cả Sản Phẩm');

      res.render('pages/products/index', {
        title: pageTitle,
        products: catalogData.products,
        total: catalogData.total,
        page: catalogData.page,
        totalPages: catalogData.totalPages,
        categories,
        currentCategory,
        selectedFilters: {
          cat: cat || '',
          gender: gender || '',
          size: size || '',
          sale: sale || '',
          minPrice: minPrice || '',
          maxPrice: maxPrice || '',
          q: q || '',
          sort: sort || '',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Display product detail
   */
  async detail(req, res, next) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);

      if (!product) {
        const err = new Error(`Không tìm thấy sản phẩm với đường dẫn: ${slug}`);
        err.status = 404;
        return next(err);
      }

      // Extract unique sizes and colors from variants
      const availableSizes = [...new Map(product.variants.map(v => [v.size_name, { id: v.size_order, name: v.size_name }])).values()];
      const availableColors = [...new Map(product.variants.map(v => [v.color_name, { name: v.color_name, hex: v.hex_code }])).values()];

      // Related products from same store catalog (Stitch C-DET-02)
      let relatedProducts = [];
      try {
        const flashSales = await productService.getFlashSaleProducts(5);
        relatedProducts = (flashSales || []).filter(p => p.id !== product.id).slice(0, 4);
      } catch (err) {
        relatedProducts = [];
      }

      res.render('pages/products/detail', {
        title: product.name,
        product,
        availableSizes,
        availableColors,
        relatedProducts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Real-time live search API endpoint
   * GET /products/live-search?q=... or GET /api/products/search?q=...
   */
  async liveSearch(req, res, next) {
    try {
      const q = req.query.q || '';
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.json({ success: true, count: 0, results: [] });
      }

      const results = await productService.searchLive(q.trim(), 8);
      return res.json({
        success: true,
        count: results.length,
        query: q.trim(),
        results: results.map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          product_code: item.product_code,
          category_name: item.category_name,
          brand_name: item.brand_name,
          gender_target: item.gender_target,
          base_price: item.base_price,
          sale_price: item.sale_price,
          image_url: item.image_url || '/images/placeholder-shoe.png',
          total_stock: item.total_stock || 0,
          in_stock: (item.total_stock || 0) > 0,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();

