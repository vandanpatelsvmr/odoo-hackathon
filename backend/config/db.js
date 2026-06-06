require('dotenv').config();
const mysql = require('mysql2');

// 1. Create a basic connection without specifying the database name
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// 2. Manually force the database creation
connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`, (err) => {
    if (err) {
        console.error("Error creating database:", err);
    } else {
        console.log("Database 'vendorbridge' is ready.");
    }
    // Close the initial connection
    connection.end();
});

// 3. Export a new connection that points to the database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = db;