import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAIStore } from '../store/useAIStore';

export default function FloatingAIButton() {
  const { isOpen } = useAIStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (isOpen || location.pathname === '/copilot') return null;

  const handleClick = () => {
    navigate('/copilot');
  };

  return (
    /* bottom-28 on mobile = 112px (clear of BottomNav ~90px) | bottom-6 on desktop */
    <div
      className="fixed right-5 z-50"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
    >
      {/* Outer pulsing glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.7, 0.35],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, #7C3AED 0%, #4F46E5 60%, transparent 80%)',
          filter: 'blur(14px)',
        }}
      />

      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        animate={{ y: [0, -5, 0] }}
        transition={{
          y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          position: 'relative',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C4CF1 0%, #9D5CFF 100%)',
          border: '1.5px solid rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(108,76,241,0.45)',
          color: '#fff',
        }}
        title="Steria AI Copilot"
      >
        <Bot size={22} strokeWidth={2} />
        <Sparkles
          size={10}
          style={{
            position: 'absolute',
            top: 9,
            right: 9,
            color: 'rgba(255,255,255,0.8)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </motion.button>
    </div>
  );
}
