import prisma from './src/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const userId = 'b6803c42-90d3-4fb8-a177-ff9a28dfefa2';
  try {
    console.log("Checking existing categories for user:", userId);
    const existing = await prisma.budgetCategory.findMany({
      where: { userId },
    });
    console.log("Existing categories:", existing);
    
    if (existing.length > 0) {
      console.log("Existing found, no need to seed.");
      return;
    }
    
    console.log("No existing, seeding defaults...");
    const defaults = ['Needs', 'Wants', 'Savings'];
    const created = await Promise.all(
      defaults.map((name) =>
        prisma.budgetCategory.create({
          data: { userId, categoryName: name },
        })
      )
    );
    console.log("Seeding successful:", created);
  } catch (error) {
    console.error("Error in seeding logic:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
