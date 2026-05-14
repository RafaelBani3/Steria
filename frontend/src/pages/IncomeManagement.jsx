import { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, Search, ArrowUpRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import CustomSelect from '../components/CustomSelect';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

export default function IncomeManagement() {
  const { incomes, addIncome, deleteIncome, fetchIncomes, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => { fetchIncomes(); }, []);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Salary');
  const [notes, setNotes] = useState('');

  const categories = ['Salary', 'Freelance', 'Business', 'Bonus', 'Investment', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source || !amount) return;
    setIsActionLoading(true);
    try {
      await addIncome({ source, amount: Number(amount), date, category, notes });
      toast.success('Pemasukan berhasil ditambahkan ✨');
      setSource(''); setAmount(0); setNotes(''); setShowForm(false);
    } catch (err) {
      toast.error('Gagal menambahkan pemasukan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setIsActionLoading(true);
    try {
      await deleteIncome(isDeleting);
      toast.success('Pemasukan berhasil dihapus.');
      setIsDeleting(null);
    } catch (err) {
      toast.error('Gagal menghapus pemasukan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const safeIncomes = Array.isArray(incomes) ? incomes : [];
  const filteredIncomes = safeIncomes.filter(inc => {
    const d = new Date(inc.date);
    const inPeriod = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    const matchSearch = inc.source.toLowerCase().includes(search.toLowerCase()) ||
                        inc.category.toLowerCase().includes(search.toLowerCase());
    return inPeriod && matchSearch;
  });

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track your revenue streams.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20"
      >
        <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Total Revenue This Period</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black tracking-tighter">{formatIDR(totalIncome)}</p>
          <span className="text-emerald-200 text-xs font-bold opacity-60">IDR</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold">
            {filteredIncomes.length} source(s)
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
              <h3 className="text-lg font-bold">Add New Income</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Source Name</label>
                <input required type="text" value={source} onChange={e => setSource(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all"
                  placeholder="e.g. Monthly Salary, Freelance Gig" />
              </div>
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
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date Received</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Notes (Optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all" placeholder="Add some notes..." />
              </div>
              <div className="sm:col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-2xl font-bold transition-all active:scale-95">Cancel</button>
                <button type="submit" disabled={isActionLoading}
                  className="flex-1 py-4 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95">
                  {isActionLoading ? 'Saving...' : 'Add Income'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
        <input type="text" placeholder="Search revenue..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-purple-500/30 transition-all shadow-sm" />
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredIncomes.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0a]/40 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-white/5 backdrop-blur-md">
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <ArrowUpRight className="w-8 h-8 text-gray-200 dark:text-gray-700" />
            </div>
            <p className="text-gray-400 font-bold text-sm">No revenue streams found</p>
            <p className="text-[10px] text-gray-500 mt-1">Add your first income to start tracking.</p>
          </div>
        ) : (
          filteredIncomes.map((inc) => (
            <motion.div key={inc.id} layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl rounded-[2rem] p-4 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4 hover:border-emerald-500/20 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{inc.source}</p>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{inc.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-gray-500 font-medium">{new Date(inc.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {inc.notes && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <p className="text-[10px] text-gray-400 truncate">{inc.notes}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <p className="font-black text-emerald-500 text-base tracking-tighter">{formatIDR(inc.amount)}</p>
                <button onClick={() => setIsDeleting(inc.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
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
        title="Delete Income Source?"
        message="This will remove this revenue stream from your current period calculations."
        isLoading={isActionLoading}
      />

      <Footer />
    </div>
  );
}
