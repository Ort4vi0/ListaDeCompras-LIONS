const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

//rota dos produto
router.post('/products', productController.createProduct);
router.get('/products', productController.getAllProducts);
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;
