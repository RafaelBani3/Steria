import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/logo1.png';

/* ─── Keyframe styles ─── */
const GLOBAL_STYLES = `
  @keyframes bgShiftGreen {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes logoFloatGreen {
    0%, 100% { transform: translateY(0px);  filter: drop-shadow(0 0 22px rgba(16,185,129,0.7)); }
    50%       { transform: translateY(-8px); filter: drop-shadow(0 0 32px rgba(16,185,129,1));   }
  }
  @keyframes borderGlowGreen {
    0%, 100% { box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(16,185,129,0); }
    50%       { box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 24px 2px rgba(16,185,129,0.22); }
  }
  @keyframes twinkleG {
    0%, 100% { opacity: 0.12; transform: scale(1);   }
    50%       { opacity: 0.75; transform: scale(1.4); }
  }
  input::placeholder { color: rgba(255,255,255,0.25); }
`;

/* ─── Deterministic stars ─── */
const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: ((i * 113.5) % 100).toFixed(2),
  top:  ((i *  79.1) % 100).toFixed(2),
  size: (1 + (i % 3)),
  dur:  2.5 + (i % 4),
  delay: (i * 0.25) % 4,
}));

/* ─── Orb ─── */
const Orb = ({ style, animateExtra = {} }) => (
  <motion.div
    animate={{ y: [0, -24, 0], x: [0, 10, 0], scale: [1, 1.06, 1], ...animateExtra }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', ...style?.transition }}
    style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }}
  />
);

/* ─── Stagger variants ─── */
const formVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.45 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

export default function Register() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) navigate('/login');
  };

  const inputStyle = (field) => ({
    width: '100%',
    background: focused === field ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.06)',
    border: focused === field ? '1.5px solid rgba(16,185,129,0.75)' : '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: field === 'password' ? '0.85rem 3rem 0.85rem 2.8rem' : '0.85rem 1rem 0.85rem 2.8rem',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.25s ease',
    boxSizing: 'border-box',
    boxShadow: focused === field ? '0 0 0 3px rgba(16,185,129,0.18)' : 'none',
  });

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(-45deg, #0a1f14, #0f2d1e, #062918, #0d2b2a, #0a1228)',
        backgroundSize: '400% 400%',
        animation: 'bgShiftGreen 14s ease infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', position: 'relative', overflow: 'hidden',
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>

        {/* ── Stars ── */}
        {STARS.map(s => (
          <div key={s.id} style={{
            position: 'absolute',
            left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size,
            borderRadius: '50%', background: '#fff',
            animation: `twinkleG ${s.dur}s ${s.delay}s ease-in-out infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* ── Orbs ── */}
        <Orb style={{ width: 340, height: 340, background: 'radial-gradient(circle, rgba(16,185,129,0.38) 0%, transparent 70%)', top: '-100px', left: '-100px', transition: { duration: 8 } }} />
        <Orb style={{ width: 260, height: 260, background: 'radial-gradient(circle, rgba(108,76,241,0.25) 0%, transparent 70%)', bottom: '-70px', right: '-70px', transition: { duration: 9, delay: 1.5 } }} animateExtra={{ x: [0, -12, 0] }} />
        <Orb style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)', top: '35%', right: '6%', transition: { duration: 10, delay: 2.5 } }} />

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 160, damping: 20 }}
          style={{
            width: '100%', maxWidth: '440px',
            background: 'rgba(255,255,255,0.065)',
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            border: '1.5px solid rgba(255,255,255,0.13)',
            borderRadius: '28px', padding: '2.5rem',
            animation: 'borderGlowGreen 4s ease-in-out infinite',
            position: 'relative', zIndex: 10, overflow: 'hidden',
          }}
        >
          {/* Inner highlight line */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />

          {/* ── Logo + Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <img
              src={logo}
              alt="Steria Logo"
              style={{
                width: '78px', height: '78px', objectFit: 'contain',
                margin: '0 auto 1rem', display: 'block',
                animation: 'logoFloatGreen 3.5s ease-in-out infinite',
              }}
            />

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #fff 0%, #6ee7b7 60%, #34d399 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Let's get started!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              style={{ color: 'rgba(255,255,255,0.45)', marginTop: '0.4rem', fontSize: '0.9rem' }}
            >
              Track spending, manage budgets, and grow your savings in one place.
            </motion.p>
          </motion.div>

          {/* ── Error ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem' }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* ── Form (staggered) ── */}
          <motion.form
            onSubmit={handleSubmit}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Full Name */}
            <motion.div variants={itemVariants} whileTap={{ scale: 0.995 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.45 }}>👤</span>
                <input
                  required type="text" value={name}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  style={inputStyle('name')}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants} whileTap={{ scale: 0.995 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.45 }}>✉️</span>
                <input
                  required type="email" value={email}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={inputStyle('email')}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} whileTap={{ scale: 0.995 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.45 }}>🔒</span>
                <input
                  required type={showPass ? 'text' : 'password'} value={password}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={inputStyle('password')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.55, color: '#fff', padding: 0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </motion.div>

            {/* Submit with shimmer */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.965 }}
                style={{
                  marginTop: '0.5rem', width: '100%', padding: '0.95rem',
                  background: isLoading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none', borderRadius: '14px', color: '#fff',
                  fontWeight: 700, fontSize: '1rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', letterSpacing: '0.3px',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {!isLoading && (
                  <motion.span
                    animate={{ x: ['-150%', '350%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '40%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                      transform: 'skewX(-20deg)', pointerEvents: 'none',
                    }}
                  />
                )}
                {isLoading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⏳</motion.span>
                    Creating account...
                  </>
                ) : (
                  <>Create Account →</>
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* ── Divider ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}
          >
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.75rem', letterSpacing: '1px' }}>ALREADY A MEMBER?</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </motion.div>

          {/* ── Login link ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            <Link to="/login"
              style={{ display: 'block', textAlign: 'center', padding: '0.85rem', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
            >
              Sign in to your account →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
