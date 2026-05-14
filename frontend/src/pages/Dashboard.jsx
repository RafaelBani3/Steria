import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, CreditCard, TrendingUp, Settings, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { formatIDR } from '../utils/formatCurrency';
import Footer from '../components/Footer';

const COLORS = ['#6C4CF1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function Dashboard() {
  const { 
    incomes = [], 
    expenses = [], 
    savings = [], 
    fetchIncomes, 
    fetchExpenses, 
    fetchSavings, 
    fetchBudgets, 
    budgets = [], 
    selectedMonth, 
    selectedYear 
  } = useFinanceStore();

  useEffect(() => {
    fetchIncomes();
    fetchExpenses();
    fetchSavings();
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  // Ensure we are working with arrays
  const safeIncomes = Array.isArray(incomes) ? incomes : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeSavings = Array.isArray(savings) ? savings : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];

  const activeBudget = safeBudgets[0];
  const pattern = activeBudget?.method || '50/30/20';

  const filteredIncomes = safeIncomes.filter(item => {
    if (!item?.date) return false;
    const d = new Date(item.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const filteredExpenses = safeExpenses.filter(item => {
    if (!item?.date) return false;
    const d = new Date(item.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalIncome = filteredIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpense = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalSavingsValue = safeSavings.reduce((sum, item) => sum + (item.currentAmount || 0), 0);
  const monthlySurplus = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;

  // Projections
  const projected6Months = totalSavingsValue + (monthlySurplus * 6);
  const projected1Year = totalSavingsValue + (monthlySurplus * 12);

  // Group expenses by category for breakdown
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    if (!exp.category) return acc;
    if (!acc[exp.category]) acc[exp.category] = 0;
    acc[exp.category] += (exp.amount || 0);
    return acc;
  }, {});

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  // Trend data (Yearly by Month)
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, index) => {
      const monthExpenses = safeExpenses.filter(e => {
        if (!e?.date) return false;
        const d = new Date(e.date);
        return d.getMonth() === index && d.getFullYear() === selectedYear;
      });
      
      const expTotal = monthExpenses.filter(e => e.category !== 'Savings').reduce((s, e) => s + (e.amount || 0), 0);
      const savTotal = monthExpenses.filter(e => e.category === 'Savings').reduce((s, e) => s + (e.amount || 0), 0);
      
      return {
        name: m,
        expenses: expTotal,
        savings: savTotal,
      };
    });
  }, [safeExpenses, selectedYear]);


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
      className="space-y-6 pb-24 md:pb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your financial health at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-600/10 dark:bg-purple-500/10 px-5 py-2.5 rounded-2xl border border-purple-500/20 backdrop-blur-md">
            <PieChartIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest">Rule: {pattern}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[
          { label: 'Surplus', value: monthlySurplus, icon: Wallet, color: 'purple', isPositive: monthlySurplus >= 0 },
          { label: 'Saving Rate', value: `${savingsRate.toFixed(1)}%`, icon: TrendingUp, color: 'emerald' },
          { label: 'Total Wealth', value: totalSavingsValue + monthlySurplus, icon: PiggyBank, color: 'blue' },
          { label: 'Daily Spent', value: filteredExpenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).reduce((s, e) => s + e.amount, 0), icon: CreditCard, color: 'amber' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants} 
            className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5"
          >
            <div className="flex flex-col gap-2 md:gap-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500`}>
                <stat.icon size={16} className="md:w-5 md:h-5" />
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <h3 className={`text-sm md:text-xl font-black mt-0.5 md:mt-1 tracking-tighter ${stat.isPositive === false ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                  {typeof stat.value === 'number' ? formatIDR(stat.value) : stat.value}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black">Monthly Trends</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Growth & Spending Analysis</p>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Savings</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> Expenses</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                  cursor={{ stroke: '#6C4CF1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.8)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '24px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  labelStyle={{ fontWeight: 900, fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  formatter={(val) => [formatIDR(val), '']}
                />
                <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={5} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={5} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
          <h3 className="text-xl font-black mb-8">Spending Analysis</h3>
          <div className="h-64 flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 10, 10, 0.8)', 
                      backdropFilter: 'blur(12px)',
                      borderRadius: '20px', 
                      border: '1px solid rgba(255,255,255,0.1)' 
                    }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px', color: '#fff' }}
                    formatter={(val) => formatIDR(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center opacity-20">
                <PieChartIcon size={48} />
                <p className="text-xs font-black mt-2 uppercase tracking-widest">No Data</p>
              </div>
            )}
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Spent</p>
                <p className="text-xl font-black tracking-tighter">{formatIDR(totalExpense)}</p>
              </div>
            )}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {pieData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{entry.name}</p>
                  <p className="text-xs font-black">{((entry.value / totalExpense) * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Projections Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants} 
          className="bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group lg:col-span-2"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <TrendingUp size={160} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Future Projections</h3>
                <p className="text-indigo-200 text-xs font-medium">Estimated wealth growth based on current habits.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Estimated 6 Months</p>
                <h4 className="text-4xl font-black tracking-tighter">{formatIDR(projected6Months)}</h4>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[9px] text-indigo-100/60 font-medium">Surplus: {formatIDR(monthlySurplus)}/mo</p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Estimated 1 Year</p>
                <h4 className="text-4xl font-black tracking-tighter text-emerald-400">{formatIDR(projected1Year)}</h4>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[9px] text-indigo-100/60 font-medium">Saving Rate: {savingsRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-white/10">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Current Base</p>
                    <p className="text-xl font-black">{formatIDR(totalSavingsValue)}</p>
                  </div>
                  <ArrowUpRight className="text-emerald-400" size={24} />
                  <div>
                    <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Expected Velocity</p>
                    <p className="text-xl font-black text-emerald-400">+{formatIDR(monthlySurplus)}</p>
                  </div>
                </div>
                <div className="hidden md:flex gap-1.5 h-12 items-end opacity-20">
                  {[40, 60, 45, 70, 85, 100].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="w-2.5 bg-white rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
               <Settings className="w-5 h-5" />
             </div>
             <h3 className="text-xl font-black">Pulse Check</h3>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="text-gray-400">Flow Efficiency</span>
                <span className={savingsRate > 20 ? 'text-emerald-500' : 'text-amber-500'}>
                  {savingsRate > 20 ? 'OPTIMIZED' : 'NEEDS TUNING'}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-white/5 h-4 rounded-full overflow-hidden p-1">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${savingsRate > 20 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(Math.max(savingsRate, 5), 100)}%` }}
                />
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5">
              <div className="flex gap-4">
                <div className="bg-blue-500/10 p-2.5 rounded-xl h-fit text-blue-500">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">AI Recommendation</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    {monthlySurplus > 0 
                      ? `Surplus detected. Strategy: Inject ${formatIDR(monthlySurplus)} into your top Savings Goal to reach targets 2.4x faster.`
                      : "Deficit warning. Analyze 'Wants' category. Reducing non-essential spend by 15% will restore positive cashflow."}
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
