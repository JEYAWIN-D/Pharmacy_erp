import prisma from '../../config/prisma.js';

export const supplierRepository = {
  findAll: async ({ page = 1, limit = 10, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' }) => {
    const where = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const allowedSort = ['name', 'code', 'createdAt', 'drugLicenseExpiry', 'paymentTermsDays'];
    const orderBy = allowedSort.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.supplier.count({ where })
    ]);

    return { suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById: async (id) => {
    return prisma.supplier.findFirst({ where: { id, isDeleted: false } });
  },

  findByCode: async (code) => {
    return prisma.supplier.findFirst({ where: { code } });
  },

  getLastCode: async () => {
    return prisma.supplier.findFirst({
      where: { code: { startsWith: 'SUP-' } },
      orderBy: { createdAt: 'desc' }
    });
  },

  create: async (data) => {
    return prisma.supplier.create({ data });
  },

  update: async (id, data) => {
    return prisma.supplier.update({ where: { id }, data });
  },

  softDelete: async (id) => {
    return prisma.supplier.update({ where: { id }, data: { isDeleted: true, isActive: false } });
  },

  toggleStatus: async (id, isActive) => {
    return prisma.supplier.update({ where: { id }, data: { isActive } });
  },

  findExpiringLicenses: async (days = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return prisma.supplier.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        drugLicenseExpiry: { lte: cutoff, gte: new Date() }
      },
      orderBy: { drugLicenseExpiry: 'asc' }
    });
  },

  // Supplier Invoices
  findAllInvoices: async () => {
    return prisma.supplierInvoice.findMany({
      orderBy: { date: 'desc' }
    });
  },

  createInvoice: async (data) => {
    return prisma.supplierInvoice.create({ data });
  },

  // Supplier Payments
  findAllPayments: async () => {
    return prisma.supplierPayment.findMany({
      orderBy: { date: 'desc' }
    });
  },

  createPayment: async (data) => {
    return prisma.supplierPayment.create({ data });
  },

  // Supplier Ledger
  findAllLedgerEntries: async () => {
    return prisma.supplierLedger.findMany({
      orderBy: { date: 'desc' }
    });
  },

  createLedgerEntry: async (data) => {
    return prisma.supplierLedger.create({ data });
  },

  // Purchase Orders
  findAllPurchaseOrders: async () => {
    return prisma.purchaseOrder.findMany({
      include: {
        items: true,
        supplier: true
      },
      orderBy: { orderDate: 'desc' }
    });
  },

  createPurchaseOrder: async (data) => {
    return prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        prId: data.prId || null,
        total: data.total,
        status: data.status || 'Draft',
        createdBy: data.createdBy || 'Admin',
        items: {
          create: data.items.map(item => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            qty: parseInt(item.qty),
            unitPrice: item.unitPrice,
            total: item.total
          }))
        }
      },
      include: {
        items: true
      }
    });
  },

  updatePurchaseOrderStatus: async (id, status) => {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });
  }
};
