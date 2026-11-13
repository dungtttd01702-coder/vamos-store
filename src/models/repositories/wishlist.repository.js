const { query } = require('../../config/database');

class WishlistRepository {
  /**
   * Find all active wishlist items for a user
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    const sql = `
      SELECT
        w.id,
        w.product_id,
        w.created_at,
        p.name,
        p.slug,
        p.product_code,
        p.gender_target,
        p.base_price,
        p.sale_price,
        COALESCE(p.sale_price, p.base_price) AS effective_price,
        (
          SELECT TOP 1 image_url
          FROM product_images
          WHERE product_id = p.id
          ORDER BY is_primary DESC, display_order ASC
        ) AS image_url
      FROM wishlist_items w
      INNER JOIN products p ON w.product_id = p.id
      WHERE w.user_id = @userId AND p.status = 'active'
      ORDER BY w.created_at DESC
    `;
    const res = await query(sql, { userId });
    return res.recordset;
  }

  /**
   * Find product by id to verify existence and active status
   * @param {number} productId
   * @returns {Promise<Object|null>}
   */
  async findProductById(productId) {
    const sql = `
      SELECT id, name, slug, product_code, base_price, sale_price, status
      FROM products
      WHERE id = @productId
    `;
    const res = await query(sql, { productId });
    return res.recordset[0] || null;
  }

  /**
   * Check if a product is in the user's wishlist
   * @param {number} userId
   * @param {number} productId
   * @returns {Promise<boolean>}
   */
  async isInWishlist(userId, productId) {
    const sql = `
      SELECT 1 AS exists_flag
      FROM wishlist_items
      WHERE user_id = @userId AND product_id = @productId
    `;
    const res = await query(sql, { userId, productId });
    return res.recordset.length > 0;
  }

  /**
   * Add item to wishlist (idempotent, safe against duplicate key errors)
   * @param {number} userId
   * @param {number} productId
   * @returns {Promise<boolean>}
   */
  async addItem(userId, productId) {
    const sql = `
      IF NOT EXISTS (SELECT 1 FROM wishlist_items WHERE user_id = @userId AND product_id = @productId)
      BEGIN
        INSERT INTO wishlist_items (user_id, product_id, created_at)
        VALUES (@userId, @productId, GETDATE());
      END
    `;
    await query(sql, { userId, productId });
    return true;
  }

  /**
   * Remove item from wishlist
   * @param {number} userId
   * @param {number} productId
   * @returns {Promise<boolean>}
   */
  async removeItem(userId, productId) {
    const sql = `
      DELETE FROM wishlist_items
      WHERE user_id = @userId AND product_id = @productId
    `;
    const res = await query(sql, { userId, productId });
    return res.rowsAffected[0] > 0;
  }

  /**
   * Clear all items in user's wishlist
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async clearWishlist(userId) {
    const sql = `
      DELETE FROM wishlist_items
      WHERE user_id = @userId
    `;
    await query(sql, { userId });
    return true;
  }

  /**
   * Count total active wishlist items for a user
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async countByUserId(userId) {
    const sql = `
      SELECT COUNT(*) AS total
      FROM wishlist_items w
      INNER JOIN products p ON w.product_id = p.id
      WHERE w.user_id = @userId AND p.status = 'active'
    `;
    const res = await query(sql, { userId });
    return res.recordset[0]?.total || 0;
  }
}

module.exports = new WishlistRepository();
