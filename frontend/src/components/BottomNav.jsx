import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, PieChart, Receipt, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/accounts',  icon: CreditCard,      label: 'Accounts' },
  { path: '/savings',   icon: PiggyBank,        label: 'Savings' },
  { path: '/budgets',   icon: PieChart,         label: 'Budgets' },
  { path: '/expenses',  icon: Receipt,          label: 'Expenses' },
];

export default function BottomNav() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: 360,
      }}
    >
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(15,23,42,0.06)',
          borderRadius: 999,
          padding: '8px 10px',
          boxShadow: '0 8px 30px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          gap: 4,
        }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            style={{ flex: 1, textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <TabItem tab={tab} isActive={isActive} />
            )}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  );
}

function TabItem({ tab, isActive }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 4px',
        borderRadius: 999,
        position: 'relative',
        minWidth: 0,
      }}
    >
      {/* Active indicator pill */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: 'var(--violet-dim)',
            border: '1px solid rgba(99,102,241,0.12)',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}

      {/* Icon */}
      <motion.div
        animate={{ scale: isActive ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ position: 'relative', zIndex: 1, marginBottom: 3 }}
      >
        <tab.icon
          size={19}
          strokeWidth={isActive ? 2.2 : 1.7}
          style={{
            color: isActive ? 'var(--violet)' : 'rgba(15,23,42,0.4)',
            transition: 'color 200ms',
            display: 'block',
          }}
        />
      </motion.div>

      {/* Label */}
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.2px',
          color: isActive ? 'var(--violet)' : 'rgba(15,23,42,0.4)',
          transition: 'color 200ms',
          position: 'relative',
          zIndex: 1,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {tab.label}
      </span>
    </div>
  );
}
