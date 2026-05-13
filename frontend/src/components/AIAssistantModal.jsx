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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#121826]/95 border border-white/10 shadow-2xl shadow-purple-500/20 text-white"
        >
          {/* Subtle top ambient glowing mesh */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-gradient-to-b from-purple-600/30 to-transparent blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-bold tracking-wide">Steria Copilot</span>
            </div>
            <button
              onClick={closeModal}
              className="p-2 text-gray-400 transition-colors rounded-full hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Visual/Content Area */}
          <div className="flex flex-col items-center justify-center min-h-[260px] p-6 relative">
            
            {/* 1. Animated AI Orb & Waveforms */}
            <div className="relative flex items-center justify-center my-4">
              {/* Processing Orbit rings */}
              {isProcessing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-36 h-36 rounded-full border-2 border-dashed border-purple-500/40"
                />
              )}

              {/* Central Glowing Orb */}
              <motion.div
                animate={{
                  scale: isListening ? [1, 1.15, 1] : isProcessing ? [1, 1.05, 1] : [1, 1.03, 1],
                  boxShadow: isListening 
                    ? ['0 0 20px #a855f7', '0 0 50px #c084fc', '0 0 20px #a855f7'] 
                    : ['0 0 15px rgba(108,76,241,0.4)', '0 0 25px rgba(108,76,241,0.6)', '0 0 15px rgba(108,76,241,0.4)'],
                }}
                transition={{ duration: isListening ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
                className={`relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr ${
                  isListening 
                    ? 'from-purple-600 via-fuchsia-500 to-pink-500' 
                    : isProcessing 
                    ? 'from-indigo-600 via-purple-600 to-purple-800 animate-pulse' 
                    : 'from-[#6C4CF1]/80 to-[#A78BFA]/80'
                }`}
              >
                <Sparkles className={`w-8 h-8 text-white ${isProcessing ? 'animate-spin' : ''}`} />
              </motion.div>

              {/* Listening Waveform Bars */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {[1.2, 0.8, 1.5, 0.6, 1.3].map((heightScale, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height: ['12px', `${30 * heightScale}px`, '12px'],
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
            <div className="w-full text-center mt-2 min-h-[48px] flex flex-col items-center justify-center">
              {error ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              ) : isProcessing ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium text-purple-300 animate-pulse"
                >
                  Processing financial intent...
                </motion.p>
              ) : isListening ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium text-white italic px-4 line-clamp-2"
                >
                  "{transcript || 'Listening to your transaction...'}"
                </motion.p>
              ) : aiResponse ? (
                <p className="text-xs text-gray-400">Transaction completed</p>
              ) : (
                <p className="text-xs text-gray-400">
                  {inputMode === 'voice' ? 'Tap orb or button below to speak naturally' : 'Type your transaction below'}
                </p>
              )}
            </div>

            {/* Success Card Confirmation */}
            <AnimatePresence>
              {aiResponse?.success && aiResponse?.expense && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="absolute inset-x-4 bottom-4 bg-[#1E293B] border border-emerald-500/30 rounded-2xl p-4 shadow-xl shadow-black/40 backdrop-blur-md z-20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Expense Added
                      </span>
                    </div>
                    <span className="text-base font-black text-white">
                      {formatIDR(aiResponse.expense.amount)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/5 pt-2">
                    <span className="text-gray-400 font-medium">
                      {aiResponse.expense.category} &gt; {aiResponse.expense.subCategory || 'General'}
                    </span>
                    <span className="text-gray-300 truncate max-w-[140px] pl-2 font-medium">
                      {aiResponse.expense.description}
                    </span>
                  </div>

                  {aiResponse?.budgetStatus?.warning && (
                    <div className="mt-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{aiResponse.budgetStatus.warning}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Controls Footer */}
          <div className="p-4 bg-white/[0.02] border-t border-white/5 flex flex-col gap-3">
            {/* Mode Switching & Main Trigger */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'voice' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'text' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
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
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-red-500/20 animate-pulse' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20'
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
                  className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !textInput.trim()}
                  className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white rounded-xl transition-all shadow-md"
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
