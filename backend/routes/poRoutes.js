const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all Purchase Orders
router.get("/", protect, (req, res) => {
  const sql = `
    SELECT po.id, po.approval_id as approvalId, po.rfq_id as rfqId, 
           po.quotation_id as quotationId, po.vendor_id as vendorId, 
           v.name as vendorName, po.date_generated as dateGenerated, 
           po.status, po.subtotal, po.gst, po.total
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    ORDER BY po.date_generated DESC
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
      purchaseOrders: results,
    });
  });
});

// Get PO by ID
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT id, approval_id as approvalId, rfq_id as rfqId, 
           quotation_id as quotationId, vendor_id as vendorId, 
           vendor_name as vendorName, date_generated as dateGenerated, 
           status, subtotal, gst, total 
    FROM purchase_orders WHERE id = ?
  `;
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
        message: "Purchase Order not found",
      });
    }
    
    const po = results[0];
    
    // Get PO items
    const itemsSql = "SELECT item_name as name, quantity as qty, price FROM po_items WHERE po_id = ?";
    db.query(itemsSql, [id], (err, items) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      res.status(200).json({
        success: true,
        purchaseOrder: {
          ...po,
          items,
        },
      });
    });
  });
});

// Create new Purchase Order
router.post("/", protect, (req, res) => {
  const { approvalId, rfqId, quotationId, vendorId, vendorName, items, subtotal, gst, total } = req.body;
  
  const poId = `PO-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  const dateGenerated = new Date().toISOString().split("T")[0];
  
  const sql = `
    INSERT INTO purchase_orders (id, approval_id, rfq_id, quotation_id, vendor_id, vendor_name, date_generated, status, subtotal, gst, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    sql,
    [poId, approvalId, rfqId, quotationId, vendorId, vendorName, dateGenerated, "Completed", subtotal, gst, total],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      // Insert PO items
      const insertItemSql = `
        INSERT INTO po_items (po_id, item_name, quantity, price)
        VALUES ?
      `;
      
      const itemsValues = items.map(item => [poId, item.name, item.qty, item.price]);
      db.query(insertItemSql, [itemsValues], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        
        res.status(201).json({
          success: true,
          message: "Purchase Order generated successfully",
          poId,
        });
      });
    }
  );
});

module.exports = router;