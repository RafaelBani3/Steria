/**
 * AI Retry System
 * Implements exponential backoff for AI requests
 */

export const withRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error.status === 400 || error.status === 403) throw error;
      
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`[AI Retry] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
