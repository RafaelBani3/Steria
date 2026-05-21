import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getAccountSummary(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const start = performance.now();

  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
  });

  const [expStats, incStats] = await Promise.all([
    prisma.expense.groupBy({
      by: ['accountId'],
      where: {
        userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.income.groupBy({
      by: ['accountId'],
      where: {
        userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const expenseMap = {};
  expStats.forEach((item) => {
    expenseMap[item.accountId] = {
      amount: item._sum?.amount || 0,
      count: item._count?.id || 0,
    };
  });

  const incomeMap = {};
  incStats.forEach((item) => {
    incomeMap[item.accountId] = {
      amount: item._sum?.amount || 0,
    };
  });

  const accountsWithStats = accounts.map((account) => {
    const exp = expenseMap[account.id] || { amount: 0, count: 0 };
    const inc = incomeMap[account.id] || { amount: 0 };

    return {
      ...account,
      monthlyExpenses: exp.amount,
      monthlyIncome: inc.amount,
      transactionCount: exp.count,
    };
  });

  const cashflowAccounts = accountsWithStats.filter(a => a.accountType === 'CASHFLOW');
  const savingsAccounts = accountsWithStats.filter(a => a.accountType === 'SAVINGS');

  const totalCashflow = cashflowAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const duration = performance.now() - start;

  return {
    accountsCount: accountsWithStats.length,
    cashflowAccountsCount: cashflowAccounts.length,
    savingsAccountsCount: savingsAccounts.length,
    totalCashflow,
    totalSavings,
    totalBalance: totalCashflow + totalSavings,
    durationMs: duration.toFixed(2)
  };
}

async function main() {
  const userId = '3bd528ed-c5ab-4acd-96a2-d7838ad551f3';
  const result = await getAccountSummary(userId);
  console.log("Summary result:", result);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
