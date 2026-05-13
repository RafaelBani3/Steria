export const parseAIResponse = (rawText) => {
  try {
    if (!rawText) throw new Error('Empty response from AI');
    
    // Clean up markdown code blocks if present
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '');
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.replace(/```$/, '');
    }
    
    cleanText = cleanText.trim();
    
    const parsed = JSON.parse(cleanText);
    
    // Basic structural validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed result is not a valid JSON object');
    }
    
    // Normalize properties
    return {
      type: parsed.type || 'expense',
      amount: Number(parsed.amount) || 0,
      category: parsed.category || 'Unallocated',
      subcategory: parsed.subcategory || parsed.subCategory || 'General',
      description: parsed.description || 'AI Expense'
    };
  } catch (error) {
    console.error('AI Parser Error:', error.message, 'Raw Text:', rawText);
    throw new Error('Failed to parse AI response into structured data');
  }
};
