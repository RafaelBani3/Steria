import { Bell, Search, User, Calendar, LogOut, Settings as SettingsIcon, Shield, UserCircle, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import CustomSelect from './CustomSelect';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Navbar() {
  const { selectedMonth, selectedYear, setSelectedPeriod } = useFinanceStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const { user, logout } = useAuthStore();
  
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BUDGET_ALERT': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'SAVINGS_MILESTONE': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'SYSTEM_UPDATE': return <Shield className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-purple-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'BUDGET_ALERT': return 'bg-red-500/10';
      case 'SAVINGS_MILESTONE': return 'bg-emerald-500/10';
      case 'SYSTEM_UPDATE': return 'bg-blue-500/10';
      default: return 'bg-purple-500/10';
    }
  };

  return (
    <div className="h-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-4 md:hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C4CF1] to-[#10B981] flex items-center justify-center text-white font-bold shadow-lg">
          S
        </div>
      </div>
      
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 bg-purple-500/5 dark:bg-white/5 px-2 py-1 rounded-2xl border border-purple-500/10 dark:border-white/10 group hover:border-purple-500/30 transition-all">
          <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
          <CustomSelect 
            value={selectedMonth}
            onChange={(val) => setSelectedPeriod(val, selectedYear)}
            options={MONTHS.map((m, i) => ({ label: m, value: i }))}
            className="w-32"
          />
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 mx-1" />
          <CustomSelect 
            value={selectedYear}
            onChange={(val) => setSelectedPeriod(selectedMonth, val)}
            options={[2025, 2026, 2027].map(y => ({ label: y.toString(), value: y }))}
            className="w-24"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-2xl transition-all relative ${showNotifications ? 'bg-purple-500/10 text-purple-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a] animate-pulse"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-[#0a0a0a]/90 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 z-50 backdrop-blur-2xl"
              >
                <div className="flex justify-between items-center mb-5 px-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-[10px] text-gray-500 font-medium">You have {unreadCount} unread messages</p>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] bg-purple-500/10 text-purple-500 px-3 py-1.5 rounded-full font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-3">
                        <Bell className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                      </div>
                      <p className="text-xs font-bold text-gray-400">All caught up!</p>
                      <p className="text-[10px] text-gray-500">No notifications for now.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <motion.div 
                        key={n.id} 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex gap-3 p-3 rounded-2xl transition-all cursor-pointer group relative ${n.isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                        onClick={() => !n.isRead && markAsRead(n.id)}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${getNotificationColor(n.type)}`}>
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors truncate">{n.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-gray-400 mt-2 font-medium">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <button className="w-full mt-4 py-3 text-[10px] font-bold text-gray-400 hover:text-purple-500 transition-colors uppercase tracking-[0.2em] border-t border-gray-100 dark:border-white/5 pt-4">
                    View Activity Log
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center gap-2 p-1 rounded-full transition-all ${showProfile ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-[#0a0a0a]' : ''}`}
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-500/20 to-emerald-500/20 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold">
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0a0a0a]/90 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 backdrop-blur-2xl"
              >
                <div className="p-5 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Steria User'}</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate">{user?.email}</p>
                </div>
                <div className="p-2.5">
                  <button 
                    onClick={() => { setShowProfile(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                  >
                    <UserCircle className="w-4 h-4 text-purple-500" />
                    My Profile
                  </button>
                  <button 
                    onClick={() => { setShowProfile(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                  >
                    <SettingsIcon className="w-4 h-4 text-emerald-500" />
                    Preferences
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-white/5 my-2 mx-4" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
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
