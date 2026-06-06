const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "vendorbridge_secret_key_2026";

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email: email, role: role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to protect routes
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Authentication required.",
    });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }

  req.user = decoded;
  next();
};

// Middleware to check role-based access
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Hash password
const hashPassword = (password) => {
  const bcrypt = require("bcryptjs");
  return bcrypt.hashSync(password, 10);
};

// Compare password
const comparePassword = (password, hashedPassword) => {
  const bcrypt = require("bcryptjs");
  return bcrypt.compareSync(password, hashedPassword);
};

// Sanitize user data (remove sensitive information)
const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
};

module.exports = {
  generateToken,
  verifyToken,
  protect,
  authorize,
  hashPassword,
  comparePassword,
  sanitizeUser,
  validateEmail,
  validatePassword,
};