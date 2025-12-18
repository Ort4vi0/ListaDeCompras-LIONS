const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/productModel');

jest.mock('../src/models/productModel');

describe('API de Produtos', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Teste: Listar todos os produtos
    it('deve listar todos os produtos', async () => {
        const mockProducts = [
            { name: 'Leite', price: 5.00 },
            { name: 'Pão', price: 8.50 }
        ];

        Product.find.mockResolvedValue(mockProducts);

        const res = await request(app).get('/api/products');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(2);
        expect(res.body[0].name).toEqual('Leite');
    });

    // Teste: Criar um novo produto
    it('deve criar um novo produto', async () => {
        const mockProduct = {
            _id: '123',
            name: 'Café',
            price: 20.00
        };

        Product.create.mockResolvedValue(mockProduct);

        const res = await request(app)
            .post('/api/products')
            .send({
                name: 'Café',
                price: 20.00
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.product.name).toEqual('Café');
    });

    // Teste: Deletar um produto
    it('deve deletar um produto', async () => {
        Product.findByIdAndDelete.mockResolvedValue({ _id: '123', name: 'Café' });

        const res = await request(app).delete('/api/products/123');

        expect(res.statusCode).toEqual(200);
    });
});
