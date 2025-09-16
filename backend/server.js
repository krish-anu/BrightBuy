const express = require("express");
const cors = require("cors");
require('dotenv').config();

const { port } = require("./config/dbConfig");
const errorMiddleware = require("./middlewares/error.middleware");
const { pool } = require('./config/db'); // your mysql helper



const app = express();

//routers
const categoryRouter = require('./routes/category');
const productRouter = require('./routes/product');
const variantRouter = require('./routes/variant');
const orderRouter = require('./routes/order');
const cityRouter = require('./routes/city');
const authRouter = require('./routes/auth');
const webhookRouter = require('./routes/webhook');
const userRouter = require("./routes/user");
const paymentRouter = require('./routes/payment');
const deliveryRouter = require('./routes/delivery');
const attributeRouter = require('./routes/attribute');
const imageRouter=require('./routes/image.upload')




app.use(cors({
  // origin: "http://localhost:5173",   // allow frontend
  // credentials: true
  origin:"*"
}));




app.use('/api/webhook', webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));






app.use('/api/auth', authRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/variant', variantRouter);
app.use('/api/order', orderRouter);
app.use('/api/city', cityRouter);
app.use('/api/users', userRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/attribute', attributeRouter);
app.use('/api/image', imageRouter);




app.use(errorMiddleware);

//testing api
app.get("/", (req, res) => {
  res.json({
    message: "Hello from api",
  });
});

//port
const PORT = process.env.APP_PORT || 8081;

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release(); // release back to pool
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // stop server if DB fails
  }
}

testConnection();

 
//server
app.listen(PORT, () => {
  console.log(`Server is now running on PORT ${ PORT }`);
});
