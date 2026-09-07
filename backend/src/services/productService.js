const productRepository = require("../repositories/productRepository");

async function getAllProducts() {
    return await productRepository.findAllProducts();
}

async function getProductById(id) {
    return await productRepository.findProductById(id);
}

module.exports = {
    getAllProducts,
    getProductById
};