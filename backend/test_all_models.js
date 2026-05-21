import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database models...");
  const models = [
    { name: 'user', query: () => prisma.user.count() },
    { name: 'account', query: () => prisma.account.count() },
    { name: 'income', query: () => prisma.income.count() },
    { name: 'budgetCategory', query: () => prisma.budgetCategory.count() },
    { name: 'budgetItem', query: () => prisma.budgetItem.count() },
    { name: 'expense', query: () => prisma.expense.count() },
    { name: 'transfer', query: () => prisma.transfer.count() },
    { name: 'notification', query: () => prisma.notification.count() },
  ];

  for (const m of models) {
    try {
      const count = await m.query();
      console.log(`✅ Model ${m.name} count:`, count);
    } catch (e) {
      console.error(`❌ Model ${m.name} failed:`, e.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
