const mysql = require('mysql2/promise');
const config = require('./dbConfig'); // your existing dbConfig.js

// Create MySQL connection pool
const pool = mysql.createPool({
  host: config.HOST,
  user: config.USER,
  password: config.PASSWORD,
  database: config.DB,
  port: config.port,
  waitForConnections: true,
  connectionLimit: config.pool.max,
  queueLimit: 0
});

// Helper function to run queries
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Export both pool and query
module.exports = { pool, query };
