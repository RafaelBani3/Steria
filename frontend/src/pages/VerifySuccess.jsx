import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';

export default function VerifySuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resendVerification, isLoading } = useAuthStore();
  
  const status = searchParams.get('status') || 'success';
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [resent, setResent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Silakan masukkan email Anda.');
      return;
    }
    
    const result = await resendVerification(email);
    if (result.success) {
      toast.success('Email verifikasi baru telah dikirim! ✨');
      setResent(true);
      setTimer(60); // 60s cooldown
    } else {
      toast.error(result.error || 'Gagal mengirim ulang verifikasi.');
    }
  };

  // Card variant
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070a13',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Blurred glowing orbs in background */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(13, 19, 36, 0.75)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 24px 60px -15px rgba(0,0,0,0.7)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header highlight */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.4), transparent)'
        }} />

        <div style={{ marginBottom: '28px' }}>
          <Link to="/login" style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '-0.5px'
          }}>
            Steria<span style={{ color: '#06b6d4' }}>.</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' && (
            <motion.div
              key="success-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
              }}>
                <CheckCircle2 size={36} color="var(--emerald)" />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                Verifikasi Berhasil! 🎉
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '32px' }}>
                Selamat! Akun Steria Anda telah aktif. Anda sekarang dapat mengakses semua fitur asisten keuangan AI dan alat pelacakan anggaran premium kami.
              </p>

              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'box-shadow 0.2s'
                }}
              >
                Masuk ke Akun <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {status === 'expired' && (
            <motion.div
              key="expired-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)'
              }}>
                <AlertTriangle size={36} color="#f59e0b" />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                Tautan Kedaluwarsa ⏳
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '24px' }}>
                Tautan verifikasi email Anda telah kedaluwarsa (berlaku 24 jam). Silakan masukkan email Anda untuk menerima tautan verifikasi yang baru.
              </p>

              <form onSubmit={handleResend} style={{ textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    marginBottom: '6px',
                    letterSpacing: '0.5px'
                  }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || timer > 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: timer > 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: timer > 0 ? '#6b7280' : '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: (isLoading || timer > 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : timer > 0 ? (
                    `Kirim Ulang dalam ${timer}s`
                  ) : (
                    <>Kirim Ulang Tautan Verifikasi <RefreshCw size={16} /></>
                  )}
                </motion.button>
              </form>
              
              <Link to="/login" style={{
                color: '#a78bfa',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Kembali ke Halaman Masuk
              </Link>
            </motion.div>
          )}

          {status !== 'success' && status !== 'expired' && (
            <motion.div
              key="invalid-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)'
              }}>
                <XCircle size={36} color="#ef4444" />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                Tautan Tidak Valid ❌
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '32px' }}>
                Tautan verifikasi salah atau sudah tidak berlaku lagi. Harap periksa kembali email Anda atau masuk untuk meminta verifikasi baru.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <motion.button
                  onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Ke Halaman Masuk
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Global CSS for Animations */}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
