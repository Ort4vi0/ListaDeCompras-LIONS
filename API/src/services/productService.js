const productRepository = require('../repositories/productRepository');

class ProductService {
    async createProduct(data) {
        if (!data.name || !data.price) {
            throw new Error('Nome e preço são obrigatórios.');
        }
        
        const formattedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        
        return await productRepository.create({ ...data, name: formattedName });
    }

    async deleteProduct(id) {
        const deletedProduct = await productRepository.delete(id);
        if (!deletedProduct) {
            throw new Error('Produto não encontrado.');
        }
        return deletedProduct;
    }

    async getAllProducts() {
        return await productRepository.findAll();
    }
}

module.exports = new ProductService();
