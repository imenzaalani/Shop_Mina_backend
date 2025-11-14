const express = require('express');
const router = express.Router();
const couponService = require('../services/couponService');

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

// Apply coupon
router.post('/apply-coupon', async (req, res) => {
  const { code, total } = req.body;
  try {
    const result = await couponService.applyCoupon(code, total);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all coupons
router.get('/coupons', async (req, res) => {
  const coupons = await couponService.getAllCoupons();
  res.json(coupons);
});

// Create coupon
router.post('/coupons', async (req, res) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update coupon
router.put('/coupons/:id', async (req, res) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    const result = await couponService.deleteCoupon(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 