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
  // Remove anything that is not a digit
  const numericString = value.replace(/\D/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};
