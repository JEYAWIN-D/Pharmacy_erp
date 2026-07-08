import { supplierRepository } from './supplier.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import prisma from '../../config/prisma.js';

// Auto-generate supplier code like SUP-001, SUP-002
const generateCode = async () => {
  const last = await supplierRepository.getLastCode();
  if (!last?.code) return 'SUP-001';
  const num = parseInt(last.code.split('-')[1] || '0', 10) + 1;
  return `SUP-${String(num).padStart(3, '0')}`;
};

// Auto-generate return number like RET-00001
const generateReturnNumber = async () => {
  const last = await supplierRepository.getLastReturnNumber();
  if (!last?.returnNumber) return 'RET-00001';
  const num = parseInt(last.returnNumber.split('-')[1] || '0', 10) + 1;
  return `RET-${String(num).padStart(5, '0')}`;
};

// Auto-generate credit note number like CN-00001
const generateCreditNoteNumber = async () => {
  const last = await supplierRepository.getLastCreditNoteNumber();
  if (!last?.creditNoteNumber) return 'CN-00001';
  const num = parseInt(last.creditNoteNumber.split('-')[1] || '0', 10) + 1;
  return `CN-${String(num).padStart(5, '0')}`;
};

// Audit logging helper
const audit = async (supplierId, action, entity, entityId, oldValue, newValue, userName) => {
  try {
    await supplierRepository.createAuditLog({
      supplierId,
      action,
      entity,
      entityId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      userName: userName || 'System'
    });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
};

export const supplierService = {
  // ─── SUPPLIER MASTER ────────────────────────────────────────────────────────
  getAll: async (params) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const isActive = params.isActive !== undefined
      ? params.isActive === 'true' || params.isActive === true
      : undefined;
    const isPreferred = params.isPreferred !== undefined
      ? params.isPreferred === 'true' || params.isPreferred === true
      : undefined;

    const result = await supplierRepository.findAll({
      page, limit,
      search: params.search,
      isActive,
      isPreferred,
      status: params.status,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    });

    return {
      suppliers: result.suppliers,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  },

  getById: async (id) => {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    return supplier;
  },

  create: async (data) => {
    if (!data.code) {
      data.code = await generateCode();
    } else {
      const existing = await supplierRepository.findByCode(data.code);
      if (existing) throw new AppError('Supplier code already exists', 409, 'DUPLICATE_CODE');
    }

    if (data.gstNumber) {
      const gstExists = await supplierRepository.findByGst(data.gstNumber);
      if (gstExists) throw new AppError('GST number already registered with another supplier', 409, 'DUPLICATE_GST');
    }

    const supplier = await supplierRepository.create(data);

    // Auto-create ledger entry for opening balance
    if (data.openingBalance && parseFloat(data.openingBalance) > 0) {
      await supplierRepository.createLedgerEntry({
        supplierId: supplier.id,
        type: 'Opening',
        amount: parseFloat(data.openingBalance),
        remarks: `Opening balance for supplier ${supplier.name}`
      });
    }

    await audit(supplier.id, 'CREATE', 'Supplier', supplier.id, null, supplier, data.createdBy);
    return supplier;
  },

  update: async (id, data) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');

    if (data.code && data.code !== existing.code) {
      const codeExists = await supplierRepository.findByCode(data.code);
      if (codeExists) throw new AppError('Supplier code already in use', 409, 'DUPLICATE_CODE');
    }

    if (data.gstNumber && data.gstNumber !== existing.gstNumber) {
      const gstExists = await supplierRepository.findByGst(data.gstNumber);
      if (gstExists) throw new AppError('GST number already registered', 409, 'DUPLICATE_GST');
    }

    const updated = await supplierRepository.update(id, data);
    await audit(id, 'UPDATE', 'Supplier', id, existing, updated, data.updatedBy);
    return updated;
  },

  toggleStatus: async (id, isActive) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    const updated = await supplierRepository.toggleStatus(id, isActive);
    await audit(id, isActive ? 'ACTIVATE' : 'DEACTIVATE', 'Supplier', id, { isActive: existing.isActive }, { isActive });
    return updated;
  },

  togglePreferred: async (id, isPreferred) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    const updated = await supplierRepository.togglePreferred(id, isPreferred);
    await audit(id, isPreferred ? 'SET_PREFERRED' : 'REMOVE_PREFERRED', 'Supplier', id, null, { isPreferred });
    return updated;
  },

  remove: async (id) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    await audit(id, 'DELETE', 'Supplier', id, existing, null);
    return supplierRepository.softDelete(id);
  },

  getExpiringLicenses: async (days = 30) => {
    return supplierRepository.findExpiringLicenses(parseInt(days));
  },

  getDashboardStats: async () => {
    return supplierRepository.getDashboardStats();
  },

  exportCSV: async (params) => {
    const result = await supplierRepository.findAll({
      page: 1, limit: 10000,
      search: params.search,
      isActive: params.isActive !== undefined ? params.isActive === 'true' : undefined
    });

    const headers = ['Code','Name','Type','Contact Person','Phone','Email','GST Number','PAN','Drug License No','Drug License Expiry','FSSAI','Credit Limit','Credit Period','Payment Mode','City','State','Status','Preferred','Active'];
    const rows = result.suppliers.map(s => [
      s.code, s.name, s.supplierType || '', s.contactPerson || '', s.phone || '', s.email || '',
      s.gstNumber || '', s.panNumber || '', s.drugLicenseNo || '',
      s.drugLicenseExpiry ? new Date(s.drugLicenseExpiry).toLocaleDateString() : '',
      s.fssaiNumber || '', s.creditLimit || '', s.creditPeriod || '',
      s.paymentMode || '', s.addressCity || '', s.addressState || '',
      s.status || '', s.isPreferred ? 'Yes' : 'No', s.isActive ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    return csv;
  },

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────
  getCategories: async (supplierId) => {
    return supplierRepository.findAllCategories(supplierId);
  },

  createCategory: async (data) => {
    const cat = await supplierRepository.createCategory(data);
    await audit(data.supplierId, 'CREATE', 'SupplierCategory', cat.id, null, cat);
    return cat;
  },

  updateCategory: async (id, data) => {
    const updated = await supplierRepository.updateCategory(id, data);
    await audit(data.supplierId, 'UPDATE', 'SupplierCategory', id, null, updated);
    return updated;
  },

  deleteCategory: async (id) => {
    await supplierRepository.deleteCategory(id);
    return { message: 'Category deleted' };
  },

  // ─── BRAND MAPPINGS ────────────────────────────────────────────────────────
  getBrandMappings: async (supplierId) => {
    return supplierRepository.findAllBrandMappings(supplierId);
  },

  createBrandMapping: async (data) => {
    const mapping = await supplierRepository.createBrandMapping(data);
    await audit(data.supplierId, 'CREATE', 'BrandMapping', mapping.id, null, mapping);
    return mapping;
  },

  updateBrandMapping: async (id, data) => {
    const updated = await supplierRepository.updateBrandMapping(id, data);
    return updated;
  },

  deleteBrandMapping: async (id) => {
    return supplierRepository.deleteBrandMapping(id);
  },

  // ─── PURCHASE TERMS ────────────────────────────────────────────────────────
  getPurchaseTerms: async (supplierId) => {
    return supplierRepository.findAllPurchaseTerms(supplierId);
  },

  createPurchaseTerm: async (data) => {
    const term = await supplierRepository.createPurchaseTerm(data);
    // Also log to price history (never overwrite)
    await supplierRepository.createPriceHistory({
      supplierId: data.supplierId,
      medicineId: data.medicineId,
      medicineName: data.medicineName,
      purchasePrice: data.purchasePrice,
      gstPercent: data.gstPercent || 0,
      discount: data.discount || 0,
      scheme: data.scheme,
      effectiveFrom: data.effectiveFrom || new Date(),
      effectiveTo: data.effectiveTo,
      changedBy: data.createdBy || 'System',
      changeReason: 'New purchase term created'
    });
    await audit(data.supplierId, 'CREATE', 'PurchaseTerm', term.id, null, term);
    return term;
  },

  updatePurchaseTerm: async (id, data) => {
    // Log old price to history before updating
    const existing = await supplierRepository.findAllPurchaseTerms();
    const oldTerm = existing.find(t => t.id === id);
    if (oldTerm && data.purchasePrice && parseFloat(data.purchasePrice) !== parseFloat(oldTerm.purchasePrice)) {
      await supplierRepository.createPriceHistory({
        supplierId: oldTerm.supplierId,
        medicineId: oldTerm.medicineId,
        medicineName: oldTerm.medicineName,
        purchasePrice: data.purchasePrice,
        gstPercent: data.gstPercent || oldTerm.gstPercent,
        discount: data.discount || oldTerm.discount,
        scheme: data.scheme || oldTerm.scheme,
        effectiveFrom: new Date(),
        changedBy: data.updatedBy || 'System',
        changeReason: 'Purchase term price updated'
      });
    }
    return supplierRepository.updatePurchaseTerm(id, data);
  },

  deletePurchaseTerm: async (id) => {
    return supplierRepository.deletePurchaseTerm(id);
  },

  // ─── PRICE HISTORY ─────────────────────────────────────────────────────────
  getPriceHistory: async (params) => {
    return supplierRepository.findAllPriceHistory(params);
  },

  createPriceHistory: async (data) => {
    return supplierRepository.createPriceHistory(data);
  },

  // ─── INVOICES ──────────────────────────────────────────────────────────────
  getInvoices: async (supplierId) => {
    return supplierRepository.findAllInvoices(supplierId);
  },

  createInvoice: async (data) => {
    const invoice = await supplierRepository.createInvoice({
      supplierId: data.supplierId,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      remarks: data.remarks || '',
      status: data.status || 'Unpaid',
      vehicleNumber: data.vehicleNumber || '',
      deliveredBy: data.deliveredBy || '',
      receivedBy: data.receivedBy || '',
      contactNumber: data.contactNumber || ''
    });

    // Auto-create ledger entry
    await supplierRepository.createLedgerEntry({
      supplierId: data.supplierId,
      type: 'Invoice',
      amount: data.amount,
      remarks: `Logged invoice ${data.invoiceNumber} (Veh: ${data.vehicleNumber || 'N/A'}): ${data.remarks || 'N/A'}`
    });

    await audit(data.supplierId, 'CREATE', 'Invoice', invoice.id, null, invoice);
    return invoice;
  },

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  getPayments: async (supplierId) => {
    return supplierRepository.findAllPayments(supplierId);
  },

  createPayment: async (data) => {
    const payment = await supplierRepository.createPayment({
      supplierId: data.supplierId,
      referenceNumber: data.referenceNumber,
      amount: data.amount,
      method: data.method || 'Bank Transfer',
      remarks: data.remarks || ''
    });

    // Auto-create ledger entry (deduct payable)
    await supplierRepository.createLedgerEntry({
      supplierId: data.supplierId,
      type: 'Payment',
      amount: data.amount,
      remarks: `Recorded payment via ${data.method || 'Bank Transfer'} (Ref: ${data.referenceNumber}): ${data.remarks || 'N/A'}`
    });

    await audit(data.supplierId, 'CREATE', 'Payment', payment.id, null, payment);
    return payment;
  },

  updatePayment: async (id, data) => {
    return supplierRepository.updatePayment(id, data);
  },

  deletePayment: async (id) => {
    return supplierRepository.deletePayment(id);
  },

  // ─── LEDGER ────────────────────────────────────────────────────────────────
  getLedger: async (supplierId) => {
    return supplierRepository.findAllLedgerEntries(supplierId);
  },

  getLedgerBySupplier: async (supplierId) => {
    return supplierRepository.findLedgerBySupplier(supplierId);
  },

  // ─── RETURNS ───────────────────────────────────────────────────────────────
  getReturns: async (supplierId) => {
    return supplierRepository.findAllReturns(supplierId);
  },

  createReturn: async (data) => {
    data.returnNumber = await generateReturnNumber();
    const supplierReturn = await supplierRepository.createReturn(data);

    // Auto-create ledger entry for return
    const returnValue = data.returnValue || data.creditAmount || 0;
    if (returnValue > 0) {
      await supplierRepository.createLedgerEntry({
        supplierId: data.supplierId,
        type: 'Return',
        amount: returnValue,
        remarks: `Return ${data.returnNumber}: ${data.reason || 'N/A'}`
      });
    }

    await audit(data.supplierId, 'CREATE', 'Return', String(supplierReturn.id), null, supplierReturn);
    return supplierReturn;
  },

  updateReturn: async (id, data) => {
    const updated = await supplierRepository.updateReturn(id, data);

    // Auto-create credit note when return is approved
    if (data.status === 'Approved' || data.status === 'Credit Note Issued') {
      const creditNoteNumber = await generateCreditNoteNumber();
      const creditNote = await supplierRepository.createCreditNote({
        creditNoteNumber,
        supplierId: updated.supplierId,
        returnId: parseInt(id),
        amount: parseFloat(updated.creditAmount || updated.returnValue || 0),
        status: 'Approved',
        remarks: `Auto-generated from return ${updated.returnNumber}`,
        createdBy: data.processedBy || 'System'
      });

      // Update return status
      await supplierRepository.updateReturn(id, { status: 'Credit Note Issued' });

      // Auto-adjust ledger
      await supplierRepository.createLedgerEntry({
        supplierId: updated.supplierId,
        type: 'CreditNote',
        amount: parseFloat(updated.creditAmount || updated.returnValue || 0),
        remarks: `Credit note ${creditNoteNumber} for return ${updated.returnNumber}`
      });
    }

    return updated;
  },

  deleteReturn: async (id) => {
    return supplierRepository.deleteReturn(id);
  },

  // ─── CREDIT NOTES ─────────────────────────────────────────────────────────
  getCreditNotes: async (supplierId) => {
    return supplierRepository.findAllCreditNotes(supplierId);
  },

  createCreditNote: async (data) => {
    if (!data.creditNoteNumber) {
      data.creditNoteNumber = await generateCreditNoteNumber();
    }
    const note = await supplierRepository.createCreditNote(data);

    // Auto-adjust supplier payable via ledger
    await supplierRepository.createLedgerEntry({
      supplierId: data.supplierId,
      type: 'CreditNote',
      amount: data.amount,
      remarks: `Credit note ${data.creditNoteNumber}: ${data.remarks || 'N/A'}`
    });

    await audit(data.supplierId, 'CREATE', 'CreditNote', note.id, null, note);
    return note;
  },

  updateCreditNote: async (id, data) => {
    return supplierRepository.updateCreditNote(id, data);
  },

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────
  getDocuments: async (supplierId) => {
    return supplierRepository.findAllDocuments(supplierId);
  },

  createDocument: async (data) => {
    const doc = await supplierRepository.createDocument(data);
    await audit(data.supplierId, 'UPLOAD', 'Document', doc.id, null, doc);
    return doc;
  },

  deleteDocument: async (id) => {
    return supplierRepository.deleteDocument(id);
  },

  // ─── PERFORMANCE ───────────────────────────────────────────────────────────
  getPerformance: async (supplierId) => {
    return supplierRepository.findPerformance(supplierId);
  },

  refreshPerformance: async (supplierId) => {
    // Calculate performance metrics based on transaction data
    const [invoices, payments, returns, purchaseOrders] = await Promise.all([
      supplierRepository.findAllInvoices(supplierId),
      supplierRepository.findAllPayments(supplierId),
      supplierRepository.findAllReturns(supplierId),
      supplierRepository.findAllPurchaseOrders(supplierId)
    ]);

    const totalInvoices = invoices.length;
    const totalReturns = returns.length;
    const totalPOs = purchaseOrders.length;

    const totalPurchaseValue = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalReturnValue = returns.reduce((sum, ret) => sum + parseFloat(ret.creditAmount || 0), 0);

    const deliveryRate = totalPOs > 0 ? Math.min(100, ((totalInvoices / Math.max(1, totalPOs)) * 100)) : 95;
    const returnPercent = totalInvoices > 0 ? ((totalReturns / totalInvoices) * 100) : 0;
    const damagePercent = returns.filter(r => r.reason === 'Damaged').length / Math.max(1, totalReturns) * 100;
    const avgLeadTimeDays = 3.5;
    const priceStability = 92;
    const marginPercent = 18.5;

    const overallRating = Math.min(5, Math.max(0,
      (deliveryRate / 20) - (returnPercent / 10) - (damagePercent / 20) + (priceStability / 25)
    ));

    const perfData = {
      supplierId,
      deliveryRate,
      delayPercent: Math.max(0, 100 - deliveryRate),
      returnPercent,
      damagePercent,
      shortSupplyPercent: 0,
      avgLeadTimeDays,
      priceStability,
      marginPercent,
      revenueContribution: 0,
      purchaseContribution: 0,
      overallRating: Math.round(overallRating * 10) / 10,
      periodStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      periodEnd: new Date()
    };

    const perf = await supplierRepository.createPerformance(perfData);
    return perf;
  },

  // ─── PURCHASE ORDERS ──────────────────────────────────────────────────────
  getPurchaseOrders: async (supplierId) => {
    return supplierRepository.findAllPurchaseOrders(supplierId);
  },

  createPurchaseOrder: async (data) => {
    return supplierRepository.createPurchaseOrder(data);
  },

  updatePurchaseOrderStatus: async (id, status) => {
    return supplierRepository.updatePurchaseOrderStatus(id, status);
  },

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────────
  getAuditLogs: async (supplierId) => {
    return supplierRepository.findAuditLogs(supplierId);
  },

  getMedicineMappings: async ({ supplierId, medicineId }) => {
    const where = {};
    if (supplierId) where.supplierId = supplierId;
    if (medicineId) where.medicineId = medicineId;
    return prisma.medicineSupplierMapping.findMany({
      where,
      include: {
        medicine: true,
        supplier: true
      }
    });
  },

  createMedicineMapping: async (data) => {
    const { supplierId, medicineId, isDefault, purchasePrice, leadTimeDays, minOrderQty, status } = data;
    
    // Check if mapping already exists
    const existing = await prisma.medicineSupplierMapping.findFirst({
      where: { supplierId, medicineId }
    });
    if (existing) {
      throw new AppError('Mapping between this supplier and medicine already exists', 400);
    }

    // If isDefault is true, set all other mappings for this medicine to default = false
    if (isDefault) {
      await prisma.medicineSupplierMapping.updateMany({
        where: { medicineId, isDefault: true },
        data: { isDefault: false }
      });
      // Also update default supplier in the Medicine model
      await prisma.medicine.update({
        where: { id: medicineId },
        data: { supplierId }
      });
    }

    return prisma.medicineSupplierMapping.create({
      data: {
        supplierId,
        medicineId,
        isDefault: !!isDefault,
        purchasePrice: parseFloat(purchasePrice),
        leadTimeDays: parseInt(leadTimeDays) || 3,
        minOrderQty: parseInt(minOrderQty) || 1,
        status: status || 'Active'
      },
      include: {
        medicine: true,
        supplier: true
      }
    });
  },

  updateMedicineMapping: async (id, data) => {
    const { isDefault, purchasePrice, leadTimeDays, minOrderQty, status } = data;
    
    const mapping = await prisma.medicineSupplierMapping.findUnique({
      where: { id }
    });
    if (!mapping) throw new AppError('Mapping not found', 404);

    if (isDefault) {
      await prisma.medicineSupplierMapping.updateMany({
        where: { medicineId: mapping.medicineId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
      await prisma.medicine.update({
        where: { id: mapping.medicineId },
        data: { supplierId: mapping.supplierId }
      });
    }

    const updateData = {};
    if (isDefault !== undefined) updateData.isDefault = !!isDefault;
    if (purchasePrice !== undefined) {
      updateData.purchasePrice = parseFloat(purchasePrice);
      updateData.lastPurchasePrice = mapping.purchasePrice;
    }
    if (leadTimeDays !== undefined) updateData.leadTimeDays = parseInt(leadTimeDays) || 3;
    if (minOrderQty !== undefined) updateData.minOrderQty = parseInt(minOrderQty) || 1;
    if (status !== undefined) updateData.status = status;

    return prisma.medicineSupplierMapping.update({
      where: { id },
      data: updateData,
      include: {
        medicine: true,
        supplier: true
      }
    });
  },

  deleteMedicineMapping: async (id) => {
    const mapping = await prisma.medicineSupplierMapping.findUnique({ where: { id } });
    if (!mapping) throw new AppError('Mapping not found', 404);
    return prisma.medicineSupplierMapping.delete({ where: { id } });
  }
};
