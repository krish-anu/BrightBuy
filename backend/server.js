const express = require("express");
const cors = require("cors");

const { port } = require("./config/dbConfig");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

var corOptins = {
  origin: "http://localhost:8081",
};



//middleware
app.use(cors(corOptins));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//routers

const categoryRouter = require('./routes/category');
const productRouter = require('./routes/product');
const variantRouter = require('./routes/variant');
const orderRouter = require('./routes/order');
const cityRouter = require('./routes/city');
const authRouter = require('./routes/auth');

app.use('/api/auth', authRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/variant', variantRouter);
app.use('/api/order', orderRouter);
app.use('/api/city', cityRouter);


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
