import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateSKU = (name, i) => {
  const prefix = name.replace(/[^A-Z]/g, '').substring(0, 3) || 'MED';
  return `SKU-${prefix}-${String(i).padStart(5, '0')}`;
};

// ─── 100 Additional Medicines with mg, cost price, selling price ───────────────
const medicines = [
  // Cardiovascular
  { name: 'Ramipril 5mg', generic: 'Ramipril', type: 'Tablets', costPrice: 18.00, price: 30.00 },
  { name: 'Carvedilol 6.25mg', generic: 'Carvedilol', type: 'Tablets', costPrice: 22.00, price: 38.00 },
  { name: 'Bisoprolol 5mg', generic: 'Bisoprolol', type: 'Tablets', costPrice: 16.00, price: 28.00 },
  { name: 'Enalapril 10mg', generic: 'Enalapril', type: 'Tablets', costPrice: 14.00, price: 25.00 },
  { name: 'Furosemide 40mg', generic: 'Furosemide', type: 'Tablets', costPrice: 8.00, price: 14.00 },
  { name: 'Digoxin 0.25mg', generic: 'Digoxin', type: 'Tablets', costPrice: 12.00, price: 22.00 },
  { name: 'Verapamil 80mg', generic: 'Verapamil', type: 'Tablets', costPrice: 20.00, price: 35.00 },
  { name: 'Diltiazem 60mg', generic: 'Diltiazem', type: 'Tablets', costPrice: 18.00, price: 32.00 },
  { name: 'Nifedipine 10mg', generic: 'Nifedipine', type: 'Tablets', costPrice: 10.00, price: 18.00 },
  { name: 'Spironolactone 25mg', generic: 'Spironolactone', type: 'Tablets', costPrice: 15.00, price: 26.00 },
  // Diabetes
  { name: 'Metformin 850mg', generic: 'Metformin', type: 'Tablets', costPrice: 12.00, price: 22.00 },
  { name: 'Glipizide 5mg', generic: 'Glipizide', type: 'Tablets', costPrice: 10.00, price: 18.00 },
  { name: 'Sitagliptin 100mg', generic: 'Sitagliptin', type: 'Tablets', costPrice: 95.00, price: 155.00 },
  { name: 'Dapagliflozin 10mg', generic: 'Dapagliflozin', type: 'Tablets', costPrice: 85.00, price: 140.00 },
  { name: 'Insulin Glargine 100U', generic: 'Insulin Glargine', type: 'Injection', costPrice: 450.00, price: 720.00 },
  { name: 'Empagliflozin 10mg', generic: 'Empagliflozin', type: 'Tablets', costPrice: 88.00, price: 145.00 },
  { name: 'Voglibose 0.3mg', generic: 'Voglibose', type: 'Tablets', costPrice: 14.00, price: 24.00 },
  { name: 'Teneligliptin 20mg', generic: 'Teneligliptin', type: 'Tablets', costPrice: 32.00, price: 55.00 },
  { name: 'Pioglitazone 15mg', generic: 'Pioglitazone', type: 'Tablets', costPrice: 18.00, price: 30.00 },
  { name: 'Acarbose 25mg', generic: 'Acarbose', type: 'Tablets', costPrice: 22.00, price: 38.00 },
  // Antibiotics
  { name: 'Levofloxacin 500mg', generic: 'Levofloxacin', type: 'Tablets', costPrice: 30.00, price: 52.00 },
  { name: 'Clarithromycin 500mg', generic: 'Clarithromycin', type: 'Tablets', costPrice: 65.00, price: 110.00 },
  { name: 'Meropenem 500mg', generic: 'Meropenem', type: 'Injection', costPrice: 180.00, price: 295.00 },
  { name: 'Piperacillin 4g/Tazobactam 500mg', generic: 'Piperacillin-Tazobactam', type: 'Injection', costPrice: 290.00, price: 475.00 },
  { name: 'Nitrofurantoin 100mg', generic: 'Nitrofurantoin', type: 'Capsules', costPrice: 22.00, price: 38.00 },
  { name: 'Amoxiclav 625mg', generic: 'Amoxicillin-Clavulanate', type: 'Tablets', costPrice: 48.00, price: 80.00 },
  { name: 'Ofloxacin 200mg', generic: 'Ofloxacin', type: 'Tablets', costPrice: 18.00, price: 32.00 },
  { name: 'Vancomycin 500mg', generic: 'Vancomycin', type: 'Injection', costPrice: 320.00, price: 520.00 },
  { name: 'Cephalexin 500mg', generic: 'Cephalexin', type: 'Capsules', costPrice: 28.00, price: 48.00 },
  { name: 'Metronidazole 400mg', generic: 'Metronidazole', type: 'Tablets', costPrice: 8.00, price: 14.00 },
  // Respiratory
  { name: 'Salbutamol 100mcg Inhaler', generic: 'Salbutamol', type: 'OTC', costPrice: 55.00, price: 90.00 },
  { name: 'Budesonide 200mcg Inhaler', generic: 'Budesonide', type: 'OTC', costPrice: 135.00, price: 220.00 },
  { name: 'Formoterol 12mcg Capsules', generic: 'Formoterol', type: 'Capsules', costPrice: 75.00, price: 125.00 },
  { name: 'Theophylline 200mg', generic: 'Theophylline', type: 'Tablets', costPrice: 12.00, price: 20.00 },
  { name: 'Ipratropium 20mcg Inhaler', generic: 'Ipratropium', type: 'OTC', costPrice: 95.00, price: 155.00 },
  { name: 'Levosalbutamol 1mg Syrup', generic: 'Levosalbutamol', type: 'Syrups', costPrice: 38.00, price: 65.00 },
  { name: 'Bromhexine 8mg', generic: 'Bromhexine', type: 'Tablets', costPrice: 8.00, price: 14.00 },
  { name: 'Guaifenesin 100mg Syrup', generic: 'Guaifenesin', type: 'Syrups', costPrice: 28.00, price: 48.00 },
  { name: 'Ambroxol 30mg', generic: 'Ambroxol', type: 'Tablets', costPrice: 10.00, price: 17.00 },
  { name: 'Codeine Phosphate 10mg', generic: 'Codeine', type: 'Tablets', costPrice: 18.00, price: 30.00 },
  // Gastrointestinal
  { name: 'Esomeprazole 40mg', generic: 'Esomeprazole', type: 'Capsules', costPrice: 22.00, price: 38.00 },
  { name: 'Lansoprazole 30mg', generic: 'Lansoprazole', type: 'Capsules', costPrice: 18.00, price: 30.00 },
  { name: 'Sucralfate 1g Suspension', generic: 'Sucralfate', type: 'Syrups', costPrice: 42.00, price: 70.00 },
  { name: 'Lactulose 10g Syrup', generic: 'Lactulose', type: 'Syrups', costPrice: 35.00, price: 58.00 },
  { name: 'Metoclopramide 10mg', generic: 'Metoclopramide', type: 'Tablets', costPrice: 7.00, price: 12.00 },
  { name: 'Bisacodyl 5mg', generic: 'Bisacodyl', type: 'Tablets', costPrice: 6.00, price: 10.00 },
  { name: 'Loperamide 2mg', generic: 'Loperamide', type: 'Tablets', costPrice: 8.00, price: 14.00 },
  { name: 'Cholestyramine 4g Powder', generic: 'Cholestyramine', type: 'OTC', costPrice: 62.00, price: 100.00 },
  { name: 'Rifaximin 200mg', generic: 'Rifaximin', type: 'Tablets', costPrice: 48.00, price: 80.00 },
  { name: 'Mesalamine 400mg', generic: 'Mesalamine', type: 'Tablets', costPrice: 45.00, price: 75.00 },
  // Neurology / Psychiatry
  { name: 'Sertraline 50mg', generic: 'Sertraline', type: 'Tablets', costPrice: 30.00, price: 52.00 },
  { name: 'Escitalopram 10mg', generic: 'Escitalopram', type: 'Tablets', costPrice: 25.00, price: 42.00 },
  { name: 'Alprazolam 0.5mg', generic: 'Alprazolam', type: 'Tablets', costPrice: 15.00, price: 25.00 },
  { name: 'Clonazepam 0.5mg', generic: 'Clonazepam', type: 'Tablets', costPrice: 12.00, price: 20.00 },
  { name: 'Olanzapine 5mg', generic: 'Olanzapine', type: 'Tablets', costPrice: 35.00, price: 58.00 },
  { name: 'Quetiapine 25mg', generic: 'Quetiapine', type: 'Tablets', costPrice: 40.00, price: 68.00 },
  { name: 'Levetiracetam 500mg', generic: 'Levetiracetam', type: 'Tablets', costPrice: 48.00, price: 80.00 },
  { name: 'Valproate 200mg', generic: 'Valproic Acid', type: 'Tablets', costPrice: 22.00, price: 37.00 },
  { name: 'Phenytoin 100mg', generic: 'Phenytoin', type: 'Tablets', costPrice: 10.00, price: 17.00 },
  { name: 'Donepezil 10mg', generic: 'Donepezil', type: 'Tablets', costPrice: 65.00, price: 110.00 },
  // Pain / Musculoskeletal
  { name: 'Tramadol 100mg SR', generic: 'Tramadol', type: 'Tablets', costPrice: 28.00, price: 48.00 },
  { name: 'Naproxen 250mg', generic: 'Naproxen', type: 'Tablets', costPrice: 12.00, price: 20.00 },
  { name: 'Ketorolac 10mg', generic: 'Ketorolac', type: 'Tablets', costPrice: 15.00, price: 26.00 },
  { name: 'Celecoxib 100mg', generic: 'Celecoxib', type: 'Capsules', costPrice: 25.00, price: 42.00 },
  { name: 'Etoricoxib 60mg', generic: 'Etoricoxib', type: 'Tablets', costPrice: 28.00, price: 48.00 },
  { name: 'Tizanidine 2mg', generic: 'Tizanidine', type: 'Tablets', costPrice: 18.00, price: 30.00 },
  { name: 'Baclofen 10mg', generic: 'Baclofen', type: 'Tablets', costPrice: 20.00, price: 34.00 },
  { name: 'Diclofenac 75mg Injection', generic: 'Diclofenac', type: 'Injection', costPrice: 15.00, price: 25.00 },
  { name: 'Aceclofenac 100mg', generic: 'Aceclofenac', type: 'Tablets', costPrice: 12.00, price: 20.00 },
  { name: 'Meloxicam 7.5mg', generic: 'Meloxicam', type: 'Tablets', costPrice: 14.00, price: 24.00 },
  // Dermatology
  { name: 'Betamethasone Cream 0.1%', generic: 'Betamethasone', type: 'Creams', costPrice: 22.00, price: 38.00 },
  { name: 'Clobetasol Ointment 0.05%', generic: 'Clobetasol', type: 'Ointments', costPrice: 28.00, price: 48.00 },
  { name: 'Tacrolimus Ointment 0.1%', generic: 'Tacrolimus', type: 'Ointments', costPrice: 145.00, price: 235.00 },
  { name: 'Tretinoin 0.025% Cream', generic: 'Tretinoin', type: 'Creams', costPrice: 38.00, price: 62.00 },
  { name: 'Azelaic Acid 15% Gel', generic: 'Azelaic Acid', type: 'Creams', costPrice: 55.00, price: 90.00 },
  { name: 'Hydrocortisone 1% Cream', generic: 'Hydrocortisone', type: 'Creams', costPrice: 18.00, price: 30.00 },
  { name: 'Silver Sulfadiazine Cream', generic: 'Silver Sulfadiazine', type: 'Creams', costPrice: 35.00, price: 58.00 },
  { name: 'Mupirocin Ointment 2%', generic: 'Mupirocin', type: 'Ointments', costPrice: 42.00, price: 70.00 },
  { name: 'Calamine Lotion 100ml', generic: 'Calamine', type: 'Syrups', costPrice: 15.00, price: 25.00 },
  { name: 'Clindamycin 1% Gel', generic: 'Clindamycin', type: 'Creams', costPrice: 45.00, price: 75.00 },
  // Vitamins & Supplements
  { name: 'Vitamin B12 500mcg', generic: 'Cyanocobalamin', type: 'Tablets', costPrice: 10.00, price: 18.00 },
  { name: 'Vitamin E 400IU', generic: 'Tocopherol', type: 'Capsules', costPrice: 18.00, price: 30.00 },
  { name: 'Folic Acid 5mg', generic: 'Folic Acid', type: 'Tablets', costPrice: 5.00, price: 9.00 },
  { name: 'Omega-3 1000mg', generic: 'Omega-3 Fatty Acids', type: 'Capsules', costPrice: 22.00, price: 38.00 },
  { name: 'Magnesium 250mg', generic: 'Magnesium', type: 'Tablets', costPrice: 15.00, price: 26.00 },
  { name: 'Potassium Chloride 750mg', generic: 'Potassium', type: 'Tablets', costPrice: 12.00, price: 20.00 },
  { name: 'Biotin 10mg', generic: 'Biotin', type: 'Tablets', costPrice: 18.00, price: 30.00 },
  { name: 'Selenium 200mcg', generic: 'Selenium', type: 'Tablets', costPrice: 15.00, price: 26.00 },
  { name: 'Lycopene 10mg', generic: 'Lycopene', type: 'Capsules', costPrice: 20.00, price: 34.00 },
  { name: 'Coenzyme Q10 100mg', generic: 'Ubiquinone', type: 'Capsules', costPrice: 45.00, price: 75.00 },
  // Ophthalmology
  { name: 'Timolol 0.5% Eye Drops', generic: 'Timolol', type: 'Drops', costPrice: 35.00, price: 58.00 },
  { name: 'Latanoprost 0.005% Eye Drops', generic: 'Latanoprost', type: 'Drops', costPrice: 95.00, price: 158.00 },
  { name: 'Chloramphenicol Eye Drops', generic: 'Chloramphenicol', type: 'Drops', costPrice: 22.00, price: 36.00 },
  { name: 'Ciprofloxacin Eye Drops', generic: 'Ciprofloxacin', type: 'Drops', costPrice: 28.00, price: 46.00 },
  { name: 'Moxifloxacin Eye Drops', generic: 'Moxifloxacin', type: 'Drops', costPrice: 45.00, price: 75.00 },
  // Surgical / Consumables
  { name: 'IV Cannula 20G', generic: 'IV Cannula', type: 'Surgical', costPrice: 8.00, price: 14.00 },
  { name: 'Sutures Vicryl 2-0', generic: 'Absorbable Suture', type: 'Surgical', costPrice: 95.00, price: 158.00 },
  { name: 'Surgical Mask N95', generic: 'Respirator Mask', type: 'Surgical', costPrice: 35.00, price: 58.00 },
  { name: 'Nebulizer Mask Adult', generic: 'Nebulizer Mask', type: 'Consumables', costPrice: 28.00, price: 46.00 },
  { name: 'Blood Glucose Test Strip', generic: 'Glucometer Strip', type: 'Consumables', costPrice: 65.00, price: 108.00 },
];

