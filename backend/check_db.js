import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = '3bd528ed-c5ab-4acd-96a2-d7838ad551f3';
  
  const budgetItems = await prisma.budgetItem.findMany({
    where: { userId },
    include: {
      category: true,
      sourceAccount: true,
      account: true,
    }
  });
  console.log("BUDGET ITEMS:");
  budgetItems.forEach(x => {
    console.log(`- ID: ${x.id} | Category: ${x.category?.categoryName} | Name: ${x.itemName} | Allocated: ${x.allocatedAmount} | Source Account: ${x.sourceAccount?.accountName} | Dest Account: ${x.account?.accountName}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
