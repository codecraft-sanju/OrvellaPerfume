const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Get all users (Admin)
// @route   GET /api/v1/admin/users
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper: Send Token via Cookie
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, 
    secure: true,      // Production ready (Vercel/Render)
    sameSite: 'none',  
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user,
    token,
  });
};

// @desc    Register a user
// @route   POST /api/v1/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: "https://ui-avatars.com/api/?name=" + name + "&background=D4AF37&color=000",
    });

    sendToken(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/v1/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please enter email and password" });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   GET /api/v1/logout
exports.logout = async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,    
    sameSite: 'none'  
  });

  res.status(200).json({
    success: true,
    message: 'Logged Out Successfully',
  });
};

// @desc    Get current logged in user
// @route   GET /api/v1/me
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------
// 👇 NEW FUNCTION ADDED FOR ADMIN PANEL ROLE UPDATE 👇
// ---------------------------------------------------

// @desc    Update User Role (Admin Only)
// @route   PUT /api/v1/admin/user/:id
exports.updateUserRole = async (req, res, next) => {
    try {
        const newRole = req.body.role;

        // Validation
        if (!newRole) {
            return res.status(400).json({ success: false, message: "Role is required" });
        }

        const user = await User.findByIdAndUpdate(req.params.id, {
            role: newRole
        }, {
            new: true,        // Return the updated user
            runValidators: true // Schema validation
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: `User role updated to ${newRole}`,
            user
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};