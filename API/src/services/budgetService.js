const budgetRepository = require('../repositories/budgetRepository');

class BudgetService {
    async getAllBudgets() {
        return await budgetRepository.findAll();
    }

    async getBudgetById(id) {
        return await budgetRepository.findById(id);
    }

    async createBudget(data) {
        return await budgetRepository.create(data);
    }

    async updateBudget(id, data) {
        return await budgetRepository.update(id, data);
    }

    async deleteBudget(id) {
        return await budgetRepository.delete(id);
    }
}

module.exports = new BudgetService();
