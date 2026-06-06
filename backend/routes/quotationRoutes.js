const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all quotations
router.get("/", protect, (req, res) => {
  const { rfqId } = req.query;
  
  let sql = `
    SELECT quotations.*, 
           v.name as vendor_name,
           v.rating as vendor_rating
    FROM quotations
    JOIN vendors v ON quotations.vendor_id = v.id
  `;
  
  if (rfqId) {
    sql += " WHERE quotations.rfq_id = ?";
  }
  
  sql += " ORDER BY quotations.date_submitted DESC";
  
  db.query(sql, rfqId ? [rfqId] : [], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    res.status(200).json({
      success: true,
      quotations: results,
    });
  });
});

// Get quotation by ID
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM quotations WHERE id = ?";
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
        message: "Quotation not found",
      });
    }
    
    const quotation = results[0];
    
    // Get quotation items
    const itemsSql = "SELECT * FROM quotation_items WHERE quotation_id = ?";
    db.query(itemsSql, [id], (err, items) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      res.status(200).json({
        success: true,
        quotation: {
          ...quotation,
          items,
        },
      });
    });
  });
});

// Create new quotation
router.post("/", protect, (req, res) => {
  const { rfqId, vendorId, vendorName, items, deliveryDays, notes } = req.body;
  
  // Validate required fields
  if (!rfqId || !vendorId || !items) {
    return res.status(400).json({
      success: false,
      message: "RFQ ID, vendor ID, and items are required",
    });
  }
  
  const quotationId = `QT-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  const dateSubmitted = new Date().toISOString().split("T")[0];
  
  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.price * item.qty;
  });
  
  const gst = subtotal * 0.18;
  const total = subtotal + gst;
  
  // Insert quotation
  const quotationSql = `
    INSERT INTO quotations (id, rfq_id, vendor_id, vendor_name, delivery_days, subtotal, gst, total, notes, status, date_submitted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    quotationSql,
    [
      quotationId,
      rfqId,
      vendorId,
      vendorName,
      deliveryDays || 7,
      subtotal,
      gst,
      total,
      notes || null,
      "Submitted",
      dateSubmitted
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      // Insert quotation items
      const insertItemSql = `
        INSERT INTO quotation_items (quotation_id, item_name, quantity, price)
        VALUES ?
      `;
      
      const itemsValues = items.map(item => [
        quotationId,
        item.name,
        item.qty,
        item.price
      ]);
      
      db.query(insertItemSql, [itemsValues], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        
        res.status(201).json({
          success: true,
          message: "Quotation created successfully",
          quotationId,
        });
      });
    }
  );
});

// Update quotation
router.put("/:id", protect, (req, res) => {
  const { id } = req.params;
  const { items, deliveryDays, notes, status } = req.body;
  
  // Get existing quotation
  const getQuotationSql = "SELECT * FROM quotations WHERE id = ?";
  db.query(getQuotationSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }
    
    const quotation = results[0];
    
    // Update totals if items changed
    let subtotal = 0;
    if (items) {
      items.forEach(item => {
        subtotal += item.price * item.qty;
      });
    } else {
      subtotal = quotation.subtotal;
    }
    
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    
    // Update quotation
    const updateSql = `
      UPDATE quotations 
      SET delivery_days = ?, subtotal = ?, gst = ?, total = ?, notes = ?, status = ?
      WHERE id = ?
    `;
    
    db.query(
      updateSql,
      [
        deliveryDays || quotation.delivery_days,
        subtotal,
        gst,
        total,
        notes || quotation.notes,
        status || quotation.status,
        id
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        
        res.status(200).json({
          success: true,
          message: "Quotation updated successfully",
        });
      }
    );
  });
});

// Delete quotation
router.delete("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM quotations WHERE id = ?";
  
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
        message: "Quotation not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Quotation deleted successfully",
    });
  });
});

module.exports = router;