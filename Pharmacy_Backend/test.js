const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const medicines = await prisma.medicine.findMany({
    where: {
      isDeleted: false,
      isActive: true
    },
    include: {
      supplier: true,
      purchaseOrderItems: {
        where: {
          purchaseOrder: {
            status: { not: 'CANCELLED' }
          }
        },
        include: {
          purchaseOrder: true
        },
        orderBy: {
          id: 'desc'
        }
      }
    }
  });

  const lowStockList = [];
  for (const med of medicines) {
    const poItems = med.purchaseOrderItems || [];
    poItems.sort((a, b) => new Date(b.purchaseOrder.createdAt) - new Date(a.purchaseOrder.createdAt));
    const latestPOItem = poItems[0];
    const latestPO = latestPOItem ? latestPOItem.purchaseOrder : null;

    let status = 'Pending Approval';
    let poId = null;

    if (latestPO) {
      if (latestPO.status === 'COMPLETED' || latestPO.status === 'Completed') {
        if (med.stockQuantity <= med.reorderLevel) {
          status = 'Pending Approval';
          poId = null;
        } else {
          status = 'Completed';
          poId = latestPO.id;
        }
      } else if (latestPO.status !== 'CANCELLED' && latestPO.status !== 'Cancelled') {
        status = 'PO Generated';
        poId = latestPO.id;
      }
    }

    const isLowStock = med.stockQuantity <= med.reorderLevel;
    console.log(`Medicine: ${med.medicineName}, Stock: ${med.stockQuantity}, Reorder: ${med.reorderLevel}, IsLow: ${isLowStock}, Status: ${status}`);

    if (isLowStock || status === 'Completed' || status === 'PO Generated') {
      lowStockList.push({
        name: med.medicineName,
        stock: med.stockQuantity,
        reorder: med.reorderLevel,
        status,
        poId
      });
    }
  }

  console.log("Low Stock List Output:", lowStockList);
}

main().catch(console.error).finally(() => prisma.$disconnect());
