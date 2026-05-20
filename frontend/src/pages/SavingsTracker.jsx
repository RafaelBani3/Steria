import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, PiggyBank, X, ArrowRight, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useSavingsStore } from '../store/useSavingsStore';
import { useAccountStore } from '../store/useAccountStore';
import { formatNumberInput, parseNumberInput } from '../utils/formatCurrency';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function SavingsTracker() {
  const { goals, transactions, fetchGoals, fetchTransactions, createGoal, deleteGoal, createTransaction, deleteTransaction } = useSavingsStore();
  const { cashflowAccounts, savingsAccounts, fetchAccounts } = useAccountStore();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [goalForm, setGoalForm] = useState({ savingsAccountId: '', goalName: '', targetAmount: '', targetDate: '' });
  const [transferForm, setTransferForm] = useState({ sourceAccountId: '', destinationSavingsAccountId: '', savingsGoalId: '', amount: '', transactionDate: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    fetchGoals();
    fetchTransactions();
    fetchAccounts();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.savingsAccountId || !goalForm.goalName || !goalForm.targetAmount) { toast.error('Fill all required fields'); return; }
    try {
      await createGoal({ ...goalForm, targetAmount: parseNumberInput(goalForm.targetAmount) });
      toast.success('Savings goal created! 🎯');
      setShowGoalForm(false);
      setGoalForm({ savingsAccountId: '', goalName: '', targetAmount: '', targetDate: '' });
    } catch { toast.error('Failed to create goal'); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.sourceAccountId || !transferForm.destinationSavingsAccountId || !transferForm.amount) { toast.error('Fill all required fields'); return; }
    try {
      await createTransaction({ ...transferForm, amount: parseNumberInput(transferForm.amount) });
      await fetchAccounts();
      toast.success('Transfer saved! 💰');
      setShowTransferForm(false);
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed to transfer'); }
  };

  const handleDeleteGoal = async (goal) => {
    if (!confirm(`Delete goal "${goal.goalName}"?`)) return;
    try { await deleteGoal(goal.id); toast.success('Goal deleted'); } catch { toast.error('Failed'); }
  };

  const totalSavings = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div style={{ paddingBottom: 40 }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <PiggyBank size={20} style={{ color: 'var(--clr-emerald)' }} />
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>Savings</h1>
          </div>
          <p style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>Track your savings goals and contributions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowTransferForm(true)} className="btn-ghost">
            <ArrowRight size={15} /> Transfer
          </button>
          <button onClick={() => setShowGoalForm(true)} className="btn-primary">
            <Plus size={16} /> New Goal
          </button>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '22px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'rgba(16,185,129,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Total Savings Progress</p>
        <p className="font-display" style={{ fontSize: 32, fontWeight: 800, color: 'var(--clr-text)' }}>{formatRp(totalSavings)}</p>
        <span className="badge badge-emerald" style={{ marginTop: 8, display: 'inline-flex', fontSize: 10 }}>{goals.length} active goals</span>
      </motion.div>

      {/* Goals */}
      {goals.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ color: 'var(--clr-text)', fontWeight: 600, marginBottom: 4 }}>No savings goals yet</p>
          <p style={{ color: 'var(--clr-text-3)', fontSize: 13, marginBottom: 16 }}>Create your first goal — emergency fund, vacation, gadget...</p>
          {savingsAccounts.length === 0 && <p style={{ color: 'var(--clr-amber)', fontSize: 12 }}>⚠️ Add a Savings account first from the Accounts page</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {goals.map((goal, i) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            return (
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass" style={{ padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: pct >= 100 ? 'var(--clr-emerald)' : 'var(--clr-cyan)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--clr-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--clr-text)', marginBottom: 2 }}>{goal.goalName}</h3>
                      <p style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>{goal.savingsAccount?.accountName} • {goal.savingsAccount?.providerName}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setTransferForm((f) => ({ ...f, savingsGoalId: goal.id, destinationSavingsAccountId: goal.savingsAccountId, sourceAccountId: goal.savingsAccountId })); setShowTransferForm(true); }} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, color: 'var(--clr-emerald)', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                      + Fund
                    </button>
                    <button onClick={() => handleDeleteGoal(goal)} className="btn-ghost" style={{ padding: '6px 8px', color: 'var(--clr-rose)', borderRadius: '8px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
                  <h4 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--clr-text)', lineHeight: 1 }}>{formatRp(goal.currentAmount)}</h4>
                  <p style={{ fontSize: 13, color: 'var(--clr-text-3)', paddingBottom: 3 }}>/ {formatRp(goal.targetAmount)}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: pct >= 100 ? 'var(--clr-emerald)' : 'var(--clr-cyan)' }}>{Math.round(pct)}% Achieved</span>
                  {goal.targetDate && <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>Target: {new Date(goal.targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
                
                <div className="progress-bar" style={{ height: 6, borderRadius: 3 }}>
                  <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} style={{ background: pct >= 100 ? 'var(--grad-emerald)' : 'var(--grad-cyan)', borderRadius: 3 }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showGoalForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setShowGoalForm(false)}>
            <motion.div className="modal-card" initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)' }}>Create Savings Goal</h2>
                <button onClick={() => setShowGoalForm(false)} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Savings Account *</label>
                  {savingsAccounts.length === 0 ? (
                    <div style={{ padding: 12, background: 'rgba(245,158,11,0.08)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p style={{ fontSize: 13, color: 'var(--clr-amber)' }}>⚠️ No savings accounts. Please add one from the Accounts page first.</p>
                    </div>
                  ) : (
                    <select className="input-dark" value={goalForm.savingsAccountId} onChange={(e) => setGoalForm((f) => ({ ...f, savingsAccountId: e.target.value }))} required>
                      <option value="">Select savings account...</option>
                      {savingsAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.icon || '💰'} {acc.accountName} — {acc.providerName}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Goal Name *</label>
                  <input className="input-dark" type="text" placeholder="e.g. Emergency Fund, Vacation, MacBook" value={goalForm.goalName} onChange={(e) => setGoalForm((f) => ({ ...f, goalName: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Target Amount (Rp) *</label>
                  <input
                    className="input-dark"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm((f) => ({ ...f, targetAmount: formatNumberInput(e.target.value) }))}
                    required
                    style={{ fontSize: 18, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Target Date (optional)</label>
                  <input className="input-dark" type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm((f) => ({ ...f, targetDate: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowGoalForm(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}><Target size={16} /> Create Goal</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setShowTransferForm(false)}>
            <motion.div className="modal-card" initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)' }}>Fund Savings</h2>
                  <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>Transfer from cashflow or allocate from existing savings</p>
                </div>
                <button onClick={() => setShowTransferForm(false)} className="btn-ghost" style={{ padding: 8, borderRadius: 10 }}><X size={18} /></button>
              </div>
              <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {transferForm.savingsGoalId && transferForm.sourceAccountId === transferForm.destinationSavingsAccountId ? (
                  <div style={{ padding: '16px', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '4px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--clr-text)', lineHeight: 1.5 }}>
                      Alokasi dana ke goal <strong>{goals.find(g => g.id === transferForm.savingsGoalId)?.goalName}</strong> menggunakan saldo dari tabungan <strong>{savingsAccounts.find(a => a.id === transferForm.sourceAccountId)?.accountName}</strong>.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>From (Source Account) *</label>
                      <select className="input-dark" value={transferForm.sourceAccountId} onChange={(e) => setTransferForm((f) => ({ ...f, sourceAccountId: e.target.value }))} required>
                        <option value="">Select source account...</option>
                        <optgroup label="Savings Accounts (Allocate existing balance)">
                          {savingsAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.icon || '💰'} {acc.accountName} — Rp {acc.currentBalance?.toLocaleString('id-ID')}</option>)}
                        </optgroup>
                        <optgroup label="Cashflow Accounts (Transfer new money)">
                          {cashflowAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.icon || '💳'} {acc.accountName} — Rp {acc.currentBalance?.toLocaleString('id-ID')}</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>To (Savings) *</label>
                      <select className="input-dark" value={transferForm.destinationSavingsAccountId} onChange={(e) => setTransferForm((f) => ({ ...f, destinationSavingsAccountId: e.target.value }))} required>
                        <option value="">Select savings account...</option>
                        {savingsAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.icon || '💰'} {acc.accountName} — {acc.providerName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Link to Goal (optional)</label>
                      <select className="input-dark" value={transferForm.savingsGoalId} onChange={(e) => setTransferForm((f) => ({ ...f, savingsGoalId: e.target.value }))}>
                        <option value="">— No specific goal —</option>
                        {goals.map((g) => <option key={g.id} value={g.id}>{g.goalName} ({Math.round((g.currentAmount / g.targetAmount) * 100)}%)</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Amount (Rp) *</label>
                  <input
                    className="input-dark"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm((f) => ({ ...f, amount: formatNumberInput(e.target.value) }))}
                    required
                    style={{ fontSize: 18, fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Date</label>
                    <input className="input-dark" type="date" value={transferForm.transactionDate} onChange={(e) => setTransferForm((f) => ({ ...f, transactionDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Notes</label>
                    <input className="input-dark" type="text" placeholder="Optional" value={transferForm.notes} onChange={(e) => setTransferForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowTransferForm(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}><ArrowRight size={16} /> Transfer Now</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
