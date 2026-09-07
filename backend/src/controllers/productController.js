const productService = require("../services/productService");

async function getAllProducts(req, res) {

    try {

        const products = await productService.getAllProducts();

        res.status(200).json({
            products: products
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });

    }
}

async function getProductById(req, res) {
    try {
        const product = await productService.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            product: product
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
}

module.exports = {
    getAllProducts,
    getProductById
};