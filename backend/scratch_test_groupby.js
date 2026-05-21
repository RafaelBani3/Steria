import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = '3bd528ed-c5ab-4acd-96a2-d7838ad551f3';
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log("Date range:", startOfMonth, "to", endOfMonth);

  // Test Expense groupBy
  const expStats = await prisma.expense.groupBy({
    by: ['accountId'],
    where: {
      userId,
      transactionDate: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { amount: true },
    _count: { id: true }
  });

  // Test Income groupBy
  const incStats = await prisma.income.groupBy({
    by: ['accountId'],
    where: {
      userId,
      transactionDate: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { amount: true }
  });

  console.log("Expense Stats GroupBy:", expStats);
  console.log("Income Stats GroupBy:", incStats);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
