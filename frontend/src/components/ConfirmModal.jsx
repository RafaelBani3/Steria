import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', isLoading = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Glowing Accents */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-red-500/10 blur-[80px]" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <button 
                  onClick={onClose}
                  className="rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                {message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl bg-white/5 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl bg-red-500 px-4 py-3.5 text-sm font-semibold text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
