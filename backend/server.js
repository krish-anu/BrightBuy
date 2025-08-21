const express = require("express");
const cors = require("cors");

const app = express();

var corOptins = {
  origin: "https://localhost:8081",
};



//middleware
app.use(cors(corOptins));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//routers
const router=require('./routes/productRoutes')

app.use('/api/products',router)

//testing api
app.get("/", (req, res) => {
  res.json({
    message: "Hello from api",
  });
});  

//port
const PORT = process.env.PORT || 8080;

//server
app.listen(PORT, () => {
  console.log(`Server is now running on PORT ${PORT}`);
});
