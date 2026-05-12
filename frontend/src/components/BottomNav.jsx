import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, PiggyBank, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Income', path: '/income', icon: Wallet },
  { name: 'Budgets', path: '/budgets', icon: PieChart },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Savings', path: '/savings', icon: PiggyBank },
];

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-[#1E293B] border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-2 pb-safe z-50 transition-colors duration-200">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-14 relative ${
              isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-active"
                  className="absolute inset-0 bg-purple-50 dark:bg-purple-500/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <item.icon className="w-5 h-5 mb-1 z-10" />
              <span className="text-[10px] font-medium z-10">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
