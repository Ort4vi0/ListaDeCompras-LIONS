const itemRepository = require('../repositories/itemRepository');

class ItemService {
    async addItem(budgetId, itemData) {
        const budget = await itemRepository.addItem(budgetId, itemData);
        if (!budget) throw new Error('Orçamento não encontrado');
        return budget;
    }

    async updateItem(budgetId, itemId, itemData) {
        const budget = await itemRepository.updateItem(budgetId, itemId, itemData);
        if (!budget) throw new Error('Orçamento ou item não encontrado');
        return budget;
    }

    async deleteItem(budgetId, itemId) {
        const budget = await itemRepository.deleteItem(budgetId, itemId);
        if (!budget) throw new Error('Orçamento não encontrado');
        return budget;
    }

    async deleteCategory(budgetId, categoryName) {
        const budget = await itemRepository.deleteItemsByCategory(budgetId, categoryName);
        if (!budget) throw new Error('Orçamento não encontrado');
        return budget;
    }
}

module.exports = new ItemService();
