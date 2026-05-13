import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './ai.prompt.js';
import { parseAIResponse } from './ai.parser.js';
import prisma from '../prisma/index.js';

export const processFinanceTransaction = async (userId, messageText) => {
  try {
    // 1. Fetch user's active budget context for precise category mapping
    const activeBudget = await prisma.budget.findFirst({
      where: { userId },
      include: { budgetItems: true },
      orderBy: { updatedAt: 'desc' }
    });

    const budgetItemsContext = activeBudget?.budgetItems || [];

    // 2. Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = getSystemPrompt(budgetItemsContext);

    let responseText = '';
    try {
      // Try calling with requested Gemini 2.5 Flash model
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction
      });
      const result = await model.generateContent(messageText);
      responseText = result.response.text();
    } catch (modelError) {
      console.warn('Gemini 2.5 Flash call failed, trying gemini-1.5-flash fallback:', modelError.message);
      // Fallback to gemini-1.5-flash if 2.5 isn't available/provisioned
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction
      });
      const result = await fallbackModel.generateContent(messageText);
      responseText = result.response.text();
    }

    // 3. Parse and validate response JSON
    const parsedData = parseAIResponse(responseText);

    if (parsedData.amount <= 0) {
      throw new Error('AI failed to extract a valid expense amount greater than 0');
    }

    // 4. Map category and subcategory intelligently to database records
    let matchedItem = null;
    if (budgetItemsContext.length > 0) {
      // Exact match case-insensitive
      matchedItem = budgetItemsContext.find(item => 
        item.category.toLowerCase() === parsedData.category.toLowerCase() &&
        item.subCategory?.toLowerCase() === parsedData.subcategory.toLowerCase()
      );
      // Partial inclusion match fallback
      if (!matchedItem) {
        matchedItem = budgetItemsContext.find(item => 
          item.category.toLowerCase() === parsedData.category.toLowerCase() &&
          item.subCategory?.toLowerCase().includes(parsedData.subcategory.toLowerCase())
        );
      }
    }

    // Normalize category to supported enum-like values
    const validCategories = ['Needs', 'Wants', 'Savings', 'Unallocated'];
    const finalCategory = validCategories.includes(parsedData.category) ? parsedData.category : 'Unallocated';
    const finalSubCategory = matchedItem ? matchedItem.subCategory : parsedData.subcategory;

    // 5. Store transaction in Neon PostgreSQL via Prisma
    const createdExpense = await prisma.expense.create({
      data: {
        amount: parseFloat(parsedData.amount),
        category: finalCategory,
        subCategory: finalSubCategory,
        date: new Date(),
        description: parsedData.description,
        userId,
        budgetItemId: matchedItem ? matchedItem.id : undefined
      }
    });

    // 6. Compute real-time sub-budget usage and remaining amount for feedback
    let budgetStatus = null;
    if (matchedItem) {
      // Calculate current month's spent total for this subcategory
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const currentMonthExpenses = await prisma.expense.findMany({
        where: {
          userId,
          category: finalCategory,
          subCategory: finalSubCategory,
          date: { gte: startOfMonth }
        }
      });

      const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const allocated = matchedItem.amount;
      const remaining = allocated - totalSpent;
      const usagePercentage = allocated > 0 ? parseFloat(((totalSpent / allocated) * 100).toFixed(1)) : 0;

      let warning = null;
      if (usagePercentage > 100) {
        warning = `Budget exceeded by ${usagePercentage - 100}%!`;
      } else if (usagePercentage > 90) {
        warning = 'Warning: Approaching monthly budget limit.';
      }

      budgetStatus = {
        allocated,
        totalSpent,
        remaining,
        usagePercentage,
        warning
      };
    }

    return {
      success: true,
      expense: createdExpense,
      budgetStatus,
      message: 'Expense successfully created'
    };
  } catch (error) {
    console.error('AI Service Integration Error:', error);
    throw error;
  }
};
