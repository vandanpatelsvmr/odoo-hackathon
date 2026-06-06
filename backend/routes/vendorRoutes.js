const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all vendors
router.get("/", protect, (req, res) => {
  const sql = `
    SELECT * FROM vendors 
    ORDER BY created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    res.status(200).json({
      success: true,
      vendors: results,
    });
  });
});

// Get vendor by ID
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM vendors WHERE id = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    res.status(200).json({
      success: true,
      vendor: results[0],
    });
  });
});

// Create new vendor
router.post("/", protect, (req, res) => {
  const { name, category, email, contact, address, gst, rating, status, country } = req.body;
  
  // Validate required fields
  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: "Name and category are required",
    });
  }
  
  const sql = `
    INSERT INTO vendors (id, name, category, email, contact, address, gst, rating, status, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const id = name.toLowerCase().replace(/\s+/g, "-");
  
  db.query(
    sql,
    [
      id,
      name,
      category,
      email || null,
      contact || null,
      address || null,
      gst || null,
      rating || 4.0,
      status || "Active",
      country || "India"
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
        message: "Vendor created successfully",
        vendorId: result.insertId,
      });
    }
  );
});

// Update vendor
router.put("/:id", protect, (req, res) => {
  const { id } = req.params;
  const { name, category, email, contact, address, gst, rating, status, country } = req.body;
  
  const sql = `
    UPDATE vendors 
    SET name = ?, category = ?, email = ?, contact = ?, address = ?, gst = ?, rating = ?, status = ?, country = ?
    WHERE id = ?
  `;
  
  db.query(
    sql,
    [
      name,
      category,
      email || null,
      contact || null,
      address || null,
      gst || null,
      rating,
      status,
      country,
      id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Vendor updated successfully",
      });
    }
  );
});

// Delete vendor
router.delete("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM vendors WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
    });
  });
});

module.exports = router;