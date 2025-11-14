const Coupon = require('../models/Coupon');

function isCouponValid(coupon, cartTotal) {
  const now = new Date();
  return (
    coupon &&
    coupon.active &&
    (!coupon.validFrom || now >= new Date(coupon.validFrom)) &&
    (!coupon.validTo || now <= new Date(coupon.validTo)) &&
    (!coupon.minOrderAmount || cartTotal >= coupon.minOrderAmount) &&
    (!coupon.maxUses || coupon.usedCount < coupon.maxUses)
  );
}

async function applyCoupon(code, total) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon || !isCouponValid(coupon, total)) {
    throw new Error('Invalid or expired coupon.');
  }
  const discount = coupon.type === 'percentage'
    ? (total * coupon.value) / 100
    : coupon.value;
  return { discount, finalTotal: total - discount, coupon: { _id: coupon._id, code: coupon.code, amount: discount } };
}

async function getAllCoupons() {
  return Coupon.find().sort({ createdAt: -1 });
}

async function createCoupon(data) {
  const couponData = { ...data, code: data.code.toUpperCase() };
  const coupon = new Coupon(couponData);
  await coupon.save();
  return coupon;
}

async function updateCoupon(id, data) {
  if (data.code) data.code = data.code.toUpperCase();
  return Coupon.findByIdAndUpdate(id, data, { new: true });
}

async function deleteCoupon(id) {
  await Coupon.findByIdAndDelete(id);
  return { message: 'Coupon deleted' };
}

module.exports = {
  isCouponValid,
  applyCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
}; 