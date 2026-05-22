import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, X, Bot, CheckCircle2,
  AlertTriangle, Sparkles, MessageSquare, Zap,
} from 'lucide-react';
import { useAIStore } from '../store/useAIStore';

// ─── Particle background (pure CSS-in-JS, no external dep) ───────────────────
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  duration: 3 + Math.random() * 4,
  delay: Math.random() * 3,
}));

// ─── Voice wave bars ──────────────────────────────────────────────────────────
const WAVE_BARS = [0.6, 1.0, 1.4, 1.8, 1.4, 1.0, 0.6, 1.2, 0.8, 1.6, 1.0, 0.7];

// ─── Quick suggestions ────────────────────────────────────────────────────────
const QUICK_CHIPS = [
  'Beli kopi 25rb pake OVO',
  'Gajian 8 juta',
  'Transfer 500rb ke tabungan',
  'Gimana kondisi keuangan gue?',
];

export default function AIAssistantModal() {
  const {
    isOpen, closeModal,
    isListening, setListening,
    isProcessing,
    transcript, setTranscript,
    aiResponse, error, setError,
    processMessage, clearResponse,
    inputMode, setInputMode,
  } = useAIStore();

  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Speech recognition setup ─────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'id-ID';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let full = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full);

      // Auto-stop after 3s of silence
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
      }, 3000);
    };

    recognition.onerror = (event) => {
      console.error('SR error:', event.error);
      setListening(false);
      if (event.error === 'not-allowed') {
        setError('Akses mikrofon ditolak. Aktifkan izin mikrofon di browser kamu.');
      } else {
        setError(`Gagal merekam suara (${event.error}). Coba mode teks ya.`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const currentText = useAIStore.getState().transcript;
      if (currentText?.trim()) {
        processMessage(currentText);
      }
    };

    recognitionRef.current = recognition;
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // ── Cleanup on modal close ───────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setTextInput('');
    }
  }, [isOpen]);

  // ── Auto-focus text input when mode switches ─────────────
  useEffect(() => {
    if (inputMode === 'text' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputMode, isOpen]);

  const toggleListening = () => {
    clearResponse();
    setError(null);
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setError('Browser kamu tidak mendukung voice recognition. Gunakan mode teks ya.');
        return;
      }
      setTranscript('');
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    processMessage(textInput.trim());
    setTextInput('');
  };

  const handleChipClick = (text) => {
    if (inputMode === 'voice') {
      setInputMode('text');
    }
    setTextInput(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!isOpen) return null;

  // ── State flags ──────────────────────────────────────────
  const isSuccess = aiResponse?.success && aiResponse?.tasks?.length > 0;
  const hasTasks  = aiResponse?.tasks?.filter(t => t.intent !== 'INQUIRY' && t.result).length > 0;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 24 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', width: '100%', maxWidth: 480,
            borderRadius: 28, overflow: 'hidden',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Ambient gradient top */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 280, height: 100,
            background: 'radial-gradient(ellipse, rgba(108,76,241,0.25) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Floating particles */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {PARTICLES.map(p => (
              <motion.div
                key={p.id}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.15, 0.45, 0.15],
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`, top: `${p.y}%`,
                  width: p.size, height: p.size,
                  borderRadius: '50%',
                  background: 'var(--clr-violet)',
                }}
              />
            ))}
          </div>

          {/* ── Header ─────────────────────────────────────── */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'var(--violet-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(108,76,241,0.2)',
              }}>
                <Bot size={18} color="var(--clr-violet)" strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--clr-text)' }}>
                  Steria Copilot
                </p>
                <p style={{ fontSize: 10, color: 'var(--clr-text-3)', fontWeight: 600 }}>
                  AI Financial Assistant
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              style={{
                width: 32, height: 32, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg)', border: '1px solid var(--glass-border)',
                cursor: 'pointer', color: 'var(--clr-text-3)',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Main Content ────────────────────────────────── */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '28px 24px 16px', gap: 20, minHeight: 260,
          }}>

            {/* Central AI Orb */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Processing orbit ring */}
              {isProcessing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', inset: -10,
                    borderRadius: '50%',
                    border: '1.5px dashed rgba(108,76,241,0.4)',
                  }}
                />
              )}
              {/* Outer glow ring when listening */}
              {isListening && (
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: -14, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(108,76,241,0.4) 0%, transparent 70%)',
                  }}
                />
              )}

              {/* Orb button */}
              <motion.button
                animate={{
                  scale: isListening ? [1, 1.08, 1] : isProcessing ? [1, 1.04, 1] : [1, 1.02, 1],
                  boxShadow: isListening
                    ? ['0 0 24px rgba(108,76,241,0.6)', '0 0 48px rgba(108,76,241,0.9)', '0 0 24px rgba(108,76,241,0.6)']
                    : ['0 8px 32px rgba(108,76,241,0.3)', '0 12px 40px rgba(108,76,241,0.4)', '0 8px 32px rgba(108,76,241,0.3)'],
                }}
                transition={{ duration: isListening ? 1.2 : 2.5, repeat: Infinity }}
                onClick={inputMode === 'voice' ? toggleListening : undefined}
                disabled={isProcessing && inputMode === 'voice'}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: isListening
                    ? 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #6C4CF1 100%)'
                    : isSuccess
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #6C4CF1 0%, #9D5CFF 60%, #C084FC 100%)',
                  border: 'none', cursor: inputMode === 'voice' ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {isSuccess
                  ? <CheckCircle2 size={34} color="#fff" strokeWidth={1.8} />
                  : isProcessing
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles size={30} color="#fff" strokeWidth={1.8} />
                      </motion.div>
                    : <Sparkles size={30} color="#fff" strokeWidth={1.8} />
                }
              </motion.button>

              {/* Voice wave bars (visible only when listening) */}
              <AnimatePresence>
                {isListening && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 3, pointerEvents: 'none',
                  }}>
                    {WAVE_BARS.map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${6}px`, `${24 * h}px`, `${6}px`] }}
                        transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                        style={{ width: 3, borderRadius: 2, background: 'rgba(255,255,255,0.85)' }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Status text area */}
            <div style={{ width: '100%', textAlign: 'center', minHeight: 56 }}>
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 12,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                      color: '#ef4444', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span style={{ textAlign: 'left' }}>{error}</span>
                  </motion.div>
                ) : isProcessing ? (
                  <motion.p
                    key="processing"
                    initial={{ opacity: 0 }} animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-violet)', textTransform: 'uppercase', letterSpacing: '0.7px' }}
                  >
                    Memproses transaksi keuangan...
                  </motion.p>
                ) : isListening ? (
                  <motion.p
                    key="listening"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--clr-text)',
                      fontStyle: 'italic', lineHeight: 1.5,
                    }}
                  >
                    {transcript ? `"${transcript}"` : 'Mendengarkan... bicara sekarang 🎙️'}
                  </motion.p>
                ) : aiResponse?.message ? (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'var(--bg)', borderRadius: 14, padding: '12px 14px',
                      border: '1px solid var(--glass-border)', textAlign: 'left',
                    }}
                  >
                    <p style={{
                      fontSize: 13.5, lineHeight: 1.65, color: 'var(--clr-text)',
                      fontWeight: 500, whiteSpace: 'pre-wrap',
                    }}>
                      {aiResponse.message}
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 12, color: 'var(--clr-text-3)', fontWeight: 500 }}
                  >
                    {inputMode === 'voice'
                      ? 'Tap tombol orb di atas, lalu bicara 🎙️'
                      : 'Ketik transaksi atau pertanyaan keuangan kamu 💬'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Task confirmation card */}
            <AnimatePresence>
              {hasTasks && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', damping: 20 }}
                  style={{
                    width: '100%', borderRadius: 16,
                    background: 'var(--bg)', border: '1px solid var(--glass-border)',
                    padding: '12px 14px',
                  }}
                >
                  {aiResponse.tasks
                    .filter(t => t.intent !== 'INQUIRY' && t.result)
                    .map((task, idx) => {
                      const colors = {
                        EXPENSE:    { bg: 'rgba(239,68,68,0.08)',  text: '#ef4444',  label: 'rgba(239,68,68,0.15)' },
                        INCOME:     { bg: 'rgba(16,185,129,0.08)', text: '#10B981', label: 'rgba(16,185,129,0.15)' },
                        TRANSFER:   { bg: 'rgba(59,130,246,0.08)', text: '#3B82F6', label: 'rgba(59,130,246,0.15)' },
                        SAVING:     { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', label: 'rgba(245,158,11,0.15)' },
                        ALLOCATION: { bg: 'rgba(108,76,241,0.08)', text: 'var(--clr-violet)', label: 'var(--violet-dim)' },
                      };
                      const c = colors[task.intent] || colors.ALLOCATION;

                      return (
                        <div key={idx} style={{ marginTop: idx > 0 ? 10 : 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px',
                              padding: '3px 8px', borderRadius: 6, color: c.text, background: c.label,
                            }}>
                              {task.intent}
                            </span>
                            {task.result?.amount && (
                              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--clr-text)' }}>
                                Rp {task.result.amount.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--clr-text-3)', fontWeight: 500 }}>
                            {task.result?.description || 'Berhasil dicatat'}
                          </p>
                        </div>
                      );
                    })
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer Controls ──────────────────────────────── */}
          <div style={{
            position: 'relative', zIndex: 1,
            padding: '12px 20px 18px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                display: 'flex', background: 'var(--bg)', borderRadius: 12,
                border: '1px solid var(--glass-border)', padding: 4, gap: 4,
              }}>
                {[
                  { mode: 'voice', icon: <Mic size={13} />, label: 'Voice' },
                  { mode: 'text',  icon: <MessageSquare size={13} />, label: 'Text' },
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => { setInputMode(mode); clearResponse(); setError(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 9, border: 'none',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: inputMode === mode ? 'var(--grad-brand)' : 'transparent',
                      color: inputMode === mode ? '#fff' : 'var(--clr-text-3)',
                      boxShadow: inputMode === mode ? '0 2px 8px var(--violet-glow)' : 'none',
                      transition: 'all 200ms',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Voice listen button */}
              {inputMode === 'voice' && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleListening}
                  disabled={isProcessing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 20px', borderRadius: 12, border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: isProcessing ? 0.5 : 1,
                    background: isListening
                      ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                      : 'var(--grad-brand)',
                    color: '#fff',
                    boxShadow: isListening
                      ? '0 4px 14px rgba(239,68,68,0.35)'
                      : '0 4px 14px var(--violet-glow)',
                    transition: 'all 200ms',
                  }}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  {isListening ? 'Stop' : 'Bicara'}
                </motion.button>
              )}
            </div>

            {/* Text input */}
            {inputMode === 'text' && (
              <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Mis: Beli kopi 25rb pake OVO..."
                  disabled={isProcessing}
                  style={{
                    flex: 1, background: 'var(--bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 12, padding: '10px 14px',
                    fontSize: 13, color: 'var(--clr-text)', fontFamily: 'inherit',
                    outline: 'none', transition: 'border-color 200ms',
                  }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing || !textInput.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: 'none',
                    background: 'var(--grad-brand)', cursor: isProcessing || !textInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isProcessing || !textInput.trim() ? 0.5 : 1,
                    boxShadow: '0 4px 14px var(--violet-glow)',
                    transition: 'all 200ms',
                  }}
                >
                  <Send size={17} color="#fff" strokeWidth={2.2} />
                </motion.button>
              </form>
            )}

            {/* Quick chips */}
            {!aiResponse && !isProcessing && !isListening && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(chip)}
                    style={{
                      padding: '5px 10px', borderRadius: 8,
                      background: 'var(--bg)', border: '1px solid var(--glass-border)',
                      fontSize: 11, fontWeight: 600, color: 'var(--clr-text-3)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      whiteSpace: 'nowrap', transition: 'all 150ms',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
