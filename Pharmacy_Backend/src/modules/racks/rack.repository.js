import prisma from '../../config/prisma.js';

export const rackRepository = {
  create: async (data) => prisma.rack.create({ data }),
  findAll: async () => prisma.rack.findMany({ 
    where: { isDeleted: false }, 
    include: {
      compartments: {
        where: { isDeleted: false },
        include: {
          medicineLocations: {
            include: { medicine: true }
          }
        }
      },
      rackStocks: {
        include: { medicine: true }
      }
    },
    orderBy: { id: 'asc' } 
  }),
  findById: async (id) => prisma.rack.findFirst({ 
    where: { id, isDeleted: false },
    include: {
      compartments: {
        where: { isDeleted: false },
        include: {
          medicineLocations: {
            include: { medicine: true }
          }
        }
      },
      rackStocks: {
        include: { medicine: true }
      }
    }
  }),
  update: async (id, data) => prisma.rack.update({ where: { id }, data }),
  count: async () => prisma.rack.count({ where: { isDeleted: false } }),
  
  createCompartment: async (data) => prisma.compartment.create({ data }),
  updateCompartment: async (id, data) => prisma.compartment.update({ where: { id }, data }),
  findCompartmentById: async (id) => prisma.compartment.findFirst({ where: { id, isDeleted: false } }),
  
  createTransfer: async (data) => prisma.stockTransfer.create({ data }),
  
  updateMedicineLocation: async (tx, compartmentId, medicineId, qtyDelta, batchNumber) => {
    const existing = await tx.medicineLocation.findFirst({
      where: { compartmentId, medicineId, batchNumber: batchNumber || null }
    });
    if (existing) {
      const newQty = existing.qty + qtyDelta;
      if (newQty < 0) throw new Error('Insufficient stock in source compartment');
      return tx.medicineLocation.update({
        where: { id: existing.id },
        data: { qty: newQty }
      });
    } else {
      if (qtyDelta < 0) throw new Error('Insufficient stock in source compartment');
      return tx.medicineLocation.create({
        data: { compartmentId, medicineId, batchNumber: batchNumber || null, qty: qtyDelta }
      });
    }
  },
  
  executeTransaction: async (fn) => prisma.$transaction(fn)
};
