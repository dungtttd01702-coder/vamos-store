const sql = require('mssql');
const { query, getPool } = require('../config/database');
const loyaltyService = require('./loyalty.service');
const { cleanupUploadedFiles } = require('../middlewares/upload.middleware');

const ALLOWED_QUICK_TAGS = new Set([
  'Vừa vặn chuẩn size',
  'Đế Phylon cực êm',
  'Đẹp như hình',
  'Giao hàng nhanh',
  'Chất lượng xuất sắc',
  'Đóng gói cẩn thận'
]);

class ReviewService {
  /**
   * Get eligible products to review for a completed order
   */
  async getOrderEligibleItems(orderId, userId) {
    const oId = Number.parseInt(orderId, 10);
    if (!oId) throw new Error('Mã đơn hàng không hợp lệ.');

    // 1. Verify order ownership & status
    const orderRes = await query(`
      SELECT id, order_code, order_status, created_at
      FROM orders
      WHERE id = @orderId AND user_id = @userId
    `, { orderId: oId, userId });

    if (orderRes.recordset.length === 0) {
      throw new Error(`Không tìm thấy đơn hàng #${oId} hoặc đơn hàng không thuộc về tài khoản của bạn.`);
    }

    const order = orderRes.recordset[0];
    const isCompleted = order.order_status === 'COMPLETED';

    // 2. Query distinct products in order
    const itemsRes = await query(`
      SELECT 
        pv.product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        (SELECT TOP 1 pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.display_order ASC) AS image_url,
        oi.size_snapshot,
        oi.color_snapshot,
        oi.unit_price
      FROM order_items oi
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = @orderId
    `, { orderId: oId });

    // Deduplicate by product_id (in case customer bought multiple sizes/colors of the same product)
    const productMap = new Map();
    for (const item of itemsRes.recordset) {
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, item);
      }
    }
    const distinctProducts = Array.from(productMap.values());

    // 3. Check existing reviews for this order
    const reviewsRes = await query(`
      SELECT product_id, rating, comment, quick_tags, points_earned, created_at
      FROM reviews
      WHERE order_id = @orderId AND user_id = @userId
    `, { orderId: oId, userId });

    const reviewMap = new Map();
    for (const r of reviewsRes.recordset) {
      reviewMap.set(r.product_id, r);
    }

    const items = distinctProducts.map(p => {
      const existing = reviewMap.get(p.product_id);
      return {
        ...p,
        isReviewed: Boolean(existing),
        existingReview: existing || null,
        canReview: isCompleted && !existing
      };
    });

    return {
      order,
      isCompleted,
      items
    };
  }

  /**
   * Submit Product Review & Award Points (ACID Transaction)
   */
  async createReview({ userId, orderId, productId, rating, comment = '', quickTags = [], mediaFiles = [], files = [] }) {
    const resolvedMediaFiles = (Array.isArray(mediaFiles) && mediaFiles.length > 0) ? mediaFiles : (Array.isArray(files) ? files : []);
    let transaction = null;

    try {
      if (!userId) throw new Error('Yêu cầu đăng nhập tài khoản khách hàng.');
      
      const oId = Number.parseInt(orderId, 10);
      const pId = Number.parseInt(productId, 10);
      const numRating = Number.parseInt(rating, 10);

      if (!oId || !pId) {
        throw new Error('Thông tin đơn hàng hoặc sản phẩm không hợp lệ.');
      }

      if (Number.isNaN(numRating) || numRating < 1 || numRating > 5) {
        throw new Error('Đánh giá số sao bắt buộc từ 1 đến 5 sao.');
      }

      // 1. Verify order ownership and status
      const orderRes = await query(`
        SELECT id, order_status, order_code
        FROM orders
        WHERE id = @orderId AND user_id = @userId
      `, { orderId: oId, userId });

      if (orderRes.recordset.length === 0) {
        throw new Error(`Đơn hàng #${oId} không tồn tại hoặc không thuộc về tài khoản của bạn.`);
      }

      const order = orderRes.recordset[0];
      if (order.order_status !== 'COMPLETED') {
        throw new Error(`Đơn hàng #${order.order_code} hiện đang ở trạng thái "${order.order_status}". Chỉ đơn hàng đã giao thành công (COMPLETED) mới đủ điều kiện đánh giá nhận điểm.`);
      }

      // 2. Verify product is in order_items through product_variants
      const verifyProdRes = await query(`
        SELECT TOP 1 oi.id
        FROM order_items oi
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE oi.order_id = @orderId AND pv.product_id = @productId
      `, { orderId: oId, productId: pId });

      if (verifyProdRes.recordset.length === 0) {
        throw new Error('Sản phẩm bạn đánh giá không nằm trong danh mục sản phẩm của đơn hàng này.');
      }

      // 3. Filter valid quick tags
      let rawTags = quickTags;
      if (typeof rawTags === 'string') {
        try {
          rawTags = JSON.parse(rawTags);
        } catch (e) {
          rawTags = rawTags.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      const validTags = Array.isArray(rawTags) 
        ? rawTags.filter(t => ALLOWED_QUICK_TAGS.has(String(t).trim()))
        : [];

      const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

      // 4. Calculate Points strictly on backend
      const pointsEarned = loyaltyService.calculateReviewPoints({
        rating: numRating,
        comment: trimmedComment,
        quickTags: validTags,
        hasMedia: Array.isArray(resolvedMediaFiles) && resolvedMediaFiles.length > 0
      });

      // 5. Open SQL Transaction
      const pool = await getPool();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // 5.1. Lock & Check existing review for this (order_id, product_id)
      const dupReq = new sql.Request(transaction);
      dupReq.input('orderId', oId);
      dupReq.input('productId', pId);
      const dupRes = await dupReq.query(`
        SELECT id FROM reviews WITH (UPDLOCK, ROWLOCK)
        WHERE order_id = @orderId AND product_id = @productId
      `);

      if (dupRes.recordset.length > 0) {
        throw new Error('Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng rồi. Mỗi sản phẩm trong một đơn hàng chỉ được nhận thưởng đánh giá 1 lần.');
      }

      // 5.2. Insert review record
      const insReq = new sql.Request(transaction);
      insReq.input('userId', userId);
      insReq.input('orderId', oId);
      insReq.input('productId', pId);
      insReq.input('rating', numRating);
      insReq.input('comment', trimmedComment || null);
      insReq.input('quickTags', validTags.length > 0 ? JSON.stringify(validTags) : null);
      insReq.input('pointsEarned', pointsEarned);

      const insRes = await insReq.query(`
        INSERT INTO reviews 
        (user_id, order_id, product_id, rating, comment, quick_tags, points_earned, status, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES
        (@userId, @orderId, @productId, @rating, @comment, @quickTags, @pointsEarned, 'APPROVED', SYSUTCDATETIME(), SYSUTCDATETIME());
      `);

      const reviewId = insRes.recordset[0].id;

      // 5.3. Insert review_media records if any
      if (Array.isArray(resolvedMediaFiles) && resolvedMediaFiles.length > 0) {
        for (const file of resolvedMediaFiles) {
          const mediaReq = new sql.Request(transaction);
          mediaReq.input('reviewId', reviewId);
          mediaReq.input('mediaType', 'IMAGE');
          mediaReq.input('mediaUrl', `/uploads/reviews/${file.filename}`);
          mediaReq.input('origName', file.originalname || 'image.jpg');
          mediaReq.input('fileSize', file.size || 0);

          await mediaReq.query(`
            INSERT INTO review_media 
            (review_id, media_type, media_url, original_filename, file_size, created_at)
            VALUES
            (@reviewId, @mediaType, @mediaUrl, @origName, @fileSize, SYSUTCDATETIME())
          `);
        }
      }

      // 5.4. Award Review Points & Update Ledger Atomically
      const rewardResult = await loyaltyService.awardReviewPoints(transaction, {
        userId,
        reviewId,
        orderId: oId,
        productId: pId,
        pointsEarned
      });

      await transaction.commit();

      return {
        success: true,
        reviewId,
        rating: numRating,
        pointsEarned,
        newBalance: rewardResult.newBalance,
        tierCode: rewardResult.tierCode,
        message: `Đánh giá thành công! Bạn đã nhận được +${pointsEarned} điểm VAMOS Club.`
      };
    } catch (err) {
      if (transaction) {
        try { await transaction.rollback(); } catch (rbErr) {}
      }
      cleanupUploadedFiles(resolvedMediaFiles);
      throw err;
    }
  }
}

module.exports = new ReviewService();
