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
    <div className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border border-gray-100 dark:border-white/10 flex items-center justify-around px-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 transition-all duration-300">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-14 relative transition-all ${
              isActive ? 'text-purple-600 dark:text-purple-400 scale-110' : 'text-gray-400 dark:text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-active"
                  className="absolute inset-0 bg-purple-500/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <item.icon className={`w-5 h-5 mb-1 z-10 transition-transform ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className={`text-[8px] font-black uppercase tracking-tighter z-10 transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
