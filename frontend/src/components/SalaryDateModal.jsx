import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBudgetStore } from '../store/useBudgetStore';

export default function SalaryDateModal() {
  const { user, updateUser } = useAuthStore();
  const { refreshPeriodBasedOnSalaryDate } = useBudgetStore();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show modal only if user is logged in and salaryDate is null/undefined
    if (user && user.salaryDate === null) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await updateUser({ salaryDate: date });
    if (success) {
      refreshPeriodBasedOnSalaryDate();
      setIsOpen(false);
    }
    
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 9999, backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            className="modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            style={{ padding: '32px 28px', maxWidth: 420 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                border: '2px solid var(--clr-violet)'
              }}>
                <Calendar size={32} style={{ color: 'var(--clr-violet)' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--clr-text)', marginBottom: 8 }}>Kapan Tanggal Gajianmu?</h2>
              <p style={{ fontSize: 13, color: 'var(--clr-text-3)', lineHeight: 1.5 }}>
                Agar budgetmu tidak kereset sebelum waktunya, Steria perlu tahu kapan siklus gajianmu dimulai setiap bulannya.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 12, textAlign: 'center' }}>
                  Pilih Tanggal (1 - 31)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button type="button" onClick={() => setDate(d => Math.max(1, d - 1))} className="btn-ghost" style={{ padding: '12px 16px', fontSize: 20, borderRadius: 12, background: 'var(--bg-elevated)' }}>-</button>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={date}
                    onChange={(e) => setDate(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                    style={{
                      width: 80, padding: '12px', borderRadius: 16,
                      border: '2px solid var(--clr-violet)', background: 'var(--bg-elevated)',
                      color: 'var(--clr-text)', fontWeight: 800, fontSize: 28, fontFamily: 'inherit',
                      outline: 'none', textAlign: 'center'
                    }}
                  />
                  <button type="button" onClick={() => setDate(d => Math.min(31, d + 1))} className="btn-ghost" style={{ padding: '12px 16px', fontSize: 20, borderRadius: 12, background: 'var(--bg-elevated)' }}>+</button>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 12, borderRadius: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--clr-emerald)', textAlign: 'center', fontWeight: 600 }}>
                  💡 Contoh: Jika isi 25, maka periode budget akan dihitung dari tanggal 25 hingga tanggal 24 bulan depan.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8 }}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tanggal Gajian'}
                {!isSubmitting && <ChevronRight size={18} />}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
