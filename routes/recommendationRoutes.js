// backend/routes/recommandationRoutes.js
const express = require('express');
const router = express.Router();
const {
  trackProductViewHandler,
  getProductRecommendationsHandler,
  getUserRecommendationsHandler,
  getTrendingProductsHandler
} = require('../services/recommendationService');
const { protect } = require('../middleware/auth');

// @desc    Track product view
// @route   POST /api/recommendations/view
// @access  Public
router.post('/view', trackProductViewHandler);

// @desc    Get product recommendations
// @route   GET /api/recommendations/product/:productId
// @access  Public
router.get('/product/:productId', getProductRecommendationsHandler);

// @desc    Get user recommendations
// @route   GET /api/recommendations/user
// @access  Private
router.get('/user', protect, getUserRecommendationsHandler);

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
router.get('/trending', getTrendingProductsHandler);

module.exports = router;