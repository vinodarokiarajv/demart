const express = require("express");

const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", productController.getAllProducts);

router.get("/:id", productController.getProductById);

router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    productController.createProduct
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    productController.updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    productController.deleteProduct
);

module.exports = router;