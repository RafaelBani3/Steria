import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ label, value, options, onChange, placeholder = "Select option", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 dark:bg-white/5 border border-transparent hover:border-purple-500/30 focus:border-purple-500/30 rounded-2xl ${label ? 'px-5 py-4' : 'px-3 py-1.5'} flex items-center justify-between cursor-pointer transition-all group shadow-sm`}
      >
        <span className={`font-bold text-gray-900 dark:text-white ${label ? 'text-base' : 'text-sm'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[999] p-2"
          >
            <div className="max-h-60 overflow-y-auto pr-1 scrollbar-thin transition-all">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all mb-1 last:mb-0 ${
                      isSelected 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
