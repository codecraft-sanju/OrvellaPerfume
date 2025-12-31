const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Check if user is authenticated (Reads cookie)
exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    const { token } = req.cookies; // Note: app.js mein 'cookie-parser' hona zaroori hai

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Please Login to access this resource" 
      });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    // IMPROVEMENT: Check if user still exists in DB
    // Agar user delete ho gaya hai, lekin browser mein purana token saved hai, toh crash bachega
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: "User no longer exists. Please login again." 
        });
    }

    next();
  } catch (error) {
    return res.status(401).json({ 
        success: false, 
        message: "Invalid Token or Session Expired" 
    });
  }
};

// Check for Admin Roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user guaranteed hai because isAuthenticatedUser pehle run hua hai
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role: ${req.user.role} is not allowed to access this resource`
      });
    }
    next();
  };
};