import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const suppliers = await prisma.supplier.findMany();
    console.log("Total suppliers:", suppliers.length);
    console.log("Suppliers:", JSON.stringify(suppliers, null, 2));
  } catch(e) {
    console.error("ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
