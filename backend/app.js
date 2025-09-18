// app.js
const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error.middleware");

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
const imageRouter = require('./routes/image.upload');

const app = express();

app.use(cors({ origin: "*" }));

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
  res.json({ message: "Hello from api" });
});

module.exports = app;
