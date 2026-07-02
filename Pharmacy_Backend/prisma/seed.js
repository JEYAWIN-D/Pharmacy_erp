import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ─────────────────────────────────────────────────────────────────
  const roles = [
    { name: 'Admin', description: 'Full system administrator access' },
    { name: 'Pharmacy Manager', description: 'Pharmacy branch manager' },
    { name: 'Pharmacist', description: 'Pharmacist / Dispensing staff' },
    { name: 'Inventory Staff', description: 'Stock and inventory management' },
    { name: 'Purchase Manager', description: 'Procurement and purchase orders' },
    { name: 'Billing Staff', description: 'POS and billing operations' },
    { name: 'Doctor', description: 'Doctor / Prescribing physician' }
  ];

  const createdRoles = {};
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
    createdRoles[role.name] = r;
    console.log(`  ✓ Role: ${role.name}`);
  }

  // ─── Admin User ────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@2024', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hcare.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hcare.com',
      password: hashedPassword,
      roleId: createdRoles['Admin'].id
    }
  });
  console.log(`  ✓ Admin user: admin@hcare.com / Admin@2024`);

  // ─── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Analgesic', description: 'Pain relief medicines' },
    { name: 'Antibiotic', description: 'Infection treatment medicines' },
    { name: 'Anti-diabetic', description: 'Diabetes management' },
    { name: 'Cardiovascular', description: 'Heart and BP medicines' },
    { name: 'Antacid', description: 'Stomach acidity medicines' },
    { name: 'Vaccine', description: 'Immunization vaccines' },
    { name: 'Vitamin & Supplement', description: 'Vitamins and supplements' },
    { name: 'Antifungal', description: 'Fungal infection medicines' },
    { name: 'Antihistamine', description: 'Allergy medicines' },
    { name: 'Respiratory', description: 'Asthma and lung medicines' }
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { name: cat.name }, update: {}, create: cat });
  }
  console.log(`  ✓ ${categories.length} Categories seeded`);

  // ─── Manufacturers ─────────────────────────────────────────────────────────
  const manufacturers = [
    { name: 'GlaxoSmithKline', country: 'India', contactEmail: 'india@gsk.com', phone: '+91 80 2222 1111' },
    { name: 'Sanofi India', country: 'India', contactEmail: 'orders@sanofi.in', phone: '+91 22 2222 3333' },
    { name: 'Alkem Laboratories', country: 'India', contactEmail: 'supply@alkem.com', phone: '+91 22 3333 4444' },
    { name: 'Pfizer Ltd', country: 'USA', contactEmail: 'india.orders@pfizer.com', phone: '+91 22 6693 2000' },
    { name: 'Serum Institute of India', country: 'India', contactEmail: 'sii@seruminstitute.com', phone: '+91 20 2699 8000' },
    { name: 'USV Pharma', country: 'India', contactEmail: 'orders@usv.com', phone: '+91 22 6698 1000' },
    { name: 'Sun Pharmaceutical', country: 'India', contactEmail: 'sunpharma@sun.com', phone: '+91 22 4324 4324' }
  ];
  for (const mfr of manufacturers) {
    await prisma.manufacturer.upsert({ where: { id: mfr.name }, update: {}, create: mfr }).catch(async () => {
      const existing = await prisma.manufacturer.findFirst({ where: { name: mfr.name } });
      if (!existing) await prisma.manufacturer.create({ data: mfr });
    });
  }
  console.log(`  ✓ ${manufacturers.length} Manufacturers seeded`);

  // ─── Notifications ─────────────────────────────────────────────────────────
  const notifs = [
    { type: 'warning', message: 'Low Stock Alert: Amoxicillin 500mg (8 left)', resolved: false },
    { type: 'danger', message: 'Critical Expiry: Batch B-CALP42 expires in 12 days!', resolved: false },
    { type: 'info', message: 'Purchase Order PO-2026-003 pending manager approval', resolved: false },
    { type: 'success', message: 'Freezer Temp stabilized at 4.2°C', resolved: true }
  ];
  for (const n of notifs) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  ✓ ${notifs.length} Notifications seeded`);

  // ─── Racks ─────────────────────────────────────────────────────────────────
  const racks = [
    { id: 'A1', category: 'Analgesics', maxCapacity: 150, status: 'Active' },
    { id: 'A2', category: 'Antibiotics', maxCapacity: 100, status: 'Active' },
    { id: 'A3', category: 'Anti-diabetic', maxCapacity: 250, status: 'Active' },
    { id: 'B1', category: 'Cardiovascular', maxCapacity: 120, status: 'Active' },
    { id: 'B2', category: 'Antacids', maxCapacity: 150, status: 'Active' },
    { id: 'Cold-1', category: 'Insulins (Freezer)', maxCapacity: 50, status: 'Active' },
    { id: 'Cold-2', category: 'Vaccines (Freezer)', maxCapacity: 50, status: 'Active' }
  ];
  for (const rack of racks) {
    await prisma.rack.upsert({ where: { id: rack.id }, update: {}, create: rack });
  }
  console.log(`  ✓ ${racks.length} Racks seeded`);

  // ─── Suppliers ─────────────────────────────────────────────────────────────
  const suppliers = [
    { name: 'Acme Pharma', code: 'SUP-ACME', gstNumber: '29AAACA1234A1Z1', email: 'acme@pharma.com', phone: '+91 99999 88888', gstType: 'Regular' },
    { name: 'Medlife Distributors', code: 'SUP-MEDLIFE', gstNumber: '29AAACA5678B1Z2', email: 'medlife@dist.com', phone: '+91 88888 77777', gstType: 'Regular' },
    { name: 'BioTech Labs', code: 'SUP-BIOTECH', gstNumber: '29AAACA9012C1Z3', email: 'biotech@labs.com', phone: '+91 77777 66666', gstType: 'Regular' }
  ];
  const createdSuppliers = {};
  for (const sup of suppliers) {
    const s = await prisma.supplier.upsert({
      where: { code: sup.code },
      update: {},
      create: sup
    });
    createdSuppliers[sup.name] = s;
  }
  console.log(`  ✓ ${suppliers.length} Suppliers seeded`);

  // Query existing categories/manufacturers to link
  const analgesicCat = await prisma.category.findUnique({ where: { name: 'Analgesic' } });
  const antacidCat = await prisma.category.findUnique({ where: { name: 'Antacid' } });
  const antibioticCat = await prisma.category.findUnique({ where: { name: 'Antibiotic' } });

  const gskMfr = await prisma.manufacturer.findFirst({ where: { name: 'GlaxoSmithKline' } });
  const alkemMfr = await prisma.manufacturer.findFirst({ where: { name: 'Alkem Laboratories' } });

  // ─── Medicines ─────────────────────────────────────────────────────────────
  const medicinesToSeed = [
    {
      medicineName: 'Dolo 650',
      genericName: 'Paracetamol',
      brandName: 'Dolo',
      skuCode: 'MED-DOLO',
      pricePerPiece: 2.50,
      taxPercentage: 12.00,
      categoryId: analgesicCat?.id,
      manufacturerId: gskMfr?.id,
      supplierId: createdSuppliers['Acme Pharma']?.id,
      stockQuantity: 1500,
      reorderLevel: 200
    },
    {
      medicineName: 'Digene',
      genericName: 'Antacid Gel/Tab',
      brandName: 'Digene',
      skuCode: 'MED-DIGENE',
      pricePerPiece: 1.80,
      taxPercentage: 12.00,
      categoryId: antacidCat?.id,
      manufacturerId: alkemMfr?.id,
      supplierId: createdSuppliers['Medlife Distributors']?.id,
      stockQuantity: 800,
      reorderLevel: 100
    },
    {
      medicineName: 'Diclofenac',
      genericName: 'Diclofenac Sodium',
      brandName: 'Voveran',
      skuCode: 'MED-DICLO',
      pricePerPiece: 5.00,
      taxPercentage: 18.00,
      categoryId: analgesicCat?.id,
      manufacturerId: gskMfr?.id,
      supplierId: createdSuppliers['BioTech Labs']?.id,
      stockQuantity: 1200,
      reorderLevel: 150
    },
    {
      medicineName: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate',
      brandName: 'Mox',
      skuCode: 'MED-AMOX',
      pricePerPiece: 8.50,
      taxPercentage: 12.00,
      categoryId: antibioticCat?.id,
      manufacturerId: alkemMfr?.id,
      supplierId: createdSuppliers['Acme Pharma']?.id,
      stockQuantity: 50,
      reorderLevel: 100
    },
    {
      medicineName: 'Paracetamol 500mg',
      genericName: 'Paracetamol',
      brandName: 'Crocin',
      skuCode: 'MED-PARA',
      pricePerPiece: 1.50,
      taxPercentage: 12.00,
      categoryId: analgesicCat?.id,
      manufacturerId: gskMfr?.id,
      supplierId: createdSuppliers['Medlife Distributors']?.id,
      stockQuantity: 2000,
      reorderLevel: 250
    }
  ];

  for (const med of medicinesToSeed) {
    await prisma.medicine.upsert({
      where: { skuCode: med.skuCode },
      update: {},
      create: med
    });
  }
  console.log(`  ✓ ${medicinesToSeed.length} Medicines seeded`);

  console.log('\n✅ Seeding complete!');
  console.log('   Login with: admin@hcare.com / Admin@2024');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });