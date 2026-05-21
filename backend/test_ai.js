import 'dotenv/config';
import prisma from './src/prisma/index.js';
import { processFinanceTransaction } from './src/ai/ai.service.js';

async function run() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('Testing with user:', user.id);
    const result = await processFinanceTransaction(user.id, "Halo, pengeluaran saya bulan ini berapa?");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
