const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    category: { type: String, default: 'Geral' },
    checked: { type: Boolean, default: false }
});

const budgetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    limit: { type: Number, default: 0 },
    items: [itemSchema],
    categories: { type: [String], default: ['Geral'] },
    createdAt: { type: Date, default: Date.now }
});

// coloca o _id em id para o front "ler"
budgetSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        if (ret.items) {
            ret.items.forEach(item => {
                item.id = item._id;
                delete item._id;
            });
        }
    }
});

module.exports = mongoose.model('Budget', budgetSchema);
