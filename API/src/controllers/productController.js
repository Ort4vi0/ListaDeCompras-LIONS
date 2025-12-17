const productService = require('../services/productService');

class ProductController {
    async createProduct(req, res) {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({ message: 'Produto criado com sucesso.', product });
        } catch (error) {
            if (error.message === 'Nome e preço são obrigatórios.') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Erro ao criar produto.', error: error.message });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const deletedProduct = await productService.deleteProduct(id);
            res.status(200).json({ message: 'Produto deletado com sucesso.', product: deletedProduct });
        } catch (error) {
            if (error.message === 'Produto não encontrado.') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Erro ao deletar produto.', error: error.message });
        }
    }

    async getAllProducts(req, res) {
        try {
            const products = await productService.getAllProducts();
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar produtos.', error: error.message });
        }
    }
}

module.exports = new ProductController();
