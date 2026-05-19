import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, PieChart, X, Target, Edit3, ChevronDown, ChevronRight, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { useBudgetStore } from '../store/useBudgetStore';
import { useAccountStore } from '../store/useAccountStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { formatNumberInput, parseNumberInput } from '../utils/formatCurrency';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const CATEGORY_CONFIG = {
  Needs: { color: 'var(--clr-cyan)', glow: 'var(--clr-cyan-glow)', emoji: '🏠', badge: 'badge-cyan' },
  Wants: { color: 'var(--clr-purple-mid)', glow: 'var(--clr-purple-glow)', emoji: '✨', badge: 'badge-purple' },
  Savings: { color: 'var(--clr-emerald)', glow: 'var(--clr-emerald-glow)', emoji: '💰', badge: 'badge-emerald' },
};

const PRESET_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#F97316', '#14B8A6'];

const ALLOCATION_PRESETS = [
  { id: '50-30-20', label: '50/30/20', desc: 'Klasik', needs: 50, wants: 30, savings: 20, color: 'var(--clr-violet)' },
  { id: '30-30-40', label: '30/30/40', desc: 'Agresif Saving', needs: 30, wants: 30, savings: 40, color: 'var(--clr-emerald)' },
  { id: '70-20-10', label: '70/20/10', desc: 'Ketat', needs: 70, wants: 20, savings: 10, color: 'var(--clr-cyan)' },
  { id: 'custom', label: 'Custom', desc: 'Atur Sendiri', needs: null, wants: null, savings: null, color: 'var(--clr-amber)' },
];

