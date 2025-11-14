
const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minOrderAmount: Number,
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  validFrom: Date,
  validTo: Date,
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Coupon', CouponSchema); 