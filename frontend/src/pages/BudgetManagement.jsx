import { useState, useEffect, useMemo, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart as PieChartIcon, Settings, Plus, Trash2, Info, CheckCircle2, AlertCircle, ChevronDown, Check, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR } from '../utils/formatCurrency';
import CurrencyInput from '../components/CurrencyInput';
import Footer from '../components/Footer';

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


  const handleAddItem = (e) => {
    e.preventDefault();
    if (!subCategory || amount <= 0) return;
    if (!activeBudget) return;

    addBudgetItem(activeBudget.id, {
      category: selectedCategory,
      subCategory,
      amount: Number(amount)
    });

    setSubCategory('');
    setAmount(0);
    setShowForm(false);
  };

  const handleUpdateItem = async (itemId) => {
    if (!editSubCategory || editAmount <= 0) return;
    await updateBudgetItem(activeBudget.id, itemId, {
      subCategory: editSubCategory,
      amount: Number(editAmount)
    });
    setEditingItemId(null);
  };

  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditSubCategory(item.subCategory);
    setEditAmount(item.amount);
  };

  const handlePatternChange = (newMethod) => {
    if (!activeBudget) return;
    updateBudget(activeBudget.id, activeBudget.name, newMethod);
  };

  const calcProgress = (spent, budget) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Blueprint</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Select a rule and allocate your income effectively.</p>
        </div>
        <div className="relative" ref={patternDropdownRef}>
          <div 
            onClick={() => setIsPatternDropdownOpen(!isPatternDropdownOpen)}
            className="flex items-center gap-3 bg-white dark:bg-[#1E293B] p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer group"
          >
            <div className="bg-purple-100 dark:bg-purple-500/10 p-2 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 transition-colors">
              <Settings className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex flex-col pr-8 relative">
              <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Allocation Rule</span>
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
                className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 p-2"
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
                        ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>{p.name}</span>
                        {p.value !== 'custom' && (
                          <span className="text-[10px] opacity-60 font-medium">
                            {p.needs}% Needs • {p.wants}% Wants • {p.savings}% Savings
                          </span>
                        )}
                        {p.value === 'custom' && (
                          <span className="text-[10px] opacity-60 font-medium">Manual allocation breakdown</span>
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

          return (
            <motion.div 
              key={cat}
              whileHover={{ y: -4 }}
              className={`p-6 rounded-3xl border shadow-sm transition-all ${
                isOver 
                ? (cat === 'Savings' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-900/30') 
                : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">{cat}</h3>
                  <p className="text-2xl font-black mt-1">{percent}%</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  cat === 'Needs' ? 'bg-blue-100 text-blue-600' : cat === 'Wants' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {cat === 'Needs' ? <CheckCircle2 className="w-5 h-5" /> : cat === 'Wants' ? <Info className="w-5 h-5" /> : <PieChartIcon className="w-5 h-5" />}
                </div>
              </div>

              <div className="space-y-4">
                {!currentPattern.isCustom && (
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-gray-400">Monthly Limit</span>
                      <span className="font-bold">{formatIDR(limit)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat === 'Needs' ? 'bg-blue-500' : cat === 'Wants' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(allocated / limit) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {currentPattern.isCustom && (
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-gray-400">Income Share</span>
                      <span className="font-bold">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat === 'Needs' ? 'bg-blue-500' : cat === 'Wants' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Allocated</p>
                    <p className={`font-bold ${isOver && !currentPattern.isCustom ? (cat === 'Savings' ? 'text-emerald-500' : 'text-red-500') : 'text-gray-900 dark:text-white'}`}>{formatIDR(allocated)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Spent</p>
                    <p className="font-bold">{formatIDR(spent)}</p>
                  </div>
                </div>
                
                {isOver && !currentPattern.isCustom && (
                  <div className={`flex items-center gap-2 text-[10px] font-bold p-2 rounded-lg ${
                    cat === 'Savings' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10' : 'text-red-500 bg-red-100/50 dark:bg-red-500/10'
                  }`}>
                    {cat === 'Savings' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {cat === 'Savings' ? `BOOSTER! Savings exceeds ${percent}%! (CUAN)` : `Allocation exceeds ${percent}% limit!`}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-purple-500/20">
          <div className="flex justify-between items-center mb-2">
            <p className="text-purple-100 font-bold text-xs uppercase tracking-widest">Total Allocated</p>
            <div className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-black">
              {((totalAllocated / totalIncome) * 100 || 0).toFixed(1)}% OF INCOME
            </div>
          </div>
          <h2 className="text-3xl font-black">{formatIDR(totalAllocated)}</h2>
          <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(totalAllocated / totalIncome) * 100 || 0}%` }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-center ${
          remainingIncome < 0 
          ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-900/30' 
          : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-gray-800'
        }`}>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Remaining Unallocated</p>
          <h2 className={`text-3xl font-black ${remainingIncome < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {formatIDR(remainingIncome)}
          </h2>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">
            {remainingIncome < 0 
              ? '⚠️ You have overallocated your budget!' 
              : 'Keep up the good work! Allocate your remaining funds to savings or investments.'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="text-xl font-bold">Budget Breakdown</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-8 overflow-hidden"
          >
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category Group</label>
                <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-xl px-4 py-3 outline-none font-medium"
                >
                  <option value="Needs">Needs</option>
                  <option value="Wants">Wants</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sub Category Name</label>
                <input required type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-xl px-4 py-3 outline-none font-medium" placeholder="e.g. Rent, Internet" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Monthly Budget</label>
                <CurrencyInput required value={amount} onChange={setAmount} className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-xl px-4 py-3 outline-none font-black text-lg" placeholder="0" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-3 border-t border-gray-50 dark:border-gray-800 pt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20">Add to Budget</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {['Needs', 'Wants', 'Savings'].map((catName) => (
          <div key={catName}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-2 h-6 rounded-full ${catName === 'Needs' ? 'bg-blue-500' : catName === 'Wants' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <h3 className="font-black text-lg">{catName} Items</h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-500 font-bold">
                {groupedItems[catName].length} items
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedItems[catName].length === 0 ? (
                <div className="md:col-span-2 py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                  <Plus className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No {catName} items yet.</p>
                </div>
              ) : (
                groupedItems[catName].map((item) => {
                  const isEditing = editingItemId === item.id;
                  const spent = currentExpenses.filter(e => e.subCategory === item.subCategory).reduce((s, e) => s + e.amount, 0);
                  const progress = calcProgress(spent, item.amount);
                  
                  return (
                    <div key={item.id} className={`bg-white dark:bg-[#1E293B] p-5 rounded-2xl border transition-all group ${
                      isEditing ? 'ring-2 ring-purple-500 border-transparent' : 'border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-900/50'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3 pr-4">
                              <input 
                                value={editSubCategory}
                                onChange={e => setEditSubCategory(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-1 ring-purple-500"
                                autoFocus
                              />
                              <CurrencyInput 
                                value={editAmount}
                                onChange={setEditAmount}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1.5 text-sm font-black outline-none focus:ring-1 ring-purple-500"
                              />
                            </div>
                          ) : (
                            <>
                              <h4 className="font-bold text-gray-900 dark:text-white">{item.subCategory}</h4>
                              <p className="text-xs text-gray-400 font-medium">Allocated: {formatIDR(item.amount)}</p>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleUpdateItem(item.id)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingItemId(null)}
                                className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(item)}
                                className="p-2 text-gray-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteBudgetItem(activeBudget.id, item.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className={progress > 90 ? 'text-red-500' : 'text-gray-400'}>Spent: {formatIDR(spent)}</span>
                          <span className="text-gray-400">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-50 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${progress > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
