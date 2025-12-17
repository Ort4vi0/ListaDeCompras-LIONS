const Budget = require('../models/budgetModel');

class ItemRepository {
    async addItem(budgetId, itemData) {
        const budget = await Budget.findById(budgetId);
        if (!budget) return null;
        
        budget.items.push(itemData);
        await budget.save();
        return budget;
    }

    async updateItem(budgetId, itemId, itemData) {
        const budget = await Budget.findById(budgetId);
        if (!budget) return null;

        const item = budget.items.id(itemId);
        if (!item) return null;

        if (itemData.name !== undefined) item.name = itemData.name;
        if (itemData.price !== undefined) item.price = itemData.price;
        if (itemData.quantity !== undefined) item.quantity = itemData.quantity;
        if (itemData.category !== undefined) item.category = itemData.category;
        if (itemData.checked !== undefined) item.checked = itemData.checked;

        await budget.save();
        return budget;
    }

    async deleteItem(budgetId, itemId) {
        const budget = await Budget.findById(budgetId);
        if (!budget) return null;

        budget.items.pull(itemId);
        await budget.save();
        return budget;
    }

    async deleteItemsByCategory(budgetId, categoryName) {
        const budget = await Budget.findById(budgetId);
        if (!budget) return null;

        // Deleta os item quando uma categoria a deletada
        budget.items = budget.items.filter(item => item.category !== categoryName);
        
        // Tira a categoria fora da lista
        budget.categories = budget.categories.filter(c => c !== categoryName);

        await budget.save();
        return budget;
    }
}

module.exports = new ItemRepository();
