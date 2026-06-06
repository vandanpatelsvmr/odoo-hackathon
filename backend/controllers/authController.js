const db = require("../config/db");
const { sanitizeUser, hashPassword, validateEmail, validatePassword } = require("../utils/auth");

// Register new user
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    // Role mapping for database
    const roleMap = {
      officer: "procurement_officer",
      vendor: "vendor",
      manager: "manager",
      admin: "admin",
    };

    const dbRole = roleMap[role] || role;

    // Validate required fields
    if (!first_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Check if user already exists
    const checkUserSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserSql, [email], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      // Hash password
      const hashedPassword = hashPassword(password);

      // Insert user
      const insertSql = `
        INSERT INTO users (email, password, role, name, title)
        VALUES (?, ?, ?, ?, ?)
      `;

      const fullName = last_name ? `${first_name} ${last_name}` : first_name;
      const title = getRoleTitle(role);

      db.query(
        insertSql,
        [email, hashedPassword, dbRole, fullName, title],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err.message,
            });
          }

          res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            userId: result.insertId,
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const findUserSql = "SELECT * FROM users WHERE email = ?";
    db.query(findUserSql, [email], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = results[0];

      if (user.role === "procurement_officer") {
        user.role = "officer";
      }

      // Compare password
      const isPasswordValid = require("bcryptjs").compareSync(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const jwt = require("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || "vendorbridge_secret_key_2026";
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { password: _, ...userWithoutPassword } = results[0];

      res.status(200).json({
        success: true,
        user: userWithoutPassword,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to get role title
function getRoleTitle(role) {
  const titles = {
    procurement_officer: "Procurement Officer",
    vendor: "Supplier Representative",
    manager: "Workflow Approver",
    admin: "System Administrator",
  };
  
  return titles[role] || "User";
}