import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, ArrowUpRight, X, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useIncomeStore } from '../store/useIncomeStore';
import { useAccountStore } from '../store/useAccountStore';
import RupiahInput from '../components/RupiahInput';
import { parseNumberInput } from '../utils/formatCurrency';


const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const INCOME_TYPES = ['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'BONUS', 'OTHER'];

const TYPE_LABELS = {
  SALARY: 'Gaji', FREELANCE: 'Freelance', BUSINESS: 'Bisnis',
  INVESTMENT: 'Investasi', BONUS: 'Bonus', OTHER: 'Lainnya'
};

export default function IncomeManagement() {
  const { incomes, fetchIncomes, createIncome, deleteIncome, isLoading } = useIncomeStore();
  const { accounts, cashflowAccounts, fetchAccounts } = useAccountStore();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    accountId: '',
    amount: '',
    incomeType: 'SALARY',
    description: '',
    transactionDate: now.toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchIncomes(selectedMonth, selectedYear);
  }, [fetchIncomes, selectedMonth, selectedYear]);

  // Pre-select first cashflow account
  useEffect(() => {
    if (cashflowAccounts.length > 0 && !form.accountId) {
      setForm((f) => ({ ...f, accountId: cashflowAccounts[0].id }));
    }
  }, [cashflowAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountId || !form.amount) { toast.error('Please fill all required fields'); return; }
    
    const parsedAmount = parseNumberInput(form.amount);
    
    setIsSubmitting(true);
    try {
      await createIncome({ ...form, amount: parsedAmount });
      await fetchAccounts(true); // force-refresh balances
      toast.success('Income added successfully! 💸');
      setForm({ accountId: cashflowAccounts[0]?.id || '', amount: '', incomeType: 'SALARY', description: '', transactionDate: now.toISOString().split('T')[0] });
      setShowForm(false);
    } catch (err) {
      toast.error('Failed to add income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (inc) => {
    if (!confirm(`Delete "${inc.description || inc.incomeType}" income of ${formatRp(inc.amount)}?`)) return;
    try {
      await deleteIncome(inc.id);
      await fetchAccounts(true); // force-refresh balances
      toast.success('Income removed');
    } catch {
      toast.error('Failed to delete income');
    }
  };

  const filtered = incomes.filter((i) => {
    const desc = (i.description || i.incomeType || '').toLowerCase();
    return desc.includes(search.toLowerCase());
  });

  const totalIncome = filtered.reduce((s, i) => s + i.amount, 0);

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
            <Wallet size={20} style={{ color: 'var(--clr-emerald)' }} />
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>Income</h1>
          </div>
          <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>Track your revenue streams & account inflows</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Add Income
        </button>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 20,
          padding: '22px 24px',
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 11, color: 'rgba(16,185,129,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>
          Total Income — {new Date(selectedYear, selectedMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
        <p className="font-display" style={{ fontSize: 32, fontWeight: 800, color: 'var(--clr-text)' }}>
          {formatRp(totalIncome)}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="badge badge-emerald">{filtered.length} transactions</span>
          {cashflowAccounts.length > 0 && (
            <span className="badge badge-cyan">via {cashflowAccounts.length} accounts</span>
          )}
        </div>
      </motion.div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
          <input
            className="input-dark"
            type="text"
            placeholder="Search income..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          className="input-dark"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          style={{ maxWidth: 130 }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          className="input-dark"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ maxWidth: 100 }}
        >
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Income List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <p style={{ color: 'var(--clr-text)', fontWeight: 600, marginBottom: 4 }}>No income found</p>
            <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>Add your first income to start tracking</p>
          </div>
        ) : (
          filtered.map((inc, i) => (
            <motion.div
              key={inc.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderRadius: 16 }}
            >
              <div
                style={{
                  width: 44, height: 44,
                  borderRadius: 14,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}
              >
                {inc.account?.icon || '💰'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.description || TYPE_LABELS[inc.incomeType] || 'Income'}
                  </p>
                  <span className="badge badge-emerald" style={{ fontSize: 10 }}>
                    {TYPE_LABELS[inc.incomeType] || inc.incomeType}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
                    {new Date(inc.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {inc.account && (
                    <>
                      <span style={{ color: 'var(--clr-border)', fontSize: 10 }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--clr-cyan)' }}>
                        → {inc.account.providerName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--clr-emerald)' }}>
                  +{formatRp(inc.amount)}
                </p>
                <button
                  onClick={() => handleDelete(inc)}
                  style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-rose)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Income Modal */}
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
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)' }}>Add Income</h2>
                  <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>Record a new inflow to your account</p>
                </div>
                <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Account */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Destination Account *
                  </label>
                  {cashflowAccounts.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p style={{ fontSize: 13, color: 'var(--clr-amber)' }}>⚠️ No cashflow accounts found. Please add an account first.</p>
                    </div>
                  ) : (
                    <select
                      className="input-dark"
                      value={form.accountId}
                      onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                      required
                    >
                      <option value="">Select account...</option>
                      {cashflowAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.icon || '💳'} {acc.accountName} — {acc.providerName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount — auto-formatted Rupiah */}
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Amount *</label>
                  <RupiahInput
                    value={form.amount}
                    onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                    placeholder="0"
                    required
                  />
                </div>

                {/* Income Type */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Income Type
                  </label>
                  <select
                    className="input-dark"
                    value={form.incomeType}
                    onChange={(e) => setForm((f) => ({ ...f, incomeType: e.target.value }))}
                  >
                    {INCOME_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
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
                    placeholder="e.g. Monthly salary from PT XYZ"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Date */}
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

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 2, justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : (
                      <>
                        <ArrowUpRight size={16} /> Add Income
                      </>
                    )}
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
