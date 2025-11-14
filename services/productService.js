// services/productService.js
const Product = require('../models/Product');

// Get all products
async function getAllProducts() {
  return await Product.find({});
}

// Get products by status
async function getProductsByStatus(status) {
  return await Product.find({ status: status });
}

// Get one product by ID
async function getProductById(id) {
  return await Product.findById(id);
}

// Create a new product
async function createProduct(data) {
  const product = new Product(data);
  return await product.save();
}

// Update a product by ID
async function updateProduct(id, data) {
  return await Product.findByIdAndUpdate(id, data, { new: true });
}

// Delete a product by ID
async function deleteProduct(id) {
  return await Product.findByIdAndDelete(id);
}

// Get all available colors from product variants that are in stock
async function getAvailableColors() {
  const products = await Product.find({});
  const colorMap = {};
  products.forEach(product => {
    if (Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.color && variant.stock > 0) {
          const color = variant.color;
          if (!colorMap[color]) {
            colorMap[color] = 0;
          }
          colorMap[color] += variant.stock;
        }
      });
    }
  });
  // Return as array of { color, count }
  return Object.entries(colorMap).map(([color, count]) => ({ color, count }));
}

// Get new arrivals (by date only)
async function getNewArrivals(days = 14) {
  return await Product.find({
    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  });
}

// Get best sellers (by soldCount)
async function getBestSellers(limit = 10) {
  return await Product.find().sort({ soldCount: -1 }).limit(limit);
}

module.exports = {
  getAllProducts,
  getProductsByStatus,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAvailableColors,
  getNewArrivals,
  getBestSellers
};
