import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Auth & User
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

// Core Financial
import accountRoutes from './routes/account.routes.js';
import incomeRoutes from './routes/income.routes.js';
import budgetCategoryRoutes from './routes/budget.category.routes.js';
import budgetItemRoutes from './routes/budget.item.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import transferRoutes from './routes/transfer.routes.js';

// Support
import notificationRoutes from './routes/notification.routes.js';
import aiRoutes from './ai/ai.routes.js';

dotenv.config();

const app = express();

// ─── CORS ───────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
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
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ─── ROUTES ─────────────────────────────────────────────
// Auth & User
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Core Financial
app.use('/api/accounts', accountRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/budget-categories', budgetCategoryRoutes);
app.use('/api/budget-items', budgetItemRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/transfers', transferRoutes);

// Support
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', version: '2.0.0', name: 'Steria Financial OS' });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