function BudgetItemRow({ item, onEdit, onDelete }) {
  const usagePct = item.allocatedAmount > 0 ? Math.min(100, (item.usedAmount / item.allocatedAmount) * 100) : 0;
  const isOver = usagePct >= 100;
  const isWarning = usagePct >= 80 && !isOver;

  const barColor = isOver ? 'var(--grad-rose)' : isWarning ? 'var(--grad-gold)' : `linear-gradient(90deg, ${item.color || '#7C3AED'}, ${item.color || '#7C3AED'}88)`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass"
      style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: item.color || '#7C3AED',
            boxShadow: `0 0 8px ${item.color || '#7C3AED'}80`,
            flexShrink: 0,
          }}
        />
        <p style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--clr-text)' }}>{item.itemName}</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {item.sourceAccount && (
            <span style={{ fontSize: 10, color: 'var(--clr-text-3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span>{item.sourceAccount.icon || '💳'} {item.sourceAccount.providerName}</span>
              <span style={{ opacity: 0.6 }}>→</span>
            </span>
          )}
          {item.account && (
            <span className="badge badge-cyan" style={{ fontSize: 10 }}>
              {item.account.icon || '💳'} {item.account.providerName}
            </span>
          )}
        </div>

        {isOver && <span className="badge badge-rose" style={{ fontSize: 9 }}>OVER</span>}
        {isWarning && <span className="badge badge-amber" style={{ fontSize: 9 }}>80%</span>}
        
        <button
          onClick={() => onEdit(item)}
          style={{ padding: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', transition: 'color 0.2s', borderRadius: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-violet)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
        >
          <Edit3 size={13} />
        </button>

        <button
          onClick={() => onDelete(item.id)}
          style={{ padding: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', transition: 'color 0.2s', borderRadius: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-rose)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 6 }}>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${usagePct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ background: barColor }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
          Spent: <span style={{ color: isOver ? 'var(--clr-rose)' : 'var(--clr-text-2)', fontWeight: 600 }}>{formatRp(item.usedAmount)}</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
          Budget: <span style={{ color: 'var(--clr-text-2)', fontWeight: 600 }}>{formatRp(item.allocatedAmount)}</span>
        </span>
        <span style={{ fontSize: 11, color: isOver ? 'var(--clr-rose)' : 'var(--clr-emerald)', fontWeight: 600 }}>
          {isOver ? `Over ${formatRp(item.usedAmount - item.allocatedAmount)}` : `${Math.round(usagePct)}% used`}
        </span>
      </div>
    </motion.div>
  );
}

function CategorySection({ category, items, totalIncome, onAddItem, onEditItem, onDeleteItem, allocationRule }) {
  const [expanded, setExpanded] = useState(true);
  const config = CATEGORY_CONFIG[category.categoryName] || {};
  const totalAllocated = items.reduce((s, i) => s + i.allocatedAmount, 0);
  const totalUsed = items.reduce((s, i) => s + i.usedAmount, 0);
  const suggestedPct = allocationRule[category.categoryName.toLowerCase()] ?? (category.categoryName === 'Needs' ? 50 : category.categoryName === 'Wants' ? 30 : 20);
  const suggestedAmount = totalIncome * (suggestedPct / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{
        borderRadius: 20,
        border: `1px solid ${config.color || 'var(--clr-border)'}25`,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* Category Header */}
      <div
        style={{
          padding: '16px 20px',
          background: `${config.glow || 'transparent'}`,
          borderBottom: expanded ? `1px solid ${config.color || 'var(--clr-border)'}15` : 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ fontSize: 22 }}>{config.emoji || '📁'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--clr-text)' }}>{category.categoryName}</h3>
            <span className={`badge ${config.badge || 'badge-purple'}`} style={{ fontSize: 10 }}>
              {suggestedPct}% recommended
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
              Allocated: <span style={{ color: config.color, fontWeight: 600 }}>{formatRp(totalAllocated)}</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
              Suggested: <span style={{ color: 'var(--clr-text-2)' }}>{formatRp(suggestedAmount)}</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAddItem(category); }}
            className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: 12, gap: 4 }}
          >
            <Plus size={13} /> Add Item
          </button>
          {expanded ? <ChevronDown size={16} style={{ color: 'var(--clr-text-3)' }} /> : <ChevronRight size={16} style={{ color: 'var(--clr-text-3)' }} />}
        </div>
      </div>

      {/* Items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ padding: items.length > 0 ? '12px 16px' : '16px', overflow: 'hidden' }}
          >
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>No budget items yet</p>
                <button onClick={() => onAddItem(category)} style={{ marginTop: 8, fontSize: 12, color: config.color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  + Add your first item
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {items.map((item) => (
                  <BudgetItemRow key={item.id} item={item} onEdit={onEditItem} onDelete={onDeleteItem} />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BudgetManagement() {
  const { categories, budgetItems, fetchCategories, fetchBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem, getTotals } = useBudgetStore();
  const { cashflowAccounts, savingsAccounts, fetchAccounts } = useAccountStore();
  const { incomes, fetchIncomes, getTotalIncome } = useIncomeStore();

  const now = new Date();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetCategory, setTargetCategory] = useState(null);
  const [form, setForm] = useState({ itemName: '', allocatedAmount: '', sourceAccountId: '', accountId: '', color: '#7C3AED' });

  // Allocation rule state
  const [selectedPreset, setSelectedPreset] = useState('50-30-20');
  const [customRule, setCustomRule] = useState({ needs: 50, wants: 30, savings: 20 });

  const activePreset = ALLOCATION_PRESETS.find(p => p.id === selectedPreset);
  const allocationRule = selectedPreset === 'custom'
    ? customRule
    : { needs: activePreset.needs, wants: activePreset.wants, savings: activePreset.savings };
  const customTotal = customRule.needs + customRule.wants + customRule.savings;

  useEffect(() => {
    fetchCategories();
    fetchBudgetItems();
    fetchAccounts();
    fetchIncomes(now.getMonth() + 1, now.getFullYear());
  }, []);

  const totalIncome = getTotalIncome();
  const { totalAllocated, totalUsed, totalRemaining } = getTotals();

  const handleOpenAddItem = (category) => {
    setTargetCategory(category);
    const isSavings = category.categoryName === 'Savings';
    const defaultAccountId = isSavings
      ? (savingsAccounts[0]?.id || '')
      : (cashflowAccounts[0]?.id || '');
    const defaultSourceId = cashflowAccounts.find(acc => acc.currentBalance > 0)?.id || '';
    setForm({ itemName: '', allocatedAmount: '', sourceAccountId: defaultSourceId, accountId: defaultAccountId, color: '#7C3AED' });
    setShowAddItem(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setTargetCategory(item.category);
    setForm({
      itemName: item.itemName,
      allocatedAmount: formatNumberInput(String(item.allocatedAmount)),
      sourceAccountId: item.sourceAccountId || '',
      accountId: item.accountId || '',
      color: item.color || '#7C3AED'
    });
    setShowEditItem(true);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!targetCategory || !form.itemName || !form.allocatedAmount) { toast.error('Please fill all fields'); return; }

    const amount = parseNumberInput(form.allocatedAmount);
    if (form.sourceAccountId) {
      const srcAcc = cashflowAccounts.find(acc => acc.id === form.sourceAccountId);
      if (srcAcc && srcAcc.currentBalance < amount) {
        toast.error(`Saldo tidak mencukupi di ${srcAcc.accountName}. Saldo saat ini: ${formatRp(srcAcc.currentBalance)}`);
        return;
      }
    }

    try {
      await createBudgetItem({
        categoryId: targetCategory.id,
        sourceAccountId: form.sourceAccountId || null,
        accountId: form.accountId || null,
        itemName: form.itemName,
        allocatedAmount: amount,
        color: form.color,
      });
      // Refresh accounts to show updated balances
      fetchAccounts();
      toast.success(`"${form.itemName}" added to ${targetCategory.categoryName}! 📊`);
      setShowAddItem(false);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      toast.error(serverMsg || 'Failed to create budget item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem || !form.itemName || !form.allocatedAmount) { toast.error('Please fill all fields'); return; }

    const amount = parseNumberInput(form.allocatedAmount);
    const newSourceId = form.sourceAccountId;

    if (newSourceId) {
      if (editingItem.sourceAccountId === newSourceId) {
        // Same source, check difference
        const netDeduction = amount - editingItem.allocatedAmount;
        if (netDeduction > 0) {
          const srcAcc = cashflowAccounts.find(acc => acc.id === newSourceId);
          if (srcAcc && srcAcc.currentBalance < netDeduction) {
            toast.error(`Saldo tidak mencukupi di ${srcAcc.accountName}. Kekurangan: ${formatRp(netDeduction - srcAcc.currentBalance)}`);
            return;
          }
        }
      } else {
        // Different source, check full amount
        const srcAcc = cashflowAccounts.find(acc => acc.id === newSourceId);
        if (srcAcc && srcAcc.currentBalance < amount) {
          toast.error(`Saldo tidak mencukupi di ${srcAcc.accountName}. Saldo saat ini: ${formatRp(srcAcc.currentBalance)}`);
          return;
        }
      }
    }

    try {
      await updateBudgetItem(editingItem.id, {
        itemName: form.itemName,
        allocatedAmount: amount,
        sourceAccountId: form.sourceAccountId || null,
        accountId: form.accountId || null,
        color: form.color,
      });
      // Refresh accounts to show updated balances
      fetchAccounts();
      toast.success(`"${form.itemName}" updated successfully! 📊`);
      setShowEditItem(false);
      setEditingItem(null);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      toast.error(serverMsg || 'Failed to update budget item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this budget item?')) return;
    try {
      await deleteBudgetItem(itemId);
      fetchAccounts(); // refresh balances after reversal
      toast.success('Budget item removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const allocationPercent = totalIncome > 0 ? Math.min(100, (totalAllocated / totalIncome) * 100) : 0;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <PieChart size={20} style={{ color: 'var(--clr-purple-mid)' }} />
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>Budget</h1>
        </div>
        <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>Allocate your income across Needs, Wants & Savings</p>
      </motion.div>

      {/* ── Category Summary Cards (Needs / Wants / Savings) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'Needs',   pct: allocationRule.needs,   cfg: CATEGORY_CONFIG.Needs },
          { key: 'Wants',   pct: allocationRule.wants,   cfg: CATEGORY_CONFIG.Wants },
          { key: 'Savings', pct: allocationRule.savings, cfg: CATEGORY_CONFIG.Savings },
        ].map(({ key, pct, cfg }, i) => {
          const catItems = budgetItems.filter(it =>
            categories.find(c => c.id === it.categoryId)?.categoryName === key
          );
          const allocated = catItems.reduce((s, it) => s + it.allocatedAmount, 0);
          const spent     = catItems.reduce((s, it) => s + it.usedAmount, 0);
          const limit     = totalIncome > 0 ? totalIncome * ((pct ?? 0) / 100) : 0;
          const usedOfLimit = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass"
              style={{
                borderRadius: 16, padding: '14px 14px',
                border: `1px solid ${cfg.color}28`,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {cfg.emoji} {key}
                  </p>
                  <p className="font-display" style={{ fontSize: 26, fontWeight: 800, color: cfg.color, lineHeight: 1.1, marginTop: 2 }}>
                    {pct ?? '—'}%
                  </p>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {cfg.emoji}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="progress-bar" style={{ height: 4 }}>
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${usedOfLimit}%` }}
                    transition={{ duration: 0.9 }}
                    style={{ background: usedOfLimit >= 100 ? 'var(--grad-rose)' : `linear-gradient(90deg, ${cfg.color}, ${cfg.color}99)` }}
                  />
                </div>
              </div>

              {/* Monthly Limit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Limit</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-text-2)' }}>{formatRp(limit)}</span>
              </div>

              {/* Allocated & Spent */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid var(--glass-border)', paddingTop: 8 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Alokasi</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{formatRp(allocated)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Terpakai</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: spent > limit && limit > 0 ? 'var(--clr-rose)' : 'var(--clr-text)' }}>{formatRp(spent)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Summary bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="glass" style={{ borderRadius: 14, padding: '12px 14px', background: 'var(--grad-brand)', border: 'none' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Teralokasi</p>
          <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{formatRp(totalAllocated)}</p>
          <div style={{ marginTop: 8 }}>
            <div className="progress-bar" style={{ height: 4, background: 'rgba(255,255,255,0.2)' }}>
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(allocationPercent, 100)}%` }}
                transition={{ duration: 1 }}
                style={{ background: '#fff' }}
              />
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {Math.round(allocationPercent)}% dari income
            </p>
          </div>
        </div>
        <div className="glass" style={{ borderRadius: 14, padding: '12px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Sisa Belum Teralokasi</p>
          <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: totalRemaining > 0 ? 'var(--clr-emerald)' : 'var(--clr-rose)' }}>{formatRp(totalRemaining)}</p>
          <p style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 600, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {totalRemaining <= 0 ? '✅ Dana Tersalurkan Semua' : '⚠️ Masih ada yang belum dialokasi'}
          </p>
        </div>
      </div>

      {/* ── Allocation Rule Picker ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass"
        style={{ padding: '16px 18px', borderRadius: 18, marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sliders size={15} style={{ color: 'var(--clr-violet)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Aturan Alokasi Dana</span>
        </div>

        {/* Preset Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: selectedPreset === 'custom' ? 14 : 0 }}>
          {ALLOCATION_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              style={{
                padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                border: `1.5px solid ${selectedPreset === preset.id ? preset.color : 'var(--glass-border)'}`,
                background: selectedPreset === preset.id ? `${preset.color}18` : 'var(--bg-elevated)',
                color: selectedPreset === preset.id ? preset.color : 'var(--clr-text-3)',
                transition: 'all 200ms ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}
            >
              <span>{preset.label}</span>
              <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{preset.desc}</span>
            </button>
          ))}
        </div>

        {/* Custom Inputs */}
        <AnimatePresence>
          {selectedPreset === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[{ key: 'needs', label: '🏠 Needs', color: 'var(--clr-cyan)' }, { key: 'wants', label: '✨ Wants', color: 'var(--clr-purple-mid)' }, { key: 'savings', label: '💰 Savings', color: 'var(--clr-emerald)' }].map(({ key, label, color }) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 5 }}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number" min="0" max="100"
                        value={customRule[key]}
                        onChange={e => setCustomRule(r => ({ ...r, [key]: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                        style={{
                          width: '100%', padding: '8px 28px 8px 10px', borderRadius: 10,
                          border: `1.5px solid ${color}40`, background: 'var(--bg-elevated)',
                          color, fontWeight: 800, fontSize: 16, fontFamily: 'inherit',
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: 'var(--clr-text-3)' }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: customTotal === 100 ? 'var(--clr-emerald)' : 'var(--clr-rose)', fontWeight: 700, marginTop: 8 }}>
                {customTotal === 100 ? '✅ Total tepat 100%' : `⚠️ Total: ${customTotal}% — harus 100%`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Allocation Progress */}
        {totalIncome > 0 && (
          <div style={{ marginTop: selectedPreset === 'custom' ? 14 : 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--clr-text-3)', fontWeight: 600 }}>Income Terisi</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: allocationPercent > 100 ? 'var(--clr-rose)' : 'var(--clr-text)' }}>
                {Math.round(allocationPercent)}% dari {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)}
              </span>
            </div>
            <div className="progress-bar" style={{ height: 7 }}>
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(allocationPercent, 100)}%` }}
                transition={{ duration: 1 }}
                style={{ background: allocationPercent > 100 ? 'var(--grad-rose)' : 'var(--grad-purple)' }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ color: 'var(--clr-text)', fontWeight: 600, marginBottom: 4 }}>Loading budget categories...</p>
        </div>
      ) : (
        categories.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            items={budgetItems.filter((i) => i.categoryId === cat.id)}
            totalIncome={totalIncome}
            onAddItem={handleOpenAddItem}
            onEditItem={handleOpenEditItem}
            onDeleteItem={handleDeleteItem}
            allocationRule={allocationRule}
          />
        ))
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItem && targetCategory && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowAddItem(false)}
          >
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--clr-text)' }}>
                    Add to {targetCategory.categoryName}
                    <span style={{ marginLeft: 6 }}>{CATEGORY_CONFIG[targetCategory.categoryName]?.emoji}</span>
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>Create a specific budget item</p>
                </div>
                <button onClick={() => setShowAddItem(false)} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Item Name *
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    placeholder="e.g. Coffee, Internet, Netflix"
                    value={form.itemName}
                    onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Allocated Amount (Rp) *
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.allocatedAmount}
                    onChange={(e) => setForm((f) => ({ ...f, allocatedAmount: formatNumberInput(e.target.value) }))}
                    required
                    style={{ fontSize: 18, fontWeight: 700 }}
                  />
                  {totalIncome > 0 && form.allocatedAmount && (
                    <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 4 }}>
                      = {((parseNumberInput(form.allocatedAmount) / totalIncome) * 100).toFixed(1)}% of your monthly income
                    </p>
                  )}
                </div>

                {/* Source Account (always cashflow — where money comes FROM) */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    📤 Source Account <span style={{ color: 'var(--clr-text-3)', fontWeight: 400 }}>(uang dari mana)</span>
                  </label>
                  {cashflowAccounts.filter((acc) => acc.currentBalance > 0).length === 0 ? (
                    <div style={{ padding: '10px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 10, border: '1px solid rgba(244,63,94,0.2)', fontSize: 12, color: 'var(--clr-rose)' }}>
                      ⚠️ Tidak ada akun yang memiliki saldo. Harap isi saldo atau buat income terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      className="input-dark"
                      value={form.sourceAccountId}
                      onChange={(e) => setForm((f) => ({ ...f, sourceAccountId: e.target.value }))}
                      required
                    >
                      <option value="">— Pilih sumber dana —</option>
                      {cashflowAccounts
                        .filter((acc) => acc.currentBalance > 0)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.icon || '💳'} {acc.accountName} (Saldo: {formatRp(acc.currentBalance)})
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Visual arrow indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-text-3)', fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                  <span>↓ dialokasikan ke</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>

                {/* Destination Account */}
                <div>
                  {(() => {
                    const isSavings = targetCategory?.categoryName === 'Savings';
                    const accountList = isSavings ? savingsAccounts : cashflowAccounts;
                    const labelText = isSavings ? '📥 Destination — Tabungan Tujuan' : '📥 Destination Account';
                    const emptyIcon = isSavings ? '💰' : '💳';
                    const anyLabel = isSavings ? '— Pilih tabungan tujuan —' : '— Pilih akun tujuan —';
                    return (
                      <>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                          {labelText}
                        </label>
                        {accountList.length === 0 ? (
                          <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: 'var(--clr-amber)' }}>
                            ⚠️ {isSavings ? 'Belum ada savings account.' : 'Belum ada cashflow account.'}
                          </div>
                        ) : (
                          <select
                            className="input-dark"
                            value={form.accountId}
                            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                          >
                            <option value="">{anyLabel}</option>
                            {accountList.map((acc) => (
                              <option key={acc.id} value={acc.id}>{acc.icon || emptyIcon} {acc.accountName}</option>
                            ))}
                          </select>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--clr-text-3)', marginTop: 5, lineHeight: 1.4 }}>
                          💡 {isSavings
                            ? 'Dana langsung masuk ke rekening tabungan ini saat budget dibuat.'
                            : 'Dana dialokasikan ke akun ini. Expense akan memotong saldo akun ini.'}
                        </p>
                      </>
                    );
                  })()}
                </div>


                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Color Tag
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c,
                          border: form.color === c ? '3px solid white' : '2px solid transparent',
                          cursor: 'pointer', boxShadow: form.color === c ? `0 0 10px ${c}` : 'none', outline: 'none',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowAddItem(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                    <Plus size={16} /> Create Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {showEditItem && targetCategory && editingItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowEditItem(false)}
          >
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--clr-text)' }}>
                    Edit Budget Item
                    <span style={{ marginLeft: 6 }}>{CATEGORY_CONFIG[targetCategory.categoryName]?.emoji}</span>
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>Modify your budget item settings</p>
                </div>
                <button onClick={() => setShowEditItem(false)} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Item Name *
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    placeholder="e.g. Coffee, Internet, Netflix"
                    value={form.itemName}
                    onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Allocated Amount (Rp) *
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.allocatedAmount}
                    onChange={(e) => setForm((f) => ({ ...f, allocatedAmount: formatNumberInput(e.target.value) }))}
                    required
                    style={{ fontSize: 18, fontWeight: 700 }}
                  />
                  {totalIncome > 0 && form.allocatedAmount && (
                    <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 4 }}>
                      = {((parseNumberInput(form.allocatedAmount) / totalIncome) * 100).toFixed(1)}% of your monthly income
                    </p>
                  )}
                </div>

                {/* Source Account (always cashflow — where money comes FROM) */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    📤 Source Account <span style={{ color: 'var(--clr-text-3)', fontWeight: 400 }}>(uang dari mana)</span>
                  </label>
                  {cashflowAccounts.filter((acc) => acc.currentBalance > 0 || acc.id === form.sourceAccountId).length === 0 ? (
                    <div style={{ padding: '10px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 10, border: '1px solid rgba(244,63,94,0.2)', fontSize: 12, color: 'var(--clr-rose)' }}>
                      ⚠️ Tidak ada akun yang memiliki saldo. Harap isi saldo atau buat income terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      className="input-dark"
                      value={form.sourceAccountId}
                      onChange={(e) => setForm((f) => ({ ...f, sourceAccountId: e.target.value }))}
                      required
                    >
                      <option value="">— Pilih sumber dana —</option>
                      {cashflowAccounts
                        .filter((acc) => acc.currentBalance > 0 || acc.id === form.sourceAccountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.icon || '💳'} {acc.accountName} (Saldo: {formatRp(acc.currentBalance)})
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Visual arrow indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-text-3)', fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                  <span>↓ dialokasikan ke</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>

                {/* Destination Account */}
                <div>
                  {(() => {
                    const isSavings = targetCategory?.categoryName === 'Savings';
                    const accountList = isSavings ? savingsAccounts : cashflowAccounts;
                    const labelText = isSavings ? '📥 Destination — Tabungan Tujuan' : '📥 Destination Account';
                    const emptyIcon = isSavings ? '💰' : '💳';
                    const anyLabel = isSavings ? '— Pilih tabungan tujuan —' : '— Pilih akun tujuan —';
                    return (
                      <>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                          {labelText}
                        </label>
                        {accountList.length === 0 ? (
                          <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: 'var(--clr-amber)' }}>
                            ⚠️ {isSavings ? 'Belum ada savings account.' : 'Belum ada cashflow account.'}
                          </div>
                        ) : (
                          <select
                            className="input-dark"
                            value={form.accountId}
                            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                          >
                            <option value="">{anyLabel}</option>
                            {accountList.map((acc) => (
                              <option key={acc.id} value={acc.id}>{acc.icon || emptyIcon} {acc.accountName}</option>
                            ))}
                          </select>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--clr-text-3)', marginTop: 5, lineHeight: 1.4 }}>
                          💡 {isSavings
                            ? 'Dana langsung masuk ke rekening tabungan ini saat budget dibuat.'
                            : 'Dana dialokasikan ke akun ini. Expense akan memotong saldo akun ini.'}
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Color Tag
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c,
                          border: form.color === c ? '3px solid white' : '2px solid transparent',
                          cursor: 'pointer', boxShadow: form.color === c ? `0 0 10px ${c}` : 'none', outline: 'none',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowEditItem(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                    <Plus size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
