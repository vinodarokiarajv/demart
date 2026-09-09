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

async function createProduct(req, res) {
    const name = req.body.name?.trim();
    const category = req.body.category?.trim();
    const description = req.body.description?.trim() || null;
    const price = req.body.price;
    const rating = req.body.rating ?? null;
    const stockQuantity = req.body.stockQuantity ?? 0;
    const imageUrl = req.body.imageUrl?.trim() || null;

    if (!name || !category || price === undefined) {
        return res.status(400).json({
            message: "Name, category and price are required"
        });
    }

    if (isNaN(price) || Number(price) < 0) {
        return res.status(400).json({
            message: "Price must be a valid non-negative number"
        });
    }

    if (rating !== null && (isNaN(rating) || Number(rating) < 0 || Number(rating) > 5)) {
        return res.status(400).json({
            message: "Rating must be between 0 and 5"
        });
    }

    if (
        isNaN(stockQuantity) ||
        !Number.isInteger(Number(stockQuantity)) ||
        Number(stockQuantity) < 0
    ) {
        return res.status(400).json({
            message: "Stock quantity must be a non-negative integer"
        });
    }

    try {

        const existingProduct = await productService.checkProductNameExists(name);

if (existingProduct) {
    return res.status(409).json({
        message: "A product with this name already exists"
    });
}
        const product = await productService.createProduct(
            name,
            category,
            description,
            price,
            rating,
            stockQuantity,
            imageUrl
        );

        res.status(201).json({
            message: "Product created successfully",
            product: product
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create product"
        });
    }
}

async function updateProduct(req, res) {

    const id = req.params.id;

    const name = req.body.name?.trim();
    const category = req.body.category?.trim();
    const description = req.body.description?.trim() || null;
    const price = req.body.price;
    const rating = req.body.rating ?? null;
    const stockQuantity = req.body.stockQuantity ?? 0;
    const imageUrl = req.body.imageUrl?.trim() || null;

    if (!name || !category || price === undefined) {
        return res.status(400).json({
            message: "Name, category and price are required"
        });
    }

    if (isNaN(price) || Number(price) < 0) {
        return res.status(400).json({
            message: "Price must be a valid non-negative number"
        });
    }

    if (
        rating !== null &&
        (isNaN(rating) || Number(rating) < 0 || Number(rating) > 5)
    ) {
        return res.status(400).json({
            message: "Rating must be between 0 and 5"
        });
    }

    if (
        isNaN(stockQuantity) ||
        !Number.isInteger(Number(stockQuantity)) ||
        Number(stockQuantity) < 0
    ) {
        return res.status(400).json({
            message: "Stock quantity must be a non-negative integer"
        });
    }

    try {

        const product = await productService.updateProduct(
            id,
            name,
            category,
            description,
            price,
            rating,
            stockQuantity,
            imageUrl
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product updated successfully",
            product: product
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update product"
        });

    }
}

async function deleteProduct(req, res) {

    const id = req.params.id;

    try {

        const product = await productService.deleteProduct(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully",
            product: product
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete product"
        });

    }
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};