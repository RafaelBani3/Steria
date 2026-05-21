import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const accountCount = await prisma.account.count();
  const expenseCount = await prisma.expense.count();
  const incomeCount = await prisma.income.count();
  const transferCount = await prisma.transfer.count();
  const userCount = await prisma.user.count();

  console.log({
    users: userCount,
    accounts: accountCount,
    expenses: expenseCount,
    incomes: incomeCount,
    transfers: transferCount
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
