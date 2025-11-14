const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productService = require('../services/productService');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Use upload.any() to accept any file field (images, variantImages[0], etc.)
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max per file
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET products by status
router.get('/status/:status', async (req, res) => {
  try {
    const products = await productService.getProductsByStatus(req.params.status);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET available colors for filters
router.get('/colors', async (req, res) => {
  try {
    const colors = await productService.getAvailableColors();
    res.json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create product with images upload
router.post('/', upload.any(), async (req, res) => {
  try {
    // Debug log to inspect incoming data
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    // Separate files by fieldname
    const imageFiles = req.files.filter(file => file.fieldname === 'images');
    const variantImageFiles = req.files.filter(file => file.fieldname.startsWith('variantImages['));
    const imagePaths = imageFiles.map(file => `/uploads/${file.filename}`);

    // Compose product data
    const productData = {
      ...req.body,
      images: imagePaths
    };

    // Convert numeric fields from strings
    if (productData.regularPrice) productData.regularPrice = parseFloat(productData.regularPrice);
    if (productData.salePrice) productData.salePrice = parseFloat(productData.salePrice);
    if (productData.quantityInStock) productData.quantityInStock = parseInt(productData.quantityInStock);

    // Handle variants data
    if (req.body.variants) {
      let variants = req.body.variants;
      if (typeof variants === 'string') {
        try {
          variants = JSON.parse(variants);
        } catch {
          variants = [variants];
        }
      }
      productData.variants = Array.isArray(variants) ? variants : [variants];
    }

    // Handle variant images if they exist
    if (req.files && productData.variants) {
      req.files.forEach(file => {
        const match = file.fieldname.match(/^variantImage_(.+)$/);
        if (match) {
          const variantId = match[1];
          const imagePath = `/uploads/${file.filename}`;
          const variant = productData.variants.find(v => v.id === variantId);
          if (variant) {
            variant.image = imagePath;
          }
        }
      });
    }

    const newProduct = await productService.createProduct(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update product by ID (no image upload here)
router.put('/:id', async (req, res) => {
  try {
    // Convert numeric fields from strings
    const updateData = { ...req.body };
    if (updateData.regularPrice) updateData.regularPrice = parseFloat(updateData.regularPrice);
    if (updateData.salePrice) updateData.salePrice = parseFloat(updateData.salePrice);
    if (updateData.quantityInStock) updateData.quantityInStock = parseInt(updateData.quantityInStock);

    const updatedProduct = await productService.updateProduct(req.params.id, updateData);
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE product by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await productService.deleteProduct(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock management routes
router.post('/check-stock', async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    
    const product = await productService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const stockCheck = product.checkStockAvailability(variantId, quantity);
    res.json(stockCheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/update-stock', async (req, res) => {
  try {
    const { productId, variantId, quantity, operation } = req.body;
    
    const product = await productService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newStock = product.updateStock(variantId, quantity, operation);
    await productService.updateProduct(productId, { quantityInStock: newStock });
    
    res.json({ success: true, newStock });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get product with real-time stock information
router.get('/:id/stock', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET new arrivals
router.get('/new-arrivals', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const products = await productService.getNewArrivals(days);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET best sellers
router.get('/best-sellers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await productService.getBestSellers(limit);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
