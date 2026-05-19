import { useState, useRef, useEffect } from 'react';

/**
 * RupiahInput — auto-formats to Indonesian Rupiah as user types.
 * Value stored is raw number. Display shows 1.000, 10.000, 1.000.000
 *
 * Props:
 *   value: number
 *   onChange: (value: number) => void
 *   placeholder?: string
 *   className?: string
 *   style?: object
 *   autoFocus?: bool
 *   required?: bool
 */
export default function RupiahInput({
  value,
  onChange,
  placeholder = '0',
  className = 'input-currency',
  style = {},
  autoFocus = false,
  required = false,
  disabled = false,
}) {
  const [display, setDisplay] = useState('');
  const inputRef = useRef(null);

  // Sync display from external value changes
  useEffect(() => {
    if (!value && value !== 0) {
      setDisplay('');
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setDisplay(formatNumber(num));
    }
  }, [value]);

  function formatNumber(n) {
    return Math.floor(n).toLocaleString('id-ID');
  }

  function parseDisplay(str) {
    // Remove all non-digits
    return parseInt(str.replace(/\D/g, ''), 10) || 0;
  }

  function handleChange(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    const num = parseInt(digits, 10) || 0;

    if (digits === '') {
      setDisplay('');
      onChange(0);
      return;
    }

    // Format with dot separator (Indonesian style)
    const formatted = num.toLocaleString('id-ID');
    setDisplay(formatted);
    onChange(num);
  }

  function handleFocus() {
    // When focused, if 0, clear so user can type fresh
    if (!value || value === 0) {
      setDisplay('');
    }
  }

  function handleBlur() {
    // On blur, if empty, show nothing; if has value, re-format
    if (value > 0) {
      setDisplay(formatNumber(value));
    } else {
      setDisplay('');
    }
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <span
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 15,
          fontWeight: 600,
          color: display ? 'var(--t3)' : 'var(--t4)',
          pointerEvents: 'none',
          fontFamily: 'Space Grotesk, sans-serif',
          userSelect: 'none',
        }}
      >
        Rp
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className={className}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        disabled={disabled}
        style={{
          paddingLeft: 42,
          ...style,
        }}
      />
    </div>
  );
}
