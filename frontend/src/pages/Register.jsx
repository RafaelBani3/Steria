import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, 
  Sparkles, Check, X, Info, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

// Carousel data for left illustration
const SLIDES = [
  {
    title: "Mulai Perjalanan Anda",
    tagline: "Track. Budget. Grow.",
    description: "Bergabunglah dengan Steria untuk mengotomatiskan pengelolaan keuangan pribadi Anda dengan kecerdasan buatan.",
    type: "welcome",
    badge: "Premium Experience"
  },
  {
    title: "Asisten AI 24/7",
    tagline: "Saran Finansial Cerdas",
    description: "Dapatkan wawasan penghematan instan dan visualisasi anggaran interaktif kapan saja Anda membutuhkannya.",
    type: "ai",
    badge: "AI Copilot"
  },
  {
    title: "Keamanan Tingkat Tinggi",
    tagline: "Data Terenkripsi Aman",
    description: "Kami menggunakan standar enkripsi tercanggih untuk memastikan informasi finansial Anda tetap aman dan privat.",
    type: "security",
    badge: "Bank-Grade Security"
  }
];

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [showRetypePass, setShowRetypePass] = useState(false);
  const [focused, setFocused] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  const { register, resendVerification, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Carousel timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Realtime password validations
  const isLengthValid = password.length >= 6;
  const isMatchValid = password.length > 0 && password === retypePassword;
  const showValidation = focused === 'password' || focused === 'retypePassword' || password.length > 0 || retypePassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLengthValid) {
      toast.error('Kata sandi harus minimal 6 karakter.');
      return;
    }
    if (!isMatchValid) {
      toast.error('Kata sandi konfirmasi tidak cocok.');
      return;
    }

    const success = await register(fullName, username, email, phoneNumber, password);
    if (success) {
      toast.success('Pendaftaran berhasil! Silakan verifikasi email Anda 🎉');
      setRegisteredEmail(email);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    const result = await resendVerification(registeredEmail);
    if (result.success) {
      toast.success('Email verifikasi telah dikirim ulang ✨');
    } else {
      toast.error(result.error || 'Gagal mengirim ulang email verifikasi.');
    }
  };

  return (
    <div className="auth-container">
      {/* ── LEFT SIDE: BRANDING & ILLUSTRATION CAROUSEL (Desktop only) ── */}
      <div className="auth-left">
        <div className="bg-orb purple-orb" />
        <div className="bg-orb cyan-orb" />
        
        <div className="left-header">
          <div className="logo-text">
            Steria<span className="logo-dot">.</span>
          </div>
        </div>

        <div className="carousel-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="carousel-slide"
            >
              <div className="badge-wrapper">
                <span className="slide-badge">{SLIDES[activeSlide].badge}</span>
              </div>
              <h1 className="slide-title">{SLIDES[activeSlide].title}</h1>
              <p className="slide-tagline">{SLIDES[activeSlide].tagline}</p>
              <p className="slide-desc">{SLIDES[activeSlide].description}</p>

              {/* Dynamic Interactive Widgets based on slide */}
              <div className="illustration-container">
                {SLIDES[activeSlide].type === 'welcome' && (
                  <div className="welcome-illustration">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="glass-card welcome-card"
                    >
                      <div className="card-lbl">Total Nilai Tabungan</div>
                      <div className="card-val">Rp48.200.000</div>
                      <div className="card-growth">
                        <Check size={14} color="#10b981" style={{ marginRight: 4 }} />
                        Meningkat 22% bulan ini
                      </div>
                    </motion.div>
                  </div>
                )}

                {SLIDES[activeSlide].type === 'ai' && (
                  <div className="ai-illustration">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="glass-card ai-response-card"
                    >
                      <div className="card-header">
                        <div className="ai-avatar">
                          <Sparkles size={14} color="#06b6d4" />
                        </div>
                        <div className="ai-name">Steria Copilot</div>
                      </div>
                      <div className="card-body">
                        "Selamat! Anda berhasil mencapai target tabungan <span className="highlight-emerald">Dana Darurat</span> lebih cepat 8 hari."
                      </div>
                    </motion.div>
                  </div>
                )}

                {SLIDES[activeSlide].type === 'security' && (
                  <div className="security-illustration">
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="glass-card security-card"
                    >
                      <div className="security-title">
                        <span className="secure-badge">🛡️ SECURE</span>
                        Enkripsi End-to-End
                      </div>
                      <p className="security-body">
                        Koneksi bank dan data transaksi Anda dilindungi dengan standar keamanan enkripsi AES-256 tingkat perbankan.
                      </p>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="carousel-indicators">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`indicator-dot ${index === activeSlide ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: FORM / SUCCESS STATE ── */}
      <div className="auth-right">
        <div className="mobile-only-orb" />

        <div className="auth-card-wrap">
          <div className="mobile-logo-header">
            Steria<span className="logo-dot">.</span>
          </div>

          <AnimatePresence mode="wait">
            {!registeredEmail ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="auth-form-card"
              >
                <div className="form-header">
                  <h2 className="form-title">Daftar Akun Baru</h2>
                  <p className="form-subtitle">Mulai kelola aset dan pengeluaran Anda dengan cerdas</p>
                </div>

                {error && (
                  <div className="error-banner">
                    <X size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                  {/* Full Name */}
                  <div className="input-group">
                    <label className="input-label">Nama Lengkap</label>
                    <div className={`input-field-wrapper ${focused === 'fullName' ? 'focused' : ''}`}>
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onFocus={() => setFocused('fullName')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="auth-input"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <div className={`input-field-wrapper ${focused === 'username' ? 'focused' : ''}`}>
                      <User size={18} className="input-icon" style={{ opacity: 0.7 }} />
                      <input
                        type="text"
                        required
                        value={username}
                        onFocus={() => setFocused('username')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe12"
                        className="auth-input"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="input-group">
                    <label className="input-label">Alamat Email</label>
                    <div className={`input-field-wrapper ${focused === 'email' ? 'focused' : ''}`}>
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        required
                        value={email}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="johndoe@email.com"
                        className="auth-input"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="input-group">
                    <label className="input-label">Nomor Telepon</label>
                    <div className={`input-field-wrapper ${focused === 'phoneNumber' ? 'focused' : ''}`}>
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onFocus={() => setFocused('phoneNumber')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="081234567890"
                        className="auth-input"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="input-group">
                    <label className="input-label">Kata Sandi</label>
                    <div className={`input-field-wrapper ${focused === 'password' ? 'focused' : ''}`}>
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={password}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="auth-input"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="password-toggle-btn"
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Retype Password */}
                  <div className="input-group">
                    <label className="input-label">Ulangi Kata Sandi</label>
                    <div className={`input-field-wrapper ${focused === 'retypePassword' ? 'focused' : ''}`}>
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showRetypePass ? 'text' : 'password'}
                        required
                        value={retypePassword}
                        onFocus={() => setFocused('retypePassword')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setRetypePassword(e.target.value)}
                        placeholder="Ulangi kata sandi Anda"
                        className="auth-input"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRetypePass(!showRetypePass)}
                        className="password-toggle-btn"
                      >
                        {showRetypePass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Interactive Realtime Validations */}
                  <AnimatePresence>
                    {showValidation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="validation-container"
                      >
                        <div className="validation-item">
                          {isLengthValid ? (
                            <Check size={14} className="val-icon valid" />
                          ) : (
                            <X size={14} className="val-icon invalid" />
                          )}
                          <span className={`val-text ${isLengthValid ? 'valid' : 'invalid'}`}>
                            Kata sandi minimal 6 karakter
                          </span>
                        </div>
                        <div className="validation-item">
                          {isMatchValid ? (
                            <Check size={14} className="val-icon valid" />
                          ) : (
                            <X size={14} className="val-icon invalid" />
                          )}
                          <span className={`val-text ${isMatchValid ? 'valid' : 'invalid'}`}>
                            Kata sandi cocok satu sama lain
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || !isLengthValid || !isMatchValid}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className="submit-btn"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Mendaftarkan...
                      </>
                    ) : (
                      <>
                        Daftar Akun Baru
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="form-footer">
                  <span style={{ color: '#9ca3af' }}>Sudah punya akun?</span>{' '}
                  <Link to="/login" className="auth-redirect-link">
                    Masuk sekarang
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* Success Flow: Instruction to verify email */
              <motion.div
                key="signup-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="success-overlay-card"
              >
                <div className="success-icon-wrap">
                  <CheckCircle2 size={40} color="#10b981" />
                </div>
                
                <h2 className="success-title">Periksa Email Anda! 📩</h2>
                <p className="success-desc">
                  Tautan aktivasi telah dikirim ke <span className="highlight-email">{registeredEmail}</span>. 
                  Silakan periksa kotak masuk (atau folder spam) untuk mengaktifkan akun Anda.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
                  <motion.button
                    onClick={() => navigate('/login')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="submit-btn"
                  >
                    Ke Halaman Masuk
                  </motion.button>
                  
                  <button 
                    onClick={handleResend}
                    className="btn-link"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a78bfa',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    Tidak menerima email? Kirim ulang <RefreshCw size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        /* Reuse baseline layouts from login page styled globally */
        .auth-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr;
          background-color: #070a13;
          font-family: 'Inter', sans-serif;
          color: #fff;
          overflow: hidden;
          position: relative;
        }

        @media (min-width: 1024px) {
          .auth-container {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }

        .auth-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 80px;
          background: radial-gradient(circle at 10% 10%, #0d1324 0%, #070a13 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .auth-left {
            display: flex;
          }
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.45;
        }

        .purple-orb {
          top: -100px;
          left: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%);
        }

        .cyan-orb {
          bottom: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
        }

        .mobile-only-orb {
          position: absolute;
          top: -150px;
          right: -100px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }

        @media (min-width: 1024px) {
          .mobile-only-orb {
            display: none;
          }
        }

        .left-header {
          position: relative;
          z-index: 10;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .logo-dot {
          color: #06b6d4;
        }

        .carousel-wrapper {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-top: 40px;
        }

        .carousel-slide {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }

        .badge-wrapper {
          margin-bottom: 16px;
        }

        .slide-badge {
          background: rgba(124, 58, 237, 0.12);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #a78bfa;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slide-title {
          font-size: 40px;
          font-weight: 850;
          margin: 0;
          letter-spacing: -1px;
          line-height: 1.15;
          background: linear-gradient(135deg, #fff 0%, #d1d5db 100%);
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
        }

        .slide-tagline {
          font-size: 15px;
          font-weight: 700;
          color: #06b6d4;
          margin: 8px 0 16px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .slide-desc {
          font-size: 15px;
          line-height: 1.6;
          color: #9ca3af;
          max-width: 440px;
          margin: 0 0 40px 0;
        }

        .carousel-indicators {
          display: flex;
          gap: 8px;
          margin-top: 32px;
        }

        .indicator-dot {
          width: 24px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .indicator-dot.active {
          background: #7c3aed;
          width: 40px;
        }

        .illustration-container {
          width: 100%;
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          position: relative;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
        }

        /* Welcome Slide Card */
        .welcome-card {
          width: 280px;
          border-left: 3px solid #10b981;
        }

        .card-lbl {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .card-val {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin: 6px 0 8px;
        }

        .card-growth {
          display: flex;
          align-items: center;
          font-size: 12px;
          font-weight: 700;
          color: #10b981;
        }

        /* AI Slide Card */
        .ai-response-card {
          max-width: 320px;
          border-left: 3px solid #7c3aed;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .ai-avatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-name {
          font-size: 12px;
          font-weight: 700;
          color: #e5e7eb;
        }

        .card-body {
          font-size: 13px;
          line-height: 1.5;
          color: #9ca3af;
        }

        .highlight-emerald {
          color: #34d399;
          font-weight: 700;
        }

        /* Security Card */
        .security-card {
          max-width: 300px;
          border-left: 3px solid #06b6d4;
        }

        .security-title {
          font-size: 14px;
          font-weight: 700;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .secure-badge {
          align-self: flex-start;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          color: #06b6d4;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .security-body {
          font-size: 12.5px;
          line-height: 1.5;
          color: #9ca3af;
          margin: 0;
        }

        /* Right Panel */
        .auth-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
          z-index: 10;
        }

        @media (min-width: 640px) {
          .auth-right {
            padding: 60px 48px;
          }
        }

        @media (min-width: 1024px) {
          .auth-right {
            padding: 60px 80px;
            background: #080c18;
          }
        }

        .auth-card-wrap {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
        }

        .mobile-logo-header {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 32px;
          text-align: center;
        }

        @media (min-width: 1024px) {
          .mobile-logo-header {
            display: none;
          }
        }

        .auth-form-card {
          width: 100%;
        }

        .form-header {
          margin-bottom: 24px;
        }

        .form-title {
          font-size: 26px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 14px;
          color: #9ca3af;
          margin: 6px 0 0 0;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
        }

        .input-field-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 0 16px;
          transition: all 0.25s ease;
          position: relative;
          box-sizing: border-box;
        }

        .input-field-wrapper:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .input-field-wrapper.focused {
          background: rgba(124, 58, 237, 0.06);
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }

        .input-icon {
          color: #9ca3af;
          margin-right: 12px;
        }

        .auth-input {
          flex: 1;
          height: 46px;
          background: none;
          border: none;
          color: #fff;
          font-size: 14.5px;
          outline: none;
          padding: 0;
          box-sizing: border-box;
          width: 100%;
        }

        .auth-input::placeholder {
          color: #4b5563;
        }

        .password-toggle-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        /* Validation List */
        .validation-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
          background: rgba(255,255,255,0.015);
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .validation-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .val-icon {
          flex-shrink: 0;
        }

        .val-icon.valid {
          color: #10b981;
        }

        .val-icon.invalid {
          color: #ef4444;
          opacity: 0.6;
        }

        .val-text {
          font-size: 12px;
          transition: color 0.2s;
        }

        .val-text.valid {
          color: #10b981;
        }

        .val-text.invalid {
          color: #9ca3af;
          opacity: 0.75;
        }

        /* Success Overlay Card */
        .success-overlay-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 0;
        }

        .success-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.15);
        }

        .success-title {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .success-desc {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .highlight-email {
          color: #fff;
          font-weight: 700;
          text-decoration: underline;
          text-decoration-color: #7c3aed;
        }

        /* Submit Button */
        .submit-btn {
          margin-top: 10px;
          height: 48px;
          width: 100%;
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
          transition: all 0.2s;
        }

        .submit-btn:disabled {
          background: rgba(255,255,255,0.06);
          color: #6b7280;
          cursor: not-allowed;
          box-shadow: none;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .form-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 13.5px;
        }

        .auth-redirect-link {
          color: #a78bfa;
          font-weight: 600;
          text-decoration: none;
        }

        .auth-redirect-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
