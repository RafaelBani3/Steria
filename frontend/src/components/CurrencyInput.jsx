import { useState, useEffect } from 'react';
import { parseIDR } from '../utils/formatCurrency';

export default function CurrencyInput({ value, onChange, placeholder, className, required }) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (value === 0 && !displayValue) {
         setDisplayValue(''); // Keep empty if user hasn't typed
      } else {
         const numericString = value.toString();
         const formatted = numericString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
         setDisplayValue(formatted);
      }
    }
  }, [value]);

  const handleChange = (e) => {
    let inputVal = e.target.value;
    
    // Allow empty
    if (inputVal === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Remove any non-digit
    const numericString = inputVal.replace(/\D/g, '');
    
    // Add thousand separators (dot for Indonesia)
    const formatted = numericString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    setDisplayValue(formatted);
    
    // Parse back to raw number and pass to parent
    const rawNumber = parseIDR(formatted);
    onChange(rawNumber);
  };

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
      <input
        type="text"
        required={required}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder || '0'}
        className={`pl-10 ${className}`}
      />
    </div>
  );
}
