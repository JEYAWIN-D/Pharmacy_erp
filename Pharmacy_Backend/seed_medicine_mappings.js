// Maps medicines to suppliers using purchase terms (cost price + selling price)
// Uses minimal data writes to conserve disk space
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Mapping medicines to suppliers with purchase terms...\n');

  const suppliers = await prisma.supplier.findMany({ where: { isActive: true } });
  const medicines = await prisma.medicine.findMany({ take: 50 });

  if (suppliers.length === 0) { console.log('No suppliers found!'); return; }
  if (medicines.length === 0) { console.log('No medicines found!'); return; }

  console.log(`Found ${suppliers.length} suppliers and ${medicines.length} medicines`);

  let created = 0;
  let failed = 0;

  // Assign 3-5 medicines per supplier via purchase terms
  for (let i = 0; i < Math.min(suppliers.length, 30); i++) {
    const supplier = suppliers[i];
    const numMeds = 3 + (i % 3); // 3-5 medicines per supplier

    // Pick medicines in a rotating pattern
    const startIdx = (i * 5) % medicines.length;
    const selectedMeds = [];
    for (let k = 0; k < numMeds; k++) {
      selectedMeds.push(medicines[(startIdx + k) % medicines.length]);
    }

    for (const med of selectedMeds) {
      // Check if term already exists
      const existing = await prisma.purchaseTerm.findFirst({
        where: { supplierId: supplier.id, medicineName: med.medicineName }
      });
      if (existing) continue;

      const sellPrice = parseFloat(med.pricePerPiece || 30);
      const costPrice = sellPrice * (0.55 + Math.random() * 0.15); // 55-70% of selling price

      try {
        await prisma.purchaseTerm.create({
          data: {
            supplierId: supplier.id,
            medicineId: med.id,
            medicineName: med.medicineName,
            purchasePrice: parseFloat(costPrice.toFixed(2)),
            gstPercent: [5, 12, 18][i % 3],
            discount: i % 10,
            moq: [10, 25, 50][i % 3],
            creditDays: [15, 30, 45][i % 3],
            scheme: i % 4 === 0 ? `${5 + (i % 5)}+1 free` : null,
            isActive: true,
          }
        });
        created++;
      } catch (err) {
        failed++;
        if (err.message.includes('No space left')) {
          console.error('\n❌ Database disk full! Stopping.');
          break;
        }
      }
    }
    if (failed > 0) break;
    console.log(`✅ Mapped ${numMeds} medicines to: ${supplier.name}`);
  }

  console.log(`\n✅ Done! Created ${created} purchase terms. Failed: ${failed}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
