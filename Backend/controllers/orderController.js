const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification'); // For DB alerts

// @desc    Create new Order
// @route   POST /api/v1/order/new
exports.newOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });

    // 1. Create DB Notification (Persistent)
    await Notification.create({
        message: `New Order placed by ${req.user.name} for ₹${totalPrice}`,
        type: 'order'
    });

    // 2. Real-time Socket Notification (Instant Alert for Admin Dashboard)
    // Yeh "req.app.get('io')" tabhi chalega jab server.js mein "app.set('io', io)" kiya ho
    const io = req.app.get("io");
    if (io) {
        io.emit("new_order_notification", {
            message: `New Order from ${req.user.name}`,
            totalAmount: totalPrice,
            orderId: order._id,
            user: req.user.name,
            createdAt: new Date()
        });
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Order
// @route   GET /api/v1/order/:id
exports.getSingleOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/me
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/v1/admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email");
    
    // Calculate Total Revenue
    let totalAmount = 0;
    orders.forEach((order) => {
      if(order.orderStatus !== "Cancelled") {
        totalAmount += order.totalPrice;
      }
    });

    res.status(200).json({ success: true, totalAmount, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Order Status (Admin)
// @route   PUT /api/v1/admin/order/:id
exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({ success: false, message: "You have already delivered this order" });
    }

    // If status is being changed to Shipped, decrease stock
    if (req.body.status === "Shipped") {
      // Using for...of loop to handle async/await correctly
      for (const o of order.orderItems) {
        await updateStock(o.product, o.quantity);
      }
    }

    order.orderStatus = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Order (Admin)
// @route   DELETE /api/v1/admin/order/:id
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    await order.deleteOne();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Update stock function
async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  
  if (product) {
      product.stock -= quantity;
      product.sales += quantity; 
      await product.save({ validateBeforeSave: false });
  }
}