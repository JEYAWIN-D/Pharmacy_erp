import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateGST = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let gst = '29'; // State code for Karnataka
  for (let i = 0; i < 5; i++) gst += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  for (let i = 0; i < 4; i++) gst += Math.floor(Math.random() * 10);
  gst += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  gst += '1Z';
  gst += chars[Math.floor(Math.random() * chars.length)];
  return gst;
};

const suppliers = [
  { name: 'Sun Pharma Distributors', type: 'Distributor', contact: 'Rajesh Kumar', phone: '9876543210', city: 'Mumbai', isPreferred: true },
  { name: 'Cipla Healthcare Solutions', type: 'Manufacturer', contact: 'Amit Shah', phone: '9876543211', city: 'Pune', isPreferred: true },
  { name: 'Lupin Pharmaceuticals Ltd', type: 'Wholesaler', contact: 'Suresh Patil', phone: '9876543212', city: 'Delhi', isPreferred: false },
  { name: 'Dr. Reddys Labs Supplier', type: 'Manufacturer', contact: 'Priya Reddy', phone: '9876543213', city: 'Hyderabad', isPreferred: true },
  { name: 'Aurobindo Pharma Dist.', type: 'Distributor', contact: 'Kiran Rao', phone: '9876543214', city: 'Hyderabad', isPreferred: false },
  { name: 'Torrent Pharma Logistics', type: 'Wholesaler', contact: 'Manoj Desai', phone: '9876543215', city: 'Ahmedabad', isPreferred: true },
  { name: 'Zydus Cadila Supplies', type: 'Manufacturer', contact: 'Neha Patel', phone: '9876543216', city: 'Ahmedabad', isPreferred: false },
  { name: 'Alkem Laboratories Ltd', type: 'Distributor', contact: 'Vikas Singh', phone: '9876543217', city: 'Mumbai', isPreferred: false },
  { name: 'Intas Pharmaceuticals', type: 'Wholesaler', contact: 'Pooja Sharma', phone: '9876543218', city: 'Ahmedabad', isPreferred: false },
  { name: 'Glenmark Pharma Supply', type: 'Distributor', contact: 'Rahul Verma', phone: '9876543219', city: 'Mumbai', isPreferred: true },
  { name: 'Mankind Pharma Dist', type: 'Wholesaler', contact: 'Arun Gupta', phone: '9876543220', city: 'Delhi', isPreferred: true },
  { name: 'Biocon Biologics', type: 'Manufacturer', contact: 'Sneha Iyer', phone: '9876543221', city: 'Bangalore', isPreferred: true },
  { name: 'Torrent Healthcare', type: 'Distributor', contact: 'Sanjay Jain', phone: '9876543222', city: 'Surat', isPreferred: false },
  { name: 'Apex Labs Wholesale', type: 'Wholesaler', contact: 'Ramesh Krishnan', phone: '9876543223', city: 'Chennai', isPreferred: false },
  { name: 'Himalaya Wellness Dist', type: 'Distributor', contact: 'Karthik N', phone: '9876543224', city: 'Bangalore', isPreferred: true },
  { name: 'Abbott India Suppliers', type: 'Distributor', contact: 'John D', phone: '9876543225', city: 'Mumbai', isPreferred: true },
  { name: 'GSK Pharmaceuticals', type: 'Manufacturer', contact: 'Peter M', phone: '9876543226', city: 'Pune', isPreferred: false },
  { name: 'Sanofi India Supply', type: 'Wholesaler', contact: 'Anjali D', phone: '9876543227', city: 'Mumbai', isPreferred: false },
  { name: 'Pfizer Ltd Distributors', type: 'Distributor', contact: 'Nitin B', phone: '9876543228', city: 'Delhi', isPreferred: true },
  { name: 'Novartis Healthcare', type: 'Manufacturer', contact: 'Riya K', phone: '9876543229', city: 'Hyderabad', isPreferred: false },
  { name: 'J&J Medical Devices', type: 'Distributor', contact: 'Sameer L', phone: '9876543230', city: 'Mumbai', isPreferred: true },
  { name: 'P&G Health Supply', type: 'Wholesaler', contact: 'Tanya R', phone: '9876543231', city: 'Mumbai', isPreferred: false },
  { name: 'Natco Pharma Logistics', type: 'Distributor', contact: 'Siva K', phone: '9876543232', city: 'Hyderabad', isPreferred: true },
  { name: 'Micro Labs Wholesale', type: 'Wholesaler', contact: 'Prasad M', phone: '9876543233', city: 'Bangalore', isPreferred: false },
  { name: 'Strides Pharma Supply', type: 'Distributor', contact: 'Ganesh P', phone: '9876543234', city: 'Bangalore', isPreferred: false },
];

const categoriesList = ['Tablets', 'Capsules', 'Syrups', 'Injection', 'Drops', 'Creams', 'Ointments', 'Surgical', 'Consumables', 'OTC', 'Ayurvedic', 'Cosmetics'];

async function main() {
  console.log('Seeding database with 25 suppliers...');
  
  for (let i = 0; i < suppliers.length; i++) {
    const s = suppliers[i];
    const code = `SUP-${Math.floor(Math.random() * 1000000)}`;
    
    // Check if supplier already exists by name
    let supplier = await prisma.supplier.findFirst({ where: { name: s.name } });
    
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: s.name,
          code: code,
          supplierType: s.type,
          contactPerson: s.contact,
          phone: s.phone,
          email: `${s.name.split(' ')[0].toLowerCase()}@example.com`,
          addressCity: s.city,
          addressState: 'State',
          gstNumber: generateGST(),
          creditLimit: (100000 + Math.floor(Math.random() * 900000)),
          openingBalance: 0,
          isActive: true,
          isPreferred: s.isPreferred,
          status: 'Active'
        }
      });
      console.log(`Created supplier: ${supplier.name}`);
      
      // Map 2-4 random categories to each supplier
      const numCategories = Math.floor(Math.random() * 3) + 2;
      const shuffledCategories = [...categoriesList].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < numCategories; j++) {
        await prisma.supplierCategory.create({
          data: {
            supplierId: supplier.id,
            categoryName: shuffledCategories[j],
            isPreferred: j === 0 // Make the first one preferred
          }
        });
      }
      
      // Let's also create an invoice and a payment to show some ledger data for half of them
      if (i % 2 === 0) {
        const invAmount = 10000 + Math.floor(Math.random() * 50000);
        await prisma.supplierLedger.create({
          data: {
            supplierId: supplier.id,
            date: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000), // Random date in last 30 days
            type: 'Invoice',
            amount: invAmount,
            remarks: 'Opening stock purchase'
          }
        });
        
        // Random payment for some
        if (Math.random() > 0.5) {
          await prisma.supplierLedger.create({
            data: {
              supplierId: supplier.id,
              date: new Date(),
              type: 'Payment',
              amount: invAmount / 2, // Part payment
              remarks: 'Advance payment'
            }
          });
        }
      }
    } else {
      console.log(`Supplier already exists: ${supplier.name}`);
    }
  }
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
