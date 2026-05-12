import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { formatIDR } from '../utils/formatCurrency';

const COLORS = ['#6C4CF1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Analytics() {
  const { incomes, expenses, budgets, fetchIncomes, fetchExpenses, fetchBudgets, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => {
    fetchIncomes();
    fetchExpenses();
    fetchBudgets();
  }, []);

  const filteredIncomes = incomes.filter(item => {
    const d = new Date(item.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const filteredExpenses = expenses.filter(item => {
    const d = new Date(item.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Group expenses by subCategory
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    if (!acc[exp.subCategory]) {
      acc[exp.subCategory] = 0;
    }
    acc[exp.subCategory] += exp.amount;
    return acc;
  }, {});

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  })).sort((a, b) => b.value - a.value);

  // Generate all days for the selected month/year for the trend chart
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const trendData = [...Array(daysInMonth)].map((_, i) => {
    const day = i + 1;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayIncome = filteredIncomes.filter(i => i.date.startsWith(dateStr)).reduce((sum, i) => sum + i.amount, 0);
    const dayExpense = filteredExpenses.filter(e => e.date.startsWith(dateStr)).reduce((sum, e) => sum + e.amount, 0);
    
    return {
      date: day,
      income: dayIncome,
      expense: dayExpense
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Deep dive into your financial data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
              <h3 className="text-2xl font-bold mt-1">{formatIDR(totalExpense)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
              <h3 className="text-2xl font-bold mt-1">{savingsRate.toFixed(1)}%</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Category</p>
              <h3 className="text-2xl font-bold mt-1 truncate">{pieData[0]?.name || '-'}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-6">Spending Breakdown</h3>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatIDR(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-6">Income vs Expenses ({MONTHS[selectedMonth]} {selectedYear})</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => formatIDR(value)} width={80} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => formatIDR(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
