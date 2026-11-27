const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// Ensure destination folder exists
const uploadDir = path.resolve(__dirname, '../public/uploads/reviews');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowlist MIME types for image uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

// Allowlist file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

/**
 * Verify genuine image content by checking magic bytes / file signatures
 * Defends against renamed executables, php, html, or shell scripts
 * @param {string} filePath - Absolute path to uploaded file on disk
 * @returns {boolean}
 */
function isAuthenticImage(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // 1. JPEG: starts with FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }

    // 2. PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    if (
      bytesRead >= 8 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
    ) {
      return true;
    }

    // 3. WebP: starts with RIFF (52 49 46 46) ... WEBP (57 45 42 50 at offset 8)
    if (
      bytesRead >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Clean up uploaded files from disk safely
 * Used on request errors, validation failures, or SQL rollbacks
 * @param {Array<{path: string}>} files
 */
function cleanupUploadedFiles(files) {
  if (!Array.isArray(files) || files.length === 0) return;
  for (const f of files) {
    try {
      const filePath = typeof f === 'string' ? f : (f?.path || (f?.filename ? path.join(uploadDir, f.filename) : null));
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // Non-blocking cleanup warning
      console.warn(`[UPLOAD CLEANUP WARNING]: Unable to delete ${f?.path || f}:`, err.message);
    }
  }
}

// Safe disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random unguessable filename without path traversal risk
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
    const randomHex = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    cb(null, `review_${timestamp}_${randomHex}${safeExt}`);
  }
});

// File filter validator (Defense-in-depth: MIME type + extension check)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Chỉ chấp nhận các định dạng ảnh hợp lệ (.jpg, .jpeg, .png, .webp). Video hiện chưa khả dụng.'), false);
  }
  cb(null, true);
};

// Multer upload instance: max 5 files, max 5 MB per file
const reviewMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5 // Max 5 media files per review
  }
});

// Wrapper middleware to gracefully handle multer errors and verify magic bytes
const reviewUploadMiddleware = (req, res, next) => {
  const uploadHandler = reviewMulter.array('media', 5);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      cleanupUploadedFiles(req.files);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Kích thước ảnh vượt quá giới hạn tối đa (5MB/ảnh).'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ được đính kèm tối đa 5 hình ảnh cho mỗi đánh giá.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload tệp tin: ${err.message}`
      });
    }
    if (err) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: err.message || 'Tệp đính kèm không hợp lệ.'
      });
    }

    // Deep Content Inspection: Verify file signatures of all uploaded files
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        if (!isAuthenticImage(file.path)) {
          // Reject and immediately scrub all uploaded files
          cleanupUploadedFiles(req.files);
          return res.status(400).json({
            success: false,
            message: 'Tệp tin tải lên không phải là ảnh hợp lệ (Phát hiện nội dung giả dạng hoặc tập tin không an toàn).'
          });
        }
      }
    }

    next();
  });
};

module.exports = {
  reviewUploadMiddleware,
  uploadDir,
  isAuthenticImage,
  cleanupUploadedFiles
};
