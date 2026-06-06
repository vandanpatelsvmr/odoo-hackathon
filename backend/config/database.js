const db = require("../config/db");

// SQL Schema for VendorBridge ERP
const createTablesSQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('officer', 'vendor', 'manager', 'admin') DEFAULT 'officer',
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ensure name column exists in users table (migration helper)
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "name";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL AFTER role"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure title column exists in users table (migration helper)
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "title";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN title VARCHAR(255) AFTER name"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  contact VARCHAR(255),
  address TEXT,
  gst VARCHAR(255),
  rating DECIMAL(3,1) DEFAULT 4.0,
  status ENUM('Active', 'Pending Approval', 'Suspended') DEFAULT 'Active',
  country VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create RFQs table
CREATE TABLE IF NOT EXISTS rfqs (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_created DATE,
  deadline DATE,
  status ENUM('Bidding Open', 'Under Review', 'Approved', 'Completed', 'Cancelled') DEFAULT 'Bidding Open',
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create RFQ items table
CREATE TABLE IF NOT EXISTS rfq_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rfq_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit VARCHAR(50),
  target_price DECIMAL(10,2),
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
);

-- Create RFQ assigned vendors table
CREATE TABLE IF NOT EXISTS rfq_assigned_vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rfq_id VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(255) NOT NULL,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(255) PRIMARY KEY,
  rfq_id VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  delivery_days INT DEFAULT 7,
  subtotal DECIMAL(10,2),
  gst DECIMAL(10,2),
  total DECIMAL(10,2),
  notes TEXT,
  status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Submitted',
  date_submitted DATE,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Create quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2),
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(255) PRIMARY KEY,
  rfq_id VARCHAR(255) NOT NULL,
  rfq_title VARCHAR(255) NOT NULL,
  quotation_id VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  requested_by VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  date_requested DATE,
  date_approved DATE,
  remarks TEXT
);

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(255) PRIMARY KEY,
  approval_id VARCHAR(255),
  rfq_id VARCHAR(255),
  quotation_id VARCHAR(255),
  vendor_id VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  date_generated DATE,
  status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
  subtotal DECIMAL(10,2),
  gst DECIMAL(10,2),
  total DECIMAL(10,2)
);

-- Create PO items table
CREATE TABLE IF NOT EXISTS po_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2),
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(255) PRIMARY KEY,
  po_id VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  date_generated DATE,
  due_date DATE,
  status ENUM('Pending Payment', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Pending Payment',
  subtotal DECIMAL(10,2),
  gst DECIMAL(10,2),
  total DECIMAL(10,2),
  notes TEXT
);

-- Create invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  user VARCHAR(255) NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Split SQL statements
    const statements = createTablesSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let completed = 0;
    let error = null;

    statements.forEach((stmt, index) => {
      db.query(stmt, (err) => {
        if (err) {
          error = err;
          console.error(`Error creating table in statement ${index + 1}:`, err);
        } else {
          completed++;
          console.log(`Table creation statement ${index + 1} executed successfully`);
        }

        if (index === statements.length - 1) {
          if (error) {
            reject(error);
          } else {
            console.log(`All ${completed} table creation statements executed successfully`);
            resolve(true);
          }
        }
      });
    });
  });
};

module.exports = { initDatabase };