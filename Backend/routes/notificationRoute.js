const express = require("express");
const { getNotifications } = require("../controllers/notificationController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/admin/notifications")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getNotifications);

module.exports = router;
