import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Mic, User, ShieldCheck, Sparkles, TrendingUp, Brain, Activity, Trash2 } from 'lucide-react';
import api from '../services/api';

const SUGGESTED = [
  { icon: '📊', label: 'Analisa Pengeluaran', text: 'Analisa pengeluaran saya bulan ini' },
  { icon: '🎯', label: 'Simulasi Tabungan', text: 'Berapa banyak yang bisa saya tabung dalam 6 bulan?' },
  { icon: '💡', label: 'Kesehatan Budget', text: 'Apakah budget bulanan saya sudah sehat?' },
  { icon: '🔥', label: 'Pos Terboros', text: 'Kategori apa yang paling boros bulan ini?' },
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Halo! Saya Steria Copilot, asisten finansial pribadi Anda. Ada yang bisa saya bantu analisis hari ini tentang pengeluaran, tabungan, atau budget Anda?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.data?.success) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.data.message,
          insights: res.data.insights,
          timestamp: new Date(),
        }]);
      } else throw new Error();
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: err.response?.data?.message || 'Maaf, sistem AI sedang sibuk. Silakan coba beberapa saat lagi.',
        isError: true,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: 1, sender: 'ai',
      text: 'Halo! Saya Steria Copilot, asisten finansial pribadi Anda. Ada yang bisa saya bantu analisis hari ini tentang pengeluaran, tabungan, atau budget Anda?',
      timestamp: new Date(),
    }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 12 }}>

      {/* ── Header ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar with live pulse */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'var(--grad-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px var(--violet-glow)',
            }}>
              <Bot size={22} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 12, height: 12, borderRadius: '50%',
              background: '#10B981', border: '2px solid var(--bg)',
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: 'var(--clr-text)' }}>
                Steria Copilot
              </p>
              <span className="badge badge-purple" style={{ fontSize: 9 }}>AI</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--clr-text-3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <ShieldCheck size={11} color="#10B981" strokeWidth={2.5} />
              Premium Financial Intelligence
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--bg-elevated)', color: 'var(--clr-text-3)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Trash2 size={13} strokeWidth={2} />
            Reset
          </button>
        )}
      </motion.div>

      {/* ── Main Chat Panel ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass"
        style={{
          flex: 1, borderRadius: 20, padding: 16,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', gap: 12, minHeight: 0,
        }}
      >
        {/* Message List */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex',
          flexDirection: 'column', gap: 16, paddingRight: 4,
          minHeight: 0,
        }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  display: 'flex', gap: 10, maxWidth: '85%',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: msg.sender === 'user' ? 'var(--grad-brand)' : 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: msg.sender === 'user' ? '0 4px 12px var(--violet-glow)' : 'none',
                  }}>
                    {msg.sender === 'user'
                      ? <User size={15} color="#fff" strokeWidth={2} />
                      : <Bot size={15} color="var(--clr-violet)" strokeWidth={2} />
                    }
                  </div>

                  {/* Bubble */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: msg.sender === 'user'
                        ? 'var(--grad-brand)'
                        : msg.isError
                          ? 'rgba(239,68,68,0.08)'
                          : 'var(--bg-elevated)',
                      border: `1px solid ${msg.isError ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)'}`,
                      boxShadow: msg.sender === 'user' ? '0 4px 14px var(--violet-glow)' : '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                      <p style={{
                        fontSize: 13.5, lineHeight: 1.6, fontWeight: 500,
                        color: msg.sender === 'user' ? '#fff' : msg.isError ? '#ef4444' : 'var(--clr-text)',
                        whiteSpace: 'pre-wrap', margin: 0,
                      }}>
                        {msg.text.replace(/"/g, '')}
                      </p>
                    </div>

                    {/* Insight Cards */}
                    {msg.insights?.length > 0 && (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                        {msg.insights.map((ins, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass"
                            style={{ padding: '10px 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}
                          >
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Activity size={16} color="var(--clr-violet)" strokeWidth={2} />
                            </div>
                            <div>
                              <p style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ins.title}</p>
                              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--clr-text)' }}>{ins.value}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <p style={{ fontSize: 9, color: 'var(--clr-text-3)', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
              }}>
                <Bot size={15} color="var(--clr-violet)" strokeWidth={2} />
              </div>
              <div style={{
                padding: '10px 16px', borderRadius: '4px 16px 16px 16px',
                background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-violet)' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggested Prompts ──────────────────── */}
        {messages.length < 3 && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: 'var(--clr-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              💡 Tanyakan Sesuatu
            </p>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto',
              paddingBottom: 4, msOverflowStyle: 'none', scrollbarWidth: 'none',
            }}
              className="no-scrollbar"
            >
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
                    background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                    fontFamily: 'inherit', transition: 'all 180ms ease',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text)', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ──────────────────────────── */}
        <form
          onSubmit={handleSend}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
            borderRadius: 16, padding: '8px 8px 8px 14px',
          }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Tanyakan tentang keuangan Anda..."
            rows={1}
            style={{
              flex: 1, border: 'none', background: 'transparent', resize: 'none',
              fontSize: 13, fontWeight: 500, color: 'var(--clr-text)', fontFamily: 'inherit',
              outline: 'none', minHeight: 40, maxHeight: 100, paddingTop: 10,
              lineHeight: 1.5,
            }}
          />
          <button
            type="button"
            title="Voice Input (Coming soon)"
            style={{
              width: 32, height: 40, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <Mic size={18} color="var(--clr-text-3)" strokeWidth={2.2} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: input.trim() && !isTyping ? 'var(--grad-brand)' : 'var(--bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: input.trim() && !isTyping ? '0 4px 14px var(--violet-glow)' : 'none',
              cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              transition: 'all 200ms ease',
            }}
          >
            <Send size={16}
              color={input.trim() && !isTyping ? '#fff' : 'var(--clr-text-3)'}
              strokeWidth={2.2}
            />
          </button>
        </form>

        <p style={{ fontSize: 9, color: 'var(--clr-text-3)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
          AI dapat membuat kesalahan · Verifikasi transaksi penting
        </p>
      </motion.div>
    </div>
  );
}
