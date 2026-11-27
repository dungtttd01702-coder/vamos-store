const wishlistService = require('../services/wishlist.service');

class WishlistController {
  /**
   * GET /api/wishlist
   * Get all active wishlist items for current Customer
   */
  async getWishlist(req, res) {
    try {
      const userId = req.session.user.id;
      const result = await wishlistService.getWishlist(userId);
      return res.json({
        success: true,
        count: result.count,
        data: result.items,
      });
    } catch (err) {
      console.error('[WishlistController.getWishlist ERROR]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống khi tải danh sách yêu thích.',
      });
    }
  }

  /**
   * POST /api/wishlist/items
   * Add a single item to wishlist
   */
  async addItem(req, res) {
    try {
      const userId = req.session.user.id;
      const { productId } = req.body;
      const result = await wishlistService.addItem(userId, productId);
      return res.status(201).json({
        success: true,
        action: result.action,
        inWishlist: result.inWishlist,
        count: result.count,
        product: result.product,
        message: 'Đã thêm sản phẩm vào danh sách yêu thích',
      });
    } catch (err) {
      console.error('[WishlistController.addItem ERROR]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống khi thêm sản phẩm vào danh sách yêu thích.',
      });
    }
  }

  /**
   * POST /api/wishlist/toggle
   * Toggle item in wishlist (convenient 1-click UX)
   */
  async toggleItem(req, res) {
    try {
      const userId = req.session.user.id;
      const { productId } = req.body;
      const result = await wishlistService.toggleItem(userId, productId);
      return res.json({
        success: true,
        action: result.action,
        inWishlist: result.inWishlist,
        count: result.count,
        product: result.product,
        message: result.inWishlist
          ? 'Đã thêm sản phẩm vào danh sách yêu thích'
          : 'Đã bỏ lưu sản phẩm khỏi danh sách yêu thích',
      });
    } catch (err) {
      console.error('[WishlistController.toggleItem ERROR]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống khi cập nhật danh sách yêu thích.',
      });
    }
  }

  /**
   * DELETE /api/wishlist/items/:productId
   * Remove a single item from wishlist
   */
  async removeItem(req, res) {
    try {
      const userId = req.session.user.id;
      const productId = req.params.productId || req.body.productId;
      const result = await wishlistService.removeItem(userId, productId);
      return res.json({
        success: true,
        action: result.action,
        inWishlist: result.inWishlist,
        count: result.count,
        message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
      });
    } catch (err) {
      console.error('[WishlistController.removeItem ERROR]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống khi xóa sản phẩm khỏi danh sách yêu thích.',
      });
    }
  }

  /**
   * DELETE /api/wishlist
   * Clear all items in user's wishlist
   */
  async clearWishlist(req, res) {
    try {
      const userId = req.session.user.id;
      const result = await wishlistService.clearWishlist(userId);
      return res.json({
        success: true,
        count: result.count,
        message: 'Đã xóa tất cả sản phẩm khỏi danh sách yêu thích',
      });
    } catch (err) {
      console.error('[WishlistController.clearWishlist ERROR]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống khi xóa toàn bộ danh sách yêu thích.',
      });
    }
  }

  /**
   * POST /api/wishlist/migrate
   * Safely migrate valid legacy localStorage items for newly authenticated customer
   */
  async migrateLegacy(req, res) {
    try {
      const userId = req.session.user.id;
      const { productIds } = req.body;
      const result = await wishlistService.migrateLegacyWishlist(userId, productIds);
      return res.json({
        success: true,
        migratedCount: result.migratedCount,
        count: result.count,
        message: `Đã đồng bộ ${result.migratedCount} sản phẩm vào tài khoản.`,
      });
    } catch (err) {
      console.error('[WishlistController.migrateLegacy ERROR]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống khi đồng bộ dữ liệu cũ.',
      });
    }
  }
}

module.exports = new WishlistController();
