// server.js
require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.APP_PORT || 8081;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is now running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}
 
startServer();
