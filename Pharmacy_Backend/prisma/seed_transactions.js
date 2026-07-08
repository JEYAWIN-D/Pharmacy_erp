import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rich transactional data (Bills, Batches, POs, GRNs, Ledger)...');

  console.log('🧹 Cleaning old transactional records to prevent duplicates...');
  const tables = [
    'paymentTransaction', 'billItem', 'bill', 'expiryAlert', 'rackStock',
    'supplierInvoice', 'supplierLedger', 'gRNItem', 'medicineBatch', 'gRN',
    'purchaseOrderItem', 'purchaseOrder', 'prescriptionItem', 'prescription', 'cashRegister'
  ];

  for (const table of tables) {
    try {
      if (prisma[table]) {
        await prisma[table].deleteMany();
      }
    } catch (e) {
      console.log(`⚠️ Failed to clean table ${table}: ${e.message}`);
    }
  }

  const medicines = await prisma.medicine.findMany({ take: 20 });
  const suppliers = await prisma.supplier.findMany({ take: 5, where: { isActive: true } });

  if (medicines.length === 0 || suppliers.length === 0) {
    console.log('❌ Error: Please seed medicines and suppliers first before running this script.');
    return;
  }

  // 1. Create Medicine Batches (MedicineBatch) & Expiry Alerts
  console.log('📦 Seeding Medicine Batches...');
  const batchesCreated = [];
  const today = new Date();

  for (let i = 0; i < medicines.length; i++) {
    const med = medicines[i];
    const supplier = suppliers[i % suppliers.length];

    // Batch 1: Expiring soon (within 30 days) to trigger alerts
    const expDateSoon = new Date(today);
    expDateSoon.setDate(today.getDate() + 20);

    const b1 = await prisma.medicineBatch.create({
      data: {
        medicineId: med.id,
        batchNumber: `B-SOON-${med.skuCode.split('-')[1] || '00'}-${100 + i}`,
        expiryDate: expDateSoon,
        mfgDate: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()),
        stockQty: 80,
        mrp: med.pricePerPiece || 25,
        purchasePrice: (med.pricePerPiece || 25) * 0.6,
        sellingPrice: med.pricePerPiece || 25,
        supplierId: supplier.id,
        status: 'Active'
      }
    });
    batchesCreated.push(b1);

    // Create Expiry Alert
    await prisma.expiryAlert.create({
      data: {
        batchId: b1.id,
        medicineId: med.id,
        medicineName: med.medicineName,
        expiryDate: expDateSoon,
        daysLeft: 20,
        alertTier: 'Medium',
        action: 'Active'
      }
    });

    // Batch 2: Healthy Expiry (1 year out)
    const expDateHealthy = new Date(today);
    expDateHealthy.setFullYear(today.getFullYear() + 1);

    const b2 = await prisma.medicineBatch.create({
      data: {
        medicineId: med.id,
        batchNumber: `B-HLTH-${med.skuCode.split('-')[1] || '00'}-${200 + i}`,
        expiryDate: expDateHealthy,
        mfgDate: new Date(today.getFullYear(), today.getMonth() - 2, today.getDate()),
        stockQty: 350,
        mrp: med.pricePerPiece || 25,
        purchasePrice: (med.pricePerPiece || 25) * 0.6,
        sellingPrice: med.pricePerPiece || 25,
        supplierId: supplier.id,
        status: 'Active'
      }
    });
    batchesCreated.push(b2);

    // Batch 3: Expired (Already expired 10 days ago)
    const expDateExpired = new Date(today);
    expDateExpired.setDate(today.getDate() - 10);

    const b3 = await prisma.medicineBatch.create({
      data: {
        medicineId: med.id,
        batchNumber: `B-EXPD-${med.skuCode.split('-')[1] || '00'}-${300 + i}`,
        expiryDate: expDateExpired,
        mfgDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
        stockQty: 45,
        mrp: med.pricePerPiece || 25,
        purchasePrice: (med.pricePerPiece || 25) * 0.6,
        sellingPrice: med.pricePerPiece || 25,
        supplierId: supplier.id,
        status: 'Active'
      }
    });
    batchesCreated.push(b3);

    // Create Expiry Alert for expired batch
    await prisma.expiryAlert.create({
      data: {
        batchId: b3.id,
        medicineId: med.id,
        medicineName: med.medicineName,
        expiryDate: expDateExpired,
        daysLeft: -10,
        alertTier: 'High',
        action: 'Expired'
      }
    });

    // Allocate Rack Stock dynamically
    await prisma.rackStock.upsert({
      where: {
        rackId_medicineId_batchNumber: {
          rackId: 'A1',
          medicineId: med.id,
          batchNumber: b2.batchNumber
        }
      },
      update: {},
      create: {
        rackId: 'A1',
        medicineId: med.id,
        batchNumber: b2.batchNumber,
        qty: 150
      }
    });

    // Sync inventory total stock
    await prisma.inventory.upsert({
      where: { medicineId: med.id },
      update: {
        rackStock: 150,
        warehouseStock: 325, // b1 (80) + b3 (45) + partial b2 (200)
        totalStock: 475
      },
      create: {
        medicineId: med.id,
        rackStock: 150,
        warehouseStock: 325,
        totalStock: 475
      }
    });

    // Update Medicine Stock quantity
    await prisma.medicine.update({
      where: { id: med.id },
      data: { stockQuantity: 475 }
    });
  }
  console.log(`  ✓ Created ${batchesCreated.length} Batches and Expiry Alerts.`);

  // 2. Open Cash Register
  console.log('🏧 Opening Cash Register...');
  await prisma.cashRegister.create({
    data: {
      openedBy: 'admin',
      openingBalance: 5000.00,
      status: 'Open',
      cashSales: 1500.00,
      upiSales: 3450.00,
      cardSales: 1200.00,
      totalSales: 6150.00,
    }
  });

  // 3. Create POS Bills (Sales History)
  console.log('🧾 Seeding POS Bills (Sales History)...');
  const billCount = 10;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (let i = 0; i < billCount; i++) {
    const isToday = i % 2 === 0;
    const billDate = isToday ? today : yesterday;
    const med1 = medicines[i % medicines.length];
    const med2 = medicines[(i + 1) % medicines.length];

    const price1 = parseFloat(med1.pricePerPiece || 25);
    const price2 = parseFloat(med2.pricePerPiece || 25);

    const qty1 = 3 + (i % 3);
    const qty2 = 2 + (i % 2);

    const subtotal = (price1 * qty1) + (price2 * qty2);
    const discount = i % 3 === 0 ? 5.00 : 0.00;
    const gstTax = subtotal * 0.12;
    const grandTotal = subtotal - discount + gstTax;

    const bill = await prisma.bill.create({
      data: {
        id: `BILL-2026-${1000 + i}`,
        patientName: `Patient ${String.fromCharCode(65 + i)}`,
        mobileNumber: `987654321${i}`,
        subtotal: subtotal,
        discount: discount,
        gstTax: gstTax,
        grandTotal: grandTotal,
        paidAmount: grandTotal,
        paymentStatus: 'Paid',
        paymentMethod: i % 3 === 0 ? 'UPI' : i % 3 === 1 ? 'Cash' : 'Card',
        createdAt: billDate,
        updatedAt: billDate,
        createdBy: 'admin',
      }
    });

    await prisma.billItem.create({
      data: {
        billId: bill.id,
        medicineId: med1.id,
        name: med1.medicineName,
        qty: qty1,
        price: price1,
        gstRate: 12,
        total: price1 * qty1,
        batchNumber: `B-HLTH-${med1.skuCode.split('-')[1] || '00'}-${200 + (i % medicines.length)}`
      }
    });

    await prisma.billItem.create({
      data: {
        billId: bill.id,
        medicineId: med2.id,
        name: med2.medicineName,
        qty: qty2,
        price: price2,
        gstRate: 12,
        total: price2 * qty2,
        batchNumber: `B-HLTH-${med2.skuCode.split('-')[1] || '00'}-${200 + ((i + 1) % medicines.length)}`
      }
    });

    // Payment Transaction splits
    await prisma.paymentTransaction.create({
      data: {
        billId: bill.id,
        cashPaid: bill.paymentMethod === 'Cash' ? grandTotal : 0,
        upiPaid: bill.paymentMethod === 'UPI' ? grandTotal : 0,
        cardPaid: bill.paymentMethod === 'Card' ? grandTotal : 0,
        createdAt: billDate
      }
    });
  }
  console.log(`  ✓ Seeded ${billCount} sales bills.`);

  // 4. Create Purchase Orders (POs) & GRNs
  console.log('🛒 Seeding Purchase Orders and GRN Receivables...');
  for (let i = 0; i < 3; i++) {
    const supplier = suppliers[i % suppliers.length];
    const med = medicines[i % medicines.length];
    const costPrice = parseFloat(med.pricePerPiece || 25) * 0.6;
    const qtyOrdered = 100 + (i * 50);
    const subtotal = costPrice * qtyOrdered;
    const total = subtotal * 1.12;

    const po = await prisma.purchaseOrder.create({
      data: {
        id: `PO-2026-${100 + i}`,
        supplierId: supplier.id,
        poDate: today,
        status: i === 0 ? 'COMPLETED' : i === 1 ? 'PO_CONFIRMED' : 'Draft',
        subtotal: subtotal,
        total: total,
        paymentTerms: 'Net 30',
        communicationMethod: 'Email',
        createdBy: 'admin'
      }
    });

    await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: po.id,
        medicineId: med.id,
        medicineName: med.medicineName,
        qty: qtyOrdered,
        defaultPrice: costPrice,
        unitPrice: costPrice,
        tax: 12,
        total: total,
        receivedQty: i === 0 ? qtyOrdered : 0,
        status: i === 0 ? 'Received' : 'Pending'
      }
    });

    // Create GRN if PO is completed
    if (i === 0) {
      const grn = await prisma.gRN.create({
        data: {
          id: `GRN-2026-${200 + i}`,
          poId: po.id,
          supplierId: supplier.id,
          invoiceNumber: `INV-SUPP-${500 + i}`,
          receivedDate: today,
          receivedBy: 'admin',
          status: 'Verified & Approved',
          savedAsDraft: false
        }
      });

      await prisma.gRNItem.create({
        data: {
          grnId: grn.id,
          medicineId: med.id,
          medicineName: med.medicineName,
          orderedQty: qtyOrdered,
          receivedQty: qtyOrdered,
          acceptedQty: qtyOrdered,
          batchNumber: `B-HLTH-${med.skuCode.split('-')[1] || '00'}-${200 + (i % medicines.length)}`,
          status: 'Completed'
        }
      });

      // Seeding Supplier Ledger and Payment
      await prisma.supplierLedger.create({
        data: {
          supplierId: supplier.id,
          type: 'INVOICE',
          amount: total,
          remarks: `Invoice generated for GRN ${grn.id} (Ref: ${grn.invoiceNumber})`,
        }
      });

      // Seeding Supplier Invoices
      await prisma.supplierInvoice.create({
        data: {
          invoiceNumber: grn.invoiceNumber,
          supplierId: supplier.id,
          amount: total,
          status: 'Unpaid',
          remarks: `Linked to PO ${po.id} and GRN ${grn.id}`
        }
      });
    }
  }
  console.log('  ✓ Seeded Purchase Orders and GRNs.');

  // 5. Create Prescriptions
  console.log('📝 Seeding Prescriptions...');
  for (let i = 0; i < 4; i++) {
    const med = medicines[i % medicines.length];
    const presc = await prisma.prescription.create({
      data: {
        patientName: `Patient Prescription ${String.fromCharCode(88 + i)}`,
        doctorName: `Dr. Specialist ${String.fromCharCode(65 + i)}`,
        department: i % 2 === 0 ? 'General Medicine' : 'Cardiology',
        status: i % 2 === 0 ? 'Pending' : 'Dispensed',
        entryMode: 'System'
      }
    });

    await prisma.prescriptionItem.create({
      data: {
        prescriptionId: presc.id,
        medicineName: med.medicineName,
        qty: 10,
        dosage: '1-0-1',
        note: 'After food for 5 days'
      }
    });
  }
  console.log('  ✓ Prescriptions seeded successfully.');

  console.log('\n✅ Rich transactional database seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding transactions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
