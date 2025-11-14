// services/recommandationService.js
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// Track product view
async function trackProductView(productId, userId = null, sessionId = null, ipAddress = '') {
  const update = {};
  
  // Create a view record
  const viewRecord = {
    ipAddress,
    viewedAt: new Date()
  };

  // For authenticated users
  if (userId) {
    viewRecord.userId = userId;
    // Check if user has already viewed this product
    const existingView = await Product.findOne({
      _id: productId,
      'viewedBy.userId': userId
    });
    
    if (!existingView) {
      update.$inc = { viewCount: 1 };
      update.$push = { viewedBy: viewRecord };
    }
  } 
  // For guest users
  else if (sessionId) {
    viewRecord.sessionId = sessionId;
    // Check if this session has already viewed this product
    const existingView = await Product.findOne({
      _id: productId,
      $or: [
        { 'viewedBy.sessionId': sessionId },
        { 'viewedBy.ipAddress': ipAddress }
      ]
    });
    
    if (!existingView) {
      update.$inc = { viewCount: 1 };
      update.$push = { viewedBy: viewRecord };
    }
  }

  // Only update if we have changes to make
  if (Object.keys(update).length > 0) {
    return await Product.findByIdAndUpdate(
      productId,
      update,
      { new: true }
    );
  }
  
  // Return the product without changes if no update was needed
  return await Product.findById(productId);
}

// Get product recommendations
async function getProductRecommendations(productId, limit = 4) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  return await Product.find({
    _id: { $ne: productId },
    status: 'published',
    $or: [
      { category: product.category },
      { type: product.type },
      { tags: { $in: product.tags || [] } }
    ]
  })
  .sort({ purchaseCount: -1, viewCount: -1 })
  .limit(limit);
}

// Get user recommendations
async function getUserRecommendations(userId, limit = 4) {
  // For now, return trending products
  // In a real app, use the user's purchase/behavior history
  return await Product.find({ status: 'published' })
    .sort({ purchaseCount: -1, viewCount: -1 })
    .limit(limit);
}

// Get trending products
async function getTrendingProducts(limit = 4) {
  try {
    // First, update any products that might have undefined viewCount or purchaseCount
    await Product.updateMany(
      { viewCount: { $exists: false } },
      { $set: { viewCount: 0 } }
    );
    
    await Product.updateMany(
      { purchaseCount: { $exists: false } },
      { $set: { purchaseCount: 0 } }
    );

    const products = await Product.aggregate([
      { $match: { status: 'published' } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          regularPrice: 1,
          salePrice: 1,
          images: 1,
          imageUrl: 1,
          category: 1,
          type: 1,
          gender: 1,
          tags: 1,
          variants: 1,
          viewCount: { $ifNull: ['$viewCount', 0] },
          purchaseCount: { $ifNull: ['$purchaseCount', 0] },
          status: 1,
          soldCount: { $ifNull: ['$soldCount', 0] }
        }
      },
      { 
        $addFields: { 
          popularity: { 
            $add: [
              { $multiply: ['$purchaseCount', 2] },
              '$viewCount'
            ] 
          } 
        }
      },
      { $sort: { popularity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Process images to ensure they have the correct URL
    return products.map(product => {
      // Helper function to format image URLs
      const formatImageUrl = (url) => {
        if (!url) return '';
        // Remove any leading slashes to prevent double slashes
        const cleanUrl = url.replace(/^\/+/, '');
        // If it's already a full URL or already has /uploads/, return as is
        return url.startsWith('http') || url.includes('/uploads/')
          ? url
          : `/uploads/${cleanUrl}`;
      };

      // Format the main image URL
      const formattedImageUrl = formatImageUrl(
        product.imageUrl || (product.images && product.images[0])
      );

      // Format the images array if it exists
      const formattedImages = Array.isArray(product.images)
        ? product.images.map(img => formatImageUrl(img))
        : [];

      return {
        ...product,
        images: formattedImages,
        imageUrl: formattedImageUrl
      };
    });
  } catch (error) {
    console.error('Error in getTrendingProducts:', error);
    throw error;
  }
}

// Helper to get client IP address
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',').shift() || 
         req.socket?.remoteAddress ||
         '';
};

// Express middleware wrapper functions
const trackProductViewHandler = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user?.id; // Will be undefined for guests
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  const ipAddress = getClientIp(req);
  
  await trackProductView(productId, userId, sessionId, ipAddress);
  res.status(200).json({ success: true });
});

const getProductRecommendationsHandler = asyncHandler(async (req, res) => {
  const recommendations = await getProductRecommendations(
    req.params.productId,
    parseInt(req.query.limit) || 4
  );
  res.json(recommendations);
});

const getUserRecommendationsHandler = asyncHandler(async (req, res) => {
  const recommendations = await getUserRecommendations(
    req.user.id,
    parseInt(req.query.limit) || 4
  );
  res.json(recommendations);
});

const getTrendingProductsHandler = asyncHandler(async (req, res) => {
  const trending = await getTrendingProducts(parseInt(req.query.limit) || 4);
  res.json(trending);
});

module.exports = {
  // Core functions
  trackProductView,
  getProductRecommendations,
  getUserRecommendations,
  getTrendingProducts,
  
  // Express handlers
  trackProductViewHandler,
  getProductRecommendationsHandler,
  getUserRecommendationsHandler,
  getTrendingProductsHandler
};