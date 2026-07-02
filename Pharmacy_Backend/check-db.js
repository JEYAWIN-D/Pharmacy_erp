import prisma from './src/config/prisma.js';

async function testConnection() {
  console.log("Checking purchase orders in DB...");
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        items: true,
        supplier: true
      }
    });
    console.log(`POs found: ${pos.length}`);
    pos.forEach(po => {
      console.log(` - PO: ${po.id} | Status: ${po.status} | Total: ${po.total} | Created By: ${po.createdBy}`);
      po.items.forEach(it => {
        console.log(`   * Item: ${it.medicineName} | Qty: ${it.qty} | Price: ${it.unitPrice}`);
      });
    });
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
