const productService = require('../services/product.service');

class ProductController {
  /**
   * Display product catalog with filtering
   */
  async index(req, res, next) {
    try {
      const { cat, gender, minPrice, maxPrice, q, sort, page } = req.query;

      const [catalogData, categories] = await Promise.all([
        productService.getCatalog({
          categorySlug: cat,
          gender,
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

      res.render('pages/products/index', {
        title: currentCategory ? currentCategory.name : 'Tất Cả Sản Phẩm',
        products: catalogData.products,
        total: catalogData.total,
        page: catalogData.page,
        totalPages: catalogData.totalPages,
        categories,
        currentCategory,
        selectedFilters: {
          cat: cat || '',
          gender: gender || '',
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

      res.render('pages/products/detail', {
        title: product.name,
        product,
        availableSizes,
        availableColors,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();

