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

module.exports = router;