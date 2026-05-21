import express from 'express';
import cors from 'cors';
import authRoutes from '../backend/src/routes/auth.routes.js';
import userRoutes from '../backend/src/routes/user.routes.js';
import accountRoutes from '../backend/src/routes/account.routes.js';
import incomeRoutes from '../backend/src/routes/income.routes.js';
import budgetCategoryRoutes from '../backend/src/routes/budget.category.routes.js';
import budgetItemRoutes from '../backend/src/routes/budget.item.routes.js';
import expenseRoutes from '../backend/src/routes/expense.routes.js';
import transferRoutes from '../backend/src/routes/transfer.routes.js';
import notificationRoutes from '../backend/src/routes/notification.routes.js';
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
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.test') ||
      allowedOrigins.indexOf(origin) !== -1
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'), false);
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
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/budget-categories', budgetCategoryRoutes);
app.use('/api/budget-items', budgetItemRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

export default app;
