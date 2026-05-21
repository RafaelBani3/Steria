import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../backend/.env') });
dotenv.config(); // fallback

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany();
  console.log("ACCOUNTS IN DATABASE:");
  accounts.forEach(acc => {
    console.log(`- ID: ${acc.id} | Name: ${acc.accountName} | Balance: ${acc.currentBalance} | Type: ${acc.accountType}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
