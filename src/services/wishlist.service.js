const wishlistRepository = require('../models/repositories/wishlist.repository');

class WishlistService {
  /**
   * Get user's wishlist items
   * @param {number} userId
   * @returns {Promise<{items: Array, count: number}>}
   */
  async getWishlist(userId) {
    const rawItems = await wishlistRepository.findByUserId(userId);
    const items = rawItems.map(item => ({
      id: item.product_id,
      wishlist_item_id: item.id,
      name: item.name,
      slug: item.slug,
      product_code: item.product_code,
      gender_target: item.gender_target,
      price: Number(item.effective_price || item.base_price || 0),
      base_price: Number(item.base_price || 0),
      sale_price: item.sale_price !== null ? Number(item.sale_price) : null,
      img: item.image_url || '/images/placeholder-shoe.png',
      added_at: item.created_at,
    }));

    return {
      items,
      count: items.length,
    };
  }

  /**
   * Add a product to wishlist
   * @param {number} userId
   * @param {number|string} productId
   */
  async addItem(userId, productId) {
    const parsedId = Number.parseInt(productId, 10);
    if (!parsedId || Number.isNaN(parsedId) || parsedId <= 0) {
      const err = new Error('Mã sản phẩm không hợp lệ.');
      err.status = 400;
      throw err;
    }

    const product = await wishlistRepository.findProductById(parsedId);
    if (!product || product.status !== 'active') {
      const err = new Error('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
      err.status = 404;
      throw err;
    }

    await wishlistRepository.addItem(userId, parsedId);
    const count = await wishlistRepository.countByUserId(userId);

    return {
      success: true,
      action: 'added',
      inWishlist: true,
      count,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
    };
  }

  /**
   * Toggle product in wishlist (add if missing, remove if present)
   * @param {number} userId
   * @param {number|string} productId
   */
  async toggleItem(userId, productId) {
    const parsedId = Number.parseInt(productId, 10);
    if (!parsedId || Number.isNaN(parsedId) || parsedId <= 0) {
      const err = new Error('Mã sản phẩm không hợp lệ.');
      err.status = 400;
      throw err;
    }

    const product = await wishlistRepository.findProductById(parsedId);
    if (!product || product.status !== 'active') {
      const err = new Error('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
      err.status = 404;
      throw err;
    }

    const exists = await wishlistRepository.isInWishlist(userId, parsedId);
    let action = 'added';
    let inWishlist = true;

    if (exists) {
      await wishlistRepository.removeItem(userId, parsedId);
      action = 'removed';
      inWishlist = false;
    } else {
      await wishlistRepository.addItem(userId, parsedId);
      action = 'added';
      inWishlist = true;
    }

    const count = await wishlistRepository.countByUserId(userId);

    return {
      success: true,
      action,
      inWishlist,
      count,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
    };
  }

  /**
   * Remove a single product from wishlist
   * @param {number} userId
   * @param {number|string} productId
   */
  async removeItem(userId, productId) {
    const parsedId = Number.parseInt(productId, 10);
    if (!parsedId || Number.isNaN(parsedId) || parsedId <= 0) {
      const err = new Error('Mã sản phẩm không hợp lệ.');
      err.status = 400;
      throw err;
    }

    await wishlistRepository.removeItem(userId, parsedId);
    const count = await wishlistRepository.countByUserId(userId);

    return {
      success: true,
      action: 'removed',
      inWishlist: false,
      count,
    };
  }

  /**
   * Clear all items in user's wishlist
   * @param {number} userId
   */
  async clearWishlist(userId) {
    await wishlistRepository.clearWishlist(userId);
    return {
      success: true,
      count: 0,
    };
  }

  /**
   * Migrate legacy customer items from localStorage to server-side SQL Server
   * @param {number} userId
   * @param {Array<number|string>} productIds
   */
  async migrateLegacyWishlist(userId, productIds) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    let migratedCount = 0;
    for (const pid of productIds) {
      const parsedId = Number.parseInt(pid, 10);
      if (parsedId && !Number.isNaN(parsedId) && parsedId > 0) {
        try {
          const product = await wishlistRepository.findProductById(parsedId);
          if (product && product.status === 'active') {
            await wishlistRepository.addItem(userId, parsedId);
            migratedCount++;
          }
        } catch (_) {
          // Skip invalid entries during migration
        }
      }
    }

    const count = await wishlistRepository.countByUserId(userId);
    return {
      success: true,
      migratedCount,
      count,
    };
  }
}

module.exports = new WishlistService();
