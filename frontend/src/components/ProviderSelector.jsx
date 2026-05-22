import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROVIDERS = [
  // ── Bank Digital & Bank Umum ──────────────────────────────────
  { name: 'Bank Central Asia (BCA)', category: 'BANK', emoji: '🏦', color: '#0066AE' },
  { name: 'Bank Mandiri', category: 'BANK', emoji: '🏦', color: '#003D7A' },
  { name: 'Bank Negara Indonesia (BNI)', category: 'BANK', emoji: '🏦', color: '#F48024' },
  { name: 'Bank Rakyat Indonesia (BRI)', category: 'BANK', emoji: '🏦', color: '#00529B' },
  { name: 'CIMB Niaga', category: 'BANK', emoji: '🏦', color: '#C0392B' },
  { name: 'PermataBank', category: 'BANK', emoji: '🏦', color: '#8B1C3C' },
  { name: 'Bank Danamon', category: 'BANK', emoji: '🏦', color: '#E63946' },
  { name: 'Bank Tabungan Negara (BTN)', category: 'BANK', emoji: '🏦', color: '#F5A623' },
  { name: 'OCBC NISP', category: 'BANK', emoji: '🏦', color: '#D0021B' },
  { name: 'Maybank Indonesia', category: 'BANK', emoji: '🏦', color: '#F7B731' },
  { name: 'Jenius', category: 'BANK', emoji: '💙', color: '#2980B9' },
  { name: 'SeaBank Indonesia', category: 'BANK', emoji: '🌊', color: '#2F855A' },
  { name: 'Bank Jago', category: 'BANK', emoji: '🐆', color: '#E63946' },
  { name: 'blu by BCA Digital', category: 'BANK', emoji: '💎', color: '#0066AE' },
  { name: 'NeoBank', category: 'BANK', emoji: '🏦', color: '#6C3483' },
  { name: 'Allo Bank', category: 'BANK', emoji: '🏦', color: '#E63946' },
  { name: 'Line Bank', category: 'BANK', emoji: '🟢', color: '#00B900' },
  { name: 'DBS Indonesia', category: 'BANK', emoji: '🏦', color: '#D0021B' },
  { name: 'HSBC Indonesia', category: 'BANK', emoji: '🏦', color: '#DB0011' },
  { name: 'UOB Indonesia', category: 'BANK', emoji: '🏦', color: '#003882' },
  { name: 'Superbank', category: 'BANK', emoji: '🏦', color: '#00C853' },
  { name: 'Krom Bank', category: 'BANK', emoji: '🏦', color: '#6200EA' },
  { name: 'Bank Saqu', category: 'BANK', emoji: '🏦', color: '#F50057' },
  { name: 'MotionBank', category: 'BANK', emoji: '🏦', color: '#E91E63' },
  { name: 'TMRW by UOB', category: 'BANK', emoji: '🏦', color: '#003882' },
  { name: 'Digibank by DBS', category: 'BANK', emoji: '🏦', color: '#D0021B' },
  { name: 'Bank Raya', category: 'BANK', emoji: '🏦', color: '#0077B6' },
  { name: 'BNC Digital', category: 'BANK', emoji: '🏦', color: '#1A237E' },
  { name: 'Komunal', category: 'BANK', emoji: '🏦', color: '#2E7D32' },

  // ── E-Wallet / Digital Wallet ─────────────────────────────────
  { name: 'OVO', category: 'E_WALLET', emoji: '💜', color: '#4C3494' },
  { name: 'GoPay', category: 'E_WALLET', emoji: '💚', color: '#00B14F' },
  { name: 'DANA', category: 'E_WALLET', emoji: '💙', color: '#0066FF' },
  { name: 'ShopeePay', category: 'E_WALLET', emoji: '🧡', color: '#EE4D2D' },
  { name: 'LinkAja', category: 'E_WALLET', emoji: '❤️', color: '#E02020' },
  { name: 'iSaku', category: 'E_WALLET', emoji: '💛', color: '#F5A623' },
  { name: 'Sakuku', category: 'E_WALLET', emoji: '💳', color: '#0066AE' },
  { name: 'AstraPay', category: 'E_WALLET', emoji: '⭐', color: '#1565C0' },
  { name: 'DOKU', category: 'E_WALLET', emoji: '🔷', color: '#0077B6' },
  { name: 'PayPal', category: 'E_WALLET', emoji: '🌐', color: '#003087' },
  { name: 'Bibit', category: 'E_WALLET', emoji: '🌱', color: '#10B981' },

  // ── Cash & Other ──────────────────────────────────────────────
  { name: 'Cash', category: 'CASH', emoji: '💵', color: '#27AE60' },
  { name: 'Wallet', category: 'CASH', emoji: '👛', color: '#8B4513' },
  { name: 'Other', category: 'OTHER', emoji: '📦', color: '#6B7280' },
];

const GROUP_LABELS = {
  BANK: '🏦 Banks',
  E_WALLET: '📱 E-Wallets',
  CASH: '💵 Cash & Wallet',
  OTHER: '📦 Other',
};

export default function ProviderSelector({ value, onChange, placeholder = 'Select provider...' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = PROVIDERS.find((p) => p.name === value);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search
    ? PROVIDERS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : PROVIDERS;

  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          background: 'var(--bg-elevated)',
          border: open
            ? '1.5px solid var(--clr-violet)'
            : '1.5px solid var(--glass-border-strong)',
          boxShadow: open ? '0 0 0 3px var(--violet-glow)' : 'none',
          color: 'var(--clr-text)',
          fontSize: '14px',
          minHeight: 46,
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: 20 }}>{selected.emoji}</span>
            <span className="flex-1 font-medium">{selected.name}</span>
            <span
              className="badge badge-purple text-xs"
              style={{ fontSize: 10 }}
            >
              {selected.category.replace('_', ' ')}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--clr-text-3)' }}>{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          style={{
            color: 'var(--clr-text-3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              zIndex: 200,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {/* Search */}
            <div
              style={{
                padding: '12px',
                borderBottom: '1px solid var(--glass-border)',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-elevated)',
                zIndex: 1,
              }}
            >
              <div className="relative">
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--clr-text-3)',
                  }}
                />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search provider..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    background: 'var(--bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 10,
                    color: 'var(--clr-text)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--clr-text-3)',
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Options */}
            <div style={{ padding: '8px 0' }}>
              {Object.entries(grouped).map(([category, providers]) => (
                <div key={category}>
                  <div
                    style={{
                      padding: '6px 14px 4px',
                      fontSize: 11,
                      color: 'var(--clr-text-3)',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {GROUP_LABELS[category] || category}
                  </div>
                  {providers.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        onChange(p.name, p.category, p.color, p.emoji);
                        setOpen(false);
                        setSearch('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 14px',
                        background: value === p.name ? 'rgba(124,58,237,0.12)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--clr-text)',
                        fontSize: 14,
                        textAlign: 'left',
                        transition: 'background 0.15s',
                        fontFamily: 'inherit',
                        fontWeight: value === p.name ? 600 : 500,
                      }}
                      onMouseEnter={(e) => {
                        if (value !== p.name) e.currentTarget.style.background = 'var(--bg)';
                      }}
                      onMouseLeave={(e) => {
                        if (value !== p.name) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{p.emoji}</span>
                      <span style={{ flex: 1, fontWeight: value === p.name ? 600 : 400 }}>{p.name}</span>
                      {value === p.name && (
                        <span style={{ color: 'var(--clr-purple)', fontSize: 12 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { PROVIDERS };
