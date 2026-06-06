const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// ================== SAFE DB IMPORT ==================
let initDatabase;

try {
  ({ initDatabase } = require("./config/database"));
} catch (err) {
  console.warn("⚠️ Database module not found. Server will start without DB connection.");
}

// ================== ROUTES ==================
const authRoutes = require("./routes/authRoutes.js");
const vendorRoutes = require("./routes/vendorRoutes");
const rfqRoutes = require("./routes/rfqRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const poRoutes = require("./routes/poRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const logRoutes = require("./routes/logRoutes");

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ================== ROUTES USAGE ==================
app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/rfq", rfqRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/approval", approvalRoutes);
app.use("/api/po", poRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/logs", logRoutes);

// ================== ROOT ==================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // connect DB only if exists
  if (initDatabase) {
    try {
      await initDatabase();
      console.log("✅ Database connected");
    } catch (err) {
      console.error("❌ Database connection failed:", err.message);
    }
  }
});