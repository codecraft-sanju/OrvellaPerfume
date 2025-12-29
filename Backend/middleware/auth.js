const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Check if user is authenticated (Reads cookie)
exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    const { token } = req.cookies; // Cookie-parser required in app.js

    if (!token) {
      return res.status(401).json({ success: false, message: "Please Login to access this resource" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid Token or Session Expired" });
  }
};

// Check for Admin Roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false, 
        message: `Role: ${req.user.role} is not allowed to access this resource` 
      });
    }
    next();
  };
};