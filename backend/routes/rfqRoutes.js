const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all RFQs
router.get("/", protect, (req, res) => {
  const sql = `
    SELECT rfqs.*, 
           COUNT(DISTINCT rfq_items.id) as items_count,
           COUNT(DISTINCT rfq_assigned_vendors.id) as vendors_count,
           COUNT(DISTINCT quotations.id) as bids_count
    FROM rfqs
    LEFT JOIN rfq_items ON rfqs.id = rfq_items.rfq_id
    LEFT JOIN rfq_assigned_vendors ON rfqs.id = rfq_items.rfq_id
    LEFT JOIN quotations ON rfqs.id = quotations.rfq_id
    GROUP BY rfqs.id
    ORDER BY rfqs.date_created DESC
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
      rfqs: results,
    });
  });
});

// Get RFQ by ID
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  // Get RFQ details
  const rfqSql = "SELECT * FROM rfqs WHERE id = ?";
  db.query(rfqSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }
    
    const rfq = results[0];
    
    // Get RFQ items
    const itemsSql = "SELECT * FROM rfq_items WHERE rfq_id = ?";
    db.query(itemsSql, [id], (err, items) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      // Get assigned vendors
      const vendorsSql = `
        SELECT v.* FROM rfq_assigned_vendors rav
        JOIN vendors v ON rav.vendor_id = v.id
        WHERE rav.rfq_id = ?
      `;
      db.query(vendorsSql, [id], (err, vendors) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        
        res.status(200).json({
          success: true,
          rfq: {
            ...rfq,
            items,
            assignedVendors: vendors,
          },
        });
      });
    });
  });
});

// Create new RFQ
router.post("/", protect, (req, res) => {
  const { title, description, deadline, items, assignedVendors } = req.body;
  
  // Validate required fields
  if (!title || !deadline || !items || !assignedVendors) {
    return res.status(400).json({
      success: false,
      message: "Title, deadline, items, and assigned vendors are required",
    });
  }
  
  const rfqId = `RFQ-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  const dateCreated = new Date().toISOString().split("T")[0];
  
  // Insert RFQ
  const rfqSql = `
    INSERT INTO rfqs (id, title, description, date_created, deadline, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    rfqSql,
    [rfqId, title, description, dateCreated, deadline, "Bidding Open", req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
      
      // Insert RFQ items
      const insertItemSql = `
        INSERT INTO rfq_items (rfq_id, item_name, quantity, unit, target_price)
        VALUES ?
      `;
      
      const itemsValues = items.map(item => [
        rfqId,
        item.name,
        item.qty,
        item.unit,
        item.targetPrice
      ]);
      
      db.query(insertItemSql, [itemsValues], (err, itemResults) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        
        // Insert assigned vendors
        const insertVendorSql = `
          INSERT INTO rfq_assigned_vendors (rfq_id, vendor_id)
          VALUES ?
        `;
        
        const vendorValues = assignedVendors.map(vendorId => [rfqId, vendorId]);
        db.query(insertVendorSql, [vendorValues], (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              error: err.message,
            });
          }
          
          res.status(201).json({
            success: true,
            message: "RFQ created successfully",
            rfqId,
          });
        });
      });
    }
  );
});

// Update RFQ
router.put("/:id", protect, (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, items, assignedVendors } = req.body;
  
  // Update RFQ
  const updateSql = `
    UPDATE rfqs 
    SET title = ?, description = ?, deadline = ?
    WHERE id = ?
  `;
  
  db.query(updateSql, [title, description, deadline, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "RFQ updated successfully",
    });
  });
});

// Delete RFQ
router.delete("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM rfqs WHERE id = ?";
  
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
        message: "RFQ not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "RFQ deleted successfully",
    });
  });
});

module.exports = router;