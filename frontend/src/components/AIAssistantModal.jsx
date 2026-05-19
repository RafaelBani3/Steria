import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, Bot, CheckCircle2, AlertTriangle, Sparkles, MessageSquare } from 'lucide-react';
import { useAIStore } from '../store/useAIStore';
import { formatIDR } from '../utils/formatCurrency';

export default function AIAssistantModal() {
  const { 
    isOpen, 
    closeModal, 
    isListening, 
    setListening, 
    isProcessing, 
    transcript, 
    setTranscript, 
    aiResponse, 
    error, 
    setError, 
    processMessage,
    clearResponse,
    inputMode,
    setInputMode
  } = useAIStore();

  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Auto-stop after silence of 3 seconds
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 3000);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please enable microphone permissions.');
        } else {
          setError(`Voice recognition error: ${event.error}. Try text mode.`);
        }
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        // Process transcript if available
        const currentText = useAIStore.getState().transcript;
        if (currentText && currentText.trim()) {
          processMessage(currentText);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setTextInput('');
    }
  }, [isOpen]);

  const toggleListening = () => {
    clearResponse();
    setError(null);
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      if (!recognitionRef.current) {
        setError('Browser voice recognition not supported. Please use text mode.');
        return;
      }
      setTranscript('');
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error('Recognition start error:', err);
      }
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    processMessage(textInput);
    setTextInput('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl text-slate-800"
        >
          {/* Subtle top ambient glowing mesh */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100">
                <Bot className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <span className="text-sm font-bold text-slate-800 tracking-wide">Steria Copilot</span>
            </div>
            <button
              onClick={closeModal}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Visual/Content Area */}
          <div className="flex flex-col items-center justify-center min-h-[240px] p-6 relative">
            
            {/* 1. Animated AI Orb & Waveforms */}
            <div className="relative flex items-center justify-center my-3">
              {/* Processing Orbit rings */}
              {isProcessing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-32 h-32 rounded-full border border-dashed border-indigo-500/40"
                />
              )}

              {/* Central Glowing Orb */}
              <motion.div
                animate={{
                  scale: isListening ? [1, 1.12, 1] : isProcessing ? [1, 1.05, 1] : [1, 1.03, 1],
                  boxShadow: isListening 
                    ? ['0 0 20px rgba(99,102,241,0.5)', '0 0 40px rgba(99,102,241,0.8)', '0 0 20px rgba(99,102,241,0.5)'] 
                    : ['0 0 12px rgba(99,102,241,0.2)', '0 0 20px rgba(99,102,241,0.3)', '0 0 12px rgba(99,102,241,0.2)'],
                }}
                transition={{ duration: isListening ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr ${
                  isListening 
                    ? 'from-indigo-600 via-violet-500 to-pink-500' 
                    : isProcessing 
                    ? 'from-indigo-600 via-violet-600 to-indigo-800' 
                    : 'from-indigo-500 to-violet-500'
                }`}
              >
                <Sparkles className={`w-7 h-7 text-white ${isProcessing ? 'animate-spin' : ''}`} />
              </motion.div>

              {/* Listening Waveform Bars */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {[1.2, 0.8, 1.5, 0.6, 1.3].map((heightScale, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height: ['10px', `${24 * heightScale}px`, '10px'],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: idx * 0.1,
                        ease: 'easeInOut',
                      }}
                      className="w-1 bg-white rounded-full opacity-80"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* State Messaging / Transcripts */}
            <div className="w-full text-center mt-3 mb-5 min-h-[50px] flex flex-col items-center justify-center">
              {error ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              ) : isProcessing ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-semibold text-indigo-600 animate-pulse uppercase tracking-wider"
                >
                  Processing financial intent...
                </motion.p>
              ) : isListening ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-semibold text-slate-800 italic px-4 line-clamp-2"
                >
                  "{transcript || 'Listening to your transaction...'}"
                </motion.p>
              ) : aiResponse ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full px-2"
                >
                  <div className="text-[14px] leading-relaxed text-slate-800 text-left bg-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-inner">
                    <p className="whitespace-pre-wrap">{aiResponse.message.replace(/"/g, '')}</p>
                  </div>
                </motion.div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  {inputMode === 'voice' ? 'Tap orb or button below to speak naturally' : 'Type your transaction below'}
                </p>
              )}
            </div>

            {/* Success Card Confirmation (Dynamic for all intents) */}
            <AnimatePresence>
              {aiResponse?.success && aiResponse?.tasks && aiResponse.tasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-2"
                >
                  {aiResponse.tasks.map((task, idx) => {
                    const isExpense = task.intent === 'EXPENSE';
                    const isIncome = task.intent === 'INCOME';
                    const isAllocation = task.intent === 'ALLOCATION';
                    
                    const colorClass = isIncome ? 'text-emerald-700' : isExpense ? 'text-rose-700' : isAllocation ? 'text-indigo-700' : 'text-amber-700';
                    const bgColorClass = isIncome ? 'bg-emerald-50' : isExpense ? 'bg-rose-50' : isAllocation ? 'bg-indigo-50' : 'bg-amber-50';
                    const borderColorClass = isIncome ? 'border-emerald-100' : isExpense ? 'border-rose-100' : isAllocation ? 'border-indigo-100' : 'border-amber-100';

                    return (
                      <div key={idx} className={`${idx > 0 ? 'mt-3 pt-3 border-t border-slate-250' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`px-2 py-0.5 rounded-lg ${bgColorClass} ${colorClass} text-[9px] font-black uppercase tracking-wider border ${borderColorClass}`}>
                            {task.intent}
                          </div>
                          <span className="text-base font-black text-slate-800">
                            {task.result?.amount ? formatIDR(task.result.amount) : task.result?.targetAmount ? formatIDR(task.result.targetAmount) : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Category</span>
                            <span className="text-slate-700 font-semibold">
                              {task.result?.category || 'General'} &gt; {task.result?.subCategory || task.result?.name || 'Item'}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Note</span>
                            <span className="text-slate-600 italic truncate max-w-[120px]">
                              {task.result?.description || 'Processed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show Global Warning if exists */}
                  {aiResponse?.tasks?.[0]?.result?.budgetStatus?.warning && (
                    <div className="mt-3 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{aiResponse.tasks[0].result.budgetStatus.warning}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Footer */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col gap-3">
            {/* Mode Switching & Main Trigger */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'voice' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'text' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>
              </div>

              {/* Main Voice Button trigger */}
              {inputMode === 'voice' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-red-500/10 animate-pulse' 
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'Stop' : 'Listen'}</span>
                </motion.button>
              )}
            </div>

            {/* Text Input Block */}
            {inputMode === 'text' && (
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g. Beli kopi kenangan 21 ribu..."
                  disabled={isProcessing}
                  className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !textInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
