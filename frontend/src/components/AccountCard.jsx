import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, MoreHorizontal } from 'lucide-react';

const formatCurrency = (amount) => {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const ACCOUNT_TYPE_CONFIG = {
  CASHFLOW: {
    label: 'Cashflow',
    badgeClass: 'badge-cyan',
    glowColor: 'rgba(6,182,212,0.15)',
    borderColor: 'rgba(6,182,212,0.2)',
  },
  SAVINGS: {
    label: 'Savings',
    badgeClass: 'badge-emerald',
    glowColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
};

export default function AccountCard({ account, index = 0, onEdit, onDelete }) {
  const config = ACCOUNT_TYPE_CONFIG[account.accountType] || ACCOUNT_TYPE_CONFIG.CASHFLOW;
  const monthlyExpenses = account.monthlyExpenses || 0;
  const transactionCount = account.transactionCount || 0;
  const balance = account.currentBalance || 0;

  // Usage percentage (for cashflow: expenses vs income this month)
  const monthlyIncome = account.monthlyIncome || 0;
  const usagePercent = monthlyIncome > 0 ? Math.min(100, (monthlyExpenses / monthlyIncome) * 100) : 0;

  const cardColor = account.color || (account.accountType === 'SAVINGS' ? '#10B981' : '#7C3AED');

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      className="stat-card"
      style={{
        borderColor: config.borderColor,
        background: `linear-gradient(145deg, rgba(10,14,30,0.85) 0%, rgba(10,14,30,0.6) 100%)`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Top glow accent */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${cardColor}, transparent)`,
          opacity: 0.8,
        }}
      />

      {/* Background color blob */}
      <div
        style={{
          position: 'absolute',
          top: -40, right: -40,
          width: 120, height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${cardColor}20 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Icon */}
          <div
            style={{
              width: 46, height: 46,
              borderRadius: 14,
              background: `${cardColor}20`,
              border: `1px solid ${cardColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}
          >
            {account.icon || (account.accountType === 'SAVINGS' ? '💰' : '💳')}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 2 }}>
              {account.accountName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>{account.providerName}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${config.badgeClass}`}>{config.label}</span>
          {(onEdit || onDelete) && (
            <div style={{ display: 'flex', gap: 4 }}>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(account); }}
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8 }}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(account); }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid rgba(244,63,94,0.2)',
                    color: 'var(--clr-rose)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Current Balance
        </p>
        <p
          className="font-display"
          style={{ fontSize: 26, fontWeight: 700, color: 'var(--clr-text)', lineHeight: 1.1 }}
        >
          Rp {balance.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: account.accountType === 'CASHFLOW' ? 16 : 0,
        }}
      >
        <div
          style={{
            background: 'rgba(244,63,94,0.08)',
            borderRadius: 12,
            padding: '10px 12px',
            border: '1px solid rgba(244,63,94,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <TrendingDown size={12} style={{ color: 'var(--clr-rose)' }} />
            <span style={{ fontSize: 10, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Spent
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-rose)' }}>
            {formatCurrency(monthlyExpenses)}
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            padding: '10px 12px',
            border: '1px solid var(--clr-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <ArrowUpRight size={12} style={{ color: 'var(--clr-text-3)' }} />
            <span style={{ fontSize: 10, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Transactions
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)' }}>
            {transactionCount} tx
          </p>
        </div>
      </div>

      {/* Usage bar (cashflow only) */}
      {account.accountType === 'CASHFLOW' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>Usage this month</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: usagePercent > 80 ? 'var(--clr-rose)' : usagePercent > 60 ? 'var(--clr-amber)' : 'var(--clr-emerald)',
              }}
            >
              {Math.round(usagePercent)}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ delay: 0.3 + index * 0.1, duration: 1, ease: 'easeOut' }}
              style={{
                background: usagePercent > 80
                  ? 'var(--grad-rose)'
                  : usagePercent > 60
                  ? 'var(--grad-gold)'
                  : 'var(--grad-emerald)',
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
