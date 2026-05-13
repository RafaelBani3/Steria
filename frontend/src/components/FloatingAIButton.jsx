import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useAIStore } from '../store/useAIStore';

export default function FloatingAIButton() {
  const { openModal, isOpen } = useAIStore();

  // Hide floating button if modal is already open
  if (isOpen) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-40">
      {/* Outer pulsing ring for premium glowing breathing effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 blur-xl opacity-60"
      />

      <motion.button
        onClick={openModal}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ 
          y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#6C4CF1] to-[#A78BFA] p-4 text-white shadow-2xl shadow-purple-500/50 backdrop-blur-md border border-white/20 group"
        title="Steria AI Assistant"
      >
        <Bot className="h-7 w-7 transition-transform group-hover:rotate-12" />
        <Sparkles className="absolute top-2 right-2 h-3 w-3 text-purple-200 animate-pulse" />
      </motion.button>
    </div>
  );
}
