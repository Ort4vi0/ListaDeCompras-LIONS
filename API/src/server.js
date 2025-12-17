require('dotenv').config();
const app = require('./app');
const config = require('./config/config');
const mongoose = require('mongoose');

mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('Conectado ao MongoDB');
        app.listen(config.port, () => {
            console.log(`Servidor rodando na porta ${config.port}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });
