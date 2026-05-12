import { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, Search, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';

export default function IncomeManagement() {
  const { incomes, addIncome, deleteIncome, fetchIncomes, selectedMonth, selectedYear } = useFinanceStore();

  useEffect(() => { fetchIncomes(); }, []);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Salary');
  const [notes, setNotes] = useState('');

  const categories = ['Salary', 'Freelance', 'Business', 'Bonus', 'Investment', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!source || !amount) return;
    addIncome({ source, amount: Number(amount), date, category, notes });
    setSource(''); setAmount(0); setNotes(''); setShowForm(false);
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
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Total This Period</p>
        <p className="text-3xl font-black">{formatIDR(totalIncome)}</p>
        <p className="text-emerald-100 text-xs mt-1">{filteredIncomes.length} transaction(s)</p>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-base font-bold mb-4">Add New Income</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Source</label>
                <input required type="text" value={source} onChange={e => setSource(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                  placeholder="e.g. Gaji, Freelance" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                <CurrencyInput required value={amount} onChange={setAmount}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes (Optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500" placeholder="Catatan..." />
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
        <input type="text" placeholder="Search income..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-300 dark:text-white shadow-sm" />
      </div>

      {/* List — Cards instead of table */}
      <div className="space-y-3">
        {filteredIncomes.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-800">
            <ArrowUpRight className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No income records found.</p>
          </div>
        ) : (
          filteredIncomes.map((inc) => (
            <motion.div key={inc.id} layout
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{inc.source}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-md font-medium">{inc.category}</span>
                  <span className="text-[10px] text-gray-400">{new Date(inc.date).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatIDR(inc.amount)}</p>
                <button onClick={() => deleteIncome(inc.id)}
                  className="mt-1 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
