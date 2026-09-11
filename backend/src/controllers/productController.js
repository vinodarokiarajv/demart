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
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Product ID must be a positive integer"
        });
    }

    try {
        const product = await productService.getProductById(id);

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
    const stockQuantity = req.body.stockQuantity;
    const imageUrl = req.body.imageUrl?.trim() || null;

    if (!name) {
    return res.status(400).json({
        message: "Name is required"
    });
}

if (!category) {
    return res.status(400).json({
        message: "Category is required"
    });
}

if (price === undefined || price === null) {
    return res.status(400).json({
        message: "Price is required"
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

    if (stockQuantity === undefined || stockQuantity === null) {
  return res.status(400).json({
    message: "Stock quantity is required"
  });
}

if (typeof stockQuantity !== "number" || Number.isNaN(stockQuantity)) {
  return res.status(400).json({
    message: "Stock quantity must be a number"
  });
}

if (!Number.isInteger(stockQuantity)) {
  return res.status(400).json({
    message: "Stock quantity must be an integer"
  });
}

if (stockQuantity < 0) {
  return res.status(400).json({
    message: "Stock quantity must be non-negative"
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
    const stockQuantity = req.body.stockQuantity;
    const imageUrl = req.body.imageUrl?.trim() || null;

    if (!name) {
    return res.status(400).json({
        message: "Name is required"
    });
}

if (!category) {
    return res.status(400).json({
        message: "Category is required"
    });
}

if (price === undefined || price === null) {
    return res.status(400).json({
        message: "Price is required"
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

    if (stockQuantity === undefined || stockQuantity === null) {
  return res.status(400).json({
    message: "Stock quantity is required"
  });
}

if (typeof stockQuantity !== "number" || Number.isNaN(stockQuantity)) {
  return res.status(400).json({
    message: "Stock quantity must be a number"
  });
}

if (!Number.isInteger(stockQuantity)) {
  return res.status(400).json({
    message: "Stock quantity must be an integer"
  });
}

if (stockQuantity < 0) {
  return res.status(400).json({
    message: "Stock quantity must be non-negative"
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