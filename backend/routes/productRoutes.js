const productController = require("../controllers/productController");

const router = require("express").Router();

router.post("/addProduct", productController.addProduct);
router.get("/allProducts", productController.getAllProducts);
router.get("/publishedProduct", productController.getAllPublishedProduct);
router.get("/:id", productController.getOneProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports=router