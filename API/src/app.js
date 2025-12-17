const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', productRoutes);
app.use('/api/budgets', budgetRoutes);

app.use(errorHandler);

module.exports = app;
