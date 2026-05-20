import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Database connection successful. First user:", users);
    
    const categories = await prisma.budgetCategory.findMany({ take: 1 });
    console.log("BudgetCategory check successful:", categories);
  } catch (error) {
    console.error("Database connection failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
