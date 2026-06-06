const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../utils/auth");

// Get all approvals
router.get("/", protect, (req, res) => {
  const sql = `
    SELECT id, rfq_id as rfqId, rfq_title as rfqTitle, quotation_id as quotationId, 
           vendor_name as vendorName, amount, status, requested_by as requestedBy, 
           approved_by as approvedBy, date_requested as dateRequested, 
           date_approved as dateApproved, remarks 
    FROM approvals 
    ORDER BY date_requested DESC
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
      approvals: results,
    });
  });
});

// Get approval by ID
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT id, rfq_id as rfqId, rfq_title as rfqTitle, quotation_id as quotationId, 
           vendor_name as vendorName, amount, status, requested_by as requestedBy, 
           approved_by as approvedBy, date_requested as dateRequested, 
           date_approved as dateApproved, remarks 
    FROM approvals WHERE id = ?
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
        message: "Approval not found",
      });
    }
    
    res.status(200).json({
      success: true,
      approval: results[0],
    });
  });
});

// Create new approval
router.post("/", protect, (req, res) => {
  const { rfqId, rfqTitle, quotationId, vendorName, amount, requestedBy } = req.body;
  
  // Validate required fields
  if (!rfqId || !quotationId || !vendorName || !requestedBy) {
    return res.status(400).json({
      success: false,
      message: "RFQ ID, quotation ID, vendor name, and requested by are required",
    });
  }
  
  const approvalId = `APP-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  const dateRequested = new Date().toISOString().split("T")[0];
  
  const sql = `
    INSERT INTO approvals (id, rfq_id, rfq_title, quotation_id, vendor_name, amount, status, requested_by, date_requested)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    sql,
    [
      approvalId,
      rfqId,
      rfqTitle,
      quotationId,
      vendorName,
      amount,
      "Pending",
      requestedBy,
      dateRequested
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
        message: "Approval created successfully",
        approvalId,
      });
    }
  );
});

// Update approval (Approve/Reject)
router.put("/:id", protect, (req, res) => {
  const { id } = req.params;
  const { status, approvedBy, remarks } = req.body;
  
  // Validate required fields
  if (!status || !approvedBy) {
    return res.status(400).json({
      success: false,
      message: "Status and approved by are required",
    });
  }
  
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be 'Approved' or 'Rejected'",
    });
  }
  
  const dateApproved = new Date().toISOString().split("T")[0];
  
  const sql = `
    UPDATE approvals 
    SET status = ?, approved_by = ?, date_approved = ?, remarks = ?
    WHERE id = ?
  `;
  
  db.query(
    sql,
    [status, approvedBy, dateApproved, remarks || null, id],
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
          message: "Approval not found",
        });
      }
      
      res.status(200).json({
        success: true,
        message: `Approval ${status.toLowerCase()}d successfully`,
      });
    }
  );
});

// Delete approval
router.delete("/:id", protect, (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM approvals WHERE id = ?";
  
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
        message: "Approval not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Approval deleted successfully",
    });
  });
});

module.exports = router;