<<<<<<< HEAD
const express = require('express');
const router = express.Router();

// 1. Your working login route
router.post('/login', (req, res) => {
    console.log("Login data received:", req.body);
    res.status(200).json({ message: "Login request received successfully!" });
});

// 2. Your working register route
router.post('/register', (req, res) => {
    console.log("Registration data received:", req.body);
    res.status(201).json({ message: "Registration request received successfully!" });
});

// 3. ADD THIS NEW PROFILE ROUTE BELOW:
router.get('/profile', (req, res) => {
    console.log("Profile data requested");
    
    // Sending back some mock data for now so the frontend can read a 'name' property
    res.status(200).json({ 
        success: true, 
        user: { 
            name: "Vandan", 
            email: "vandan@example.com" 
        } 
    });
});
=======
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
<<<<<<< HEAD
>>>>>>> 372a214b20627d441e80b08edc6c116e9140c889
=======
router.put("/role", protect, authController.updateRole);
>>>>>>> d3fa2d776dc62135a946b5fec1a43d4494a25785

module.exports = router;