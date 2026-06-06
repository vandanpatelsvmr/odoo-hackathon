const mysql = require("mysql2");
require("dotenv").config();

// Initial connection without database to ensure it exists
const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};

const tempDb = mysql.createConnection(connectionConfig);

tempDb.query(
  `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "vendorbridge"}\`;`,
  (err) => {
    if (err) {
      console.error("Could not create/verify database:", err);
    }
    tempDb.end();
  }
);

const db = mysql.createConnection({
  ...connectionConfig,
  database: process.env.DB_NAME || "vendorbridge",
});

// Test connection
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    console.log("Please configure .env file with correct database credentials");
  } else {
    console.log("MySQL Connected Successfully");
  }
});

module.exports = db;