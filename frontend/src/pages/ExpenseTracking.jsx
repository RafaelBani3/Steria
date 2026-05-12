import { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, Search, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import Footer from '../components/Footer';

export default function ExpenseTracking() {
  const { expenses, budgets, incomes, addExpense, deleteExpense, fetchExpenses, fetchBudgets, fetchIncomes, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => { fetchExpenses(); fetchBudgets(); fetchIncomes(); }, []);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const activeBudget = Array.isArray(budgets) ? budgets[0] : null;
  const budgetItems = activeBudget?.budgetItems || [];
  const categories = [...new Set(budgetItems.map(item => item.category))].filter(Boolean);
  if (!categories.includes('Unallocated')) categories.push('Unallocated');

  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(categories[0] || 'Needs');
  const subCategories = budgetItems.filter(item => item.category === category).map(item => ({ id: item.id, name: item.subCategory })).filter(item => item.name);
  const [subCategory, setSubCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeIncomes = Array.isArray(incomes) ? incomes : [];

  const availableUnallocated = useMemo(() => {
    const filteredIncomes = safeIncomes.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const totalIncome = filteredIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalAllocated = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const unallocatedSpent = safeExpenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && exp.category === 'Unallocated';
    }).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    return totalIncome - totalAllocated - unallocatedSpent;
  }, [safeIncomes, safeExpenses, budgetItems, selectedMonth, selectedYear]);

  useEffect(() => {
    if (category === 'Unallocated') { setSubCategory('General'); return; }
    if (subCategories.length > 0 && !subCategories.find(s => s.name === subCategory)) {
      setSubCategory(subCategories[0].name);
    }
  }, [category, subCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    if (category === 'Unallocated' && amount > availableUnallocated) {
      alert(`Dana tidak cukup! Tersedia: ${formatIDR(availableUnallocated)}`); return;
    }
    if (category !== 'Unallocated' && !subCategory) return;
    addExpense({ amount: Number(amount), category, subCategory, date, description });
    setAmount(0); setDescription(''); setShowForm(false);
  };

  const filteredExpenses = safeExpenses.filter(exp => {
    const d = new Date(exp.date);
    const inPeriod = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    const matchSearch = (exp.description?.toLowerCase().includes(search.toLowerCase()) ||
                        exp.category?.toLowerCase().includes(search.toLowerCase()) ||
                        exp.subCategory?.toLowerCase().includes(search.toLowerCase()));
    return inPeriod && matchSearch;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const categoryColors = { Needs: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', Wants: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', Savings: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', Unallocated: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track your spending.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /><span>Add</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-1">Total Spent This Period</p>
        <p className="text-3xl font-black">{formatIDR(totalExpense)}</p>
        <p className="text-red-100 text-xs mt-1">{filteredExpenses.length} transaction(s)</p>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                <CurrencyInput required value={amount} onChange={setAmount}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500">
                  {categories.length === 0 ? <option value="">No categories</option> : categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {category !== 'Unallocated' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sub Category</label>
                  <select required value={subCategory} onChange={e => setSubCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500">
                    {subCategories.length === 0 ? <option value="">No sub-categories</option> : subCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col justify-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-0.5">Available</p>
                  <p className="text-lg font-black text-purple-900 dark:text-white">{formatIDR(availableUnallocated)}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description (Optional)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500" placeholder="Keterangan..." />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow">Save</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search expenses..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-300 dark:text-white shadow-sm" />
      </div>

      {/* List - Cards */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-800">
            <Receipt className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No expense records found.</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <motion.div key={exp.id} layout
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[exp.category] || categoryColors.Unallocated}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{exp.subCategory || exp.category}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${categoryColors[exp.category] || categoryColors.Unallocated}`}>{exp.category}</span>
                  <span className="text-[10px] text-gray-400">{new Date(exp.date).toLocaleDateString('id-ID')}</span>
                  {exp.description && <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{exp.description}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-red-600 dark:text-red-400 text-sm">{formatIDR(exp.amount)}</p>
                <button onClick={() => deleteExpense(exp.id)}
                  className="mt-1 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}
