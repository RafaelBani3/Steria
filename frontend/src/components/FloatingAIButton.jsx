import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAIStore } from '../store/useAIStore';

export default function FloatingAIButton() {
  const { isOpen, openModal, isProcessing, aiInsights } = useAIStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on copilot page and when modal is open
  if (isOpen || location.pathname === '/copilot') return null;

  const handleClick = () => {
    openModal();
  };

  const unreadCount = aiInsights?.length || 0;

  return (
    <div
      className="fixed right-5 z-50"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
    >
      {/* Outer pulsing glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.65, 0.3],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          background: 'radial-gradient(circle, #7C3AED 0%, #4F46E5 60%, transparent 80%)',
          filter: 'blur(14px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        animate={isProcessing
          ? { rotate: [0, 5, -5, 0] }
          : { y: [0, -5, 0] }
        }
        transition={isProcessing
          ? { duration: 0.4, repeat: Infinity }
          : { y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } }
        }
        title="Steria AI Copilot — klik untuk bicara"
        style={{
          position: 'relative',
          width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C4CF1 0%, #9D5CFF 100%)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(108,76,241,0.5), 0 2px 8px rgba(0,0,0,0.3)',
          color: '#fff',
        }}
      >
        {isProcessing ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={22} strokeWidth={2} />
          </motion.div>
        ) : (
          <Bot size={22} strokeWidth={2} />
        )}

        {/* Sparkle accent */}
        {!isProcessing && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 8, height: 8,
            }}
          >
            <Sparkles size={8} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
          </motion.div>
        )}

        {/* Unread insights badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute', top: -2, right: -2,
                width: 18, height: 18, borderRadius: '50%',
                background: '#F59E0B', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
