const Budget = require('../models/budgetModel');

class BudgetRepository {
    async findAll() {
        return await Budget.find().sort({ createdAt: -1 });
    }

    async findById(id) {
        return await Budget.findById(id);
    }

    async create(data) {
        const budget = new Budget(data);
        return await budget.save();
    }

    async update(id, data) {
        return await Budget.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await Budget.findByIdAndDelete(id);
    }
}

module.exports = new BudgetRepository();
