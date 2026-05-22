import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Mic, User, ShieldCheck, Sparkles,
  Activity, Trash2, Copy, Check, TrendingUp, Zap,
  MessageSquare, ChevronDown,
} from 'lucide-react';
import { useAIStore } from '../store/useAIStore';

// ─── Suggested quick prompts ─────────────────────────────────────────────────
const SUGGESTED = [
  { icon: '📊', label: 'Analisa Pengeluaran', text: 'Analisa pengeluaran saya bulan ini dan kasih insight!' },
  { icon: '🎯', label: 'Kesehatan Budget', text: 'Apakah kondisi keuangan saya sehat bulan ini?' },
  { icon: '🔥', label: 'Kategori Terboros', text: 'Kategori apa yang paling boros bulan ini?' },
  { icon: '💰', label: 'Rekomendasi Tabungan', text: 'Berapa yang idealnya saya tabung tiap bulan?' },
  { icon: '📈', label: 'Tren 6 Bulan', text: 'Gimana tren pengeluaran saya 6 bulan terakhir?' },
  { icon: '💡', label: 'Tips Hemat', text: 'Kasih saya tips hemat berdasarkan pola spending saya' },
];

// ─── Word-by-word typing animation hook ──────────────────────────────────────
function useTypingAnimation(targetText, isActive) {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isActive || !targetText) {
      setDisplayText(targetText || '');
      setIsDone(true);
      return;
    }

    setDisplayText('');
    setIsDone(false);
    const words = targetText.split(' ');
    let i = 0;

    const interval = setInterval(() => {
      if (i >= words.length) {
        setIsDone(true);
        clearInterval(interval);
        return;
      }
      setDisplayText(prev => (prev ? prev + ' ' + words[i] : words[i]));
      i++;
    }, 55);

    return () => clearInterval(interval);
  }, [targetText, isActive]);

  return { displayText, isDone };
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, isLatestAI }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.sender === 'user';
  const { displayText } = useTypingAnimation(msg.text, isLatestAI && !isUser);
  const shownText = isLatestAI && !isUser ? displayText : msg.text;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{
        display: 'flex', gap: 10, maxWidth: '88%',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isUser ? 'var(--grad-brand)' : 'var(--bg-elevated)',
          border: '1px solid var(--glass-border)',
          boxShadow: isUser ? '0 4px 14px var(--violet-glow)' : 'none',
          marginTop: 2,
        }}>
          {isUser
            ? <User size={15} color="#fff" strokeWidth={2} />
            : <Bot size={15} color="var(--clr-violet)" strokeWidth={2} />
          }
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 6 }}>
          {/* Bubble */}
          <div
            style={{
              position: 'relative',
              padding: '11px 15px',
              borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: isUser
                ? 'var(--grad-brand)'
                : msg.isError
                  ? 'rgba(239,68,68,0.07)'
                  : 'var(--bg-elevated)',
              border: `1px solid ${msg.isError ? 'rgba(239,68,68,0.2)' : isUser ? 'transparent' : 'var(--glass-border)'}`,
              boxShadow: isUser
                ? '0 4px 20px var(--violet-glow)'
                : '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <p style={{
              fontSize: 13.5,
              lineHeight: 1.65,
              fontWeight: 500,
              color: isUser ? '#fff' : msg.isError ? '#ef4444' : 'var(--clr-text)',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {shownText}
              {isLatestAI && !isUser && displayText !== msg.text && (
                <span style={{
                  display: 'inline-block', width: 2, height: 14,
                  background: 'var(--clr-violet)', borderRadius: 1,
                  marginLeft: 2, verticalAlign: 'text-bottom',
                  animation: 'blink 0.8s ease-in-out infinite',
                }} />
              )}
            </p>

            {/* Copy button (AI messages only) */}
            {!isUser && (
              <button
                onClick={handleCopy}
                title="Copy"
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, borderRadius: 6, opacity: 0,
                  transition: 'opacity 200ms',
                  color: 'var(--clr-text-3)',
                }}
                className="copy-btn"
              >
                {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
              </button>
            )}
          </div>

          {/* Insight Cards */}
          {msg.insights?.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: msg.insights.length > 1 ? '1fr 1fr' : '1fr',
              gap: 8, width: '100%',
            }}>
              {msg.insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="glass"
                  style={{
                    padding: '10px 12px', borderRadius: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'var(--violet-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Activity size={15} color="var(--clr-violet)" strokeWidth={2} />
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {ins.title}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--clr-text)', marginTop: 1 }}>
                      {ins.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p style={{
            fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.4px',
          }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
      }}>
        <Bot size={15} color="var(--clr-violet)" strokeWidth={2} />
      </div>
      <div style={{
        padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
        background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.18 }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--clr-violet)' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main AIChat Page ────────────────────────────────────────────────────────
export default function AIChat() {
  const { chatHistory, isChatLoading, sendMessage, clearHistory } = useAIStore();
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading, scrollToBottom]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isChatLoading) return;
    setInput('');
    await sendMessage(text);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // Find latest AI message index for typing animation
  const latestAIIndex = [...chatHistory].reverse().findIndex(m => m.sender === 'ai');
  const latestAIId = latestAIIndex >= 0 ? chatHistory[chatHistory.length - 1 - latestAIIndex]?.id : null;

  return (
    <>
      {/* Blink cursor CSS */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .copy-btn { opacity: 0 !important; transition: opacity 200ms; }
        div:hover > div > .copy-btn { opacity: 1 !important; }
        .msg-bubble:hover .copy-btn { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 12 }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'var(--grad-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px var(--violet-glow)',
              }}>
                <Bot size={22} color="#fff" strokeWidth={1.8} />
              </div>
              {/* Live indicator */}
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#10B981', border: '2px solid var(--bg)',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: 'var(--clr-text)' }}>
                  Steria Copilot
                </p>
                <span className="badge badge-purple" style={{ fontSize: 9, letterSpacing: '0.5px' }}>AI</span>
              </div>
              <p style={{ fontSize: 10, color: 'var(--clr-text-3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <ShieldCheck size={11} color="#10B981" strokeWidth={2.5} />
                Gemini · Premium Financial Intelligence
              </p>
            </div>
          </div>

          {chatHistory.length > 1 && (
            <button
              onClick={clearHistory}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 10, border: '1px solid var(--glass-border)',
                background: 'var(--bg-elevated)', color: 'var(--clr-text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 180ms',
              }}
            >
              <Trash2 size={13} strokeWidth={2} />
              Reset
            </button>
          )}
        </motion.div>

        {/* ── Chat Panel ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass"
          style={{
            flex: 1, borderRadius: 20, padding: 16,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', gap: 12, minHeight: 0,
            position: 'relative',
          }}
        >
          {/* Message list */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1, overflowY: 'auto', display: 'flex',
              flexDirection: 'column', gap: 18, paddingRight: 4,
              minHeight: 0,
            }}
          >
            <AnimatePresence initial={false}>
              {chatHistory.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLatestAI={msg.id === latestAIId}
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {isChatLoading && <TypingIndicator />}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-to-bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                style={{
                  position: 'absolute', bottom: 80, right: 24,
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 10,
                }}
              >
                <ChevronDown size={16} color="var(--clr-text-3)" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── Suggested Prompts ────────────────────────────────── */}
          {chatHistory.length <= 2 && !isChatLoading && (
            <div style={{ flexShrink: 0 }}>
              <p style={{
                fontSize: 10, color: 'var(--clr-text-3)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
              }}>
                💡 Tanyakan Sesuatu
              </p>
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                paddingBottom: 4, scrollbarWidth: 'none',
              }}>
                {SUGGESTED.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSuggestion(s.text)}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
                      padding: '8px 13px', borderRadius: 12, cursor: 'pointer',
                      background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                      fontFamily: 'inherit', transition: 'all 180ms ease',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{s.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--clr-text)', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input Bar ────────────────────────────────────────── */}
          <form
            onSubmit={handleSend}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
              borderRadius: 16, padding: '8px 8px 8px 14px',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Tanya Steria Copilot... (mis. 'Beli kopi 25rb pake OVO')"
              rows={1}
              disabled={isChatLoading}
              style={{
                flex: 1, border: 'none', background: 'transparent', resize: 'none',
                fontSize: 13.5, fontWeight: 500, color: 'var(--clr-text)',
                fontFamily: 'inherit', outline: 'none',
                minHeight: 40, maxHeight: 100, paddingTop: 10,
                lineHeight: 1.5,
              }}
            />

            {/* Mic button — navigates to floating modal in voice mode */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Input Suara"
              onClick={() => {
                // Open AIAssistantModal via store
                const { openModal, setInputMode } = useAIStore.getState();
                setInputMode('voice');
                openModal();
              }}
              style={{
                width: 36, height: 40, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <Mic size={18} color="var(--clr-text-3)" strokeWidth={2.2} />
            </motion.button>

            {/* Send button */}
            <motion.button
              type="submit"
              whileHover={input.trim() && !isChatLoading ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !isChatLoading ? { scale: 0.95 } : {}}
              disabled={!input.trim() || isChatLoading}
              style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: input.trim() && !isChatLoading ? 'var(--grad-brand)' : 'var(--bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: input.trim() && !isChatLoading ? '0 4px 16px var(--violet-glow)' : 'none',
                cursor: input.trim() && !isChatLoading ? 'pointer' : 'not-allowed',
                transition: 'all 200ms ease',
              }}
            >
              <Send
                size={16}
                color={input.trim() && !isChatLoading ? '#fff' : 'var(--clr-text-3)'}
                strokeWidth={2.2}
              />
            </motion.button>
          </form>

          <p style={{
            fontSize: 9, color: 'var(--clr-text-3)', textAlign: 'center',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0,
          }}>
            AI dapat membuat kesalahan · Verifikasi transaksi penting
          </p>
        </motion.div>
      </div>
    </>
  );
}
