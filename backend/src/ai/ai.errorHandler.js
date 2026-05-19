export const handleAIError = (error, res) => {
  console.error('[AI Error Handler] Caught AI Error:', error?.message || error);

  // Return elegant user-friendly message as per requirements
  const fallbackMessages = [
    "AI lagi sibuk 😅\nHarap tunggu sebentar dan coba lagi nanti.",
    "AI sementara lagi penuh.\nCoba beberapa menit lagi ya 👀"
  ];
  const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

  // We return a 200 with success: false so the frontend handles it gracefully 
  // as a conversational reply rather than throwing a raw 500 error toast, 
  // depending on the context. But standard API response is preferred:
  return res.status(200).json({
    success: false,
    message: randomMessage,
    errorType: 'AI_PROVIDER_ERROR'
  });
};
