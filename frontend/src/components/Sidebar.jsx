import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Bot, Wallet,
  PieChart, Receipt, PiggyBank, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo3.png';

const PRIMARY_NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts',  path: '/accounts',  icon: CreditCard },
  { name: 'Copilot',   path: '/copilot',   icon: Bot },
];

const FINANCE_NAV = [
  { name: 'Income',    path: '/income',    icon: Wallet },
  { name: 'Budgets',   path: '/budgets',   icon: PieChart },
  { name: 'Expenses',  path: '/expenses',  icon: Receipt },
  { name: 'Savings',   path: '/savings',   icon: PiggyBank },
];

function NavItem({ item }) {
  return (
    <NavLink to={item.path} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 10,
            position: 'relative',
            background: isActive ? 'var(--violet-dim)' : 'transparent',
            color: isActive ? 'var(--violet-light)' : 'var(--t3)',
            fontWeight: isActive ? 600 : 400,
            fontSize: 13.5,
            transition: 'all 150ms ease',
            cursor: 'pointer',
            border: `1px solid ${isActive ? 'rgba(99,102,241,0.15)' : 'transparent'}`,
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(15,23,42,0.04)';
              e.currentTarget.style.color = 'var(--t1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--t3)';
            }
          }}
        >
          {/* Animated active dot */}
          {isActive && (
            <motion.span
              layoutId="sidebar-dot"
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 18,
                background: 'var(--grad-brand)',
                borderRadius: '0 3px 3px 0',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}

          <item.icon
            size={15}
            strokeWidth={isActive ? 2.2 : 1.7}
            style={{ flexShrink: 0, transition: 'all 150ms' }}
          />
          <span>{item.name}</span>
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        height: '100%',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <img src={logo} alt="Steria" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div>
          <p
            className="font-display"
            style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}
          >
            Steria
          </p>
          <p style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, letterSpacing: '0.3px' }}>
            Financial OS
          </p>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {PRIMARY_NAV.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}

        {/* Divider with label */}
        <div style={{ padding: '12px 12px 6px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Finances
          </p>
        </div>

        {FINANCE_NAV.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>

      {/* Settings footer */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--glass-border)' }}>
        <NavLink to="/settings" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: isActive ? 'var(--violet-dim)' : 'transparent',
                color: isActive ? 'var(--violet-light)' : 'var(--t3)',
                fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'all 150ms',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.color = 'var(--t1)'; }}}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}}
            >
              <Settings size={15} strokeWidth={isActive ? 2.2 : 1.7} />
              <span>Settings</span>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
