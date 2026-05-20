import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }
  
  for (const user of users) {
    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 5
    });
    console.log(`User: ${user.name} (ID: ${user.id})`);
    console.log(`Recent Incomes (${incomes.length}):`, incomes);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
