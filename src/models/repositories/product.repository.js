const { query } = require('../../config/database');

class ProductRepository {
  /**
   * Find products with filtering, search, and pagination
   */
  async findAll({ categorySlug, gender, size, sale, minPrice, maxPrice, search, sort, page = 1, limit = 12 }) {
    let sqlWhere = "WHERE p.status = 'active'";
    const params = {};

    if (categorySlug) {
      sqlWhere += " AND c.slug = @catSlug";
      params.catSlug = categorySlug;
    }

    if (gender) {
      sqlWhere += " AND p.gender_target = @gender";
      params.gender = gender;
    }

    if (size) {
      sqlWhere += ` AND EXISTS (
        SELECT 1 FROM product_variants pv 
        JOIN sizes s ON pv.size_id = s.id 
        WHERE pv.product_id = p.id AND s.size_name = @size AND pv.stock_quantity > 0 AND pv.status = 'active'
      )`;
      params.size = String(size);
    }

    if (sale === '1' || sale === 'true' || sale === true) {
      sqlWhere += " AND (p.sale_price IS NOT NULL AND p.sale_price > 0 AND p.sale_price < p.base_price)";
    }

    let parsedMin = minPrice !== undefined && minPrice !== null && minPrice !== '' ? parseFloat(minPrice) : null;
    let parsedMax = maxPrice !== undefined && maxPrice !== null && maxPrice !== '' ? parseFloat(maxPrice) : null;
    if (parsedMin !== null && !isNaN(parsedMin) && parsedMin < 0) parsedMin = 0;
    if (parsedMax !== null && !isNaN(parsedMax) && parsedMax < 0) parsedMax = null;
    if (parsedMin !== null && parsedMax !== null && !isNaN(parsedMin) && !isNaN(parsedMax) && parsedMin > parsedMax) {
      const tmp = parsedMin;
      parsedMin = parsedMax;
      parsedMax = tmp;
    }

    if (parsedMin !== null && !isNaN(parsedMin)) {
      sqlWhere += " AND (COALESCE(p.sale_price, p.base_price) >= @minPrice)";
      params.minPrice = parsedMin;
    }

    if (parsedMax !== null && !isNaN(parsedMax)) {
      sqlWhere += " AND (COALESCE(p.sale_price, p.base_price) <= @maxPrice)";
      params.maxPrice = parsedMax;
    }

    if (search) {
      sqlWhere += " AND (p.name LIKE @search OR p.product_code LIKE @search)";
      params.search = `%${search}%`;
    }

    let sqlOrder = "ORDER BY p.id DESC";
    if (sort === 'price_asc') {
      sqlOrder = "ORDER BY COALESCE(p.sale_price, p.base_price) ASC";
    } else if (sort === 'price_desc') {
      sqlOrder = "ORDER BY COALESCE(p.sale_price, p.base_price) DESC";
    } else if (sort === 'name_asc') {
      sqlOrder = "ORDER BY p.name ASC";
    }

    const offset = (page - 1) * limit;
    params.offset = offset;
    params.limit = limit;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${sqlWhere}
    `;

    const dataSql = `
      SELECT 
        p.id, p.product_code, p.name, p.slug, p.description, p.gender_target,
        p.base_price, p.sale_price, p.status, p.created_at,
        c.name AS category_name, c.slug AS category_slug,
        b.name AS brand_name,
        (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${sqlWhere}
      ${sqlOrder}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const countRes = await query(countSql, params);
    const dataRes = await query(dataSql, params);

    const total = countRes.recordset[0].total;

    return {
      products: dataRes.recordset,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find product by slug with images, variants, size, and colors
   */
  async findBySlug(slug) {
    const prodSql = `
      SELECT 
        p.id, p.product_code, p.name, p.slug, p.description, p.gender_target,
        p.base_price, p.sale_price, p.status, p.created_at,
        c.name AS category_name, c.slug AS category_slug,
        b.name AS brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = @slug AND p.status = 'active'
    `;
    const prodRes = await query(prodSql, { slug });
    if (prodRes.recordset.length === 0) return null;

    const product = prodRes.recordset[0];

    // Images
    const imgSql = `
      SELECT id, image_url, is_primary, display_order 
      FROM product_images 
      WHERE product_id = @id 
      ORDER BY is_primary DESC, display_order ASC
    `;
    const imgRes = await query(imgSql, { id: product.id });
    product.images = imgRes.recordset;

    // Variants with sizes and colors
    const varSql = `
      SELECT 
        pv.id, pv.sku, pv.stock_quantity, pv.status,
        s.size_name, s.display_order AS size_order,
        c.color_name, c.hex_code
      FROM product_variants pv
      JOIN sizes s ON pv.size_id = s.id
      JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = @id AND pv.status = 'active'
      ORDER BY s.display_order ASC, c.color_name ASC
    `;
    const varRes = await query(varSql, { id: product.id });
    product.variants = varRes.recordset;

    return product;
  }

  /**
   * Get all active categories with product counts
   */
  async getCategories() {
    const sqlStr = `
      SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.slug, c.description
      ORDER BY c.id ASC
    `;
    const res = await query(sqlStr);
    return res.recordset;
  }

  /**
   * Get active banners for homepage slider
   */
  async getBanners() {
    const sqlStr = `
      SELECT id, title, image_url, link_url, display_order
      FROM banners
      WHERE is_active = 1
      ORDER BY display_order ASC, id ASC
    `;
    const res = await query(sqlStr);
    return res.recordset;
  }

  /**
   * Get latest products with primary image and brand/category info
   */
  async getLatestProducts(limit = 8) {
    const sqlStr = `
      SELECT TOP (@limit)
        p.id, p.product_code, p.name, p.slug, p.description, p.gender_target,
        p.base_price, p.sale_price, p.status, p.created_at,
        c.name AS category_name, c.slug AS category_slug,
        b.name AS brand_name,
        (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
      ORDER BY p.id DESC
    `;
    const res = await query(sqlStr, { limit });
    return res.recordset;
  }

  /**
   * Get flash sale / hot discount products
   */
  async getFlashSaleProducts(limit = 4) {
    const sqlStr = `
      SELECT TOP (@limit)
        p.id, p.product_code, p.name, p.slug, p.description, p.gender_target,
        p.base_price, p.sale_price, p.status,
        c.name AS category_name, c.slug AS category_slug,
        b.name AS brand_name,
        (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active' AND p.sale_price IS NOT NULL AND p.sale_price < p.base_price
      ORDER BY ((p.base_price - p.sale_price) / p.base_price) DESC
    `;
    const res = await query(sqlStr, { limit });
    return res.recordset;
  }

  /**
   * Real-time live search for products (Header search & Live autocomplete)
   */
  async searchLive(keyword, limit = 8) {
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return [];
    }

    const cleanKeyword = keyword.trim();
    const sqlStr = `
      SELECT TOP (@limit)
        p.id, p.product_code, p.name, p.slug, p.gender_target,
        p.base_price, p.sale_price, p.status,
        c.name AS category_name, c.slug AS category_slug,
        b.name AS brand_name,
        (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.id AND status = 'active') AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
        AND (
          p.name LIKE @q
          OR p.product_code LIKE @q
          OR c.name LIKE @q
          OR b.name LIKE @q
        )
      ORDER BY 
        CASE 
          WHEN p.name LIKE @exactStart THEN 0
          WHEN p.name LIKE @wordStart THEN 1
          ELSE 2 
        END,
        p.id DESC
    `;

    const res = await query(sqlStr, {
      q: `%${cleanKeyword}%`,
      exactStart: `${cleanKeyword}%`,
      wordStart: `% ${cleanKeyword}%`,
      limit,
    });

    return res.recordset;
  }
}

module.exports = new ProductRepository();

