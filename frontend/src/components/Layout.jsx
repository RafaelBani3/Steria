import { Outlet, NavLink } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import FloatingAIButton from './FloatingAIButton';
import AIAssistantModal from './AIAssistantModal';
import { formatDistanceToNow } from 'date-fns';

function MobileHeader() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    // Notifications are already fetched by Navbar on desktop.
    // On mobile, trigger fetch only once via the shared store (which handles deduplication via TTL cache).
    fetchNotifications();
  }, []);


  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      style={{
        height: 56,
        background: 'rgba(5,8,20,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'var(--grad-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 13,
            boxShadow: '0 0 14px var(--violet-glow)',
            flexShrink: 0,
          }}
        >
          S
        </div>
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18,
            background: 'linear-gradient(135deg, #9D5CFF, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Steria
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotif((v) => !v)}
            style={{
              width: 34, height: 34, borderRadius: 11,
              background: showNotif ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${showNotif ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <Bell size={16} color={showNotif ? '#9D5CFF' : 'rgba(255,255,255,0.55)'} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#F43F5E',
                  border: '2px solid rgba(5,8,20,1)',
                }}
              />
            )}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                style={{
                  position: 'fixed',
                  top: 58, right: 12,
                  width: 300,
                  background: '#0d1324',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 18,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#F0F4FF' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{ fontSize: 11, color: '#9D5CFF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>🔔</div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>All caught up!</p>
                    </div>
                  ) : notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                      style={{
                        display: 'flex', gap: 10, padding: '10px 10px',
                        borderRadius: 12, marginBottom: 4, cursor: 'pointer',
                        background: n.isRead ? 'transparent' : 'rgba(124,58,237,0.07)',
                        border: `1px solid ${n.isRead ? 'transparent' : 'rgba(124,58,237,0.15)'}`,
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {n.type === 'BUDGET_ALERT' ? '⚠️' : n.type === 'SAVINGS_MILESTONE' ? '🎯' : '🔔'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <NavLink to="/profile" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--grad-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
              boxShadow: '0 0 12px var(--violet-glow)',
              border: '2px solid rgba(16,185,129,0.3)',
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || <User size={15} />}
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--clr-bg)',
        color: 'var(--clr-text)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background orbs — desktop only */}
      <div className="bg-orb bg-orb-1 hidden md:block" />
      <div className="bg-orb bg-orb-2 hidden md:block" />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex" style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <Sidebar />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Desktop Navbar */}
        <div className="hidden md:block">
          <Navbar />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader />
        </div>

        {/* Main Content */}
        <main
          id="main-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div className="page-wrapper">
            <Outlet />
          </div>
        </main>

        {/* Mobile Floating Bottom Nav */}
        <div className="md:hidden">
          <BottomNav />
        </div>

        {/* AI Floating Button - visible on all screens */}
        <FloatingAIButton />
        <AIAssistantModal />
      </div>
    </div>
  );
}
