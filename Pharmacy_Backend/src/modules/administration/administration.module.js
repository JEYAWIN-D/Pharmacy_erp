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
  },

  // ─── FINANCE INTEGRATION ───────────────────────────────────────────────────
  getFinancePayments: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.supplierId) where.supplierId = req.query.supplierId;
      if (req.query.status) where.status = req.query.status;
      if (req.query.invoiceNumber) where.invoiceNumber = { contains: req.query.invoiceNumber, mode: 'insensitive' };
      
      const data = await prisma.financeSupplierPayment.findMany({
        where,
        include: { supplier: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  payFinanceInvoice: async (req, res, next) => {
    try {
      const { id, amountPaid, paymentMode, remarks } = req.body;
      const parsedAmount = parseFloat(amountPaid);

      return prisma.$transaction(async (tx) => {
        const payment = await tx.financeSupplierPayment.findUnique({ where: { id } });
        if (!payment) throw new Error('Payment record not found');

        const newPaidAmount = Number(payment.paidAmount) + parsedAmount;
        const newPendingAmount = Math.max(0, Number(payment.purchaseAmount) - newPaidAmount);
        const status = newPendingAmount === 0 ? 'Paid' : newPaidAmount > 0 ? 'Partially Paid' : 'Pending';

        const updatedPayment = await tx.financeSupplierPayment.update({
          where: { id },
          data: {
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            paymentMode: paymentMode || 'Bank Transfer',
            paymentDate: new Date(),
            status
          }
        });

        // Create standard SupplierPayment entry
        await tx.supplierPayment.create({
          data: {
            supplierId: payment.supplierId,
            referenceNumber: payment.grnId || payment.invoiceNumber || 'Manual',
            amount: parsedAmount,
            method: paymentMode || 'Bank Transfer',
            remarks: remarks || 'Paid via Finance integration module'
          }
        });

        // Add to supplier ledger
        await tx.supplierLedger.create({
          data: {
            supplierId: payment.supplierId,
            type: 'Debit',
            amount: parsedAmount,
            remarks: `Payment against Invoice ${payment.invoiceNumber || 'N/A'} (GRN: ${payment.grnId || 'N/A'})`
          }
        });

        res.json({ success: true, data: updatedPayment, message: 'Payment recorded successfully' });
      });
    } catch (e) { next(e); }
  },

  getFinanceReports: async (req, res, next) => {
    try {
      const { type, supplierId, startDate, endDate } = req.query;
      
      let dateWhere = {};
      if (startDate && endDate) {
        dateWhere = {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        };
      }

      if (type === 'supplier-wise') {
        const data = await prisma.financeSupplierPayment.groupBy({
          by: ['supplierId', 'supplierName'],
          _sum: {
            purchaseAmount: true,
            paidAmount: true,
            pendingAmount: true
          },
          where: dateWhere
        });
        return res.json({ success: true, data });
      }

      if (type === 'pending-payments') {
        const data = await prisma.financeSupplierPayment.findMany({
          where: { status: { in: ['Pending', 'Partially Paid'] }, ...dateWhere },
          include: { supplier: { select: { name: true } } }
        });
        return res.json({ success: true, data });
      }

      if (type === 'paid-payments') {
        const data = await prisma.financeSupplierPayment.findMany({
          where: { status: 'Paid', ...dateWhere },
          include: { supplier: { select: { name: true } } }
        });
        return res.json({ success: true, data });
      }

      if (type === 'date-wise') {
        const payments = await prisma.financeSupplierPayment.findMany({
          where: dateWhere,
          orderBy: { createdAt: 'asc' }
        });
        return res.json({ success: true, data: payments });
      }

      if (type === 'medicine-wise') {
        // Find all GRNs completed and group items
        const grns = await prisma.gRN.findMany({
          where: {
            savedAsDraft: false,
            createdAt: dateWhere.createdAt
          },
          include: {
            items: true
          }
        });

        const medicineStats = {};
        for (const grn of grns) {
          for (const item of grn.items) {
            const medId = item.medicineId;
            const medName = item.medicineName || 'Unknown';
            const accepted = item.acceptedQty;
            const amount = accepted * 10; // Fallback price or calculate from PO if needed
            
            if (!medicineStats[medId]) {
              medicineStats[medId] = { medicineId: medId, medicineName: medName, qtyReceived: 0, totalCost: 0 };
            }
            medicineStats[medId].qtyReceived += accepted;
            medicineStats[medId].totalCost += amount;
          }
        }

        return res.json({ success: true, data: Object.values(medicineStats) });
      }

      res.status(400).json({ success: false, message: 'Invalid report type' });
    } catch (e) { next(e); }
  }
};
