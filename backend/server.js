// server.js
require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.APP_PORT || 8081;

async function startServer() {
  const maxRetries = 10;
  const retryDelayMs = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await pool.getConnection();
      console.log('Database connected successfully!');
      connection.release();

      app.listen(PORT, () => {
        console.log(`Server is now running on PORT ${PORT}`);
      });
      return;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        console.error('Max DB connection attempts reached. Exiting.');
        process.exit(1);
      }
      // Wait before retrying
      await new Promise((res) => setTimeout(res, retryDelayMs));
    }
  }
}
 
startServer();
