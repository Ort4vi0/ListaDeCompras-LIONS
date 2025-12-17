const itemService = require('../services/itemService');

class ItemController {
    async addItem(req, res, next) {
        try {
            const budget = await itemService.addItem(req.params.id, req.body);
            res.json(budget);
        } catch (error) {
            next(error);
        }
    }

    async updateItem(req, res, next) {
        try {
            const budget = await itemService.updateItem(req.params.id, req.params.itemId, req.body);
            res.json(budget);
        } catch (error) {
            next(error);
        }
    }

    async deleteItem(req, res, next) {
        try {
            const budget = await itemService.deleteItem(req.params.id, req.params.itemId);
            res.json(budget);
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const budget = await itemService.deleteCategory(req.params.id, req.params.categoryName);
            res.json(budget);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ItemController();
