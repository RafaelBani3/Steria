import { useState, useEffect, useMemo, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart as PieChartIcon, Settings, Plus, Trash2, Info, CheckCircle2, AlertCircle, ChevronDown, Check, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import CustomSelect from '../components/CustomSelect';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

const BUDGET_PATTERNS = [
  { name: '50/30/20 (Standard)', value: '50/30/20', needs: 50, wants: 30, savings: 20 },
  { name: '50/40/10 (Aggressive)', value: '50/40/10', needs: 50, wants: 40, savings: 10 },
  { name: '30/30/40 (Wealth Builder)', value: '30/30/40', needs: 30, wants: 30, savings: 40 },
  { name: '70/20/10 (Conservative)', value: '70/20/10', needs: 70, wants: 20, savings: 10 },
  { name: 'Custom', value: 'custom', needs: 0, wants: 0, savings: 0 },
];

export default function BudgetManagement() {
  const { incomes, expenses, budgets, fetchBudgets, fetchIncomes, fetchExpenses, updateBudget, addBudgetItem, deleteBudgetItem, updateBudgetItem, selectedMonth, selectedYear } = useFinanceStore();
  
  useEffect(() => {
    fetchBudgets();
    fetchIncomes();
    fetchExpenses();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Needs'); // Needs, Wants, Savings
  const [subCategory, setSubCategory] = useState('');
  const [amount, setAmount] = useState(0);

  // Edit states
  const [editingItemId, setEditingItemId] = useState(null);
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editAmount, setEditAmount] = useState(0);

  const [isPatternDropdownOpen, setIsPatternDropdownOpen] = useState(false);
  const patternDropdownRef = useRef(null);
  
  const [isDeleting, setIsDeleting] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (patternDropdownRef.current && !patternDropdownRef.current.contains(event.target)) {
        setIsPatternDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeBudget = budgets[0];
  const currentPatternValue = activeBudget?.method || '50/30/20';
  
  const budgetItems = activeBudget?.budgetItems || [];
  
  // Group items
  const groupedItems = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, { Needs: [], Wants: [], Savings: [] });

  const allocations = {
    Needs: groupedItems.Needs.reduce((sum, i) => sum + i.amount, 0),
    Wants: groupedItems.Wants.reduce((sum, i) => sum + i.amount, 0),
    Savings: groupedItems.Savings.reduce((sum, i) => sum + i.amount, 0),
  };

  const currentIncomes = incomes.filter(inc => {
    const d = new Date(inc.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalIncome = currentIncomes.reduce((sum, item) => sum + item.amount, 0);

  const currentPattern = useMemo(() => {
    if (currentPatternValue === 'custom') {
      const n = totalIncome > 0 ? (allocations.Needs / totalIncome) * 100 : 0;
      const w = totalIncome > 0 ? (allocations.Wants / totalIncome) * 100 : 0;
      const s = totalIncome > 0 ? (allocations.Savings / totalIncome) * 100 : 0;
      return { needs: n.toFixed(0), wants: w.toFixed(0), savings: s.toFixed(0), isCustom: true };
    }
    const [n, w, s] = currentPatternValue.split('/').map(Number);
    return { needs: n || 50, wants: w || 30, savings: s || 20, isCustom: false };
  }, [currentPatternValue, totalIncome, allocations]);

  const totalAllocated = allocations.Needs + allocations.Wants + allocations.Savings;
  
  const currentExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Sum of expenses that are 'Unallocated'
  const totalUnallocatedSpent = currentExpenses.filter(exp => 
    exp.category === 'Unallocated'
  ).reduce((sum, exp) => sum + exp.amount, 0);

  const remainingIncome = totalIncome - totalAllocated - totalUnallocatedSpent;

  // Limits based on pattern
  const limits = {
    Needs: (totalIncome * currentPattern.needs) / 100,
    Wants: (totalIncome * currentPattern.wants) / 100,
    Savings: (totalIncome * currentPattern.savings) / 100,
  };


  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!subCategory || amount <= 0) return;
    if (!activeBudget) return;

    setIsActionLoading(true);
    try {
      await addBudgetItem(activeBudget.id, {
        category: selectedCategory,
        subCategory,
        amount: Number(amount)
      });
      toast.success('Pos anggaran ditambahkan ✨');
      setSubCategory('');
      setAmount(0);
      setShowForm(false);
    } catch (err) {
      toast.error('Gagal menambahkan pos anggaran.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateItem = async (itemId) => {
    if (!editSubCategory || editAmount <= 0) return;
    setIsActionLoading(true);
    try {
      await updateBudgetItem(activeBudget.id, itemId, {
        subCategory: editSubCategory,
        amount: Number(editAmount)
      });
      toast.success('Anggaran diperbarui.');
      setEditingItemId(null);
    } catch (err) {
      toast.error('Gagal memperbarui anggaran.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setIsActionLoading(true);
    try {
      await deleteBudgetItem(activeBudget.id, isDeleting);
      toast.success('Pos anggaran dihapus.');
      setIsDeleting(null);
    } catch (err) {
      toast.error('Gagal menghapus pos anggaran.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditSubCategory(item.subCategory);
    setEditAmount(item.amount);
  };

  const handlePatternChange = async (newMethod) => {
    if (!activeBudget) return;
    try {
      await updateBudget(activeBudget.id, activeBudget.name, newMethod);
      toast.success(`Rule diubah ke ${newMethod} ✨`);
    } catch (err) {
      toast.error('Gagal mengubah rule.');
    }
  };

  const calcProgress = (spent, budget) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Blueprint</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Select a rule and allocate your income effectively.</p>
        </div>
        <div className="relative" ref={patternDropdownRef}>
          <div 
            onClick={() => setIsPatternDropdownOpen(!isPatternDropdownOpen)}
            className="flex items-center gap-3 bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-purple-500/50 transition-all cursor-pointer group"
          >
            <div className="bg-purple-100 dark:bg-purple-500/10 p-2.5 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 transition-colors">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex flex-col pr-10 relative">
              <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1 tracking-widest">Rule</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {BUDGET_PATTERNS.find(p => p.value === currentPatternValue)?.name || '50/30/20 (Standard)'}
              </span>
              <ChevronDown className={`w-4 h-4 absolute right-0 bottom-0.5 text-gray-400 transition-transform duration-300 ${isPatternDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <AnimatePresence>
            {isPatternDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-[60] p-2"
              >
                {BUDGET_PATTERNS.map((p) => {
                  const isSelected = p.value === currentPatternValue;
                  return (
                    <button
                      key={p.value}
                      onClick={() => {
                        handlePatternChange(p.value);
                        setIsPatternDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isSelected 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>{p.name}</span>
                        {p.value !== 'custom' && (
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-purple-100' : 'opacity-60'}`}>
                            {p.needs}% Needs • {p.wants}% Wants • {p.savings}% Savings
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Needs', 'Wants', 'Savings'].map((cat) => {
          const limit = limits[cat];
          const allocated = allocations[cat];
          const percent = cat === 'Needs' ? currentPattern.needs : cat === 'Wants' ? currentPattern.wants : currentPattern.savings;
          const isOver = allocated > limit;
          const spent = currentExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
          const actualAllocPercent = totalIncome > 0 ? (allocated / totalIncome) * 100 : 0;
          const deviation = actualAllocPercent - percent;

          return (
            <motion.div 
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-[2.5rem] border shadow-sm transition-all group overflow-hidden relative ${
                isOver 
                ? (cat === 'Savings' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' : 'bg-red-50/50 dark:bg-red-500/5 border-red-500/20 shadow-red-500/5') 
                : 'bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl border-gray-100 dark:border-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{cat}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-black tracking-tighter group-hover:scale-110 origin-left transition-transform">{percent}%</p>
                    {isOver && !currentPattern.isCustom && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${cat === 'Savings' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {cat === 'Savings' ? '+' : '+'}{deviation.toFixed(0)}% OVER
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${
                  cat === 'Needs' ? 'bg-blue-500/10 text-blue-500' : cat === 'Wants' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {cat === 'Needs' ? <CheckCircle2 size={24} /> : cat === 'Wants' ? <Info size={24} /> : <PieChartIcon size={24} />}
                </div>
              </div>

              <div className="space-y-4">
                {!currentPattern.isCustom && (
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                      <span>Monthly Limit</span>
                      <span>{formatIDR(limit)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${cat === 'Needs' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : cat === 'Wants' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                        style={{ width: `${Math.min((allocated / limit) * 100 || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Allocated</p>
                    <p className={`font-black text-sm ${isOver && !currentPattern.isCustom ? (cat === 'Savings' ? 'text-emerald-500' : 'text-red-500') : 'text-gray-900 dark:text-white'}`}>{formatIDR(allocated)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Spent</p>
                    <p className="font-black text-sm text-gray-600 dark:text-gray-400">{formatIDR(spent)}</p>
                  </div>
                </div>
                
                {isOver && !currentPattern.isCustom && (
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest p-2.5 rounded-xl animate-pulse ${
                    cat === 'Savings' ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                  }`}>
                    {cat === 'Savings' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{cat === 'Savings' ? `BOOSTER: SAVING ${deviation.toFixed(0)}% EXTRA` : `WARNING: OVER BY ${deviation.toFixed(0)}%`}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <PieChartIcon size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <p className="text-purple-100 font-black text-[10px] uppercase tracking-[0.2em]">Total Allocated</p>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 tracking-widest">
                {((totalAllocated / totalIncome) * 100 || 0).toFixed(1)}% OF INCOME
              </div>
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-6">{formatIDR(totalAllocated)}</h2>
            <div className="w-full bg-white/10 backdrop-blur-md h-4 rounded-full overflow-hidden p-1 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalAllocated / totalIncome) * 100 || 0, 100)}%` }}
                className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>
        </motion.div>

        <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-center backdrop-blur-xl relative overflow-hidden group transition-all ${
          remainingIncome < 0 
          ? 'bg-red-50 dark:bg-red-500/5 border-red-500/20 shadow-red-500/5' 
          : 'bg-white dark:bg-[#0a0a0a]/60 border-gray-100 dark:border-white/5 shadow-sm'
        }`}>
          <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Remaining Unallocated</p>
          <div className="flex items-end gap-3">
            <h2 className={`text-4xl font-black tracking-tighter ${remainingIncome < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {formatIDR(remainingIncome)}
            </h2>
            {remainingIncome > 0 && totalIncome > 0 && (
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg mb-2">
                +{((remainingIncome / totalIncome) * 100).toFixed(0)}% EXCESS
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-2 h-2 rounded-full ${remainingIncome < 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">
              {remainingIncome < 0 
                ? 'CRITICAL OVER-ALLOCATION' 
                : remainingIncome > (totalIncome * 0.2) 
                  ? `Wah, sisa dana kamu cuan ${((remainingIncome / totalIncome) * 100).toFixed(0)}% goks! 🔥`
                  : remainingIncome > 0
                    ? `Gokil, sisa dana kamu ${((remainingIncome / totalIncome) * 100).toFixed(0)}% dari income! ✨`
                    : 'FUNDS TOTALLY ALLOCATED'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-12 mb-8">
        <div>
          <h2 className="text-2xl font-black">Budget Breakdown</h2>
          <p className="text-xs text-gray-500 font-medium">Manage individual spending categories.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 mb-8 overflow-visible z-50 relative"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black">Add New Allocation</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CustomSelect 
                label="Category Group"
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { label: 'Needs', value: 'Needs' },
                  { label: 'Wants', value: 'Wants' },
                  { label: 'Savings', value: 'Savings' },
                ]}
              />
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Sub Category Name</label>
                <input required type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 rounded-2xl px-5 py-4 outline-none font-bold transition-all" placeholder="e.g. Rent, Internet" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Monthly Budget</label>
                <CurrencyInput required value={amount} onChange={setAmount} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 rounded-2xl px-5 py-4 outline-none font-black text-xl transition-all" placeholder="0" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={isActionLoading} className="px-12 py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                  {isActionLoading ? 'Saving...' : 'Activate Allocation'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {['Needs', 'Wants', 'Savings'].map((catName) => (
          <div key={catName}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-2 h-8 rounded-full ${catName === 'Needs' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : catName === 'Wants' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
              <h3 className="font-black text-2xl tracking-tighter">{catName} Items</h3>
              <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg text-[10px] text-gray-500 font-black uppercase tracking-widest">
                {groupedItems[catName].length} Positions
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedItems[catName].length === 0 ? (
                <div className="md:col-span-2 py-20 bg-gray-50/50 dark:bg-white/5 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-gray-400 group hover:border-purple-500/30 transition-all">
                  <Plus className="w-12 h-12 mb-4 opacity-10 group-hover:scale-125 transition-transform" />
                  <p className="text-sm font-black uppercase tracking-widest opacity-40">Zero Allocation Detected</p>
                </div>
              ) : (
                groupedItems[catName].map((item) => {
                  const isEditing = editingItemId === item.id;
                  const spent = currentExpenses.filter(e => e.subCategory === item.subCategory && e.category === item.category).reduce((s, e) => s + e.amount, 0);
                  const progress = calcProgress(spent, item.amount);
                  
                  return (
                    <motion.div 
                      key={item.id} 
                      layout
                      className={`bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-6 rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                        isEditing ? 'ring-2 ring-purple-500 border-transparent z-10' : 'border-gray-100 dark:border-white/5 hover:border-purple-500/30 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-4 pr-6">
                              <input 
                                value={editSubCategory}
                                onChange={e => setEditSubCategory(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none ring-1 ring-white/10 focus:ring-purple-500"
                                autoFocus
                              />
                              <CurrencyInput 
                                value={editAmount}
                                onChange={setEditAmount}
                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-sm font-black outline-none ring-1 ring-white/10 focus:ring-purple-500"
                              />
                            </div>
                          ) : (
                            <>
                              <h4 className="font-black text-gray-900 dark:text-white tracking-tight truncate">{item.subCategory}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Allocation:</span>
                                <span className="text-xs font-black text-purple-500">{formatIDR(item.amount)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleUpdateItem(item.id)}
                                className="p-2.5 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                              >
                                <Check size={20} />
                              </button>
                              <button 
                                onClick={() => setEditingItemId(null)}
                                className="p-2.5 text-gray-400 hover:bg-gray-500/10 rounded-xl transition-all"
                              >
                                <X size={20} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(item)}
                                className="p-2.5 text-gray-300 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setIsDeleting(item.id)}
                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Utilization</p>
                            <p className={`text-sm font-black tracking-tighter ${progress > 90 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{formatIDR(spent)}</p>
                          </div>
                          <p className={`text-[10px] font-black tracking-widest ${progress > 90 ? 'text-red-500' : 'text-purple-500'}`}>{progress.toFixed(0)}%</p>
                        </div>
                        <div className="w-full bg-gray-50 dark:bg-white/5 h-3 rounded-full overflow-hidden p-1">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full shadow-lg ${progress > 90 ? 'bg-red-500 shadow-red-500/20' : 'bg-purple-600 shadow-purple-500/20'}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Remove Budget Position?"
        message="This will remove this item from your financial blueprint. Existing transactions in this category will remain, but will no longer be tracked against a target."
        isLoading={isActionLoading}
      />

      <Footer />
    </div>
  );
}
