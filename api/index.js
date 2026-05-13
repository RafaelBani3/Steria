import express from 'express';
import cors from 'cors';
import authRoutes from '../backend/src/routes/auth.routes.js';
import incomeRoutes from '../backend/src/routes/income.routes.js';
import expenseRoutes from '../backend/src/routes/expense.routes.js';
import savingRoutes from '../backend/src/routes/saving.routes.js';
import budgetRoutes from '../backend/src/routes/budget.routes.js';
import aiRoutes from '../backend/src/ai/ai.routes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://steria-finance-app.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'Steria API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/savings', savingRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

export default app;
