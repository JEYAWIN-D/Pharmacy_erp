import prisma from '../../config/prisma.js';

export const supplierRepository = {
  // ─── SUPPLIER MASTER ────────────────────────────────────────────────────────
  findAll: async ({ page = 1, limit = 10, search, isActive, status, isPreferred, sortBy = 'createdAt', sortOrder = 'desc' }) => {
    const where = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (status) where.status = status;
    if (isPreferred !== undefined) where.isPreferred = isPreferred;

    const allowedSort = ['name', 'code', 'createdAt', 'drugLicenseExpiry', 'paymentTermsDays', 'creditLimit'];
    const orderBy = allowedSort.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplierCategories: true,
          _count: {
            select: {
              supplierInvoices: true,
              supplierPayments: true,
              supplierReturns: true,
              supplierBrandMappings: true
            }
          }
        }
      }),
      prisma.supplier.count({ where })
    ]);

    return { suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById: async (id) => {
    return prisma.supplier.findFirst({
      where: { id, isDeleted: false },
      include: {
        supplierCategories: true,
        supplierBrandMappings: true,
        purchaseTerms: { where: { isActive: true } },
        supplierDocuments: true,
        _count: {
          select: {
            supplierInvoices: true,
            supplierPayments: true,
            supplierReturns: true,
            supplierBrandMappings: true,
            purchaseOrders: true
          }
        }
      }
    });
  },

  findByCode: async (code) => {
    return prisma.supplier.findFirst({ where: { code } });
  },

  findByGst: async (gstNumber) => {
    return prisma.supplier.findFirst({ where: { gstNumber, isDeleted: false } });
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
    return prisma.supplier.update({
      where: { id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date(), status: 'Deleted' }
    });
  },

  toggleStatus: async (id, isActive) => {
    return prisma.supplier.update({
      where: { id },
      data: { isActive, status: isActive ? 'Active' : 'Inactive' }
    });
  },

  togglePreferred: async (id, isPreferred) => {
    return prisma.supplier.update({
      where: { id },
      data: { isPreferred }
    });
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

  getDashboardStats: async () => {
    const [total, active, preferred, blacklisted] = await Promise.all([
      prisma.supplier.count({ where: { isDeleted: false } }),
      prisma.supplier.count({ where: { isDeleted: false, isActive: true } }),
      prisma.supplier.count({ where: { isDeleted: false, isPreferred: true } }),
      prisma.supplier.count({ where: { isDeleted: false, status: 'Blacklisted' } })
    ]);
    return { total, active, preferred, blacklisted };
  },

  // ─── SUPPLIER CATEGORIES ──────────────────────────────────────────────────
  findAllCategories: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierCategory.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  createCategory: async (data) => {
    return prisma.supplierCategory.create({ data });
  },

  updateCategory: async (id, data) => {
    return prisma.supplierCategory.update({ where: { id }, data });
  },

  deleteCategory: async (id) => {
    return prisma.supplierCategory.delete({ where: { id } });
  },

  // ─── BRAND MAPPINGS ───────────────────────────────────────────────────────
  findAllBrandMappings: async (supplierId) => {
    const where = supplierId ? { supplierId, isActive: true } : { isActive: true };
    return prisma.supplierBrandMapping.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { brandName: 'asc' }
    });
  },

  createBrandMapping: async (data) => {
    return prisma.supplierBrandMapping.create({ data });
  },

  updateBrandMapping: async (id, data) => {
    return prisma.supplierBrandMapping.update({ where: { id }, data });
  },

  deleteBrandMapping: async (id) => {
    return prisma.supplierBrandMapping.update({ where: { id }, data: { isActive: false } });
  },

  // ─── PURCHASE TERMS ───────────────────────────────────────────────────────
  findAllPurchaseTerms: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.purchaseTerm.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  createPurchaseTerm: async (data) => {
    return prisma.purchaseTerm.create({ data });
  },

  updatePurchaseTerm: async (id, data) => {
    return prisma.purchaseTerm.update({ where: { id }, data });
  },

  deletePurchaseTerm: async (id) => {
    return prisma.purchaseTerm.update({ where: { id }, data: { isActive: false } });
  },

  // ─── PRICE HISTORY ────────────────────────────────────────────────────────
  findAllPriceHistory: async ({ supplierId, medicineId, page = 1, limit = 50 }) => {
    const where = {};
    if (supplierId) where.supplierId = supplierId;
    if (medicineId) where.medicineId = medicineId;

    const [records, total] = await Promise.all([
      prisma.supplierPriceHistory.findMany({
        where,
        include: { supplier: { select: { id: true, name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.supplierPriceHistory.count({ where })
    ]);
    return { records, total, page, limit };
  },

  createPriceHistory: async (data) => {
    return prisma.supplierPriceHistory.create({ data });
  },

  // ─── SUPPLIER INVOICES ────────────────────────────────────────────────────
  findAllInvoices: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierInvoice.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { date: 'desc' }
    });
  },

  createInvoice: async (data) => {
    return prisma.supplierInvoice.create({ data });
  },

  // ─── SUPPLIER PAYMENTS ────────────────────────────────────────────────────
  findAllPayments: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierPayment.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { date: 'desc' }
    });
  },

  createPayment: async (data) => {
    return prisma.supplierPayment.create({ data });
  },

  updatePayment: async (id, data) => {
    return prisma.supplierPayment.update({ where: { id }, data });
  },

  deletePayment: async (id) => {
    return prisma.supplierPayment.delete({ where: { id } });
  },

  // ─── SUPPLIER LEDGER ──────────────────────────────────────────────────────
  findAllLedgerEntries: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierLedger.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { date: 'desc' }
    });
  },

  findLedgerBySupplier: async (supplierId) => {
    return prisma.supplierLedger.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' }
    });
  },

  createLedgerEntry: async (data) => {
    return prisma.supplierLedger.create({ data });
  },

  // ─── SUPPLIER RETURNS ─────────────────────────────────────────────────────
  findAllReturns: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierReturn.findMany({
      where,
      include: {
        items: true,
        supplier: { select: { id: true, name: true, code: true } },
        creditNotes: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  getLastReturnNumber: async () => {
    return prisma.supplierReturn.findFirst({
      where: { returnNumber: { startsWith: 'RET-' } },
      orderBy: { createdAt: 'desc' }
    });
  },

  createReturn: async (data) => {
    return prisma.supplierReturn.create({
      data: {
        returnNumber: data.returnNumber,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        grnId: data.grnId || null,
        creditAmount: data.creditAmount || 0,
        returnValue: data.returnValue || 0,
        reason: data.reason,
        status: data.status || 'Pending',
        processedBy: data.processedBy,
        remarks: data.remarks,
        items: {
          create: (data.items || []).map(item => ({
            medicineId: item.medicineId || null,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber || null,
            qty: parseInt(item.qty),
            unitPrice: item.unitPrice || null
          }))
        }
      },
      include: { items: true }
    });
  },

  updateReturn: async (id, data) => {
    return prisma.supplierReturn.update({ where: { id: parseInt(id) }, data });
  },

  deleteReturn: async (id) => {
    return prisma.supplierReturn.delete({ where: { id: parseInt(id) } });
  },

  // ─── CREDIT NOTES ────────────────────────────────────────────────────────
  findAllCreditNotes: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierCreditNote.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        supplierReturn: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  getLastCreditNoteNumber: async () => {
    return prisma.supplierCreditNote.findFirst({
      where: { creditNoteNumber: { startsWith: 'CN-' } },
      orderBy: { createdAt: 'desc' }
    });
  },

  createCreditNote: async (data) => {
    return prisma.supplierCreditNote.create({ data });
  },

  updateCreditNote: async (id, data) => {
    return prisma.supplierCreditNote.update({ where: { id }, data });
  },

  // ─── DOCUMENTS ────────────────────────────────────────────────────────────
  findAllDocuments: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierDocument.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  createDocument: async (data) => {
    return prisma.supplierDocument.create({ data });
  },

  deleteDocument: async (id) => {
    return prisma.supplierDocument.delete({ where: { id } });
  },

  // ─── PERFORMANCE ──────────────────────────────────────────────────────────
  findPerformance: async (supplierId) => {
    if (supplierId) {
      return prisma.supplierPerformance.findMany({
        where: { supplierId },
        include: { supplier: { select: { id: true, name: true, code: true } } },
        orderBy: { calculatedAt: 'desc' },
        take: 1
      });
    }
    // Get latest performance for all suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true }
    });
    const performances = [];
    for (const s of suppliers) {
      const perf = await prisma.supplierPerformance.findFirst({
        where: { supplierId: s.id },
        include: { supplier: { select: { id: true, name: true, code: true } } },
        orderBy: { calculatedAt: 'desc' }
      });
      if (perf) performances.push(perf);
    }
    return performances;
  },

  createPerformance: async (data) => {
    return prisma.supplierPerformance.create({ data });
  },

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────────
  createAuditLog: async (data) => {
    return prisma.supplierAuditLog.create({ data });
  },

  findAuditLogs: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.supplierAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  },

  // ─── PURCHASE ORDERS ──────────────────────────────────────────────────────
  findAllPurchaseOrders: async (supplierId) => {
    const where = supplierId ? { supplierId } : {};
    return prisma.purchaseOrder.findMany({
      where,
      include: {
        items: true,
        supplier: { select: { id: true, name: true, code: true } }
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
      include: { items: true }
    });
  },

  updatePurchaseOrderStatus: async (id, status) => {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });
  }
};
