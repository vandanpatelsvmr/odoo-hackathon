const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all activity logs
router.get("/", protect, (req, res) => {
  const sql = "SELECT * FROM activity_logs ORDER BY timestamp DESC";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      logs: results,
    });
  });
});

// Create new activity log
router.post("/", protect, (req, res) => {
  const { type, action } = req.body;
  const user = req.user.name; // or req.user.name if available in token

  if (!type || !action) {
    return res.status(400).json({
      success: false,
      message: "Type and action are required",
    });
  }

  const sql = "INSERT INTO activity_logs (type, user, action) VALUES (?, ?, ?)";

  db.query(sql, [type, user, action], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Log created successfully",
    });
  });
});

module.exports = router;