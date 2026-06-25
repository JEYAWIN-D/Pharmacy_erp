import { supplierRepository } from './supplier.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

// Auto-generate supplier code like SUP-001, SUP-002
const generateCode = async () => {
  const last = await supplierRepository.getLastCode();
  if (!last?.code) return 'SUP-001';
  const num = parseInt(last.code.split('-')[1] || '0', 10) + 1;
  return `SUP-${String(num).padStart(3, '0')}`;
};

export const supplierService = {
  getAll: async (params) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const isActive = params.isActive !== undefined
      ? params.isActive === 'true' || params.isActive === true
      : undefined;

    const result = await supplierRepository.findAll({
      page, limit,
      search: params.search,
      isActive,
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
    // Auto-generate code if not provided
    if (!data.code) {
      data.code = await generateCode();
    } else {
      const existing = await supplierRepository.findByCode(data.code);
      if (existing) throw new AppError('Supplier code already exists', 409, 'DUPLICATE_CODE');
    }
    return supplierRepository.create(data);
  },

  update: async (id, data) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');

    if (data.code && data.code !== existing.code) {
      const codeExists = await supplierRepository.findByCode(data.code);
      if (codeExists) throw new AppError('Supplier code already in use', 409, 'DUPLICATE_CODE');
    }

    return supplierRepository.update(id, data);
  },

  toggleStatus: async (id, isActive) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    return supplierRepository.toggleStatus(id, isActive);
  },

  remove: async (id) => {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    return supplierRepository.softDelete(id);
  },

  getExpiringLicenses: async (days = 30) => {
    return supplierRepository.findExpiringLicenses(parseInt(days));
  },

  exportCSV: async (params) => {
    const result = await supplierRepository.findAll({
      page: 1, limit: 10000,
      search: params.search,
      isActive: params.isActive !== undefined
        ? params.isActive === 'true'
        : undefined
    });

    const headers = ['Code','Name','Contact Person','Phone','Email','GST Number','Drug License No','Drug License Expiry','Payment Terms (Days)','City','State','Active'];
    const rows = result.suppliers.map(s => [
      s.code, s.name, s.contactPerson || '', s.phone || '', s.email || '',
      s.gstNumber || '', s.drugLicenseNo || '',
      s.drugLicenseExpiry ? new Date(s.drugLicenseExpiry).toLocaleDateString() : '',
      s.paymentTermsDays || '', s.addressCity || '', s.addressState || '',
      s.isActive ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    return csv;
  },

  getInvoices: async () => {
    return supplierRepository.findAllInvoices();
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

    await supplierRepository.createLedgerEntry({
      supplierId: data.supplierId,
      type: 'Invoice',
      amount: data.amount,
      remarks: `Logged invoice ${data.invoiceNumber} (Veh: ${data.vehicleNumber || 'N/A'}): ${data.remarks || 'N/A'}`
    });

    return invoice;
  },

  getPayments: async () => {
    return supplierRepository.findAllPayments();
  },

  createPayment: async (data) => {
    const payment = await supplierRepository.createPayment({
      supplierId: data.supplierId,
      referenceNumber: data.referenceNumber,
      amount: data.amount,
      method: data.method || 'Bank Transfer',
      remarks: data.remarks || ''
    });

    await supplierRepository.createLedgerEntry({
      supplierId: data.supplierId,
      type: 'Payment',
      amount: data.amount,
      remarks: `Recorded payment via ${data.method || 'Bank Transfer'} (Ref: ${data.referenceNumber}): ${data.remarks || 'N/A'}`
    });

    return payment;
  },

  getLedger: async () => {
    return supplierRepository.findAllLedgerEntries();
  },

  // Purchase Orders
  getPurchaseOrders: async () => {
    return supplierRepository.findAllPurchaseOrders();
  },

  createPurchaseOrder: async (data) => {
    return supplierRepository.createPurchaseOrder(data);
  },

  updatePurchaseOrderStatus: async (id, status) => {
    return supplierRepository.updatePurchaseOrderStatus(id, status);
  }
};
