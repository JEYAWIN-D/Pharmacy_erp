// Checks database sizes to understand disk usage
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const counts = await Promise.all([
  p.supplier.count(),
  p.medicine.count(),
  p.purchaseTerm.count(),
  p.supplierBrandMapping.count(),
  p.supplierLedger.count(),
  p.auditLog.count(),
  p.notification.count(),
  p.bill.count(),
  p.billItem.count(),
  p.dispensingLog.count(),
  p.inventoryLog.count(),
]);

console.log('Entity Counts:');
console.log('  Suppliers:', counts[0]);
console.log('  Medicines:', counts[1]);
console.log('  PurchaseTerms:', counts[2]);
console.log('  BrandMappings:', counts[3]);
console.log('  SupplierLedger:', counts[4]);
console.log('  AuditLogs:', counts[5]);
console.log('  Notifications:', counts[6]);
console.log('  Bills:', counts[7]);
console.log('  BillItems:', counts[8]);
console.log('  DispensingLogs:', counts[9]);
console.log('  InventoryLogs:', counts[10]);

await p.$disconnect();
