import { Bell, Search, User, Calendar, LogOut, Settings as SettingsIcon, Shield, UserCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Navbar() {
  const { selectedMonth, selectedYear, setSelectedPeriod, expenses } = useFinanceStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentNotifications = [
    { id: 1, title: 'Budget Alert', message: 'You have spent 90% of your "Wants" budget.', type: 'alert', time: '2h ago' },
    { id: 2, title: 'Savings Goal', message: 'Congratulations! You reached 50% of your MacBook goal.', type: 'success', time: '5h ago' },
    { id: 3, title: 'New Income', message: 'A new income source "Freelance" was added.', type: 'info', time: '1d ago' },
  ];

  return (
    <div className="h-20 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-colors duration-200">
      <div className="flex items-center gap-4 md:hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C4CF1] to-[#10B981] flex items-center justify-center text-white font-bold shadow-lg">
          S
        </div>
      </div>
      
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-purple-300 dark:focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Global Period Selector */}
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-800/50">
          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedPeriod(e.target.value, selectedYear)}
            className="bg-transparent text-sm font-medium text-purple-700 dark:text-purple-300 outline-none cursor-pointer"
          >
            {MONTHS.map((m, i) => <option key={m} value={i} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedPeriod(selectedMonth, e.target.value)}
            className="bg-transparent text-sm font-medium text-purple-700 dark:text-purple-300 outline-none cursor-pointer border-l border-purple-200 dark:border-purple-800 pl-1 ml-1"
          >
            {[2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{y}</option>)}
          </select>
        </div>

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1E293B]"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 z-50"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                  <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">3 NEW</span>
                </div>
                <div className="space-y-3">
                  {recentNotifications.map(n => (
                    <div key={n.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        n.type === 'alert' ? 'bg-red-50 text-red-500' : n.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {n.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{n.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-gray-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-widest border-t border-gray-50 dark:border-gray-800 pt-3">
                  View All Notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center gap-2 p-1 rounded-full transition-all ${showProfile ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-[#1E293B]' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-100 to-emerald-100 dark:from-purple-900/50 dark:to-emerald-900/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-medium">
              <User className="w-5 h-5" />
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
              >
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Admin User</p>
                  <p className="text-[10px] text-gray-500 font-medium">admin@steria.finance</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { setShowProfile(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile
                  </button>
                  <button 
                    onClick={() => { setShowProfile(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="h-px bg-gray-50 dark:bg-gray-800 my-2 mx-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
