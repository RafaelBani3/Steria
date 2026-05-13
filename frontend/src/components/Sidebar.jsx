import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, Receipt, PiggyBank, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo3.png';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Income',    path: '/income',    icon: Wallet },
  { name: 'Budgets',   path: '/budgets',   icon: PieChart },
  { name: 'Expenses',  path: '/expenses',  icon: Receipt },
  { name: 'Savings',   path: '/savings',   icon: PiggyBank },
];

/* Stagger variants for the nav list */
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const itemVariants = {
  hidden:  { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-gray-800 flex flex-col transition-colors duration-200">

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-center justify-center py-4 px-4 border-b border-gray-50 dark:border-gray-800/50"
      >
        <motion.img
          src={logo}
          alt="Logo"
          whileHover={{ scale: 1.06, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{ width: '120px', height: '120px', objectFit: 'contain' }}
        />
      </motion.div>

      {/* ── Nav items ── */}
      <motion.div
        className="flex-1 py-6 px-4 space-y-1"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => (
          <motion.div key={item.name} variants={itemVariants}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active pill indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}

                  {/* Icon with bounce on active */}
                  <motion.div
                    animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                  </motion.div>

                  <span>{item.name}</span>

                  {/* Animated dot on active */}
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500"
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Settings ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="p-4 border-t border-gray-50 dark:border-gray-800/50"
      >
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <motion.div animate={isActive ? { rotate: 90 } : { rotate: 0 }} transition={{ duration: 0.3 }}>
                <Settings className={`w-5 h-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}`} />
              </motion.div>
              <span>Settings</span>
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500"
                />
              )}
            </>
          )}
        </NavLink>
      </motion.div>
    </div>
  );
}
