import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, 
  Sparkles, AlertCircle, CheckCircle, RefreshCw, Check 
} from 'lucide-react';
import { toast } from 'sonner';

// Carousel data for left illustration
const SLIDES = [
  {
    title: "AI Financial Copilot",
    tagline: "Track. Budget. Grow.",
    description: "Tanyakan apa saja kepada AI asisten Anda untuk ringkasan pengeluaran otomatis dan rekomendasi keuangan cerdas.",
    type: "ai",
    badge: "AI Powered"
  },
  {
    title: "Smart Budgeting",
    tagline: "Alokasi 50/30/20 Otomatis",
    description: "Kelola keuangan Anda ke dalam Kebutuhan, Keinginan, dan Tabungan secara langsung dengan visualisasi yang indah.",
    type: "budget",
    badge: "Real-time sync"
  },
  {
    title: "Interactive Analytics",
    tagline: "Visualisasi Data Premium",
    description: "Pantau kesehatan keuangan Anda melalui grafik prediktif, analisis riwayat, dan manajemen aset terintegrasi.",
    type: "analytics",
    badge: "Insight-driven"
  }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focused, setFocused] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Carousel timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (success) {
      toast.success('Selamat datang kembali di Steria! ✨');
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = () => {
    toast.info('Fitur pemulihan kata sandi sedang dalam pengembangan ✨');
  };

  return (
    <div className="auth-container">
      {/* ── LEFT SIDE: BRANDING & ILLUSTRATION CAROUSEL (Desktop only) ── */}
      <div className="auth-left">
        {/* Soft animated background elements */}
        <div className="bg-orb purple-orb" />
        <div className="bg-orb cyan-orb" />
        
        {/* Top Header Logo */}
        <div className="left-header">
          <div className="logo-text">
            Steria<span className="logo-dot">.</span>
          </div>
        </div>

        {/* Carousel Content Container */}
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

              {/* Dynamic Interactive Widgets based on slide type */}
              <div className="illustration-container">
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
                        "Anda menghemat <span className="highlight-emerald">Rp450.000</span> minggu ini dengan mengurangi pengeluaran kafe & hiburan."
                      </div>
                    </motion.div>

                    <div className="pulsating-orb-wrapper">
                      <div className="core-orb" />
                      <div className="pulse-ring ring-1" />
                      <div className="pulse-ring ring-2" />
                    </div>
                  </div>
                )}

                {SLIDES[activeSlide].type === 'budget' && (
                  <div className="budget-illustration">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="glass-card budget-card"
                    >
                      <div className="budget-title">Distribusi Bulanan</div>
                      <div className="budget-bars">
                        <div className="bar-group">
                          <div className="bar-labels">
                            <span>Kebutuhan (Needs)</span>
                            <span>50%</span>
                          </div>
                          <div className="bar-bg">
                            <motion.div initial={{ width: 0 }} animate={{ width: "50%" }} transition={{ duration: 1 }} className="bar-fill purple-fill" />
                          </div>
                        </div>
                        <div className="bar-group">
                          <div className="bar-labels">
                            <span>Keinginan (Wants)</span>
                            <span>30%</span>
                          </div>
                          <div className="bar-bg">
                            <motion.div initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ duration: 1, delay: 0.2 }} className="bar-fill cyan-fill" />
                          </div>
                        </div>
                        <div className="bar-group">
                          <div className="bar-labels">
                            <span>Tabungan (Savings)</span>
                            <span>20%</span>
                          </div>
                          <div className="bar-bg">
                            <motion.div initial={{ width: 0 }} animate={{ width: "20%" }} transition={{ duration: 1, delay: 0.4 }} className="bar-fill emerald-fill" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {SLIDES[activeSlide].type === 'analytics' && (
                  <div className="analytics-illustration">
                    <motion.div
                      animate={{ y: [0, -12, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="glass-card chart-card"
                    >
                      <div className="chart-header">
                        <div>
                          <div className="chart-label">Total Aset Aktif</div>
                          <div className="chart-amount">Rp24.500.000</div>
                        </div>
                        <div className="growth-badge">+15.4%</div>
                      </div>
                      <div className="chart-bars">
                        {[40, 55, 48, 70, 85, 60, 95].map((h, i) => (
                          <div key={i} className="chart-bar-container">
                            <motion.div 
                              initial={{ height: 0 }} 
                              animate={{ height: `${h}%` }} 
                              transition={{ duration: 0.8, delay: i * 0.08 }} 
                              className={`chart-bar-fill ${i === 6 ? 'active-bar' : ''}`}
                            />
                            <span className="chart-bar-label">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel indicators */}
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

      {/* ── RIGHT SIDE: AUTHENTICATION FORM ── */}
      <div className="auth-right">
        {/* Soft background glow on mobile */}
        <div className="mobile-only-orb" />

        <div className="auth-card-wrap">
          {/* Logo on Mobile */}
          <div className="mobile-logo-header">
            Steria<span className="logo-dot">.</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="auth-form-card"
          >
            <div className="form-header">
              <h2 className="form-title">Masuk ke Akun</h2>
              <p className="form-subtitle">Kelola dan kembangkan finansial Anda secara otomatis</p>
            </div>

            {/* Error Handlers (Soft & clean UI) */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="error-banner"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Input */}
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
                    placeholder="nama@email.com"
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label">Kata Sandi</label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword} 
                    className="forgot-password-link"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className={`input-field-wrapper ${focused === 'password' ? 'focused' : ''}`}>
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              {/* Remember me */}
              <div className="remember-me-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span className="checkbox-custom">
                    {rememberMe && <Check size={12} color="#fff" strokeWidth={3} />}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--t2, #475569)', userSelect: 'none' }}>Ingat Saya</span>
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Akun
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="form-footer">
              <span style={{ color: 'var(--t3, #64748B)' }}>Belum punya akun?</span>{' '}
              <Link to="/register" className="auth-redirect-link">
                Daftar sekarang
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Embedded CSS styling for modern, premium appearance */}
      <style>{`
        /* Container and base grids */
        .auth-container {
          height: 100vh;
          max-height: 100vh;
          display: grid;
          grid-template-columns: 1fr;
          background-color: var(--bg, #EEF2F6);
          font-family: 'Inter', sans-serif;
          color: var(--t1, #0F172A);
          overflow: hidden;
          position: relative;
        }

        @media (min-width: 1024px) {
          .auth-container {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }

        /* Left Branding Panel */
        .auth-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 60px;
          background: radial-gradient(circle at 10% 10%, #F1F5F9 0%, #EEF2F6 100%);
          border-right: 1px solid rgba(15, 23, 42, 0.06);
          position: relative;
          overflow: hidden;
          height: 100vh;
          max-height: 100vh;
        }

        @media (min-width: 1024px) {
          .auth-left {
            display: flex;
          }
        }

        /* Ambient Orbs */
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
          background: radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%);
        }

        .cyan-orb {
          bottom: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);
        }

        .mobile-only-orb {
          position: absolute;
          top: -150px;
          right: -100px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }

        @media (min-width: 1024px) {
          .mobile-only-orb {
            display: none;
          }
        }

        /* Branding logo styles */
        .left-header {
          position: relative;
          z-index: 10;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: var(--t1, #0F172A);
        }

        .logo-dot {
          color: var(--cyan, #06b6d4);
        }

        /* Carousel Panel */
        .carousel-wrapper {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-top: 20px;
        }

        .carousel-slide {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }

        .badge-wrapper {
          margin-bottom: 12px;
        }

        .slide-badge {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.18);
          color: #4F46E5;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slide-title {
          font-size: 36px;
          font-weight: 850;
          margin: 0;
          letter-spacing: -1px;
          line-height: 1.15;
          background: linear-gradient(135deg, #0F172A 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
        }

        .slide-tagline {
          font-size: 14px;
          font-weight: 700;
          color: var(--violet, #6366F1);
          margin: 6px 0 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .slide-desc {
          font-size: 14px;
          line-height: 1.6;
          color: var(--t2, #475569);
          max-width: 440px;
          margin: 0 0 24px 0;
        }

        .carousel-indicators {
          display: flex;
          gap: 8px;
          margin-top: 24px;
        }

        .indicator-dot {
          width: 24px;
          height: 4px;
          border-radius: 2px;
          background: rgba(15, 23, 42, 0.12);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .indicator-dot.active {
          background: var(--violet, #6366F1);
          width: 40px;
        }

        /* Widgets and Illustrations */
        .illustration-container {
          width: 100%;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          position: relative;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);
        }

        /* AI Illustration styles */
        .ai-illustration {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .ai-response-card {
          max-width: 320px;
          z-index: 10;
          border-left: 3px solid var(--violet, #6366F1);
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
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--t1, #0F172A);
        }

        .card-body {
          font-size: 13px;
          line-height: 1.5;
          color: var(--t2, #475569);
        }

        .highlight-emerald {
          color: var(--emerald, #10b981);
          font-weight: 700;
        }

        .pulsating-orb-wrapper {
          position: absolute;
          left: 280px;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .core-orb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4 0%, #6366F1 100%);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
          z-index: 5;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(6, 182, 212, 0.15);
          width: 100%;
          height: 100%;
          animation: pulse 4s infinite linear;
        }

        .ring-2 {
          animation-delay: 2s;
        }

        @keyframes pulse {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        /* Budget Illustration */
        .budget-card {
          width: 320px;
        }

        .budget-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--t1, #0F172A);
          margin-bottom: 16px;
        }

        .budget-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bar-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: var(--t3, #64748B);
        }

        .bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(15, 23, 42, 0.05);
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        .purple-fill { background: var(--violet, #6366F1); }
        .cyan-fill { background: var(--cyan, #06b6d4); }
        .emerald-fill { background: var(--emerald, #10b981); }

        /* Chart Illustration */
        .chart-card {
          width: 340px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .chart-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--t3, #64748B);
        }

        .chart-amount {
          font-size: 18px;
          font-weight: 800;
          color: var(--t1, #0F172A);
          margin-top: 2px;
        }

        .growth-badge {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.18);
          color: var(--emerald, #10b981);
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .chart-bars {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 100px;
          padding-top: 10px;
        }

        .chart-bar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .chart-bar-fill {
          width: 14px;
          background: rgba(15, 23, 42, 0.06);
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .active-bar {
          background: var(--grad-brand, linear-gradient(135deg, #6366F1 0%, #4F46E5 100%));
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .chart-bar-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--t3, #64748B);
        }

        /* Right Authentication Panel */
        .auth-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 24px 24px;
          position: relative;
          z-index: 10;
          background: #FFFFFF;
          height: 100vh;
          max-height: 100vh;
          overflow-y: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .auth-right::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 640px) {
          .auth-right {
            padding: 40px 48px;
          }
        }

        @media (min-width: 1024px) {
          .auth-right {
            padding: 40px 60px;
            background: #FFFFFF;
          }
        }

        .auth-card-wrap {
          width: 100%;
          max-width: 420px;
          margin: auto 0;
        }

        .mobile-logo-header {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 16px;
          text-align: center;
          color: var(--t1, #0F172A);
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
          margin-bottom: 10px;
        }

        .form-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          color: var(--t1, #0F172A);
        }

        .form-subtitle {
          font-size: 12.5px;
          color: var(--t2, #475569);
          margin: 2px 0 0 0;
        }

        /* Error/Warning Banners */
        .error-banner {
          background: rgba(244, 63, 94, 0.06);
          border: 1px solid rgba(244, 63, 94, 0.15);
          color: #E11D48;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .verification-warning {
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
          color: #D97706;
        }

        .warning-content {
          flex: 1;
        }

        .resend-inline-btn {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.18);
          color: #D97706;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .resend-inline-btn:hover {
          background: rgba(245, 158, 11, 0.15);
        }

        /* Form Controls */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .input-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--t2, #475569);
        }

        .input-field-wrapper {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid rgba(15, 23, 42, 0.09);
          border-radius: 8px;
          padding: 0 10px;
          transition: all 0.25s ease;
          position: relative;
          box-sizing: border-box;
        }

        .input-field-wrapper:hover {
          border-color: rgba(15, 23, 42, 0.18);
        }

        .input-field-wrapper.focused {
          background: #FFFFFF;
          border-color: var(--violet, #6366F1);
          box-shadow: 0 0 0 3px var(--violet-dim, rgba(99, 102, 241, 0.06));
        }

        .input-icon {
          color: var(--t3, #64748B);
          margin-right: 8px;
        }

        .auth-input {
          flex: 1;
          height: 36px;
          background: none;
          border: none;
          color: var(--t1, #0F172A);
          font-size: 13px;
          outline: none;
          padding: 0;
          box-sizing: border-box;
          width: 100%;
        }

        .auth-input::placeholder {
          color: var(--t4, #94A3B8);
        }

        /* Prevent autofill style breakage */
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:hover,
        .auth-input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--t1, #0F172A);
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .password-toggle-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: var(--t3, #64748B);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .password-toggle-btn:hover {
          color: var(--t2, #475569);
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: var(--violet, #6366F1);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .forgot-password-link:hover {
          text-decoration: underline;
        }

        /* Checkbox remembered */
        .remember-me-container {
          margin-top: 4px;
        }

        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .auth-checkbox {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(15, 23, 42, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .checkbox-label:hover .checkbox-custom {
          border-color: rgba(15, 23, 42, 0.3);
        }

        .auth-checkbox:checked + .checkbox-custom {
          background: var(--grad-brand, linear-gradient(135deg, #6366F1 0%, #4F46E5 100%));
          border-color: var(--violet, #6366F1);
        }

        /* Submit Button */
        .submit-btn {
          margin-top: 6px;
          height: 38px;
          width: 100%;
          background: var(--grad-brand, linear-gradient(135deg, #6366F1 0%, #4F46E5 100%));
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: var(--shadow-brand, 0 4px 20px rgba(99, 102, 241, 0.18));
          transition: all 0.2s;
        }

        .submit-btn:disabled {
          background: rgba(15, 23, 42, 0.04);
          color: var(--t4, #94A3B8);
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
          margin-top: 16px;
          text-align: center;
          font-size: 13px;
          color: var(--t2, #475569);
        }

        .auth-redirect-link {
          color: var(--violet, #6366F1);
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
