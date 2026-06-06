const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require("../utils/auth");
const authController = require("../controllers/authController");

// Multer Configuration
const storage = multer.diskStorage({
    destination: './public/uploads/', 
    filename: (req, file, cb) => {
        cb(null, 'user-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
// Use upload.single here to handle the file before the controller logic runs
router.post("/register", upload.single('profile_picture'), authController.register);
router.post("/login", authController.login);
router.get("/profile", protect, authController.getProfile);

module.exports = router;