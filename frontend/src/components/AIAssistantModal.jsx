import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, X, Bot, CheckCircle2,
  AlertTriangle, Sparkles, MessageSquare,
  HelpCircle, CheckCheck, XCircle,
} from 'lucide-react';
import { useAIStore } from '../store/useAIStore';

// ─── Particles ────────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: 2 + Math.random() * 3, duration: 3 + Math.random() * 4, delay: Math.random() * 3,
}));

const WAVE_BARS = [0.6, 1.0, 1.4, 1.8, 1.4, 1.0, 0.6, 1.2, 0.8, 1.6, 1.0, 0.7];

const QUICK_CHIPS = [
  'Beli kopi 25rb pake OVO',
  'Gajian 8 juta',
  'Transfer 500rb ke tabungan',
  'Kondisi keuangan gue gimana?',
];

// ─── Confirmation Step UI ─────────────────────────────────────────────────────
function ConfirmationStep({ aiResponse, onConfirm, onEdit, onCancel, isProcessing }) {
  const tasks = aiResponse?.pending_tasks || [];
  const isClarification = aiResponse?.isClarification;

  if (isClarification) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: '100%', borderRadius: 16,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <HelpCircle size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13.5, fontWeight: 500, color: '#d4a018', lineHeight: 1.6 }}>
            {aiResponse.message}
          </p>
        </div>
      </motion.div>
    );
  }

  if (!tasks.length) return null;

  const INTENT_COLORS = {
    EXPENSE:    { label: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
    INCOME:     { label: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    TRANSFER:   { label: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    SAVING:     { label: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    ALLOCATION: { label: '#9D5CFF', bg: 'rgba(108,76,241,0.1)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{
        width: '100%', borderRadius: 16,
        background: 'rgba(108,76,241,0.07)',
        border: '1px solid rgba(108,76,241,0.2)',
        padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, color: '#9D5CFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        📋 Konfirmasi Transaksi
      </p>

      {tasks.map((task, i) => {
        const c = INTENT_COLORS[task.intent] || INTENT_COLORS.ALLOCATION;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: c.bg }}>
            <div>
              <span style={{ fontSize: 9, fontWeight: 800, color: c.label, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{task.intent}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginTop: 2 }}>
                {task.data?.description || task.data?.subcategory || '-'}
              </p>
              {task.data?.source_account && (
                <p style={{ fontSize: 10, color: 'var(--clr-text-3)', marginTop: 1 }}>
                  {task.data.source_account}
                  {task.data?.destination_account ? ` → ${task.data.destination_account}` : ''}
                </p>
              )}
            </div>
            {task.data?.amount && (
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--clr-text)' }}>
                Rp {task.data.amount.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          disabled={isProcessing}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 11, border: 'none',
            background: 'var(--grad-brand)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: isProcessing ? 0.6 : 1,
            boxShadow: '0 4px 14px var(--violet-glow)',
          }}
        >
          <CheckCheck size={15} />
          {isProcessing ? 'Memproses...' : 'Ya, Konfirmasi'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onEdit}
          disabled={isProcessing}
          style={{
            padding: '10px 14px', borderRadius: 11, border: '1px solid var(--glass-border)',
            background: 'var(--bg-elevated)', color: 'var(--clr-text-3)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onCancel}
          disabled={isProcessing}
          style={{
            width: 42, height: 42, borderRadius: 11, border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.07)', color: '#ef4444',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <XCircle size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Success Card ─────────────────────────────────────────────────────────────
function SuccessCard({ aiResponse }) {
  const hasTasks = aiResponse?.tasks?.filter(t => t.intent !== 'INQUIRY' && t.result).length > 0;
  if (!hasTasks) return null;

  const COLORS = {
    EXPENSE:    { bg: 'rgba(239,68,68,0.08)',   text: '#ef4444',  label: 'rgba(239,68,68,0.15)' },
    INCOME:     { bg: 'rgba(16,185,129,0.08)',  text: '#10B981',  label: 'rgba(16,185,129,0.15)' },
    TRANSFER:   { bg: 'rgba(59,130,246,0.08)',  text: '#3B82F6',  label: 'rgba(59,130,246,0.15)' },
    SAVING:     { bg: 'rgba(245,158,11,0.08)',  text: '#F59E0B',  label: 'rgba(245,158,11,0.15)' },
    ALLOCATION: { bg: 'rgba(108,76,241,0.08)',  text: '#9D5CFF',  label: 'var(--violet-dim)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      style={{ width: '100%', borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--glass-border)', padding: '12px 14px' }}
    >
      {aiResponse.tasks.filter(t => t.intent !== 'INQUIRY' && t.result).map((task, idx) => {
        const c = COLORS[task.intent] || COLORS.ALLOCATION;
        return (
          <div key={idx} style={{ marginTop: idx > 0 ? 10 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '3px 8px', borderRadius: 6, color: c.text, background: c.label }}>
                {task.intent}
              </span>
              {task.result?.amount && (
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--clr-text)' }}>
                  Rp {task.result.amount.toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--clr-text-3)', fontWeight: 500 }}>
              {task.result?.description || 'Berhasil dicatat ✅'}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Main AIAssistantModal ────────────────────────────────────────────────────
export default function AIAssistantModal() {
  const {
    isOpen, closeModal,
    isListening, setListening,
    isProcessing,
    transcript, setTranscript,
    aiResponse, error, setError,
    processMessage, clearResponse,
    inputMode, setInputMode,
    confirmModalAction,
  } = useAIStore();

  const [textInput, setTextInput] = useState('');
  const recognitionRef  = useRef(null);
  const silenceTimerRef = useRef(null);
  const inputRef        = useRef(null);

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
      for (let i = event.resultIndex; i < event.results.length; i++) full += event.results[i][0].transcript;
      setTranscript(full);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognitionRef.current?.stop(), 3000);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') setError('Akses mikrofon ditolak. Aktifkan izin mikrofon di browser kamu.');
      else setError(`Gagal merekam suara. Coba mode teks ya 😄`);
    };

    recognition.onend = () => {
      setListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const currentText = useAIStore.getState().transcript;
      if (currentText?.trim()) processMessage(currentText);
    };

    recognitionRef.current = recognition;
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setTextInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (inputMode === 'text' && isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputMode, isOpen]);

  const toggleListening = () => {
    clearResponse();
    setError(null);
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) { setError('Browser kamu tidak mendukung voice recognition. Gunakan mode teks ya.'); return; }
      setTranscript('');
      try { recognitionRef.current.start(); setListening(true); } catch (e) { console.error(e); }
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    processMessage(textInput.trim());
    setTextInput('');
  };

  const handleChipClick = (text) => {
    setInputMode('text');
    setTextInput(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleConfirm = async () => {
    await confirmModalAction();
  };

  const handleEdit = () => {
    // Switch to text mode with prefilled text hint
    clearResponse();
    setInputMode('text');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCancelConfirm = () => {
    clearResponse();
    setTranscript('');
  };

  if (!isOpen) return null;

  const isClarification = aiResponse?.isClarification;
  const isConfirmation  = aiResponse?.isConfirmation;
  const isSuccess       = aiResponse?.success && (aiResponse?.tasks?.filter(t => t.result).length > 0 || aiResponse?.justConfirmed);
  const showConfirmStep = isConfirmation && aiResponse?.pending_tasks?.length > 0;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={closeModal}
        style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
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
          {/* Ambient gradient */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 280, height: 100, background: 'radial-gradient(ellipse, rgba(108,76,241,0.25) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* Particles */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {PARTICLES.map(p => (
              <motion.div key={p.id} animate={{ y: [0, -20, 0], opacity: [0.12, 0.4, 0.12], scale: [1, 1.3, 1] }} transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: 'var(--clr-violet)' }} />
            ))}
          </div>

          {/* ── Header ──────────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(108,76,241,0.2)' }}>
                <Bot size={18} color="var(--clr-violet)" strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--clr-text)' }}>Steria Copilot</p>
                <p style={{ fontSize: 10, color: 'var(--clr-text-3)', fontWeight: 600 }}>AI Financial Assistant</p>
              </div>
            </div>
            <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--clr-text-3)' }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Main Content ─────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 24px 16px', gap: 18, minHeight: 240 }}>

            {/* AI Orb */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {isProcessing && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1.5px dashed rgba(108,76,241,0.4)' }} />
              )}
              {isListening && (
                <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,76,241,0.4) 0%, transparent 70%)' }} />
              )}

              <motion.button
                animate={{
                  scale: isListening ? [1, 1.08, 1] : isProcessing ? [1, 1.04, 1] : [1, 1.02, 1],
                  boxShadow: isListening
                    ? ['0 0 24px rgba(108,76,241,0.6)', '0 0 48px rgba(108,76,241,0.9)', '0 0 24px rgba(108,76,241,0.6)']
                    : ['0 8px 32px rgba(108,76,241,0.3)', '0 12px 40px rgba(108,76,241,0.4)', '0 8px 32px rgba(108,76,241,0.3)'],
                }}
                transition={{ duration: isListening ? 1.2 : 2.5, repeat: Infinity }}
                onClick={inputMode === 'voice' ? toggleListening : undefined}
                disabled={isProcessing}
                style={{
                  width: 80, height: 80, borderRadius: '50%', border: 'none',
                  cursor: inputMode === 'voice' && !isProcessing ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                  background: isSuccess
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : isClarification
                      ? 'linear-gradient(135deg, #D97706, #F59E0B)'
                      : isListening
                        ? 'linear-gradient(135deg, #EC4899, #8B5CF6, #6C4CF1)'
                        : 'linear-gradient(135deg, #6C4CF1, #9D5CFF, #C084FC)',
                }}
              >
                {isSuccess
                  ? <CheckCircle2 size={30} color="#fff" strokeWidth={1.8} />
                  : isClarification
                    ? <HelpCircle size={30} color="#fff" strokeWidth={1.8} />
                    : isProcessing
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}><Sparkles size={28} color="#fff" strokeWidth={1.8} /></motion.div>
                      : <Sparkles size={28} color="#fff" strokeWidth={1.8} />
                }
              </motion.button>

              {/* Voice wave bars */}
              <AnimatePresence>
                {isListening && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, pointerEvents: 'none' }}>
                    {WAVE_BARS.map((h, i) => (
                      <motion.div key={i} animate={{ height: [`6px`, `${24 * h}px`, `6px`] }} transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                        style={{ width: 3, borderRadius: 2, background: 'rgba(255,255,255,0.85)' }} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Status area */}
            <div style={{ width: '100%', textAlign: 'center', minHeight: 48 }}>
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span style={{ textAlign: 'left' }}>{error}</span>
                  </motion.div>
                ) : isProcessing ? (
                  <motion.p key="processing" initial={{ opacity: 0 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-violet)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    Memproses...
                  </motion.p>
                ) : isListening ? (
                  <motion.p key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {transcript ? `"${transcript}"` : 'Mendengarkan... bicara sekarang 🎙️'}
                  </motion.p>
                ) : aiResponse?.message && !showConfirmStep && !isClarification ? (
                  <motion.div key="response" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--glass-border)', textAlign: 'left' }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--clr-text)', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                      {aiResponse.message}
                    </p>
                  </motion.div>
                ) : !aiResponse && (
                  <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 12, color: 'var(--clr-text-3)', fontWeight: 500 }}>
                    {inputMode === 'voice' ? 'Tap orb di atas, lalu bicara 🎙️' : 'Ketik transaksi atau pertanyaan kamu 💬'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmation / Clarification step */}
            <AnimatePresence>
              {(showConfirmStep || isClarification) && (
                <ConfirmationStep
                  aiResponse={aiResponse}
                  onConfirm={handleConfirm}
                  onEdit={handleEdit}
                  onCancel={handleCancelConfirm}
                  isProcessing={isProcessing}
                />
              )}
            </AnimatePresence>

            {/* Success task card */}
            <AnimatePresence>
              {isSuccess && !showConfirmStep && <SuccessCard aiResponse={aiResponse} />}
            </AnimatePresence>
          </div>

          {/* ── Footer ───────────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, padding: '12px 20px 18px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Mode tabs + voice button */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--glass-border)', padding: 4, gap: 4 }}>
                {[
                  { mode: 'voice', icon: <Mic size={13} />, label: 'Voice' },
                  { mode: 'text',  icon: <MessageSquare size={13} />, label: 'Text' },
                ].map(({ mode, icon, label }) => (
                  <button key={mode}
                    onClick={() => { setInputMode(mode); clearResponse(); setError(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: 'none',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: inputMode === mode ? 'var(--grad-brand)' : 'transparent',
                      color: inputMode === mode ? '#fff' : 'var(--clr-text-3)',
                      boxShadow: inputMode === mode ? '0 2px 8px var(--violet-glow)' : 'none',
                      transition: 'all 200ms',
                    }}
                  >{icon} {label}</button>
                ))}
              </div>

              {inputMode === 'voice' && (
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={toggleListening}
                  disabled={isProcessing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    background: isListening ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'var(--grad-brand)',
                    color: '#fff', opacity: isProcessing ? 0.5 : 1,
                    boxShadow: isListening ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px var(--violet-glow)',
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
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--clr-text)', fontFamily: 'inherit', outline: 'none' }}
                />
                <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  disabled={isProcessing || !textInput.trim()}
                  style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'var(--grad-brand)', cursor: isProcessing || !textInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isProcessing || !textInput.trim() ? 0.5 : 1, boxShadow: '0 4px 14px var(--violet-glow)' }}>
                  <Send size={17} color="#fff" strokeWidth={2.2} />
                </motion.button>
              </form>
            )}

            {/* Quick chips */}
            {!aiResponse && !isProcessing && !isListening && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_CHIPS.map((chip, i) => (
                  <button key={i} onClick={() => handleChipClick(chip)}
                    style={{ padding: '5px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--glass-border)', fontSize: 11, fontWeight: 600, color: 'var(--clr-text-3)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
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
