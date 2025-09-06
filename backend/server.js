const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');require('dotenv').config()

const { port } = require("./config/dbConfig");
const errorMiddleware = require("./middlewares/error.middleware");

const categoryRouter = require('./routes/category');
const productRouter = require('./routes/product');
const variantRouter = require('./routes/variant');
const orderRouter = require('./routes/order');
const cityRouter = require('./routes/city');
const authRouter = require('./routes/auth');
const webhookRouter = require('./routes/webhook');

const app = express();




app.use(cors({
  origin: "http://localhost:5173",   // allow frontend
  credentials: true
}));

app.use('/api/webhook', webhookRouter);




app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//routers
const categoryRouter = require('./routes/category');
const productRouter = require('./routes/product');
const variantRouter = require('./routes/variant');
const authRouter = require('./routes/auth');
const orderRouter=require("./routes/order")
const userRouter=require("./routes/user")

app.use('/api/webhook', webhookRouter);
app.use('/api/auth', authRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/variant', variantRouter);
app.use('/api/order', orderRouter);
app.use('/api/city', cityRouter);app.use('/api/auth', authRouter);
app.use('/api/order', orderRouter);
app.use('/api/users', userRouter);




app.use(errorMiddleware);

//testing api
app.get("/", (req, res) => {
  res.json({
    message: "Hello from api",
  });
});

//port
const PORT = port || 8080;

//server
app.listen(PORT, () => {
  console.log(`Server is now running on PORT ${ PORT }`);
});
  