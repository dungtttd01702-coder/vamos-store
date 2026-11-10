const productRepository = require('../models/repositories/product.repository');

class ProductService {
  async getCatalog(filters) {
    return productRepository.findAll(filters);
  }

  async getProductBySlug(slug) {
    return productRepository.findBySlug(slug);
  }

  async getAllCategories() {
    return productRepository.getCategories();
  }

  async getHomeBanners() {
    return productRepository.getBanners();
  }

  async getLatestProducts(limit = 8) {
    return productRepository.getLatestProducts(limit);
  }

  async getFlashSaleProducts(limit = 4) {
    return productRepository.getFlashSaleProducts(limit);
  }
}

module.exports = new ProductService();

