const QUOTA_MESSAGES = [
  'Steria AI sedang mencapai batas penggunaan sementara. Coba lagi dalam 1-2 menit ✨',
  'AI Steria sedang sibuk 😄 Coba beberapa saat lagi ya.',
];

const TIMEOUT_MESSAGES = [
  'Koneksi ke Steria AI sedikit lambat. Coba lagi sebentar ya 🙏',
  'AI butuh waktu lebih lama dari biasanya. Silakan coba kembali!',
];

const GENERIC_MESSAGES = [
  'Wah, sepertinya ada gangguan kecil 😅 Coba lagi nanti ya!',
  'Steria AI sedang tidak dapat diakses saat ini. Coba beberapa menit lagi 🌟',
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const classifyError = (error) => {
  const msg = error?.message || '';
  if (msg.includes('429') || msg.includes('QUOTA') || msg.includes('quota') || msg.includes('Resource has been exhausted')) return 'QUOTA';
  if (msg.includes('TIMEOUT') || msg.includes('timeout') || msg.includes('ETIMEDOUT')) return 'TIMEOUT';
  if (msg.includes('ALL_MODELS_FAILED')) return 'ALL_FAILED';
  if (msg.includes('EMPTY_MESSAGE')) return 'EMPTY';
  return 'GENERIC';
};

export const handleAIError = (error, res) => {
  console.error('[AI Error Handler] Error type:', classifyError(error), '| Message:', error?.message);

  const type = classifyError(error);

  if (type === 'EMPTY') {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong ya 😊', errorType: 'EMPTY_MESSAGE' });
  }

  let userMessage;
  switch (type) {
    case 'QUOTA':    userMessage = pickRandom(QUOTA_MESSAGES);   break;
    case 'TIMEOUT':  userMessage = pickRandom(TIMEOUT_MESSAGES); break;
    default:         userMessage = pickRandom(GENERIC_MESSAGES);
  }

  return res.status(200).json({
    success: false,
    message: userMessage,
    errorType: type,
  });
};
