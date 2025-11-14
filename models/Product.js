const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  regularPrice: { type: Number, required: true },
  salePrice: { type: Number },
  images: [String], // array of image URLs or base64
  imageUrl: String, // for backward compatibility
  category: { type: String, index: true },
  type: { type: String, index: true },
  gender: { type: String, index: true },
  tags: [{ type: String }],
  viewCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
  // Track views by user ID (for authenticated users) or session ID (for guests)
  viewedBy: [{
    _id: false,
    userId: { type: mongoose.Schema.Types.ObjectId, sparse: true },
    sessionId: { type: String, sparse: true },
    ipAddress: { type: String },
    viewedAt: { type: Date, default: Date.now }
  }],
  variants: [{
    id: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 }, // Only stock for inventory
    image: String // optional variant-specific image
  }],
  dateOption: String,
  date: String,
  schedule: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft'  // new products start as drafts
  },
  createdAt: { type: Date, default: Date.now },
  soldCount: { type: Number, default: 0 }
});

// Add method to check stock availability
productSchema.methods.checkStockAvailability = function(variantId, requestedQuantity) {
  const variant = this.variants.find(v => v.id === variantId);
  if (!variant) {
    return { available: false, currentStock: 0, message: 'Variant not found' };
  }
  
  const available = variant.stock >= requestedQuantity;
  return { 
    available, 
    currentStock: variant.stock, 
    message: available ? 'In stock' : 'Insufficient stock' 
  };
};

// Add method to update stock
productSchema.methods.updateStock = function(variantId, quantity, operation) {
  const variant = this.variants.find(v => v.id === variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }

  if (operation === 'decrease') {
    if (variant.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    variant.stock -= quantity;
  } else if (operation === 'increase') {
    variant.stock += quantity;
  }

  return variant.stock;
};

// Add method to calculate stock status automatically
productSchema.methods.calculateStockStatus = function() {
  if (!this.variants || this.variants.length === 0) {
    return 'Out of Stock';
  }
  const totalStock = this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  return totalStock > 0 ? 'In Stock' : 'Out of Stock';
};

// Add virtual property for stock status
productSchema.virtual('stockStatus').get(function() {
  return this.calculateStockStatus();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
