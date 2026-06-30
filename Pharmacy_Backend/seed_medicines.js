import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateSKU = () => {
  return `SKU-${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;
};

const medicineData = [
  { name: 'Paracetamol 500mg', type: 'Tablets', price: 15 },
  { name: 'Amoxicillin 250mg', type: 'Capsules', price: 45 },
  { name: 'Ibuprofen 400mg', type: 'Tablets', price: 20 },
  { name: 'Cetirizine 10mg', type: 'Tablets', price: 12 },
  { name: 'Azithromycin 500mg', type: 'Tablets', price: 75 },
  { name: 'Pantoprazole 40mg', type: 'Tablets', price: 30 },
  { name: 'Metformin 500mg', type: 'Tablets', price: 18 },
  { name: 'Amlodipine 5mg', type: 'Tablets', price: 22 },
  { name: 'Losartan 50mg', type: 'Tablets', price: 35 },
  { name: 'Atorvastatin 10mg', type: 'Tablets', price: 40 },
  { name: 'Omeprazole 20mg', type: 'Capsules', price: 25 },
  { name: 'Levocetirizine 5mg', type: 'Tablets', price: 15 },
  { name: 'Diclofenac 50mg', type: 'Tablets', price: 10 },
  { name: 'Ciprofloxacin 500mg', type: 'Tablets', price: 50 },
  { name: 'Doxycycline 100mg', type: 'Capsules', price: 30 },
  { name: 'Ranitidine 150mg', type: 'Tablets', price: 8 },
  { name: 'Aspirin 75mg', type: 'Tablets', price: 5 },
  { name: 'Montelukast 10mg', type: 'Tablets', price: 45 },
  { name: 'Clopidogrel 75mg', type: 'Tablets', price: 55 },
  { name: 'Rosuvastatin 10mg', type: 'Tablets', price: 65 },
  { name: 'Telmisartan 40mg', type: 'Tablets', price: 35 },
  { name: 'Glimepiride 1mg', type: 'Tablets', price: 12 },
  { name: 'Metoprolol 50mg', type: 'Tablets', price: 28 },
  { name: 'Pregabalin 75mg', type: 'Capsules', price: 80 },
  { name: 'Gabapentin 300mg', type: 'Capsules', price: 90 },
  { name: 'Tramadol 50mg', type: 'Capsules', price: 40 },
  { name: 'Ondansetron 4mg', type: 'Tablets', price: 15 },
  { name: 'Domperidone 10mg', type: 'Tablets', price: 10 },
  { name: 'Rabeprazole 20mg', type: 'Tablets', price: 35 },
  { name: 'Cefixime 200mg', type: 'Tablets', price: 60 },
  { name: 'Ceftriaxone 1g', type: 'Injection', price: 45 },
  { name: 'Fluconazole 150mg', type: 'Tablets', price: 22 },
  { name: 'Itraconazole 100mg', type: 'Capsules', price: 110 },
  { name: 'Miconazole Cream', type: 'Creams', price: 35 },
  { name: 'Ketoconazole Soap', type: 'Cosmetics', price: 85 },
  { name: 'Vitamin C 500mg', type: 'Tablets', price: 25 },
  { name: 'Vitamin D3 60000IU', type: 'Capsules', price: 120 },
  { name: 'Multivitamin Syrup', type: 'Syrups', price: 95 },
  { name: 'Calcium 500mg', type: 'Tablets', price: 40 },
  { name: 'Iron Folic Acid', type: 'Tablets', price: 30 },
  { name: 'B Complex Capsule', type: 'Capsules', price: 15 },
  { name: 'Zinc Sulphate 20mg', type: 'Tablets', price: 20 },
  { name: 'ORS Powder', type: 'OTC', price: 18 },
  { name: 'Cough Syrup (D)', type: 'Syrups', price: 65 },
  { name: 'Cough Syrup (LS)', type: 'Syrups', price: 75 },
  { name: 'Antacid Liquid', type: 'Syrups', price: 55 },
  { name: 'Surgical Gloves', type: 'Surgical', price: 15 },
  { name: 'Cotton Roll 100g', type: 'Consumables', price: 45 },
  { name: 'Bandage 5cm', type: 'Surgical', price: 10 },
  { name: 'Syringe 5ml', type: 'Consumables', price: 5 }
];

async function main() {
  console.log('Seeding 50 medicines and mapping to suppliers...');

  // Fetch all suppliers and their categories
  const supplierCategories = await prisma.supplierCategory.findMany({
    include: { supplier: true }
  });

  // Group suppliers by category
  const suppliersByCategory = {};
  for (const sc of supplierCategories) {
    if (!suppliersByCategory[sc.categoryName]) {
      suppliersByCategory[sc.categoryName] = [];
    }
    suppliersByCategory[sc.categoryName].push(sc.supplier);
  }

  let successCount = 0;

  for (const med of medicineData) {
    // Find suppliers that match this medicine's category
    const matchingSuppliers = suppliersByCategory[med.type] || [];
    
    // Pick a random matching supplier if available
    let assignedSupplierId = null;
    let companyName = null;
    
    if (matchingSuppliers.length > 0) {
      const randomSupplier = matchingSuppliers[Math.floor(Math.random() * matchingSuppliers.length)];
      assignedSupplierId = randomSupplier.id;
      companyName = randomSupplier.name;
    }

    // Lookup or create Category
    let category = await prisma.category.findUnique({ where: { name: med.type } });
    if (!category) {
      category = await prisma.category.create({
        data: { name: med.type, description: med.type + ' Category' }
      });
    }

    // Check if medicine exists
    const existing = await prisma.medicine.findFirst({ where: { medicineName: med.name } });
    if (!existing) {
      await prisma.medicine.create({
        data: {
          medicineName: med.name,
          genericName: med.name.split(' ')[0],
          skuCode: generateSKU(),
          categoryId: category.id,
          supplierId: assignedSupplierId,
          companyName: companyName,
          pricePerPiece: med.price,
          stockQuantity: Math.floor(Math.random() * 500) + 50,
          reorderLevel: 50,
          isActive: true
        }
      });
      
      // Also optionally create a SupplierBrandMapping to show how it connects
      if (assignedSupplierId) {
        // Just create a dummy brand mapping
        await prisma.supplierBrandMapping.create({
          data: {
            supplierId: assignedSupplierId,
            brandName: med.name.split(' ')[0] + ' Brand',
            medicineName: med.name,
            genericName: med.name.split(' ')[0]
          }
        });
      }
      
      successCount++;
      console.log(`Created medicine: ${med.name} -> mapped to ${companyName || 'No matching supplier'}`);
    } else {
      console.log(`Medicine already exists: ${med.name}`);
    }
  }

  console.log(`Finished! Created ${successCount} new medicines.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
