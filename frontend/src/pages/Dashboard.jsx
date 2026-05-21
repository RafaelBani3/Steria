import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, Bot } from 'lucide-react';
import { useAccountStore } from '../store/useAccountStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { useAuthStore } from '../store/useAuthStore';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from 'recharts';

const fmt = (n) => {
  if (!n) return 'Rp 0';
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};
const fmtFull = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const { user } = useAuthStore();
  const { totalCashflow, totalSavings, totalBalance, cashflowAccounts, savingsAccounts, fetchAccounts } = useAccountStore();
  const { incomes, fetchIncomes, getTotalIncome } = useIncomeStore();
  const { expenses, fetchExpenses, getTotalExpenses } = useExpenseStore();
  const { budgetItems, categories, fetchBudgetItems, fetchCategories, getTotals } = useBudgetStore();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    fetchAccounts();
    fetchIncomes(month, year);
    fetchExpenses(month, year);
    fetchBudgetItems();
    fetchCategories();
  }, []);

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const { totalAllocated, totalUsed } = getTotals();
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;
  const budgetUsedPct = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;
  const avgDailySpend = totalExpenses > 0 ? Math.round(totalExpenses / now.getDate()) : 0;

  // 7-day spending chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const total = expenses.filter(e => new Date(e.transactionDate).toDateString() === d.toDateString())
      .reduce((s, e) => s + e.amount, 0);
    return { day: dayLabel, amount: total };
  });

  // Spending breakdown by budget category for donut
  const pieData = categories.map(cat => ({
    name: cat.categoryName,
    value: budgetItems.filter(i => i.categoryId === cat.id).reduce((s, i) => s + i.usedAmount, 0),
  })).filter(d => d.value > 0);
  const PIE_COLORS = ['#2DD4BF', '#10B981', '#F59E0B'];

  const overBudgetItems = budgetItems.filter(i => i.allocatedAmount > 0 && i.usedAmount >= i.allocatedAmount * 0.8);
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div>
      {/* ── Greeting ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 16 }}
      >
        <p style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--clr-text)', marginTop: 2 }}>
            Hey, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <span style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 2 }}>
            {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </motion.div>

      {/* ── Twin Account Cards ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {/* Cashflow card */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: 'var(--grad-brand)',
            borderRadius: 18, padding: '16px 14px',
            boxShadow: '0 8px 24px var(--violet-glow)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
            💳 Total Cashflow
          </p>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            {fmt(totalCashflow)}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
            {cashflowAccounts.length} Accounts
          </p>
        </motion.div>

        {/* Savings card */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            borderRadius: 18, padding: '16px 14px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
            💰 Total Savings
          </p>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            {fmt(totalSavings)}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
            {savingsAccounts.length} Accounts
          </p>
        </motion.div>
      </div>

      {/* ── Overview This Month ───────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ borderRadius: 18, padding: '16px 16px', marginBottom: 12 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text)' }}>Overview This Month</p>
          <span className="badge badge-purple" style={{ fontSize: 10 }}>
            {now.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {[
          { label: 'Income', value: fmtFull(totalIncome), icon: '💚', color: 'var(--clr-emerald)' },
          { label: 'Expenses', value: fmtFull(totalExpenses), icon: '❤️', color: 'var(--clr-rose)' },
          { label: 'Avg Daily Spend', value: fmt(avgDailySpend), icon: '📊', color: 'var(--clr-amber)', sub: '↑ vs last month', subColor: 'var(--clr-amber)' },
        ].map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none' }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--clr-text-2)', fontWeight: 500 }}>{item.label}</span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</p>
              {item.sub && <p style={{ fontSize: 10, color: item.subColor, marginTop: 1 }}>{item.sub}</p>}
            </div>
          </div>
        ))}

        {/* Budget Usage Bar */}
        <div style={{ marginTop: 12, padding: '10px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--clr-text-3)', fontWeight: 500 }}>Budget Usage</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: budgetUsedPct >= 90 ? 'var(--clr-rose)' : 'var(--clr-text)' }}>
              {budgetUsedPct}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 7 }}>
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${budgetUsedPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ background: budgetUsedPct >= 90 ? 'var(--grad-rose)' : 'var(--grad-purple)' }}
            />
          </div>
          <p style={{ fontSize: 10, color: 'var(--clr-text-3)', marginTop: 4 }}>
            {fmtFull(totalUsed)} / {fmtFull(totalAllocated)}
          </p>
        </div>
      </motion.div>

      {/* ── Spending Breakdown + 7-Day Chart ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
        {/* 7-Day Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass"
          style={{ borderRadius: 18, padding: '16px 14px 8px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--clr-text)' }}>7-Day Spending</p>
            <span className="badge badge-rose" style={{ fontSize: 9 }}>This week</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={last7} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#5A6888' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [fmt(v), 'Spent']}
                contentStyle={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: 10, fontSize: 11, color: 'var(--clr-text)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
                cursor={{ stroke: 'rgba(15,23,42,0.06)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="amount" stroke="#F43F5E" strokeWidth={2} fill="url(#spendG)" dot={false} activeDot={{ r: 4, fill: '#F43F5E' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Spending Breakdown Donut — only when data exists */}
        {pieData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="glass"
            style={{ borderRadius: 18, padding: '16px 14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--clr-text)' }}>Spending Breakdown</p>
              <Link to="/budgets" style={{ fontSize: 11, color: 'var(--clr-purple-mid)', textDecoration: 'none', fontWeight: 600 }}>See All</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <PieChart width={100} height={100}>
                <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={44} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div style={{ flex: 1 }}>
                {pieData.map((d, i) => {
                  const total = pieData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--clr-text-2)', flex: 1 }}>{d.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text)' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── AI Insight Card ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.04) 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 18, padding: '14px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={18} color="var(--violet)" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet)', marginBottom: 4 }}>AI Insight</p>
          <p style={{ fontSize: 13, color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
            {totalExpenses > totalIncome * 0.8
              ? `Pengeluaran kamu sudah ${Math.round((totalExpenses / totalIncome) * 100)}% dari pemasukan. Mulai kurangi pengeluaran Wants! 💡`
              : savingsRate >= 20
              ? `Mantap! Savings rate kamu ${savingsRate}% — sudah melewati target 20%. Pertahankan! 🎉`
              : `Savings rate kamu ${savingsRate}%. Target ideal adalah 20% dari pemasukan bulanan. Yuk lebih bijak! 💪`}
          </p>
        </div>
        <Link to="/copilot" style={{ flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={14} color="var(--violet)" />
          </div>
        </Link>
      </motion.div>

      {/* ── Budget Alerts ─────────────────────── */}
      {overBudgetItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="glass"
          style={{ borderRadius: 18, padding: '14px 16px', marginBottom: 12, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}
        >
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--clr-amber)', marginBottom: 10 }}>⚠️ Budget Alerts</p>
          {overBudgetItems.slice(0, 3).map((item) => {
            const pct = Math.round((item.usedAmount / item.allocatedAmount) * 100);
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--clr-text)', fontWeight: 500 }}>{item.itemName}</p>
                  <p style={{ fontSize: 10, color: 'var(--clr-text-3)' }}>{item.category?.categoryName}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? 'var(--clr-rose)' : 'var(--clr-amber)' }}>{pct}%</span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ── Recent Expenses ───────────────────── */}
      {recentExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass"
          style={{ borderRadius: 18, padding: '16px 16px', marginBottom: 12 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text)' }}>Recent Expenses</p>
            <Link to="/expenses" style={{ fontSize: 11, color: 'var(--clr-purple-mid)', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
          </div>
          {recentExpenses.map((exp, i) => (
            <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < recentExpenses.length - 1 ? 10 : 0, marginBottom: i < recentExpenses.length - 1 ? 10 : 0, borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {exp.account?.icon || '💸'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exp.description || exp.budgetItem?.itemName || 'Expense'}
                </p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                  <p style={{ fontSize: 10, color: 'var(--clr-text-3)' }}>
                    {new Date(exp.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                  {exp.category && (
                    <>
                      <span style={{ fontSize: 10, color: 'var(--clr-border)' }}>·</span>
                      <p style={{ fontSize: 10, color: 'var(--clr-text-3)' }}>{exp.category.categoryName}</p>
                    </>
                  )}
                  {exp.account?.providerName && (
                    <>
                      <span style={{ fontSize: 10, color: 'var(--clr-border)' }}>·</span>
                      <p style={{ fontSize: 10, color: 'var(--clr-cyan)' }}>{exp.account.providerName}</p>
                    </>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-rose)', flexShrink: 0 }}>
                -{fmt(exp.amount)}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Savings Goals ─────────────────────── */}
      {savingsAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="glass"
          style={{ borderRadius: 18, padding: '16px 16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--clr-text)' }}>Savings Accounts / Goals</p>
            <Link to="/accounts" style={{ fontSize: 11, color: 'var(--clr-emerald)', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
          </div>
          {savingsAccounts.slice(0, 3).map((acc) => {
            const pct = acc.targetAmount > 0 ? Math.min(100, (acc.currentBalance / acc.targetAmount) * 100) : 0;
            return (
              <div key={acc.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)' }}>{acc.accountName}</p>
                    <p style={{ fontSize: 10, color: 'var(--clr-text-3)' }}>{acc.providerName}</p>
                  </div>
                  {acc.targetAmount > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-emerald)' }}>{Math.round(pct)}%</span>
                  )}
                </div>
                {acc.targetAmount > 0 ? (
                  <>
                    <div className="progress-bar">
                      <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2 }} style={{ background: 'var(--grad-emerald)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <p style={{ fontSize: 10, color: 'var(--clr-emerald)', fontWeight: 600 }}>{fmt(acc.currentBalance)}</p>
                      <p style={{ fontSize: 10, color: 'var(--clr-text-3)' }}>of {fmt(acc.targetAmount)}</p>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-emerald)' }}>{fmtFull(acc.currentBalance)}</p>
                    <span style={{ fontSize: 10, color: 'var(--clr-text-3)', fontStyle: 'italic' }}>Flexible Savings</span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {savingsAccounts.length === 0 && recentExpenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass"
          style={{ borderRadius: 18, padding: '36px 20px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--clr-text)', marginBottom: 6 }}>Let's get started!</p>
          <p style={{ fontSize: 13, color: 'var(--clr-text-3)', marginBottom: 16 }}>Add your first account to start tracking your finances.</p>
          <Link to="/accounts" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ margin: '0 auto' }}>Add Account</button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
