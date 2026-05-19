export const formatIDR = (value) => {
  if (value === undefined || value === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const parseIDR = (value) => {
  if (!value) return 0;
  const numericString = value.replace(/\D/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

/**
 * Format angka menjadi string dengan pemisah titik (format Indonesia)
 * Contoh: 20000000 → "20.000.000"  |  "20000" → "20.000"
 * Gunakan untuk menampilkan nilai di dalam <input>
 */
export const formatNumberInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const digits = String(value).replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
};

/**
 * Parse string berformat titik kembali ke number murni
 * Contoh: "20.000.000" → 20000000
 * Gunakan sebelum mengirim ke API / menyimpan ke state numerik
 */
export const parseNumberInput = (formatted) => {
  if (!formatted) return 0;
  const digits = String(formatted).replace(/\./g, '').replace(/,/g, '');
  return digits ? Number(digits) : 0;
};
