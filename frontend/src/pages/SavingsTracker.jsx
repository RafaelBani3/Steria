import { useState, useEffect, useMemo, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Target, Plus, PiggyBank, X, Wallet, ArrowUpRight, TrendingUp, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import Footer from '../components/Footer';

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

  useEffect(() => {
    fetchSavings();
    fetchBudgets();
    fetchExpenses();
  }, []);

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!name || targetAmount <= 0) return;
    
    if (editingGoal) {
      updateSaving(editingGoal.id, { name, targetAmount });
    } else {
      addSaving({ name, targetAmount });
    }
    
    setName('');
    setTargetAmount(0);
    setShowForm(false);
    setEditingGoal(null);
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

  const handleConfirmUpdate = (e) => {
    e.preventDefault();
    if (!updateGoal || amountToUpdate <= 0) return;

    let newAmount = updateGoal.isDeposit 
      ? updateGoal.currentAmount + Number(amountToUpdate) 
      : updateGoal.currentAmount - Number(amountToUpdate);
    
    if (newAmount < 0) newAmount = 0;

    // 1. Update the saving goal balance
    updateSaving(updateGoal.id, { currentAmount: newAmount });

    // 2. If it's a deposit, record it as a "Savings Expense" to reduce the savings budget
    if (updateGoal.isDeposit) {
      addExpense({
          amount: Number(amountToUpdate),
          category: 'Savings',
          subCategory: selectedSource || 'General Savings',
          description: `Deposit to ${updateGoal.name}`,
          notes: `goal_id:${updateGoal.id}`,
          date: new Date().toISOString()
      });
    } else {
      // 3. If it's a withdrawal, record it as "Income" to put it back into unallocated/budget
      addIncome({
        amount: Number(amountToUpdate),
        source: `Withdrawal: ${updateGoal.name}`,
        category: 'Savings Withdrawal',
        notes: withdrawReason || 'Withdrawn for usage',
        date: new Date().toISOString()
      });
    }

    setUpdateGoal(null);
    setAmountToUpdate(0);
    setSelectedSource('');
    setWithdrawReason('');
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your goals and track your saving discipline.</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); scrollToForm(); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <PiggyBank className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Wealth Overview
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">Total Accumulated</p>
                <h2 className="text-4xl font-black">{formatIDR(totalSavings)}</h2>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-white/60 text-sm font-medium mb-1">Total Target</p>
                <h2 className="text-2xl font-bold">{formatIDR(totalTarget)}</h2>
              </div>
            </div>
            
            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span>Overall Completion</span>
                <span>{overallProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Savings Budget</h3>
          <p className="text-2xl font-black mb-4">{formatIDR(totalSavingsBudget)}</p>
          <div className="text-[10px] text-gray-500 font-medium leading-relaxed">
            This budget is based on your chosen pattern in the Budgeting menu. Use this as your monthly saving goal.
          </div>
          <button 
            onClick={() => window.location.href = '/budgets'}
            className="mt-6 w-full py-3 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            Adjust Budget <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            ref={formRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8"
          >
            <h3 className="text-xl font-black mb-6">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
            <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Goal Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-2xl px-5 py-3 outline-none font-medium" placeholder="e.g. New iPhone, Travel" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Amount</label>
                <CurrencyInput required value={targetAmount} onChange={setTargetAmount} className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-2xl px-5 py-3 outline-none font-black text-lg" placeholder="0" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingGoal(null); }} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" className="px-10 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
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
              className="bg-white dark:bg-[#1E293B] p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col group hover:border-purple-200 dark:hover:border-purple-900/30 transition-all"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Target className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 dark:text-white leading-tight">{goal.name}</h3>
                    <p className="text-sm text-gray-400 font-medium">Goal achieved {progress.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditing(goal)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if(confirm('Delete this goal?')) deleteSaving(goal.id) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900 dark:text-white">{formatIDR(goal.currentAmount)}</span>
                  <span className="text-gray-400">Target: {formatIDR(goal.targetAmount)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                  onClick={() => setUpdateGoal({ ...goal, isDeposit: false })} 
                  className="py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
                >
                  Withdraw
                </button>
                <button 
                  onClick={() => openDeposit(goal)} 
                  className="py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-emerald-600" />
              <button onClick={() => setUpdateGoal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${updateGoal.isDeposit ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">{updateGoal.isDeposit ? 'Deposit' : 'Withdraw'}</h3>
                  <p className="text-gray-500 text-sm font-medium">{updateGoal.name}</p>
                </div>
              </div>
              
              <form onSubmit={handleConfirmUpdate} className="space-y-6">
                {updateGoal.isDeposit && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Source (Savings Budget)</label>
                    <select 
                      required 
                      value={selectedSource} 
                      onChange={e => handleSourceChange(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 outline-none font-bold"
                    >
                      <option value="">Select Savings Item</option>
                      {savingsBudgetItems.map(item => (
                        <option key={item.id} value={item.subCategory}>{item.subCategory} ({formatIDR(item.amount)})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Amount to {updateGoal.isDeposit ? 'Add' : 'Take'}
                  </label>
                  <CurrencyInput 
                    autoFocus 
                    value={amountToUpdate} 
                    onChange={setAmountToUpdate} 
                    disabled={updateGoal.isDeposit && selectedSource !== ''}
                    className={`w-full text-4xl font-black bg-transparent border-b-2 border-gray-100 dark:border-gray-800 focus:border-purple-600 pb-4 outline-none transition-colors ${updateGoal.isDeposit && selectedSource !== '' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                    placeholder="0" 
                  />
                  {updateGoal.isDeposit && selectedSource !== '' && (
                    <p className="mt-2 text-[10px] text-purple-600 font-bold animate-pulse">✨ Full remaining budget will be deposited.</p>
                  )}
                </div>

                {!updateGoal.isDeposit && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reason for Withdrawal</label>
                    <input 
                      required 
                      type="text" 
                      value={withdrawReason} 
                      onChange={e => setWithdrawReason(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 outline-none font-bold"
                      placeholder="e.g. Bought Laptop, Emergency"
                    />
                    <p className="mt-2 text-[10px] text-gray-400 font-medium italic">This amount will be added back to your unallocated monthly balance.</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setUpdateGoal(null)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl">Cancel</button>
                  <button type="submit" className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-xl transition-all ${updateGoal.isDeposit ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
