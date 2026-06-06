const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../utils/auth");
const authController = require("../controllers/authController");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes
router.get("/profile", protect, authController.getProfile);
router.put("/role", protect, authController.updateRole);

module.exports = router;