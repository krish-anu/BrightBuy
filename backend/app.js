const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error.middleware");

// Routers
const webhookRouter = require('./routes/webhook');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const categoryRouter = require('./routes/category');
const productRouter = require('./routes/product');
const variantRouter = require('./routes/variant');
const orderRouter = require('./routes/order');
const cityRouter = require('./routes/city');
const userRouter = require("./routes/user");
const addressRouter = require('./routes/address');
const paymentRouter = require('./routes/payment');
const deliveryRouter = require('./routes/delivery');
const attributeRouter = require('./routes/attribute');
const imageRouter = require('./routes/image.upload');
const chartRouter = require("./routes/chart");
const cartRouter = require('./routes/cart');

const app = express();

app.use(cors({ origin: "*" }));


app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  webhookRouter
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All other routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/variant', variantRouter);
app.use('/api/order', orderRouter);
app.use('/api/city', cityRouter);
app.use('/api/users/addresses', addressRouter);
app.use('/api/users', userRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/attribute', attributeRouter);
app.use('/api/image', imageRouter);
app.use("/api/chart", chartRouter);
app.use('/api/cart', cartRouter);

app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.json({ message: "Hello from api" });
});

module.exports = app;
