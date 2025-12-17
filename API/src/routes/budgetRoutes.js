const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const itemController = require('../controllers/itemController');

router.get('/', budgetController.getAll);
router.get('/:id', budgetController.getOne);
router.post('/', budgetController.create);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.delete);

// Rotas dos item
router.post('/:id/items', itemController.addItem);
router.put('/:id/items/:itemId', itemController.updateItem);
router.delete('/:id/items/:itemId', itemController.deleteItem);

// rota da categoria
router.delete('/:id/categories/:categoryName', itemController.deleteCategory);

module.exports = router;
