/**
 * Validation utilities for VAMOS STORE
 */

// Email regex requiring valid domain and TLD (at least 2 letters, e.g. .com, .vn, .edu.vn)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Vietnam phone number regex: 10 digits starting with 03, 05, 07, 08, 09 or +84
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/**
 * Validate email format strictly
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 150) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validate Vietnamese phone number format
 * @param {string} phone 
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
  return PHONE_REGEX.test(cleanPhone);
}

/**
 * Validate password requirements (minimum 6 characters)
 * @param {string} password 
 * @returns {boolean}
 */
function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 100;
}

/**
 * Validate full name (minimum 2 characters, no illegal symbols)
 * @param {string} name 
 * @returns {boolean}
 */
function isValidFullName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

const MAX_RETAIL_QUANTITY = 10;

/**
 * Validate cart quantity strictly according to VAMOS retail rules (1-10 pairs, positive integer only)
 * @param {any} quantity 
 * @returns {{ valid: boolean, quantity?: number, message?: string }}
 */
function validateCartQuantity(quantity) {
  if (quantity === undefined || quantity === null || String(quantity).trim() === '') {
    return { valid: false, message: 'Vui lòng cung cấp số lượng sản phẩm hợp lệ.' };
  }
  const str = String(quantity).trim();
  if (!/^[1-9]\d*$/.test(str)) {
    return { valid: false, message: 'Số lượng sản phẩm không hợp lệ (phải là số nguyên dương từ 1 đến 10).' };
  }
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num < 1) {
    return { valid: false, message: 'Số lượng sản phẩm không hợp lệ (phải là số nguyên dương từ 1 đến 10).' };
  }
  if (num > MAX_RETAIL_QUANTITY) {
    return {
      valid: false,
      message: `Đơn hàng bán lẻ trên website tối đa 10 đôi/sản phẩm. Nếu quý khách có nhu cầu mua sỉ số lượng lớn (${num} đôi), vui lòng liên hệ Hotline 1900 2126 để nhận báo giá sỉ ưu đãi!`,
    };
  }
  return { valid: true, quantity: num };
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidFullName,
  validateCartQuantity,
  MAX_RETAIL_QUANTITY,
};

