import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, CreditCard, PiggyBank, Wallet, TrendingUp, BarChart2,
  RefreshCw, X, AlertCircle, Check, Pencil, Trash2, ArrowUpRight,
  ArrowDownLeft, ArrowLeftRight, Receipt, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useAccountStore } from '../store/useAccountStore';
import AccountCard from '../components/AccountCard';
import ProviderSelector, { PROVIDERS } from '../components/ProviderSelector';
import { formatNumberInput, parseNumberInput } from '../utils/formatCurrency';
import IncomeManagement from './IncomeManagement';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const ACCOUNT_TYPE_OPTIONS = [
  {
    value: 'CASHFLOW',
    label: 'Cashflow Account',
    description: 'Daily spending, transactions, income flow',
    icon: '💳',
    color: 'var(--clr-cyan)',
    glow: 'var(--clr-cyan-glow)',
  },
  {
    value: 'SAVINGS',
    label: 'Savings Account',
    description: 'Emergency fund, long-term goals, passive storage',
    icon: '💰',
    color: 'var(--clr-emerald)',
    glow: 'var(--clr-emerald-glow)',
  },
];

function CreateAccountModal({ onClose, onSuccess }) {
  const { createAccount } = useAccountStore();
  const [form, setForm] = useState({
    accountName: '',
    accountType: 'CASHFLOW',
    providerName: '',
    providerCategory: 'BANK',
    currentBalance: '',
    color: '#7C3AED',
    icon: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleProviderChange = (name, category, color, emoji) => {
    setForm((f) => ({
      ...f,
      providerName: name,
      providerCategory: category,
      color: color || f.color,
      icon: emoji || f.icon,
      accountName: f.accountName || name,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.providerName) { toast.error('Please select a provider'); return; }
    setIsLoading(true);
    try {
      await createAccount({ ...form, currentBalance: parseNumberInput(form.currentBalance) });
      toast.success(`Account "${form.accountName || form.providerName}" created! 🎉`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-card"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)' }}>Add Account</h2>
            <p style={{ fontSize: 13, color: 'var(--clr-text-3)', marginTop: 2 }}>Link a bank, e-wallet, or cash source</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '8px', borderRadius: 10 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Account Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Account Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, accountType: opt.value }))}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    border: form.accountType === opt.value
                      ? `2px solid ${opt.color}`
                      : '1px solid var(--clr-border)',
                    background: form.accountType === opt.value
                      ? `${opt.glow}`
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-3)', lineHeight: 1.4 }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Bank / E-Wallet
            </label>
            <ProviderSelector
              value={form.providerName}
              onChange={handleProviderChange}
            />
          </div>

          {/* Account Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Account Name
            </label>
            <input
              className="input-dark"
              type="text"
              placeholder="e.g. BCA Utama, OVO Harian"
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
            />
          </div>

          {/* Starting Balance */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Current Balance (Rp)
            </label>
            <input
              className="input-dark"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.currentBalance}
              onChange={(e) => {
                const formatted = formatNumberInput(e.target.value);
                setForm((f) => ({ ...f, currentBalance: formatted }));
              }}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Card Color
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['#7C3AED', '#06B6D4', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer',
                    boxShadow: form.color === c ? `0 0 12px ${c}` : 'none',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {isLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw size={16} />
              </motion.div>
            ) : (
              <Check size={16} />
            )}
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Account Modal ───────────────────────────────────────────────────────
function EditAccountModal({ account, onClose, onSuccess }) {
  const { updateAccount } = useAccountStore();
  const [form, setForm] = useState({
    accountName: account.accountName || '',
    currentBalance: formatNumberInput(String(account.currentBalance || 0)),
    color: account.color || '#7C3AED',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateAccount(account.id, {
        accountName: form.accountName,
        currentBalance: parseNumberInput(form.currentBalance),
        color: form.color,
      });
      toast.success(`"${form.accountName}" berhasil diperbarui! ✅`);
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Gagal memperbarui akun');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-card"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)' }}>Edit Akun</h2>
            <p style={{ fontSize: 13, color: 'var(--clr-text-3)', marginTop: 2 }}>
              {account.icon} {account.providerName}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '8px', borderRadius: 10 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Account Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Nama Akun
            </label>
            <input
              className="input-dark"
              type="text"
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Balance */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Saldo Sekarang (Rp)
            </label>
            <input
              className="input-dark"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.currentBalance}
              onChange={(e) => setForm((f) => ({ ...f, currentBalance: formatNumberInput(e.target.value) }))}
              style={{ fontSize: 18, fontWeight: 700 }}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Warna Kartu
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['#7C3AED','#06B6D4','#10B981','#F43F5E','#F59E0B','#3B82F6','#EC4899','#8B5CF6'].map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c,
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer', boxShadow: form.color === c ? `0 0 12px ${c}` : 'none',
                    transition: 'all 0.2s', outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={isLoading}>
              <Check size={14} />
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, glow, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      className="stat-card"
      style={{ border: `1px solid ${glow.replace('rgba', 'rgba').replace('0.2', '0.15')}` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40, height: 40,
            borderRadius: 12,
            background: glow,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, color: 'var(--clr-text-3)', fontWeight: 500 }}>{label}</span>
      </div>
      <p className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>
        {value}
      </p>
    </motion.div>
  );
}

function AccountDetailsModal({ account, onClose }) {
  const { selectedAccountHistory, isLoadingHistory, fetchAccountHistory } = useAccountStore();

  useEffect(() => {
    if (account?.id) {
      fetchAccountHistory(account.id);
    }
  }, [account, fetchAccountHistory]);

  const typeConfig = {
    INCOME: {
      label: 'Uang Masuk (Income)',
      color: 'var(--clr-emerald)',
      bg: 'rgba(16,185,129,0.12)',
      icon: <ArrowDownLeft size={16} />,
      sign: '+'
    },
    EXPENSE: {
      label: 'Pengeluaran (Expense)',
      color: 'var(--clr-rose)',
      bg: 'rgba(244,63,94,0.12)',
      icon: <Receipt size={16} />,
      sign: '-'
    },
    ALLOCATION_OUT: {
      label: 'Alokasi Keluar (Budget)',
      color: 'var(--clr-amber)',
      bg: 'rgba(245,158,11,0.12)',
      icon: <ArrowUpRight size={16} />,
      sign: '-'
    },
    ALLOCATION_IN: {
      label: 'Terima Alokasi (Budget)',
      color: 'var(--clr-cyan)',
      bg: 'rgba(6,182,212,0.12)',
      icon: <ArrowDownLeft size={16} />,
      sign: '+'
    },
    SAVINGS_ALLOCATION_INTERNAL: {
      label: 'Dialokasikan ke Goal',
      color: 'var(--clr-emerald)',
      bg: 'rgba(16,185,129,0.12)',
      icon: <Target size={16} />,
      sign: ''
    },
    SAVINGS_TRANSFER_OUT: {
      label: 'Transfer Keluar (Savings)',
      color: 'var(--clr-amber)',
      bg: 'rgba(245,158,11,0.12)',
      icon: <ArrowUpRight size={16} />,
      sign: '-'
    },
    SAVINGS_TRANSFER_IN: {
      label: 'Terima Transfer (Savings)',
      color: 'var(--clr-cyan)',
      bg: 'rgba(6,182,212,0.12)',
      icon: <ArrowDownLeft size={16} />,
      sign: '+'
    }
  };

  const totalTransactions = selectedAccountHistory?.length || 0;
  const totalExpenses = (selectedAccountHistory || [])
    .filter(tx => tx.type === 'EXPENSE' || tx.type === 'ALLOCATION_OUT')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-card"
        style={{ maxWidth: 520, width: '95%', padding: '24px 20px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${account.color || '#7C3AED'}20`,
              border: `1px solid ${account.color || '#7C3AED'}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
            }}>
              {account.icon || '💳'}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--clr-text)' }}>{account.accountName}</h2>
              <p style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>{account.providerName} · {account.accountType}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}>
            <X size={18} />
          </button>
        </div>

        {/* Balance Display */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 16, textAlign: 'center', flexShrink: 0
        }}>
          <p style={{ fontSize: 11, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Saldo Saat Ini</p>
          <h3 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: account.accountType === 'SAVINGS' ? 'var(--clr-emerald)' : 'var(--clr-text)' }}>
            {formatRp(account.currentBalance)}
          </h3>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, flexShrink: 0 }}>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Pengeluaran</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-rose)' }}>{formatRp(totalExpenses)}</p>
          </div>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Transaksi</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)' }}>{totalTransactions}x</p>
          </div>
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
          Riwayat Transaksi
        </p>

        {/* Transaction list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
          {isLoadingHistory ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="shimmer" style={{ height: 60, borderRadius: 12 }} />
            ))
          ) : selectedAccountHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--clr-text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🍃</div>
              <p style={{ fontSize: 13 }}>Belum ada riwayat transaksi untuk akun ini.</p>
            </div>
          ) : (
            selectedAccountHistory.map((tx) => {
              const cfg = typeConfig[tx.type] || { label: 'Transaksi', color: 'var(--clr-text)', bg: 'rgba(255,255,255,0.1)', icon: <ArrowLeftRight size={16} />, sign: '' };
              return (
                <div key={tx.id} className="glass" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: cfg.bg, color: cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4, lineHeight: 1.3 }}>
                      {tx.title}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                      {tx.details && (
                        <span style={{ fontSize: 11, color: 'var(--clr-text-3)', lineHeight: 1.4 }}>{tx.details}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>
                      {cfg.sign}{formatRp(tx.amount)}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Accounts() {
  const {
    accounts, cashflowAccounts, savingsAccounts,
    totalCashflow, totalSavings, totalBalance,
    fetchAccounts, deleteAccount, isLoading
  } = useAccountStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'income'

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDelete = async (account) => {
    if (!confirm(`Remove "${account.accountName}"? This will deactivate it.`)) return;
    try {
      await deleteAccount(account.id);
      toast.success('Account removed');
    } catch {
      toast.error('Failed to remove account');
    }
  };

  const mostUsedAccount = accounts.reduce(
    (max, a) => ((a.transactionCount || 0) > (max.transactionCount || 0) ? a : max),
    accounts[0] || null
  );

  const mostSpentAccount = accounts.reduce(
    (max, a) => ((a.monthlyExpenses || 0) > (max.monthlyExpenses || 0) ? a : max),
    accounts[0] || null
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <CreditCard size={20} style={{ color: 'var(--clr-purple-mid)' }} />
              <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>
                Accounts
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--clr-text-3)' }}>
              Manage all your financial sources — banks, e-wallets & cash
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchAccounts} className="btn-ghost" style={{ padding: '10px' }}>
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} />
              Add Account
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Toggle — mobile only */}
      <div className="md:hidden flex" style={{ gap: 6, marginBottom: 24, background: 'var(--bg-elevated)', borderRadius: 14, padding: 5, border: '1px solid var(--glass-border)' }}>
        {[
          { key: 'accounts', label: '💳 Akun', icon: CreditCard },
          { key: 'income',   label: '💵 Income', icon: ArrowUpRight },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.key ? 'var(--grad-brand)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--clr-text-3)',
              boxShadow: activeTab === tab.key ? '0 4px 14px var(--violet-glow)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ACCOUNTS TAB ─────────────────────────────── */}
      {activeTab === 'accounts' && (
        <>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard
          icon={<Wallet size={18} />}
          label="Total Balance"
          value={formatRp(totalBalance)}
          color="var(--clr-purple-mid)"
          glow="rgba(124,58,237,0.15)"
          delay={0}
        />
        <StatCard
          icon={<CreditCard size={18} />}
          label="Total Cashflow"
          value={formatRp(totalCashflow)}
          color="var(--clr-cyan)"
          glow="var(--clr-cyan-glow)"
          delay={0.05}
        />
        <StatCard
          icon={<PiggyBank size={18} />}
          label="Total Savings"
          value={formatRp(totalSavings)}
          color="var(--clr-emerald)"
          glow="var(--clr-emerald-glow)"
          delay={0.1}
        />
        <StatCard
          icon={<BarChart2 size={18} />}
          label="Active Accounts"
          value={`${accounts.length} accounts`}
          color="var(--clr-amber)"
          glow="var(--clr-amber-glow)"
          delay={0.15}
        />
      </div>

      {/* Loading shimmer */}
      {isLoading && accounts.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{ height: 200 }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            padding: 60,
            textAlign: 'center',
            border: '2px dashed var(--clr-border)',
            borderRadius: 24,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 8 }}>
            No accounts yet
          </h3>
          <p style={{ color: 'var(--clr-text-3)', marginBottom: 20, fontSize: 14 }}>
            Add your bank accounts, e-wallets, and cash sources to get started
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} />
            Add Your First Account
          </button>
        </motion.div>
      )}

      {/* Cashflow Accounts */}
      {cashflowAccounts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="badge badge-cyan">💳 Cashflow Accounts</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--clr-cyan)', fontWeight: 600 }}>
              {formatRp(totalCashflow)}
            </span>
          </div>

          {/* Mobile: list rows / Desktop: card grid */}
          <div className="accounts-list-mobile">
            {cashflowAccounts.map((account, i) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, marginBottom: 8, cursor: 'pointer' }}
                onClick={() => setDetailsTarget(account)}
              >
                <div
                  style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: `${account.color || '#7C3AED'}20`,
                    border: `1px solid ${account.color || '#7C3AED'}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {account.icon || '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text)', marginBottom: 2 }}>
                    {account.providerName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
                    {account.accountName} {account.accountNumber ? `· ···· ${account.accountNumber.slice(-4)}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text)' }}>
                    {formatRp(account.currentBalance)}
                  </p>
                  {account.monthlyExpenses > 0 && (
                    <p style={{ fontSize: 10, color: 'var(--clr-rose)', marginTop: 2 }}>
                      -{formatRp(account.monthlyExpenses)} spent
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditTarget(account); }}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
                    title="Edit account"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(account); }}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-rose)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
                    title="Delete account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Accounts */}
      {savingsAccounts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="badge badge-emerald">💰 Savings Accounts</div>
            <span style={{ fontSize: 12, color: 'var(--clr-emerald)', fontWeight: 600 }}>
              {formatRp(totalSavings)}
            </span>
          </div>

          <div className="accounts-list-mobile">
            {savingsAccounts.map((account, i) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, marginBottom: 8, cursor: 'pointer' }}
                onClick={() => setDetailsTarget(account)}
              >
                <div
                  style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {account.icon || '💰'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text)', marginBottom: 2 }}>
                    {account.providerName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>
                    {account.accountName} {account.accountNumber ? `· ···· ${account.accountNumber.slice(-4)}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-emerald)' }}>
                    {formatRp(account.currentBalance)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditTarget(account); }}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-emerald)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
                    title="Edit account"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(account); }}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-rose)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
                    title="Delete account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Total Balance Footer */}
      {accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass"
          style={{ borderRadius: 16, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <div>
            <p style={{ fontSize: 11, color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Balance</p>
            <p style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>{accounts.length} Accounts</p>
          </div>
          <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--clr-text)' }}>{formatRp(totalBalance)}</p>
        </motion.div>
      )}

      {/* Analytics section */}
      {accounts.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={14} style={{ color: 'var(--clr-purple-mid)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)' }}>Account Insights</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {mostUsedAccount && (
              <div className="glass" style={{ padding: 18 }}>
                <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Most Used Account
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{mostUsedAccount.icon || '💳'}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--clr-text)', fontSize: 14 }}>{mostUsedAccount.accountName}</p>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: 12 }}>{mostUsedAccount.transactionCount || 0} transactions this month</p>
                  </div>
                </div>
              </div>
            )}

            {mostSpentAccount && (
              <div className="glass" style={{ padding: 18 }}>
                <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Highest Spending Account
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{mostSpentAccount.icon || '💳'}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--clr-text)', fontSize: 14 }}>{mostSpentAccount.accountName}</p>
                    <p style={{ color: 'var(--clr-rose)', fontSize: 12 }}>{formatRp(mostSpentAccount.monthlyExpenses || 0)} spent this month</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Distribution */}
            <div className="glass" style={{ padding: 18 }}>
              <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Spending Distribution
              </p>
              {cashflowAccounts.slice(0, 4).map((acc) => {
                const totalSpent = cashflowAccounts.reduce((s, a) => s + (a.monthlyExpenses || 0), 0);
                const pct = totalSpent > 0 ? Math.round(((acc.monthlyExpenses || 0) / totalSpent) * 100) : 0;
                return (
                  <div key={acc.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--clr-text-2)' }}>
                        {acc.icon} {acc.providerName}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ background: acc.color || 'var(--grad-purple)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
        </>
      )}

      {/* ── INCOME TAB ── mobile only ────────────────────────── */}
      {activeTab === 'income' && (
        <IncomeManagement />
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateAccountModal
            onClose={() => setShowCreate(false)}
            onSuccess={fetchAccounts}
          />
        )}
        {editTarget && (
          <EditAccountModal
            account={editTarget}
            onClose={() => setEditTarget(null)}
            onSuccess={fetchAccounts}
          />
        )}
        {detailsTarget && (
          <AccountDetailsModal
            account={detailsTarget}
            onClose={() => setDetailsTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
