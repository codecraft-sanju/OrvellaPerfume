const Product = require('../models/Product');

// @desc    Create new product (Admin)
// @route   POST /api/v1/admin/product/new
exports.createProduct = async (req, res, next) => {
  try {
    req.body.user = req.user.id; // Assign creator
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products (with Search)
// @route   GET /api/v1/products
exports.getAllProducts = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    
    // Search Filter Logic
    const queryObj = keyword ? {
        name: { $regex: keyword, $options: "i" }
    } : {};

    const products = await Product.find(queryObj);
    const productCount = await Product.countDocuments();

    res.status(200).json({
      success: true,
      products,
      productCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product details
// @route   GET /api/v1/product/:id
exports.getProductDetails = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Product (Admin)
// @route   PUT /api/v1/admin/product/:id
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Product (Admin)
// @route   DELETE /api/v1/admin/product/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};