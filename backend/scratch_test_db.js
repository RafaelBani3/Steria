import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Database connection successful. Found users:', users.length);
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
