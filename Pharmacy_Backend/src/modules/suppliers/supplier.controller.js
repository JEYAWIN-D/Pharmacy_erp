import { supplierService } from './supplier.service.js';

export const supplierController = {
  // ─── SUPPLIER MASTER ────────────────────────────────────────────────────────
  getAll: async (req, res, next) => {
    try {
      const data = await supplierService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const supplier = await supplierService.getById(req.params.id);
      res.json({ success: true, data: supplier });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const supplier = await supplierService.create(req.body);
      res.status(201).json({ success: true, data: supplier, message: 'Supplier created successfully' });
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const supplier = await supplierService.update(req.params.id, req.body);
      res.json({ success: true, data: supplier, message: 'Supplier updated successfully' });
    } catch (err) { next(err); }
  },

  toggleStatus: async (req, res, next) => {
    try {
      const { isActive } = req.body;
      const supplier = await supplierService.toggleStatus(req.params.id, isActive);
      res.json({ success: true, data: supplier, message: `Supplier ${isActive ? 'activated' : 'deactivated'}` });
    } catch (err) { next(err); }
  },

  togglePreferred: async (req, res, next) => {
    try {
      const { isPreferred } = req.body;
      const supplier = await supplierService.togglePreferred(req.params.id, isPreferred);
      res.json({ success: true, data: supplier, message: `Supplier ${isPreferred ? 'set as preferred' : 'removed from preferred'}` });
    } catch (err) { next(err); }
  },

  remove: async (req, res, next) => {
    try {
      await supplierService.remove(req.params.id);
      res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (err) { next(err); }
  },

  getExpiringLicenses: async (req, res, next) => {
    try {
      const suppliers = await supplierService.getExpiringLicenses(req.query.days);
      res.json({ success: true, data: suppliers });
    } catch (err) { next(err); }
  },

  getDashboardStats: async (req, res, next) => {
    try {
      const stats = await supplierService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  exportCSV: async (req, res, next) => {
    try {
      const csv = await supplierService.exportCSV(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="suppliers_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (err) { next(err); }
  },

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────
  getCategories: async (req, res, next) => {
    try {
      const data = await supplierService.getCategories(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createCategory: async (req, res, next) => {
    try {
      const data = await supplierService.createCategory(req.body);
      res.status(201).json({ success: true, data, message: 'Category added' });
    } catch (err) { next(err); }
  },

  updateCategory: async (req, res, next) => {
    try {
      const data = await supplierService.updateCategory(req.params.id, req.body);
      res.json({ success: true, data, message: 'Category updated' });
    } catch (err) { next(err); }
  },

  deleteCategory: async (req, res, next) => {
    try {
      await supplierService.deleteCategory(req.params.id);
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) { next(err); }
  },

  // ─── BRAND MAPPINGS ────────────────────────────────────────────────────────
  getBrandMappings: async (req, res, next) => {
    try {
      const data = await supplierService.getBrandMappings(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createBrandMapping: async (req, res, next) => {
    try {
      const data = await supplierService.createBrandMapping(req.body);
      res.status(201).json({ success: true, data, message: 'Brand mapping created' });
    } catch (err) { next(err); }
  },

  updateBrandMapping: async (req, res, next) => {
    try {
      const data = await supplierService.updateBrandMapping(req.params.id, req.body);
      res.json({ success: true, data, message: 'Brand mapping updated' });
    } catch (err) { next(err); }
  },

  deleteBrandMapping: async (req, res, next) => {
    try {
      await supplierService.deleteBrandMapping(req.params.id);
      res.json({ success: true, message: 'Brand mapping deactivated' });
    } catch (err) { next(err); }
  },

  // ─── PURCHASE TERMS ────────────────────────────────────────────────────────
  getPurchaseTerms: async (req, res, next) => {
    try {
      const data = await supplierService.getPurchaseTerms(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createPurchaseTerm: async (req, res, next) => {
    try {
      const data = await supplierService.createPurchaseTerm(req.body);
      res.status(201).json({ success: true, data, message: 'Purchase term created' });
    } catch (err) { next(err); }
  },

  updatePurchaseTerm: async (req, res, next) => {
    try {
      const data = await supplierService.updatePurchaseTerm(req.params.id, req.body);
      res.json({ success: true, data, message: 'Purchase term updated' });
    } catch (err) { next(err); }
  },

  deletePurchaseTerm: async (req, res, next) => {
    try {
      await supplierService.deletePurchaseTerm(req.params.id);
      res.json({ success: true, message: 'Purchase term deactivated' });
    } catch (err) { next(err); }
  },

  // ─── PRICE HISTORY ─────────────────────────────────────────────────────────
  getPriceHistory: async (req, res, next) => {
    try {
      const data = await supplierService.getPriceHistory(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createPriceHistory: async (req, res, next) => {
    try {
      const data = await supplierService.createPriceHistory(req.body);
      res.status(201).json({ success: true, data, message: 'Price history entry created' });
    } catch (err) { next(err); }
  },

  // ─── INVOICES ──────────────────────────────────────────────────────────────
  getInvoices: async (req, res, next) => {
    try {
      const data = await supplierService.getInvoices(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createInvoice: async (req, res, next) => {
    try {
      const data = await supplierService.createInvoice(req.body);
      res.status(201).json({ success: true, data, message: 'Supplier invoice created successfully' });
    } catch (err) { next(err); }
  },

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  getPayments: async (req, res, next) => {
    try {
      const data = await supplierService.getPayments(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createPayment: async (req, res, next) => {
    try {
      const data = await supplierService.createPayment(req.body);
      res.status(201).json({ success: true, data, message: 'Supplier payment created successfully' });
    } catch (err) { next(err); }
  },

  updatePayment: async (req, res, next) => {
    try {
      const data = await supplierService.updatePayment(req.params.id, req.body);
      res.json({ success: true, data, message: 'Payment updated' });
    } catch (err) { next(err); }
  },

  deletePayment: async (req, res, next) => {
    try {
      await supplierService.deletePayment(req.params.id);
      res.json({ success: true, message: 'Payment deleted' });
    } catch (err) { next(err); }
  },

  // ─── LEDGER ────────────────────────────────────────────────────────────────
  getLedger: async (req, res, next) => {
    try {
      const data = await supplierService.getLedger(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  getLedgerBySupplier: async (req, res, next) => {
    try {
      const data = await supplierService.getLedgerBySupplier(req.params.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  // ─── RETURNS ───────────────────────────────────────────────────────────────
  getReturns: async (req, res, next) => {
    try {
      const data = await supplierService.getReturns(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createReturn: async (req, res, next) => {
    try {
      const data = await supplierService.createReturn(req.body);
      res.status(201).json({ success: true, data, message: 'Return created' });
    } catch (err) { next(err); }
  },

  updateReturn: async (req, res, next) => {
    try {
      const data = await supplierService.updateReturn(req.params.id, req.body);
      res.json({ success: true, data, message: 'Return updated' });
    } catch (err) { next(err); }
  },

  deleteReturn: async (req, res, next) => {
    try {
      await supplierService.deleteReturn(req.params.id);
      res.json({ success: true, message: 'Return deleted' });
    } catch (err) { next(err); }
  },

  // ─── CREDIT NOTES ─────────────────────────────────────────────────────────
  getCreditNotes: async (req, res, next) => {
    try {
      const data = await supplierService.getCreditNotes(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createCreditNote: async (req, res, next) => {
    try {
      const data = await supplierService.createCreditNote(req.body);
      res.status(201).json({ success: true, data, message: 'Credit note created' });
    } catch (err) { next(err); }
  },

  updateCreditNote: async (req, res, next) => {
    try {
      const data = await supplierService.updateCreditNote(req.params.id, req.body);
      res.json({ success: true, data, message: 'Credit note updated' });
    } catch (err) { next(err); }
  },

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────
  getDocuments: async (req, res, next) => {
    try {
      const data = await supplierService.getDocuments(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createDocument: async (req, res, next) => {
    try {
      const docData = {
        supplierId: req.body.supplierId,
        documentType: req.body.documentType,
        documentName: req.body.documentName,
        fileName: req.body.fileName || (req.file ? req.file.filename : ''),
        filePath: req.body.filePath || (req.file ? req.file.path : ''),
        fileSize: req.body.fileSize || (req.file ? req.file.size : 0),
        mimeType: req.body.mimeType || (req.file ? req.file.mimetype : ''),
        expiryDate: req.body.expiryDate || null,
        uploadedBy: req.body.uploadedBy || 'Admin'
      };
      const data = await supplierService.createDocument(docData);
      res.status(201).json({ success: true, data, message: 'Document uploaded' });
    } catch (err) { next(err); }
  },

  deleteDocument: async (req, res, next) => {
    try {
      await supplierService.deleteDocument(req.params.id);
      res.json({ success: true, message: 'Document deleted' });
    } catch (err) { next(err); }
  },

  // ─── PERFORMANCE ───────────────────────────────────────────────────────────
  getPerformance: async (req, res, next) => {
    try {
      const data = await supplierService.getPerformance(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  refreshPerformance: async (req, res, next) => {
    try {
      const data = await supplierService.refreshPerformance(req.params.supplierId);
      res.json({ success: true, data, message: 'Performance rating refreshed' });
    } catch (err) { next(err); }
  },

  // ─── PURCHASE ORDERS ──────────────────────────────────────────────────────
  getPurchaseOrders: async (req, res, next) => {
    try {
      const data = await supplierService.getPurchaseOrders(req.query.supplierId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createPurchaseOrder: async (req, res, next) => {
    try {
      const data = await supplierService.createPurchaseOrder(req.body);
      res.status(201).json({ success: true, data, message: 'Purchase Order created successfully' });
    } catch (err) { next(err); }
  },

  updatePurchaseOrderStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const data = await supplierService.updatePurchaseOrderStatus(req.params.id, status);
      res.json({ success: true, data, message: `Purchase Order status updated to ${status}` });
    } catch (err) { next(err); }
  },

  // ─── REPORTS ──────────────────────────────────────────────────────────────
  getReport: async (req, res, next) => {
    try {
      const { type } = req.params;
      const supplierId = req.query.supplierId;
      let reportData = {};

      switch (type) {
        case 'supplier':
          reportData = await supplierService.getAll({ ...req.query, limit: 10000 });
          break;
        case 'purchase':
          reportData = await supplierService.getInvoices(supplierId);
          break;
        case 'payment':
          reportData = await supplierService.getPayments(supplierId);
          break;
        case 'outstanding': {
          const invoices = await supplierService.getInvoices(supplierId);
          const payments = await supplierService.getPayments(supplierId);
          const totalInv = invoices.reduce((s, i) => s + parseFloat(i.amount), 0);
          const totalPay = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
          reportData = { invoices, payments, totalInvoices: totalInv, totalPayments: totalPay, outstanding: totalInv - totalPay };
          break;
        }
        case 'ledger':
          reportData = await supplierService.getLedger(supplierId);
          break;
        case 'performance':
          reportData = await supplierService.getPerformance(supplierId);
          break;
        case 'return':
          reportData = await supplierService.getReturns(supplierId);
          break;
        case 'credit-note':
          reportData = await supplierService.getCreditNotes(supplierId);
          break;
        case 'price-history':
          reportData = await supplierService.getPriceHistory(req.query);
          break;
        default:
          reportData = { message: 'Unknown report type' };
      }

      res.json({ success: true, data: reportData });
    } catch (err) { next(err); }
  }
};
