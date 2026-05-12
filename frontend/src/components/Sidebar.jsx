import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, Receipt, PiggyBank, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Income', path: '/income', icon: Wallet },
  { name: 'Budgets', path: '/budgets', icon: PieChart },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Savings', path: '/savings', icon: PiggyBank },
];

export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-gray-800 flex flex-col transition-colors duration-200">
      <div className="h-20 flex items-center px-8 border-b border-gray-50 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C4CF1] to-[#10B981] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Steria</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-8 bg-purple-600 rounded-r-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-gray-50 dark:border-gray-800/50">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              isActive
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
}
