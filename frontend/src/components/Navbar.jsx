import { Bell, User, LogOut, Settings as SettingsIcon, Shield, UserCircle, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Navbar() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const { user, logout } = useAuthStore();
  
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications(); // deduplicated by TTL if MobileHeader already fetched
    // Refresh notifications every 5 minutes (forced)
    const interval = setInterval(() => fetchNotifications(true), 5 * 60 * 1000);
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
    <div style={{ height: 64, background: 'rgba(8,13,30,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
      {/* Mobile brand */}
      <div className="flex md:hidden" style={{ alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--grad-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 0 16px var(--clr-purple-glow)' }}>S</div>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--clr-text)', fontFamily: 'Space Grotesk, sans-serif' }}>Steria</span>
      </div>

      {/* Desktop spacer */}
      <div className="hidden md:block" style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ padding: '8px', borderRadius: 12, background: showNotifications ? 'rgba(124,58,237,0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: showNotifications ? 'var(--clr-purple-mid)' : 'var(--clr-text-3)', position: 'relative', transition: 'all 0.2s' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, background: 'var(--clr-rose)', borderRadius: '50%', border: '2px solid var(--clr-bg)' }} />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                style={{ position: 'absolute', right: 0, marginTop: 8, width: 340, background: '#0d1324', border: '1px solid var(--clr-border)', borderRadius: 20, padding: 16, zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: 'var(--clr-text)', fontSize: 15 }}>Notifications</h3>
                    <p style={{ fontSize: 11, color: 'var(--clr-text-3)' }}>{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{ fontSize: 11, background: 'rgba(124,58,237,0.1)', color: 'var(--clr-purple-mid)', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                      <p style={{ fontSize: 13, color: 'var(--clr-text-3)' }}>All caught up!</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(124,58,237,0.06)', border: `1px solid ${n.isRead ? 'transparent' : 'rgba(124,58,237,0.12)'}`, position: 'relative' }}>
                        <div style={{ fontSize: 18, flexShrink: 0 }}>{n.type === 'BUDGET_ALERT' ? '⚠️' : n.type === 'SAVINGS_MILESTONE' ? '🎯' : '🔔'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--clr-text-3)', lineHeight: 1.4 }}>{n.message}</p>
                          <p style={{ fontSize: 10, color: 'var(--clr-text-3)', marginTop: 4 }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                        {!n.isRead && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-purple)' }} />}
                      </div>
                    ))
                  )}
                </div>
                

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{ padding: 4, borderRadius: '50%', border: showProfile ? '2px solid var(--clr-purple)' : '2px solid transparent', background: 'none', cursor: 'pointer', transition: 'border 0.2s' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, boxShadow: '0 0 12px var(--clr-purple-glow)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                style={{ position: 'absolute', right: 0, marginTop: 8, width: 220, background: '#0d1324', border: '1px solid var(--clr-border)', borderRadius: 16, zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--clr-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{user?.name || 'Steria User'}</p>
                  <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 2 }}>{user?.email}</p>
                </div>
                <div style={{ padding: '8px' }}>
                  {[{ label: 'My Profile', icon: <UserCircle size={14} />, path: '/profile', color: 'var(--clr-purple-mid)' }, { label: 'Settings', icon: <SettingsIcon size={14} />, path: '/settings', color: 'var(--clr-emerald)' }].map((item) => (
                    <button key={item.path} onClick={() => { setShowProfile(false); navigate(item.path); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-2)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, textAlign: 'left', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                      <span style={{ color: item.color }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'var(--clr-border)', margin: '6px 8px' }} />
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-rose)', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <LogOut size={14} /> Logout
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
