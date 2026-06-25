import { supplierService } from './supplier.service.js';

export const supplierController = {
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

  exportCSV: async (req, res, next) => {
    try {
      const csv = await supplierService.exportCSV(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="suppliers_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (err) { next(err); }
  },

  getInvoices: async (req, res, next) => {
    try {
      const data = await supplierService.getInvoices();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createInvoice: async (req, res, next) => {
    try {
      const data = await supplierService.createInvoice(req.body);
      res.status(201).json({ success: true, data, message: 'Supplier invoice created successfully' });
    } catch (err) { next(err); }
  },

  getPayments: async (req, res, next) => {
    try {
      const data = await supplierService.getPayments();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createPayment: async (req, res, next) => {
    try {
      const data = await supplierService.createPayment(req.body);
      res.status(201).json({ success: true, data, message: 'Supplier payment created successfully' });
    } catch (err) { next(err); }
  },

  getLedger: async (req, res, next) => {
    try {
      const data = await supplierService.getLedger();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  // Purchase Orders
  getPurchaseOrders: async (req, res, next) => {
    try {
      const data = await supplierService.getPurchaseOrders();
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
  }
};
