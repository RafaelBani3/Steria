import { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, Search, Filter, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import Footer from '../components/Footer';

export default function ExpenseTracking() {
  const { expenses, budgets, incomes, addExpense, deleteExpense, fetchExpenses, fetchBudgets, fetchIncomes, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
    fetchIncomes();
  }, []);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const activeBudget = budgets[0];
  const budgetItems = activeBudget?.budgetItems || [];
  const categories = [...new Set(budgetItems.map(item => item.category))].filter(Boolean);
  
  // Add 'Unallocated' as a global category if it's not already there
  if (!categories.includes('Unallocated')) {
    categories.push('Unallocated');
  }

  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(categories[0] || 'Needs');
  
  const subCategories = budgetItems.filter(item => item.category === category).map(item => ({ id: item.id, name: item.subCategory })).filter(item => item.name);
  
  const [subCategory, setSubCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Calculate Unallocated Balance
  const availableUnallocated = useMemo(() => {
    const filteredIncomes = incomes.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalAllocated = budgetItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Sum of expenses that are 'Unallocated'
    const unallocatedSpent = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && exp.category === 'Unallocated';
    }).reduce((sum, exp) => sum + exp.amount, 0);

    return totalIncome - totalAllocated - unallocatedSpent;
  }, [incomes, expenses, budgetItems, selectedMonth, selectedYear]);

  // Update default subCategory when category changes
  useEffect(() => {
    if (category === 'Unallocated') {
      setSubCategory('General');
      return;
    }
    if (subCategories.length > 0 && !subCategories.find(s => s.name === subCategory)) {
      setSubCategory(subCategories[0].name);
    }
  }, [category, subCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    if (category === 'Unallocated' && amount > availableUnallocated) {
      alert(`Insufficient Unallocated Funds! You only have ${formatIDR(availableUnallocated)} available.`);
      return;
    }
    if (category !== 'Unallocated' && !subCategory) return;
    
    addExpense({ amount: Number(amount), category, subCategory, date, description });
    setAmount(0);
    setDescription('');
    setShowForm(false);
  };

  const filteredExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    const inPeriod = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    const matchSearch = (exp.description?.toLowerCase().includes(search.toLowerCase()) ||
                        exp.category.toLowerCase().includes(search.toLowerCase()) ||
                        exp.subCategory?.toLowerCase().includes(search.toLowerCase()));
    return inPeriod && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your spending.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6"
          >
            <h3 className="text-lg font-bold mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <CurrencyInput required value={amount} onChange={setAmount} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-purple-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-purple-500">
                  {categories.length === 0 ? <option value="">No categories found</option> : categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {category !== 'Unallocated' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub Category</label>
                  <select required value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-purple-500">
                    {subCategories.length === 0 ? <option value="">No sub-categories found</option> : subCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Available Unallocated</p>
                  <p className="text-xl font-black text-purple-900 dark:text-white">{formatIDR(availableUnallocated)}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-purple-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-purple-500" placeholder="Optional description" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow transition-colors">Save Expense</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-purple-300 dark:focus:border-purple-500/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 text-sm">
                <th className="px-6 py-4 font-medium">Expense</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{exp.subCategory}</p>
                          {exp.description && <p className="text-xs text-gray-500 truncate max-w-[150px]">{exp.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">{exp.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{exp.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatIDR(exp.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteExpense(exp.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
}
