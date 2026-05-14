import { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, Search, Receipt, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import CustomSelect from '../components/CustomSelect';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

export default function ExpenseTracking() {
  const { expenses, budgets, incomes, addExpense, deleteExpense, fetchExpenses, fetchBudgets, fetchIncomes, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => { fetchExpenses(); fetchBudgets(); fetchIncomes(); }, []);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // stores ID of expense to delete
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    if (category === 'Unallocated' && amount > availableUnallocated) {
      toast.error(`Dana tidak cukup! Tersedia: ${formatIDR(availableUnallocated)}`); 
      return;
    }
    if (category !== 'Unallocated' && !subCategory) return;
    
    setIsActionLoading(true);
    try {
      await addExpense({ amount: Number(amount), category, subCategory, date, description });
      toast.success('Pengeluaran berhasil dicatat ✨');
      setAmount(0); 
      setDescription(''); 
      setShowForm(false);
    } catch (err) {
      toast.error('Gagal mencatat pengeluaran.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setIsActionLoading(true);
    try {
      await deleteExpense(isDeleting);
      toast.success('Transaksi berhasil dihapus.');
      setIsDeleting(null);
    } catch (err) {
      toast.error('Gagal menghapus transaksi.');
    } finally {
      setIsActionLoading(false);
    }
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

  const categoryColors = { 
    Needs: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', 
    Wants: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', 
    Savings: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', 
    Unallocated: 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400' 
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track your spending.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /><span>Add Transaction</span>
        </button>
      </div>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 rounded-3xl p-6 text-white shadow-xl shadow-red-500/20"
      >
        <p className="text-red-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Total Spent This Period</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black tracking-tighter">{formatIDR(totalExpense)}</p>
          <span className="text-red-200 text-xs font-bold opacity-60">IDR</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold">
            {filteredExpenses.length} transaction(s)
          </div>
        </div>
      </motion.div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 overflow-visible z-50 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Add New Expense</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
                <CurrencyInput required value={amount} onChange={setAmount}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-4 text-lg font-black outline-none transition-all" placeholder="0" />
              </div>
              
              <CustomSelect 
                label="Category"
                value={category}
                onChange={setCategory}
                options={categories.map(c => ({ label: c, value: c }))}
              />

              {category !== 'Unallocated' ? (
                <CustomSelect 
                  label="Sub Category"
                  value={subCategory}
                  onChange={setSubCategory}
                  options={subCategories.map(c => ({ label: c.name, value: c.name }))}
                />
              ) : (
                <div className="flex flex-col justify-center p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 h-[74px] mt-6">
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Available Funds</p>
                  <p className="text-xl font-black text-purple-900 dark:text-white tracking-tight">{formatIDR(availableUnallocated)}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all" placeholder="Enter notes..." />
              </div>

              <div className="sm:col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-2xl font-bold transition-all active:scale-95">Cancel</button>
                <button type="submit" disabled={isActionLoading}
                  className="flex-1 py-4 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50">
                  {isActionLoading ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
        <input type="text" placeholder="Search transactions..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-purple-500/30 transition-all shadow-sm" />
      </div>

      {/* List - Cards */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0a]/40 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-white/5 backdrop-blur-md">
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-gray-200 dark:text-gray-700" />
            </div>
            <p className="text-gray-400 font-bold text-sm">No transactions found</p>
            <p className="text-[10px] text-gray-500 mt-1">Start adding your expenses to see them here.</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <motion.div 
              key={exp.id} 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl rounded-[2rem] p-4 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4 hover:border-purple-500/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${categoryColors[exp.category] || categoryColors.Unallocated} transition-transform group-hover:scale-110`}>
                <Receipt className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{exp.subCategory || exp.category}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${categoryColors[exp.category] || categoryColors.Unallocated}`}>{exp.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-gray-500 font-medium">
                    {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {exp.description && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <p className="text-[10px] text-gray-400 truncate">{exp.description}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <p className="font-black text-red-500 text-base tracking-tighter">{formatIDR(exp.amount)}</p>
                <button 
                  onClick={() => setIsDeleting(exp.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <ConfirmModal 
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        message="This action cannot be undone and will permanently remove this transaction from your records."
        isLoading={isActionLoading}
      />

      <Footer />
    </div>
  );
}
