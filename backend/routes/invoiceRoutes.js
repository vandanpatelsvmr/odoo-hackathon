const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all Invoices
router.get("/", protect, (req, res) => {
  const sql = `
    SELECT * FROM invoices 
    ORDER BY date_generated DESC
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
      invoices: results,
    });
  });
});

// Get Invoice by ID
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM invoices WHERE id = ?";
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
        message: "Invoice not found",
      });
    }
    
    const invoice = results[0];
    
    // Get invoice items
    const itemsSql = "SELECT * FROM invoice_items WHERE invoice_id = ?";
    db.query(itemsSql, [id], (err, items) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      res.status(200).json({
        success: true,
        invoice: {
          ...invoice,
          items,
        },
      });
    });
  });
});

// Create new Invoice
router.post("/", protect, (req, res) => {
  const { poId, vendorId, vendorName, items, subtotal, gst, total, notes } = req.body;
  
  const invoiceId = `INV-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  const dateGenerated = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const sql = `
    INSERT INTO invoices (id, po_id, vendor_id, vendor_name, date_generated, due_date, status, subtotal, gst, total, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    sql,
    [invoiceId, poId, vendorId, vendorName, dateGenerated, dueDate, "Pending Payment", subtotal, gst, total, notes],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      // Insert invoice items
      const insertItemSql = `
        INSERT INTO invoice_items (invoice_id, item_name, quantity, price)
        VALUES ?
      `;
      
      const itemsValues = items.map(item => [invoiceId, item.name, item.qty, item.price]);
      db.query(insertItemSql, [itemsValues], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        
        res.status(201).json({
          success: true,
          message: "Invoice generated successfully",
          invoiceId,
        });
      });
    }
  );
});

// Update Invoice Status (e.g., Pay)
router.put("/:id/pay", protect, (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const sql = "UPDATE invoices SET status = 'Paid', notes = ? WHERE id = ?";
  
  db.query(sql, [notes, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Invoice paid successfully",
    });
  });
});

module.exports = router;