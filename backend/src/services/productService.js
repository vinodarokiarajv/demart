const productRepository = require("../repositories/productRepository");

async function getAllProducts() {
    return await productRepository.findAllProducts();
}

async function getProductById(id) {
    return await productRepository.findProductById(id);
}

async function checkProductNameExists(name) {

    return await productRepository.findProductByName(name);

}

async function createProduct(
    name,
    category,
    description,
    price,
    rating,
    stockQuantity,
    imageUrl
) {
    return await productRepository.createProduct(
        name,
        category,
        description,
        price,
        rating,
        stockQuantity,
        imageUrl
    );
}

async function updateProduct(
    id,
    name,
    category,
    description,
    price,
    rating,
    stockQuantity,
    imageUrl
) {
    return await productRepository.updateProduct(
        id,
        name,
        category,
        description,
        price,
        rating,
        stockQuantity,
        imageUrl
    );
}

async function deleteProduct(id) {

    return await productRepository.deleteProduct(id);

}

module.exports = {
    getAllProducts,
    getProductById,
    checkProductNameExists,
    createProduct,
    updateProduct,
    deleteProduct
};