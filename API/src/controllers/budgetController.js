const budgetService = require('../services/budgetService');

class BudgetController {
    async getAll(req, res, next) {
        try {
            const budgets = await budgetService.getAllBudgets();
            res.json(budgets);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const budget = await budgetService.getBudgetById(req.params.id);
            if (!budget) return res.status(404).json({ message: 'Orçamento não encontrado' });
            res.json(budget);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const budget = await budgetService.createBudget(req.body);
            res.status(201).json(budget);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const budget = await budgetService.updateBudget(req.params.id, req.body);
            if (!budget) return res.status(404).json({ message: 'Orçamento não encontrado' });
            res.json(budget);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await budgetService.deleteBudget(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BudgetController();
