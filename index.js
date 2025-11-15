const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const Product = require('./models/Product');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads folder statically so images can be accessed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

// API Routes
const apiRouter = express.Router();
apiRouter.use('/products', productRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('', couponRoutes);
apiRouter.use('/recommendations', recommendationRoutes);

app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
  });
} else {
  // Production mode
  app.listen(PORT, HOST, () => {
    console.log(`Server is running in production mode on port ${PORT}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
