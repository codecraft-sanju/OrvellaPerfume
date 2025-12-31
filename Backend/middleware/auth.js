const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Check if user is authenticated (Reads cookie)
exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    // DEBUG LOG 1: Check if token exists
    console.log("-----------------------------------------");
    console.log("1. Checking Token from Cookies...");
    if (!token) {
      console.log("❌ Token NOT found in cookies");
      return res.status(401).json({ 
        success: false, 
        message: "Please Login to access this resource" 
      });
    }
    console.log("✅ Token found!");

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    
    // DEBUG LOG 2: Check User ID from Token
    console.log("2. Token Decoded. User ID:", decodedData.id);

    req.user = await User.findById(decodedData.id);

    if (!req.user) {
        console.log("❌ User ID valid in token, but User NOT found in DB");
        return res.status(401).json({ 
            success: false, 
            message: "User no longer exists. Please login again." 
        });
    }

    // DEBUG LOG 3: Check Role fetched from DB
    console.log("3. User Found in DB. Role is:", req.user.role);
    console.log("-----------------------------------------");

    next();
  } catch (error) {
    console.log("❌ Error in Auth Middleware:", error.message);
    return res.status(401).json({ 
        success: false, 
        message: "Invalid Token or Session Expired" 
    });
  }
};

// Check for Admin Roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    
    // DEBUG LOG 4: Check if Role matches
    console.log("4. Authorizing Role...");
    console.log("   User Role:", req.user.role);
    console.log("   Allowed Roles:", roles);

    if (!roles.includes(req.user.role)) {
      console.log("❌ Access Denied: Role mismatch");
      return res.status(403).json({
        success: false,
        message: `Role: ${req.user.role} is not allowed to access this resource`
      });
    }
    
    console.log("✅ Access Granted!");
    next();
  };
};