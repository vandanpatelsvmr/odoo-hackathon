const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { initDatabase } = require("./config/database");
const authRoutes = require("./routes/authRoutes.js");
const vendorRoutes = require("./routes/vendorRoutes");
const rfqRoutes = require("./routes/rfqRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const poRoutes = require("./routes/poRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const logRoutes = require("./routes/logRoutes");

const app = express();
const path = require("path");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Static Files (Serve Frontend)
app.use(express.static(path.join(__dirname, "../")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/purchase-orders", poRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/logs", logRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.get("/", (req, res) => {
  res.send("VendorBridge ERP API Running");
});

const PORT = process.env.PORT || 5000;

// Initialize Database and Start Server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });