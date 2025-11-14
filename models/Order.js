const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  selectedColor: String,
  selectedSize: String,
  quantity: { type: Number, required: true }
});

const StatusHistorySchema = new mongoose.Schema({
  status: String,
  date: { type: Date, default: Date.now }
});

const ShippingSchema = new mongoose.Schema({
  address: String,
  city: String,
  postalCode: String,
  country: String,
  carrier: String,
  trackingNumber: String
});

const GuestSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  phone: String
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  method: String,         // "credit-card", "paypal", "cash-on-delivery", etc.
  status: String,         // "paid", "pending", "failed"
  transactionId: String,  // Stripe/PayPal ID, etc.
  currency: { type: String, default: 'TND' }
}, { _id: false });

const DiscountSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  code: String,
  amount: Number
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isGuestOrder: { type: Boolean, default: false },
  guest: GuestSchema,
  items: [OrderItemSchema],
  status: { type: String, default: 'pending' },
  statusHistory: [StatusHistorySchema],
  shipping: ShippingSchema,
  payment: PaymentSchema,
  discount: DiscountSchema,
  fulfillmentStatus: { type: String, default: 'unfufilled' },
  isFirstOrder: Boolean,
  total: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
