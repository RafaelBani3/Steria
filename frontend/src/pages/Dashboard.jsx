import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, CreditCard, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { formatIDR } from '../utils/formatCurrency';
import Footer from '../components/Footer';

const COLORS = ['#6C4CF1', '#10B981', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const { incomes, expenses, savings, fetchIncomes, fetchExpenses, fetchSavings, fetchBudgets, budgets, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => {
    fetchIncomes();
    fetchExpenses();
    fetchSavings();
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const activeBudget = budgets[0];
  const pattern = activeBudget?.method || '50/30/20';

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
  const totalSavingsValue = savings.reduce((sum, item) => sum + item.currentAmount, 0);
  const monthlySurplus = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;

  // Projections
  const projected6Months = totalSavingsValue + (monthlySurplus * 6);
  const projected1Year = totalSavingsValue + (monthlySurplus * 12);

  // Group expenses by category for breakdown
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = 0;
    acc[exp.category] += exp.amount;
    return acc;
  }, {});

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  // Trend data (Current Month)
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const trendData = [...Array(daysInMonth)].map((_, i) => {
    const day = i + 1;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayIncome = filteredIncomes.filter(i => i.date.startsWith(dateStr)).reduce((sum, i) => sum + i.amount, 0);
    const dayExpense = filteredExpenses.filter(e => e.date.startsWith(dateStr)).reduce((sum, e) => sum + e.amount, 0);
    return { day, income: dayIncome, expense: dayExpense };
  });

  // Trend data (Yearly by Month)
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, index) => {
      const monthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === index && d.getFullYear() === selectedYear;
      });
      
      const expTotal = monthExpenses.filter(e => e.category !== 'Savings').reduce((s, e) => s + e.amount, 0);
      const savTotal = monthExpenses.filter(e => e.category === 'Savings').reduce((s, e) => s + e.amount, 0);
      
      return {
        name: m,
        expenses: expTotal,
        savings: savTotal,
      };
    });
  }, [expenses, selectedYear]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your financial health at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 px-4 py-2 rounded-2xl border border-purple-100 dark:border-purple-800">
            <PieChartIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Rule: {pattern}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Wallet className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Surplus</p>
              <h3 className={`text-sm md:text-2xl font-black mt-0.5 ${monthlySurplus >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatIDR(monthlySurplus)}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate</p>
              <h3 className="text-sm md:text-2xl font-black mt-0.5">{savingsRate.toFixed(1)}%</h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PiggyBank className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wealth</p>
              <h3 className="text-sm md:text-2xl font-black mt-0.5">{formatIDR(totalSavingsValue + monthlySurplus)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spent</p>
              <h3 className="text-sm md:text-2xl font-black mt-0.5">
                {formatIDR(filteredExpenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).reduce((s, e) => s + e.amount, 0))}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Monthly Trends</h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Savings</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Expenses</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                  cursor={{ stroke: '#6C4CF1', strokeWidth: 1 }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => formatIDR(val)}
                />
                <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={4} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-6">Spending Analysis</h3>
          <div className="h-64 flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => formatIDR(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">No data</p>
            )}
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Spent</p>
                <p className="text-xl font-black">{formatIDR(totalExpense)}</p>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-gray-500">{entry.name}</span>
                </div>
                <span>{((entry.value / totalExpense) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Projections Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold">Future Wealth Projections</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Estimated in 6 Months</p>
              <h4 className="text-3xl font-black">{formatIDR(projected6Months)}</h4>
              <div className="mt-4 p-3 bg-white/10 rounded-2xl">
                <p className="text-[10px] text-indigo-100 leading-relaxed">
                  Based on your current monthly surplus of <span className="font-bold text-white">{formatIDR(monthlySurplus)}</span>.
                </p>
              </div>
            </div>
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Estimated in 1 Year</p>
              <h4 className="text-3xl font-black">{formatIDR(projected1Year)}</h4>
              <div className="mt-4 p-3 bg-white/10 rounded-2xl">
                <p className="text-[10px] text-indigo-100 leading-relaxed">
                  You are saving at a rate of <span className="font-bold text-white">{savingsRate.toFixed(1)}%</span>. Keep it up!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-2">Savings Progress</p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-black">{formatIDR(totalSavingsValue)}</p>
                    <p className="text-[8px] opacity-60">CURRENT</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-lg font-black text-emerald-400">+{formatIDR(monthlySurplus)}</p>
                    <p className="text-[8px] opacity-60">THIS MONTH</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="flex gap-1 h-12 items-end">
                  {[40, 60, 45, 70, 85, 100].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-2 bg-white/20 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-4">Financial Health</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-gray-400">Income vs Expenses</span>
                <span className={savingsRate > 20 ? 'text-emerald-500' : 'text-amber-500'}>
                  {savingsRate > 20 ? 'Healthy' : 'Room to improve'}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${savingsRate > 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(savingsRate, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
              <div className="flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-xl h-fit">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold mb-1">Quick Tip</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {monthlySurplus > 0 
                      ? "You're living within your means. Consider moving your surplus to your 'Wealth Builder' savings account."
                      : "Your expenses are higher than your income this month. Review your 'Wants' category to reduce spending."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </motion.div>
  );
}
