const Order = require('../models/Order');

// Get all orders
async function getAllOrders() {
  return await Order.find({}).populate('userId', 'firstName lastName email');
}

// Get one order by ID
async function getOrderById(id) {
  return await Order.findById(id).populate('userId', 'firstName lastName email');
}

// Create a new order
async function createOrder(data) {
  const order = new Order(data);
  return await order.save();
}

// Update order status by ID
async function updateOrderStatus(id, status) {
  return await Order.findByIdAndUpdate(id, { status }, { new: true });
}

// Delete order by ID
async function deleteOrder(id) {
  return await Order.findByIdAndDelete(id);
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
