import prisma from '../../config/prisma.js';

// ─── ADMINISTRATION MODULE ─────────────────────────────────────────────────────

export const administrationController = {
  // Audit Logs
  getAuditLogs: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.userId) where.userId = req.query.userId;
      if (req.query.action) where.action = { contains: req.query.action, mode: 'insensitive' };
      const d = await prisma.auditLog.findMany({
        where,
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500
      });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  createAuditLog: async (req, res, next) => {
    try {
      const d = await prisma.auditLog.create({ data: { ...req.body, userId: req.user?.userId } });
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  // Expenses
  getExpenses: async (req, res, next) => {
    try {
      const d = await prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 200 });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  createExpense: async (req, res, next) => {
    try { const d = await prisma.expense.create({ data: req.body }); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  updateExpense: async (req, res, next) => {
    try { const d = await prisma.expense.update({ where: { id: parseInt(req.params.id) }, data: req.body }); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  deleteExpense: async (req, res, next) => {
    try { await prisma.expense.delete({ where: { id: parseInt(req.params.id) } }); res.json({ success: true, message: 'Expense deleted' }); } catch (e) { next(e); }
  },

  // Supplier Finance
  getSupplierInvoices: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.supplierId) where.supplierId = req.query.supplierId;
      const d = await prisma.supplierInvoice.findMany({ where, include: { supplier: true }, orderBy: { date: 'desc' } });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  createSupplierInvoice: async (req, res, next) => {
    try { const d = await prisma.supplierInvoice.create({ data: req.body }); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getSupplierPayments: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.supplierId) where.supplierId = req.query.supplierId;
      const d = await prisma.supplierPayment.findMany({ where, include: { supplier: true }, orderBy: { date: 'desc' } });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  createSupplierPayment: async (req, res, next) => {
    try { const d = await prisma.supplierPayment.create({ data: req.body }); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getSupplierLedger: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.supplierId) where.supplierId = req.query.supplierId;
      const d = await prisma.supplierLedger.findMany({ where, include: { supplier: true }, orderBy: { date: 'desc' } });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  createSupplierLedger: async (req, res, next) => {
    try { const d = await prisma.supplierLedger.create({ data: req.body }); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  }
};
