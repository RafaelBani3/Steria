import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Receipt, X, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useExpenseStore } from '../store/useExpenseStore';
import { useAccountStore } from '../store/useAccountStore';
import { useBudgetStore } from '../store/useBudgetStore';
import RupiahInput from '../components/RupiahInput';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const CATEGORY_COLORS = { Needs: 'var(--clr-cyan)', Wants: 'var(--clr-purple-mid)', Savings: 'var(--clr-emerald)' };

export default function ExpenseTracking() {
  const { expenses, fetchExpenses, createExpense, deleteExpense, isLoading } = useExpenseStore();
  const { cashflowAccounts, fetchAccounts } = useAccountStore();
  const { categories, budgetItems, fetchCategories, fetchBudgetItems } = useBudgetStore();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    accountId: '',
    budgetItemId: '',
    categoryId: '',
    amount: '',
    description: '',
    transactionDate: now.toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  useEffect(() => {
    fetchExpenses(selectedMonth, selectedYear);
    fetchBudgetItems();
  }, [fetchExpenses, fetchBudgetItems, selectedMonth, selectedYear]);

  useEffect(() => {
    if (cashflowAccounts.length > 0 && !form.accountId) {
      setForm((f) => ({ ...f, accountId: cashflowAccounts[0].id }));
    }
  }, [cashflowAccounts]);

  const handleBudgetItemChange = (itemId) => {
    const item = budgetItems.find((i) => i.id === itemId);
    setForm((f) => ({
      ...f,
      budgetItemId: itemId,
      categoryId: item?.categoryId || f.categoryId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountId || !form.amount) { toast.error('Please fill required fields'); return; }
    try {
      await createExpense(form);
      await fetchAccounts();
      await fetchBudgetItems();
      toast.success('Expense recorded! 💸');
      setForm({
        accountId: cashflowAccounts[0]?.id || '',
        budgetItemId: '', categoryId: '', amount: '',
        description: '', transactionDate: now.toISOString().split('T')[0], notes: '',
      });
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to record expense');
    }
  };

  const handleDelete = async (exp) => {
    if (!confirm(`Delete "${exp.description || 'this expense'}" of ${formatRp(exp.amount)}?`)) return;
    try {
      await deleteExpense(exp.id);
      await fetchAccounts();
      await fetchBudgetItems();
      toast.success('Expense removed');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const filtered = expenses.filter((e) => {
    const desc = (e.description || '').toLowerCase();
    const catName = (e.category?.categoryName || '').toLowerCase();
    return desc.includes(search.toLowerCase()) || catName.includes(search.toLowerCase());
  });

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  // Group by category for summary
  const byCategory = categories.map((cat) => ({
    ...cat,
    total: filtered.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0),
  }));

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Receipt size={20} style={{ color: 'var(--clr-rose)' }} />
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>Expenses</h1>
          </div>
          <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>Track your spending across all accounts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Add Expense
        </button>
      </motion.div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            background: 'linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(244,63,94,0.06) 100%)',
            border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 18, padding: '18px 20px',
          }}
        >
          <p style={{ fontSize: 11, color: 'rgba(244,63,94,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>
            Total Spent
          </p>
          <p className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--clr-text)' }}>
            {formatRp(totalExpenses)}
          </p>
          <span className="badge badge-rose" style={{ marginTop: 8, display: 'inline-flex', fontSize: 10 }}>
            {filtered.length} transactions
          </span>
        </motion.div>

        {byCategory.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="glass"
            style={{ borderRadius: 18, padding: '18px 20px' }}
          >
            <p style={{ fontSize: 11, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>
              {cat.categoryName}
            </p>
            <p className="font-display" style={{ fontSize: 18, fontWeight: 700, color: CATEGORY_COLORS[cat.categoryName] || 'var(--clr-text)' }}>
              {formatRp(cat.total)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
          <input
            className="input-dark"
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select className="input-dark" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ maxWidth: 130 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}</option>
          ))}
        </select>
        <select className="input-dark" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ maxWidth: 100 }}>
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Expense List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
            <p style={{ color: 'var(--clr-text)', fontWeight: 600, marginBottom: 4 }}>No expenses found</p>
            <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>Record your first expense to start tracking</p>
          </div>
        ) : (
          filtered.map((exp, i) => {
            const catColor = CATEGORY_COLORS[exp.category?.categoryName] || 'var(--clr-text-3)';
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass"
                style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderRadius: 16 }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: `${catColor}15`,
                    border: `1px solid ${catColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {exp.account?.icon || '💸'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || exp.budgetItem?.itemName || 'Expense'}
                    </p>
                    {exp.category && (
                      <span
                        style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                          background: `${catColor}15`, color: catColor,
                          border: `1px solid ${catColor}30`, flexShrink: 0,
                        }}
                      >
                        {exp.category.categoryName}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
                      {new Date(exp.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {exp.account && (
                      <>
                        <span style={{ color: 'var(--clr-border)', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--clr-cyan)' }}>
                          via {exp.account.providerName}
                        </span>
                      </>
                    )}
                    {exp.budgetItem && (
                      <>
                        <span style={{ color: 'var(--clr-border)', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--clr-purple-mid)' }}>
                          📊 {exp.budgetItem.itemName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--clr-rose)' }}>
                    -{formatRp(exp.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(exp)}
                    style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-rose)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)' }}>Record Expense</h2>
                  <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>Track your spending from an account</p>
                </div>
                <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Amount — auto-format Rupiah */}
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Amount *</label>
                  <RupiahInput
                    value={form.amount}
                    onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                    placeholder="0"
                    required
                  />
                </div>

                {/* Payment Account */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Payment Source *
                  </label>
                  <select
                    className="input-dark"
                    value={form.accountId}
                    onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                    required
                  >
                    <option value="">Select account...</option>
                    {cashflowAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.icon || '💳'} {acc.accountName} — Rp {acc.currentBalance.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget Item */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Budget Item (optional)
                  </label>
                  <select
                    className="input-dark"
                    value={form.budgetItemId}
                    onChange={(e) => handleBudgetItemChange(e.target.value)}
                  >
                    <option value="">— No budget item —</option>
                    {budgetItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.category?.categoryName}] {item.itemName} — sisa Rp {item.remainingAmount.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category (auto-filled from budget item, or manual) */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Category
                  </label>
                  <select
                    className="input-dark"
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  >
                    <option value="">— Select category —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Description
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    placeholder="e.g. Coffee with team, Monthly internet"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Date & Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                      Date
                    </label>
                    <input
                      className="input-dark"
                      type="date"
                      value={form.transactionDate}
                      onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                      Notes
                    </label>
                    <input
                      className="input-dark"
                      type="text"
                      placeholder="Optional notes"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                    <TrendingDown size={16} /> Record Expense
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
