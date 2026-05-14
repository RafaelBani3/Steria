import { useState, useEffect, useMemo, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Target, Plus, PiggyBank, X, Wallet, ArrowUpRight, TrendingUp, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import CustomSelect from '../components/CustomSelect';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

export default function SavingsTracker() {
  const { savings, addSaving, fetchSavings, updateSaving, deleteSaving, budgets, fetchBudgets, expenses, fetchExpenses, addExpense, addIncome, selectedMonth, selectedYear } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const formRef = useRef(null);

  // Update Progress Modal State
  const [updateGoal, setUpdateGoal] = useState(null); 
  const [amountToUpdate, setAmountToUpdate] = useState(0);
  const [selectedSource, setSelectedSource] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchSavings();
    fetchBudgets();
    fetchExpenses();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || targetAmount <= 0) return;
    
    setIsActionLoading(true);
    try {
      if (editingGoal) {
        await updateSaving(editingGoal.id, { name, targetAmount });
        toast.success('Goal tabungan diperbarui ✨');
      } else {
        await addSaving({ name, targetAmount });
        toast.success('Goal tabungan baru dibuat 🚀');
      }
      setName('');
      setTargetAmount(0);
      setShowForm(false);
      setEditingGoal(null);
    } catch (err) {
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setIsActionLoading(true);
    try {
      await deleteSaving(isDeleting);
      toast.success('Goal tabungan dihapus.');
      setIsDeleting(null);
    } catch (err) {
      toast.error('Gagal menghapus goal.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const startEditing = (goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setShowForm(true);
    scrollToForm();
  };

  const handleConfirmUpdate = async (e) => {
    e.preventDefault();
    if (!updateGoal || amountToUpdate <= 0) return;

    setIsActionLoading(true);
    try {
      let newAmount = updateGoal.isDeposit 
        ? updateGoal.currentAmount + Number(amountToUpdate) 
        : updateGoal.currentAmount - Number(amountToUpdate);
      
      if (newAmount < 0) newAmount = 0;

      // 1. Update the saving goal balance
      await updateSaving(updateGoal.id, { currentAmount: newAmount });

      // 2. If it's a deposit, record it as a "Savings Expense"
      if (updateGoal.isDeposit) {
        await addExpense({
            amount: Number(amountToUpdate),
            category: 'Savings',
            subCategory: selectedSource || 'General Savings',
            description: `Deposit to ${updateGoal.name}`,
            notes: `goal_id:${updateGoal.id}`,
            date: new Date().toISOString()
        });
        toast.success(`Berhasil deposit ke ${updateGoal.name} ✨`);
      } else {
        // 3. If it's a withdrawal, record it as "Income"
        await addIncome({
          amount: Number(amountToUpdate),
          source: `Withdrawal: ${updateGoal.name}`,
          category: 'Savings Withdrawal',
          notes: withdrawReason || 'Withdrawn for usage',
          date: new Date().toISOString()
        });
        toast.success(`Berhasil tarik tunai dari ${updateGoal.name}`);
      }

      setUpdateGoal(null);
      setAmountToUpdate(0);
      setSelectedSource('');
      setWithdrawReason('');
    } catch (err) {
      toast.error('Gagal memperbarui saldo tabungan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openDeposit = (goal) => {
    setUpdateGoal({ ...goal, isDeposit: true });
    setAmountToUpdate(0);
    setSelectedSource('');
  };

  const handleSourceChange = (sourceName) => {
    setSelectedSource(sourceName);
    if (!sourceName) {
      setAmountToUpdate(0);
      return;
    }
    
    const budgetItem = activeBudget?.budgetItems?.find(i => i.subCategory === sourceName && i.category === 'Savings');
    if (budgetItem) {
      const currentMonthExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear &&
               exp.category === 'Savings' && exp.subCategory === sourceName;
      });
      const spent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      setAmountToUpdate(Math.max(0, budgetItem.amount - spent));
    }
  };

  const activeBudget = budgets[0];
  
  const savingsBudgetItems = useMemo(() => {
    const items = activeBudget?.budgetItems?.filter(i => i.category === 'Savings') || [];
    const currentMonthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    return items.filter(item => {
      const spent = currentMonthExpenses
        .filter(e => e.category === 'Savings' && e.subCategory === item.subCategory)
        .reduce((sum, e) => sum + e.amount, 0);
      return spent < item.amount; // Only show if there's still budget left
    });
  }, [activeBudget, expenses, selectedMonth, selectedYear]);

  const totalSavingsBudget = (activeBudget?.budgetItems?.filter(i => i.category === 'Savings') || [])
    .reduce((sum, i) => sum + i.amount, 0);

  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  const totalTarget = savings.reduce((sum, s) => sum + s.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your goals and track your saving discipline.</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); scrollToForm(); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-gradient-to-br from-[#6C4CF1] via-[#8B5CF6] to-[#4F46E5] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <PiggyBank className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 bg-white/10 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
              <TrendingUp className="w-3 h-3" />
              Wealth Overview
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Total Accumulated</p>
                <h2 className="text-4xl font-black tracking-tighter">{formatIDR(totalSavings)}</h2>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Total Target</p>
                <h2 className="text-2xl font-black tracking-tighter">{formatIDR(totalTarget)}</h2>
              </div>
            </div>
            
            <div className="mt-10 space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                <span>Overall Completion</span>
                <span>{overallProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 p-1 backdrop-blur-md">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  className="bg-white h-full rounded-full shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Monthly Budget</h3>
          <p className="text-2xl font-black mb-4 tracking-tighter">{formatIDR(totalSavingsBudget)}</p>
          <div className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
            This budget is based on your chosen pattern in the Budgeting menu. Use this as your monthly saving goal.
          </div>
          <button 
            onClick={() => window.location.href = '/budgets'}
            className="mt-8 w-full py-4 border border-gray-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Adjust Budget <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            ref={formRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 mb-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
              <button onClick={() => { setShowForm(false); setEditingGoal(null); }} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Goal Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 rounded-2xl px-6 py-4 outline-none font-bold transition-all" placeholder="e.g. New iPhone, Travel" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Amount</label>
                <CurrencyInput required value={targetAmount} onChange={setTargetAmount} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 rounded-2xl px-6 py-4 outline-none font-black text-xl transition-all" placeholder="0" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingGoal(null); }} className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={isActionLoading} className="px-12 py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                  {isActionLoading ? 'Processing...' : (editingGoal ? 'Update Goal' : 'Launch Goal')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savings.map(goal => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          return (
            <motion.div
              key={goal.id}
              layout
              className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col group hover:border-purple-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Target className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 dark:text-white leading-tight">{goal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">{progress.toFixed(0)}% achieved</span>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-800" />
                      <span className="text-[10px] text-gray-400 font-medium">Milestone Tracking</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEditing(goal)} className="p-2.5 text-gray-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsDeleting(goal.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Accumulated</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{formatIDR(goal.currentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Target</p>
                    <p className="text-sm font-bold text-gray-500">{formatIDR(goal.targetAmount)}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-5 p-1.5 backdrop-blur-md">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 h-full rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                  onClick={() => setUpdateGoal({ ...goal, isDeposit: false })} 
                  className="py-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all active:scale-95"
                >
                  Withdraw
                </button>
                <button 
                  onClick={() => openDeposit(goal)} 
                  className="py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                  Deposit
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {updateGoal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0a0a0a]/80 w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-visible border border-white/10 backdrop-blur-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-emerald-600" />
              <button onClick={() => setUpdateGoal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-5 mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${updateGoal.isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">{updateGoal.isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{updateGoal.name}</p>
                </div>
              </div>
              
              <form onSubmit={handleConfirmUpdate} className="space-y-6">
                {updateGoal.isDeposit && (
                  <CustomSelect 
                    label="Source (Savings Budget)"
                    value={selectedSource}
                    onChange={handleSourceChange}
                    placeholder="Select Savings Item"
                    options={[
                      { label: 'Select Savings Item', value: '' },
                      ...savingsBudgetItems.map(item => ({ 
                        label: `${item.subCategory} (${formatIDR(item.amount)})`, 
                        value: item.subCategory 
                      }))
                    ]}
                  />
                )}

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    Amount to {updateGoal.isDeposit ? 'Add' : 'Take'}
                  </label>
                  <CurrencyInput 
                    autoFocus 
                    value={amountToUpdate} 
                    onChange={setAmountToUpdate} 
                    disabled={updateGoal.isDeposit && selectedSource !== ''}
                    className={`w-full text-4xl font-black bg-transparent border-b-2 border-gray-100 dark:border-white/10 focus:border-purple-500 pb-4 outline-none transition-colors tracking-tighter ${updateGoal.isDeposit && selectedSource !== '' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                    placeholder="0" 
                  />
                  {updateGoal.isDeposit && selectedSource !== '' && (
                    <p className="mt-3 text-[10px] text-purple-500 font-bold animate-pulse">✨ Full remaining budget will be deposited automatically.</p>
                  )}
                </div>

                {!updateGoal.isDeposit && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Reason for Withdrawal</label>
                    <input 
                      required 
                      type="text" 
                      value={withdrawReason} 
                      onChange={e => setWithdrawReason(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 rounded-2xl px-5 py-4 outline-none font-bold"
                      placeholder="e.g. Bought Laptop, Emergency"
                    />
                    <p className="mt-3 text-[10px] text-gray-400 font-medium italic">This amount will be added back to your unallocated monthly balance.</p>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setUpdateGoal(null)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 font-bold rounded-2xl active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={isActionLoading} className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-2xl active:scale-95 transition-all ${updateGoal.isDeposit ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-red-600 shadow-red-500/30'}`}>
                    {isActionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Savings Goal?"
        message="This will permanently delete this goal and all its progress. This action is irreversible."
        isLoading={isActionLoading}
      />

      <Footer />
    </div>
  );
}
