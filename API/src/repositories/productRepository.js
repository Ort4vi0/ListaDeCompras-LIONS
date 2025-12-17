const Product = require('../models/productModel');

class ProductRepository {
    async create(data) {
        return await Product.create(data);
    }

    async delete(id) {
        return await Product.findByIdAndDelete(id);
    }

    async findById(id) {
        return await Product.findById(id);
    }

    async findAll() {
        return await Product.find();
    }
}

module.exports = new ProductRepository();
