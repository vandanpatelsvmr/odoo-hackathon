const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role,
    } = req.body;

    if (!first_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users
      (first_name,last_name,email,password,role)
      VALUES (?,?,?,?,?)
    `;

    db.query(
      sql,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        role,
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "User Registered Successfully",
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  res.json({
    success: true,
    message: "Login API Coming Next",
  });
};