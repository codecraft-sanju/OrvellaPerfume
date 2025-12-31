const express = require("express");
const { 
    registerUser, 
    loginUser, 
    logout, 
    getUserProfile, 
    getAllUsers ,// <--- Added this import
    updateUserRole
} = require("../controllers/authController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/me").get(isAuthenticatedUser, getUserProfile);

// Admin route to get all users
router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router.route('/admin/user/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);

module.exports = router;