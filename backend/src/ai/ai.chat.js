import prisma from '../prisma/index.js';
import { generateAIResponse } from './ai.providers.js';

export const processAIChat = async (userId, messageText) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch compact context
    const [user, activeBudget, savingsGoals, recentIncomes, monthExpenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.budget.findFirst({
        where: { userId },
        include: { budgetItems: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.saving.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.expense.findMany({
        where: { userId, date: { gte: startOfMonth } },
        select: { amount: true, category: true }
      })
    ]);

    // 2. Aggregate Data in Backend (Rule 4: Backend calculations first)
    const currentMonthIncomes = recentIncomes.filter(inc => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear();
    });

    let totalIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    if (totalIncome === 0 && recentIncomes.length > 0) {
      totalIncome = recentIncomes[0].amount;
    }

    const totalExpense = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryUsage = monthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    // Sort categories to find top spend
    const topCategory = Object.keys(categoryUsage).length > 0 
      ? Object.keys(categoryUsage).reduce((a, b) => categoryUsage[a] > categoryUsage[b] ? a : b) 
      : 'None';

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const compactContext = {
      userName: user?.name || 'User',
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      topCategory,
      savingsRate: savingsRate.toFixed(1),
      budgetItems: activeBudget?.budgetItems.map(i => `${i.category}:${i.amount}`) || [],
      savingsGoals: savingsGoals.map(s => `${s.name}:${s.currentAmount}/${s.targetAmount}`) || []
    };

    // 3. System Prompt for Copilot Chat
    const systemPrompt = `You are Steria Copilot, an elite AI financial assistant.
You provide interpretation, personalized insights, and actionable recommendations.

CRITICAL RULES:
1. ALWAYS use the provided context to answer. NEVER say you don't know the data if it is provided.
2. Reply in casual, modern, friendly Indonesian (like a smart fintech assistant).
3. Do NOT provide raw math formulas. Give actionable advice.
4. Keep answers concise (max 3-4 short paragraphs). Use bullet points if necessary.
5. You MUST return ONLY a JSON response in this exact schema:
{
  "message": "Your conversational text response here. Use formatting like \n\n for newlines.",
  "insights": [
    { "title": "Insight Title (e.g., SAVINGS RATE)", "value": "Value (e.g., 20%)" }
  ]
}
Include 1-2 insights ONLY if relevant to the user's question. If not, return an empty array for insights.

USER CONTEXT:
${JSON.stringify(compactContext, null, 2)}`;

    // 4. Generate AI Response
    const aiRawResponse = await generateAIResponse(systemPrompt, messageText, true);
    
    // Clean JSON markdown
    const cleanedJson = aiRawResponse.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    return {
      success: true,
      message: result.message,
      insights: result.insights || []
    };

  } catch (error) {
    console.error('[AI Chat] Process Error:', error.message);
    throw error;
  }
};
