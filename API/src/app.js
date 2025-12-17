const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const productRoutes = require('./routes/productRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Segurança para ataques
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Limite de requisiçoes
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

//libera acesso da API
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', productRoutes);
app.use('/api/budgets', budgetRoutes);

app.use(errorHandler);

module.exports = app;