async function main() {
  console.log('🚀 Seeding 100 additional medicines...\n');
  let successCount = 0;

  // Fetch suppliers for mapping
  const allSuppliers = await prisma.supplier.findMany({ where: { isActive: true } });

  for (let i = 0; i < medicines.length; i++) {
    const med = medicines[i];

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
      // Find a random supplier
      const randomSupplier = allSuppliers.length > 0
        ? allSuppliers[Math.floor(Math.random() * allSuppliers.length)]
        : null;

      const newMed = await prisma.medicine.create({
        data: {
          medicineName: med.name,
          genericName: med.generic,
          skuCode: generateSKU(med.name, 1000 + i),
          categoryId: category.id,
          supplierId: randomSupplier?.id || null,
          companyName: randomSupplier?.name || null,
          pricePerPiece: med.price,
          stockQuantity: Math.floor(Math.random() * 500) + 50,
          reorderLevel: 25,
          taxPercentage: [5, 12, 18][Math.floor(Math.random() * 3)],
          isActive: true
        }
      });

      // Create SupplierBrandMapping with cost & selling price info
      if (randomSupplier) {
        await prisma.supplierBrandMapping.create({
          data: {
            supplierId: randomSupplier.id,
            brandName: med.generic + ' Brand',
            medicineName: med.name,
            genericName: med.generic,
          }
        });

        // Create PurchaseTerm to record cost price
        await prisma.purchaseTerm.create({
          data: {
            supplierId: randomSupplier.id,
            medicineName: med.name,
            medicineId: newMed.id,
            purchasePrice: med.costPrice,
            gstPercent: [5, 12, 18][Math.floor(Math.random() * 3)],
            discount: Math.floor(Math.random() * 12),
            moq: [10, 25, 50][Math.floor(Math.random() * 3)],
            creditDays: [15, 30, 45][Math.floor(Math.random() * 3)],
            scheme: Math.random() > 0.65 ? `${Math.floor(Math.random()*8)+5}+1 free` : null,
            isActive: true,
          }
        });
      }

      successCount++;
      console.log(`✅ [${successCount}] ${med.name} — Cost: ₹${med.costPrice} | Sell: ₹${med.price}`);
    } else {
      console.log(`⚠️  Already exists: ${med.name}`);
    }
  }

  console.log(`\n✅ Done! Created ${successCount} new medicines.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
