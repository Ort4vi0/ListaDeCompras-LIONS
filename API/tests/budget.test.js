const request = require('supertest');
const app = require('../src/app');
const Budget = require('../src/models/budgetModel');
jest.mock('../src/models/budgetModel');

describe('API de Orçamentos (Budgets)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- TESTES DE ORÇAMENTO ---

    it('deve listar todos os orçamentos', async () => {
        const mockBudgets = [
            { title: 'Mercado Semanal', limit: 500 },
            { title: 'Churrasco', limit: 300 }
        ];
        const mockSort = jest.fn().mockResolvedValue(mockBudgets);
        Budget.find.mockReturnValue({
            sort: mockSort
        });

        const res = await request(app).get('/api/budgets');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(2);
    });

    it('deve criar um novo orçamento', async () => {
        const mockBudget = {
            _id: '123',
            title: 'Novo Orçamento',
            limit: 100,
            items: [],
            categories: ['Geral']
        };
        Budget.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(mockBudget)
        }));

        const res = await request(app)
            .post('/api/budgets')
            .send({
                title: 'Novo Orçamento',
                limit: 100
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual('Novo Orçamento');
    });

    it('deve deletar um orçamento', async () => {
        Budget.findByIdAndDelete.mockResolvedValue({ _id: '123' });

        const res = await request(app).delete('/api/budgets/123');

        expect(res.statusCode).toEqual(204);
    });

    // --- TESTES DE ITENS ---

    it('deve adicionar um item ao orçamento', async () => {
        const mockBudgetDoc = {
            _id: '123',
            items: [],
            save: jest.fn().mockResolvedValue({
                _id: '123',
                items: [{ name: 'Arroz', price: 20 }]
            })
        };
        mockBudgetDoc.items.push = jest.fn();

        Budget.findById.mockResolvedValue(mockBudgetDoc);

        const res = await request(app)
            .post('/api/budgets/123/items')
            .send({
                name: 'Arroz',
                price: 20,
                quantity: 1
            });

        expect(res.statusCode).toEqual(200);
        expect(mockBudgetDoc.items.push).toHaveBeenCalled();
        expect(mockBudgetDoc.save).toHaveBeenCalled();
    });
});
