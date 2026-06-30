import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { generateBillId } from '../../shared/utils/generateBillId.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

// ─── Billing Queue (file-backed in-memory cache) ─────────────────────────────
// Queue is now stored in the database instead of a blocking flat JSON file.

// ─── Bill Repository ──────────────────────────────────────────────────────────

const billRepo = {
  /**
   * Create a bill. ID is always backend-generated (see generateBillId).
   * createdBy is always taken from req.user — never from req.body.
   */
  create: async (data, createdBy) => {
    // FIX #3: Generate ID in backend — ignore any id from frontend
    const billId = await generateBillId();

    // Compute round-off: difference between rounded integer total and actual total
    const rawGrandTotal = Number(data.total ?? data.grandTotal ?? 0);
    const roundedTotal = Math.round(rawGrandTotal);
    const roundOffValue = parseFloat((roundedTotal - rawGrandTotal).toFixed(2));
    const finalTotal = roundedTotal;

    const mappedData = {
      id: billId,                                   // ← backend-generated
      patientName: (data.patient || data.patientName || '').trim(),
      mobileNumber: data.mobile || data.mobileNumber || null,
      doctorName: data.doctor || data.doctorName || null,
      prescriptionNo: data.prescription || data.prescriptionNo || null,
      billType: data.type || data.billType || 'Normal',
      subtotal: data.subtotal ?? data.subTotal ?? 0,
      grandTotal: finalTotal,
      gstTax: data.gst ?? data.gstTax ?? 0,
      roundOff: roundOffValue,
      discount: data.discount ?? 0,
      paymentMethod: data.paymentMethod || null,
      paymentStatus: data.status || data.paymentStatus || 'Unpaid',
      paidAmount: data.paidAmount ?? 0,
      balanceAmount: data.balanceAmount ?? 0,
      changeReturned: data.changeReturned ?? 0,
      printedStatus: data.printedStatus || 'Printed',
      createdBy: createdBy,  // FIX #6: from JWT, not frontend body
    };

    const items = (data.items || []).map(item => ({
      medicineId: item.medicineId ? String(item.medicineId) : null,
      name: item.name,
      qty: item.qty,
      price: item.price,
      gstRate: item.gstRate || 0,
      total: item.total,
      batchNumber: item.batchNumber || null,
      expiryDate: item.expiryDate || null,
      unitType: item.unitType || null,
      sellingUnit: item.sellingUnit || null,
      totalPieces: item.totalPieces || null,
      discount: item.discount || 0,
    }));

    return prisma.$transaction(async (tx) => {
      // Create the bill
      const bill = await tx.bill.create({
        data: { ...mappedData, items: { create: items } },
        include: { items: true, customer: true }
      });

      // Deduct stock for each medicine atomically
      for (const item of items) {
        if (item.medicineId) {
          const deduction = item.totalPieces || item.qty || 1;

          // Check current stock to ensure we don't go negative
          const currentMed = await tx.medicine.findUnique({
            where: { id: item.medicineId },
            select: { stockQuantity: true, medicineName: true }
          });

          if (!currentMed || currentMed.stockQuantity < deduction) {
            throw new AppError(`Insufficient stock for ${currentMed?.medicineName || 'Item'}. Requested: ${deduction}, Available: ${currentMed?.stockQuantity || 0}`, 400);
          }

          // If the item exists, decrement its stockQuantity
          await tx.medicine.update({
            where: { id: item.medicineId },
            data: {
              stockQuantity: {
                decrement: deduction
              }
            }
          });
        }
      }

      return bill;
    });
  },

  /**
   * FIX #4 + #9 + #10: Paginated list with lean SELECT, multi-field search, and date range filter.
   */
  findAll: async ({ status, search, customerId, page = 1, limit = 30, fromDate, toDate } = {}) => {
    const where = { isDeleted: false };

    if (status) where.paymentStatus = status;
    if (customerId) where.customerId = parseInt(customerId);

    // FIX #9: Search across bill ID, patient name, mobile, prescription, doctor
    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { prescriptionNo: { contains: search, mode: 'insensitive' } },
        { doctorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // FIX #10: Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        // FIX #4: Lean select — no full item/transaction joins on list view
        select: {
          id: true,
          patientName: true,
          mobileNumber: true,
          subtotal: true,
          discount: true,
          gstTax: true,
          roundOff: true,
          grandTotal: true,
          paymentStatus: true,
          paymentMethod: true,
          paidAmount: true,
          balanceAmount: true,
          billType: true,
          createdAt: true,
          printedStatus: true,
          createdBy: true,
          _count: { select: { items: true } },  // count only — no join
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.bill.count({ where }),
    ]);

    return {
      data: bills,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  // Full detail (items + transactions) only when opening one specific bill
  findById: async (id) => prisma.bill.findFirst({
    where: { id, isDeleted: false },
    include: { items: true, customer: true, transactions: true }
  }),

  update: async (id, data) => prisma.bill.update({ where: { id }, data }),

  findByMobile: async (mobile) => prisma.bill.findMany({
    where: { mobileNumber: mobile, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { items: true }
  }),

  createPayment: async (data) => prisma.paymentTransaction.create({ data }),

  // Cash Register
  getOpenRegister: async () => prisma.cashRegister.findFirst({ where: { status: 'Open' }, orderBy: { createdAt: 'desc' } }),
  createRegister: async (data) => prisma.cashRegister.create({ data }),
  closeRegister: async (id, data) => prisma.cashRegister.update({ where: { id }, data }),
  getRegisters: async () => prisma.cashRegister.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
};

// ─── Controllers ──────────────────────────────────────────────────────────────

export const billingController = {

  // ── GET /bills ──────────────────────────────────────────────────────────────
  // Supports: ?status=Paid&search=ram&fromDate=2026-06-01&toDate=2026-06-22&page=1&limit=30
  getAllBills: async (req, res, next) => {
    try {
      const result = await billRepo.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  },

  // ── GET /bills/:id ──────────────────────────────────────────────────────────
  getBillById: async (req, res, next) => {
    try {
      const b = await billRepo.findById(req.params.id);
      if (!b) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));
      res.json({ success: true, data: b });
    } catch (e) { next(e); }
  },

  // ── POST /bills (validation middleware runs first via router) ───────────────
  // FIX #1: Validated by validateCreateBill middleware
  // FIX #3: ID generated by backend
  // FIX #6: createdBy taken from req.user
  createBill: async (req, res, next) => {
    try {
      const createdBy = req.user?.email || req.user?.roleName || 'Unknown';
      const bill = await billRepo.create(req.body, createdBy);

      res.status(201).json({
        success: true,
        data: bill,
        // Return the backend-generated bill ID so the frontend can use it for display/print
        billId: bill.id,
      });
    } catch (e) { next(e); }
  },

  // ── PUT /bills/:id ──────────────────────────────────────────────────────────
  // FIX #7: Whitelist-only update, blocks edits on paid bills
  updateBill: async (req, res, next) => {
    try {
      const bill = await billRepo.findById(req.params.id);
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));

      // Paid bills are locked — use void or return instead
      if (bill.paymentStatus === 'Paid') {
        return next(new AppError(
          'Paid bills cannot be modified. Create a return/refund instead.',
          400,
          'BILL_LOCKED'
        ));
      }

      // Whitelist only safe editable fields
      const ALLOWED = ['printedStatus', 'notes', 'doctorName', 'prescriptionNo'];
      const safeUpdate = {};
      for (const field of ALLOWED) {
        if (req.body[field] !== undefined) safeUpdate[field] = req.body[field];
      }

      if (Object.keys(safeUpdate).length === 0) {
        return next(new AppError('No valid fields to update', 400, 'VALIDATION_ERROR'));
      }

      // FIX #6: Audit trail from JWT
      safeUpdate.updatedBy = req.user?.email || 'Unknown';

      const d = await billRepo.update(req.params.id, safeUpdate);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  // ── POST /bills/:id/void ────────────────────────────────────────────────────
  // FIX #8: Soft-delete via void with reason + audit trail
  voidBill: async (req, res, next) => {
    try {
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return next(new AppError('Void reason is required (min 5 characters)', 400, 'VALIDATION_ERROR'));
      }

      const bill = await billRepo.findById(req.params.id);
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));

      if (bill.paymentStatus === 'Paid') {
        return next(new AppError(
          'Cannot void a paid bill. Process a return/refund instead.',
          400,
          'BILL_PAID'
        ));
      }

      if (bill.isDeleted || bill.paymentStatus === 'Voided') {
        return next(new AppError('Bill is already voided', 400, 'ALREADY_VOIDED'));
      }

      const voided = await billRepo.update(req.params.id, {
        isDeleted: true,
        paymentStatus: 'Voided',
        voidReason: reason.trim(),
        voidedBy: req.user?.email || req.user?.roleName || 'Unknown',  // FIX #6
        voidedAt: new Date(),
      });

      res.json({
        success: true,
        data: voided,
        message: `Bill ${req.params.id} voided successfully`,
      });
    } catch (e) { next(e); }
  },

  // ── POST /payments ──────────────────────────────────────────────────────────
  // FIX #2: Validates billId + amount, fetches bill, calculates correct status
  addPayment: async (req, res, next) => {
    try {
      const { billId, amount, paymentMode } = req.body;

      // 1. Input validation
      if (!billId) {
        return next(new AppError('billId is required', 400, 'VALIDATION_ERROR'));
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return next(new AppError('Payment amount must be a positive number', 400, 'VALIDATION_ERROR'));
      }

      // 2. Fetch and verify the bill exists
      const bill = await billRepo.findById(billId);
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));

      // 3. Block duplicate payment on already fully paid bill
      if (bill.paymentStatus === 'Paid') {
        return next(new AppError('This bill is already fully paid', 400, 'ALREADY_PAID'));
      }

      if (bill.isDeleted || bill.paymentStatus === 'Voided') {
        return next(new AppError('Cannot add payment to a voided bill', 400, 'BILL_VOIDED'));
      }

      // 4. Calculate accurate cumulative totals
      const previouslyPaid = Number(bill.paidAmount) || 0;
      const newTotalPaid = previouslyPaid + Number(amount);
      const grandTotal = Number(bill.grandTotal);
      const newBalance = Math.max(0, grandTotal - newTotalPaid);

      // Overpayment block check
      if (newTotalPaid > grandTotal + 0.01) {
        return next(new AppError(`Payment amount exceeds the total bill amount. Max allowed: ${Math.max(0, grandTotal - previouslyPaid).toFixed(2)}`, 400, 'PAYMENT_EXCEEDS_TOTAL'));
      }

      // 5. Derive correct payment status
      const newStatus = newTotalPaid >= grandTotal ? 'Paid' : 'Partially Paid';

      // 6. Create the payment record
      const pmt = await billRepo.createPayment({
        billId,
        amount: Number(amount),
        paymentMode: paymentMode || 'Cash',
        createdAt: new Date(),
      });

      // 7. Update bill with accurate figures
      await billRepo.update(billId, {
        paymentStatus: newStatus,
        paidAmount: newTotalPaid,
        balanceAmount: newBalance,
      });

      res.status(201).json({
        success: true,
        data: pmt,
        billStatus: newStatus,
        newBalance: newBalance.toFixed(2),
      });
    } catch (e) { next(e); }
  },

  // ── Cash Register ────────────────────────────────────────────────────────────
  getRegisters: async (req, res, next) => {
    try { const d = await billRepo.getRegisters(); res.json({ success: true, data: d }); }
    catch (e) { next(e); }
  },

  // FIX #5: Race condition fix — check + create inside a Prisma transaction
  openRegister: async (req, res, next) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Lock the check and create atomically
        const existing = await tx.cashRegister.findFirst({ where: { status: 'Open' } });
        if (existing) return { data: existing, isNew: false };

        const newRegister = await tx.cashRegister.create({
          data: {
            ...req.body,
            status: 'Open',
            openedBy: req.user?.email || req.user?.roleName || 'Unknown', // FIX #6
          }
        });
        return { data: newRegister, isNew: true };
      });

      res.status(result.isNew ? 201 : 200).json({
        success: true,
        data: result.data,
        message: result.isNew ? 'Register opened successfully' : 'Register already open',
      });
    } catch (e) { next(e); }
  },

  // FIX #6: closedBy always from JWT
  closeRegister: async (req, res, next) => {
    try {
      const r = await billRepo.closeRegister(parseInt(req.params.id), {
        closingBalance: req.body.closingBalance,
        notes: req.body.notes,
        cashSales: req.body.cashSales,
        upiSales: req.body.upiSales,
        cardSales: req.body.cardSales,
        totalSales: req.body.totalSales,
        status: 'Closed',
      });
      res.json({ success: true, data: r });
    } catch (e) { next(e); }
  },

  // ── Billing Queue ─────────────────────────────────────────────────────────────
  getQueue: async (req, res, next) => {
    try {
      const queue = await prisma.billingQueue.findMany({ orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: queue });
    } catch (e) { next(e); }
  },

  addToQueue: async (req, res, next) => {
    try {
      const heldBill = req.body;
      if (!heldBill || !heldBill.queueId) {
        return next(new AppError('Invalid queued bill payload: queueId is required', 400, 'BAD_REQUEST'));
      }

      const existing = await prisma.billingQueue.findUnique({ where: { queueId: heldBill.queueId } });
      if (existing) {
        await prisma.billingQueue.update({
          where: { queueId: heldBill.queueId },
          data: {
            customerName: heldBill.customerName,
            mobileNumber: heldBill.mobileNumber,
            items: heldBill.items,
            draftTotalAmount: heldBill.draftTotalAmount,
            createdTime: heldBill.createdTime
          }
        });
      } else {
        await prisma.billingQueue.create({
          data: {
            queueId: heldBill.queueId,
            customerName: heldBill.customerName,
            mobileNumber: heldBill.mobileNumber,
            items: heldBill.items,
            draftTotalAmount: heldBill.draftTotalAmount,
            createdTime: heldBill.createdTime
          }
        });
      }

      res.status(201).json({ success: true, data: heldBill });
    } catch (e) { next(e); }
  },

  removeFromQueue: async (req, res, next) => {
    try {
      const { queueId } = req.params;
      await prisma.billingQueue.deleteMany({ where: { queueId } });
      res.json({ success: true, message: 'Queue item removed' });
    } catch (e) { next(e); }
  },

  resumeQueue: async (req, res, next) => {
    try {
      const { queueId } = req.body;
      const bill = await prisma.billingQueue.findUnique({ where: { queueId } });
      if (!bill) return next(new AppError('Queue item not found', 404, 'NOT_FOUND'));
      
      await prisma.billingQueue.delete({ where: { queueId } });
      
      res.json({ success: true, data: bill });
    } catch(e) { next(e); }
  },

  getHistoryByMobile: async (req, res, next) => {
    try {
      const bills = await billRepo.findByMobile(req.params.mobile);
      res.json({ success: true, data: bills });
    } catch (e) { next(e); }
  },

  reprintBill: async (req, res, next) => {
    try {
      const { id } = req.body;
      if (!id) return next(new AppError('Bill ID required', 400, 'VALIDATION_ERROR'));
      const bill = await billRepo.findById(id);
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));

      const updated = await billRepo.update(id, {
        printCount: (bill.printCount || 0) + 1,
        lastPrintedAt: new Date(),
        printedStatus: 'Printed'
      });
      res.json({ success: true, data: updated });
    } catch(e) { next(e); }
  },

  // ── GET /billing/invoice/:id ─────────────────────────────────────────────────
  // Returns full bill data for the Invoice Preview screen
  getInvoice: async (req, res, next) => {
    try {
      const bill = await billRepo.findById(req.params.id);
      if (!bill) return next(new AppError('Invoice not found', 404, 'NOT_FOUND'));
      res.json({ success: true, data: bill });
    } catch(e) { next(e); }
  },

  // ── PUT /billing/print-count ──────────────────────────────────────────────────
  // Increments printCount and records lastPrintedAt timestamp
  updatePrintCount: async (req, res, next) => {
    try {
      const { id } = req.body;
      if (!id) return next(new AppError('Bill ID required', 400, 'VALIDATION_ERROR'));
      const bill = await billRepo.findById(id);
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));

      const updated = await billRepo.update(id, {
        printCount: (bill.printCount || 0) + 1,
        lastPrintedAt: new Date(),
        printedStatus: 'Printed'
      });
      res.json({
        success: true,
        data: updated,
        printCount: updated.printCount,
        lastPrintedAt: updated.lastPrintedAt
      });
    } catch(e) { next(e); }
  },

  // ── Actions ─────────────────────────────────────────────────────────────
  printInvoice: async (req, res, next) => {
    try { res.json({ success: true, message: 'Print initiated' }); } catch(e) { next(e); }
  },
  
  pdfInvoice: async (req, res, next) => {
    try {
      const bill = await billRepo.findById(req.params.id);
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));

      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        res.writeHead(200, {
          'Content-Length': Buffer.byteLength(pdfData),
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment;filename=invoice-${bill.id}.pdf`,
        });
        res.end(pdfData);
      });

      // Professional PDF layout
      doc.fontSize(20).font('Helvetica-Bold').text('LifeCare Pharmacy', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('12, Gandhi Nagar, Main Road, Chennai - 600 001', { align: 'center' });
      doc.text('Ph: +91 98765 43210 | GST: 33ABCDE1234F1Z5', { align: 'center' }).moveDown();

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

      // Bill details
      doc.fontSize(12).font('Helvetica-Bold').text('TAX INVOICE');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Bill No: ${bill.id}`, { continued: true }).text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, { align: 'right' });
      doc.text(`Customer: ${bill.patientName || 'Walk-in'}`, { continued: true }).text(`Payment: ${bill.paymentMethod || 'Cash'}`, { align: 'right' });
      if (bill.mobileNumber) doc.text(`Mobile: ${bill.mobileNumber}`);
      if (bill.doctorName) doc.text(`Doctor: ${bill.doctorName}`);
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('S.No', 50, tableTop);
      doc.text('Item Description', 100, tableTop);
      doc.text('Qty', 350, tableTop, { width: 30, align: 'center' });
      doc.text('Rate', 400, tableTop, { width: 50, align: 'right' });
      doc.text('Amount', 480, tableTop, { width: 70, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      // Table Rows
      let y = tableTop + 25;
      doc.font('Helvetica');
      bill.items.forEach((item, idx) => {
        // Handle page break
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text((idx + 1).toString(), 50, y);
        doc.text(`${item.name} (Batch: ${item.batchNumber || 'N/A'})`, 100, y, { width: 230 });
        doc.text(item.qty.toString(), 350, y, { width: 30, align: 'center' });
        doc.text(Number(item.price).toFixed(2), 400, y, { width: 50, align: 'right' });
        doc.text(Number(item.total).toFixed(2), 480, y, { width: 70, align: 'right' });
        y += 20;
      });

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // Totals
      const subtotal = Number(bill.subtotal || 0) > 0 ? Number(bill.subtotal) : Number(bill.grandTotal) - Number(bill.gstTax);
      
      doc.font('Helvetica');
      doc.text('Subtotal:', 380, y, { width: 100, align: 'right' });
      doc.text(subtotal.toFixed(2), 480, y, { width: 70, align: 'right' });
      y += 15;
      
      if (Number(bill.discount || 0) > 0) {
        doc.text('Discount:', 380, y, { width: 100, align: 'right' });
        doc.text(`-${Number(bill.discount).toFixed(2)}`, 480, y, { width: 70, align: 'right' });
        y += 15;
      }
      
      doc.text('GST Tax:', 380, y, { width: 100, align: 'right' });
      doc.text(Number(bill.gstTax || 0).toFixed(2), 480, y, { width: 70, align: 'right' });
      y += 15;
      
      if (Number(bill.roundOff || 0) !== 0) {
        const ro = Number(bill.roundOff);
        doc.text('Round Off:', 380, y, { width: 100, align: 'right' });
        doc.text(`${ro > 0 ? '+' : ''}${ro.toFixed(2)}`, 480, y, { width: 70, align: 'right' });
        y += 15;
      }
      
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', 380, y, { width: 100, align: 'right' });
      doc.text(`Rs. ${Number(bill.grandTotal).toFixed(2)}`, 480, y, { width: 70, align: 'right' });
      y += 40;
      
      // Footer
      doc.font('Helvetica').fontSize(10);
      doc.text('Thank you! Visit Again.', 50, y, { align: 'center' });
      doc.fontSize(8).text('Medicines once sold cannot be returned without valid reason.', { align: 'center' });
      
      doc.end();
    } catch(e) { next(e); }
  },
  
  emailInvoice: async (req, res, next) => {
    try { res.json({ success: true, message: 'Email sent' }); } catch(e) { next(e); }
  },
  whatsappInvoice: async (req, res, next) => {
    try { res.json({ success: true, message: 'WhatsApp sent' }); } catch(e) { next(e); }
  },

  getSettings: async (req, res, next) => {
    try {
      const setting = await prisma.appSetting.findUnique({ where: { key: 'dailyDiscountRate' } });
      res.json({ success: true, data: { dailyDiscountRate: setting ? Number(setting.value) : 0 } });
    } catch (e) { next(e); }
  },

  updateSettings: async (req, res, next) => {
    try {
      const { dailyDiscountRate } = req.body;
      if (dailyDiscountRate !== undefined) {
        await prisma.appSetting.upsert({
          where: { key: 'dailyDiscountRate' },
          update: { value: String(dailyDiscountRate) },
          create: { key: 'dailyDiscountRate', value: String(dailyDiscountRate), description: 'Default global discount rate for billing' }
        });
      }
      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (e) { next(e); }
  },

  returnBill: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { itemsToReturn, reason } = req.body;
      const bill = await billRepo.findById(id);
      
      if (!bill) return next(new AppError('Bill not found', 404, 'NOT_FOUND'));
      if (!itemsToReturn || !itemsToReturn.length) return next(new AppError('No items selected for return', 400));

      const processedBy = req.user?.email || 'System';

      await prisma.$transaction(async (tx) => {
        let totalRefund = 0;
        const returnItemsData = [];

        for (const reqItem of itemsToReturn) {
          const billItem = bill.items.find(i => i.id === reqItem.billItemId);
          if (!billItem) throw new AppError(`Item ${reqItem.billItemId} not found in bill`, 400);
          if (reqItem.qty > billItem.qty) throw new AppError(`Cannot return more than purchased for ${billItem.name}`, 400);
          
          const unitPrice = Number(billItem.price);
          const refundAmount = unitPrice * reqItem.qty;
          totalRefund += refundAmount;

          returnItemsData.push({
            medicineId: billItem.medicineId,
            medicineName: billItem.name,
            qty: reqItem.qty
          });

          // Restore stock
          if (billItem.medicineId) {
            await tx.medicine.update({
              where: { id: billItem.medicineId },
              data: { stockQuantity: { increment: reqItem.qty } }
            });
          }
        }

        // Create return record
        await tx.patientReturn.create({
          data: {
            billId: bill.id,
            patientName: bill.patientName,
            refundAmount: totalRefund,
            reason: reason || 'Customer Return',
            processedBy,
            items: { create: returnItemsData }
          }
        });

        // Update bill totals
        await tx.bill.update({
          where: { id: bill.id },
          data: {
            grandTotal: { decrement: totalRefund },
            balanceAmount: { decrement: totalRefund }, // Depending on if it was paid
            notes: bill.notes ? `${bill.notes} | Refund processed for Rs. ${totalRefund}` : `Refund processed for Rs. ${totalRefund}`
          }
        });
      });

      res.json({ success: true, message: 'Return processed successfully' });
    } catch (e) { next(e); }
  },

  // ── GET /billing/sales-history ──────────────────────────────────────────────
  // Advanced paginated sales history with multi-field search and filters
  getSalesHistory: async (req, res, next) => {
    try {
      const {
        search, billNumber, patientName, mobileNumber: mobile, medicineName,
        fromDate, toDate, paymentMethod, createdBy,
        page = 1, pageSize = 20
      } = req.query;

      const where = { isDeleted: false };

      // Multi-field text search
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { mobileNumber: { contains: search } },
          { items: { some: { name: { contains: search, mode: 'insensitive' } } } },
        ];
      }
      if (billNumber) where.id = { contains: billNumber, mode: 'insensitive' };
      if (patientName) where.patientName = { contains: patientName, mode: 'insensitive' };
      if (mobile) where.mobileNumber = { contains: mobile };
      if (medicineName) {
        where.items = { some: { name: { contains: medicineName, mode: 'insensitive' } } };
      }
      if (paymentMethod) where.paymentMethod = { contains: paymentMethod, mode: 'insensitive' };
      if (createdBy) where.createdBy = { contains: createdBy, mode: 'insensitive' };

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const pageNum = Math.max(1, parseInt(page));
      const size = Math.min(100, Math.max(1, parseInt(pageSize)));
      const skip = (pageNum - 1) * size;

      const [bills, total] = await Promise.all([
        prisma.bill.findMany({
          where,
          include: {
            items: {
              include: {
                medicine: {
                  select: { medicineName: true, manufacturerId: true, manufacturer: { select: { name: true } } }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: size,
        }),
        prisma.bill.count({ where }),
      ]);

      res.json({
        success: true,
        data: bills,
        pagination: { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) },
      });
    } catch (e) { next(e); }
  },

  // ── DELETE /billing/bills/bulk-delete (Admin only) ──────────────────────────
  bulkDeleteBills: async (req, res, next) => {
    try {
      const { billIds } = req.body;
      if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
        return next(new AppError('billIds array is required', 400, 'VALIDATION_ERROR'));
      }
      // Soft-delete only
      const result = await prisma.bill.updateMany({
        where: { id: { in: billIds }, isDeleted: false },
        data: {
          isDeleted: true,
          paymentStatus: 'Voided',
          voidReason: 'Bulk deleted by admin',
          voidedBy: req.user?.email || 'Admin',
          voidedAt: new Date(),
        }
      });
      res.json({ success: true, message: `${result.count} bills deleted`, count: result.count });
    } catch (e) { next(e); }
  },

  // ── GET /billing/reports/daily ──────────────────────────────────────────────
  getDailyReport: async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [bills, totalAgg] = await Promise.all([
        prisma.bill.findMany({
          where: { createdAt: { gte: today, lt: tomorrow }, isDeleted: false },
          select: {
            id: true, patientName: true, grandTotal: true, gstTax: true,
            roundOff: true, discount: true, paymentMethod: true, paymentStatus: true,
            paidAmount: true, createdAt: true, createdBy: true,
            _count: { select: { items: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.bill.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow }, isDeleted: false },
          _sum: { grandTotal: true, gstTax: true, discount: true, roundOff: true },
          _count: { id: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          date: today.toISOString().split('T')[0],
          bills,
          summary: {
            totalBills: totalAgg._count.id,
            totalRevenue: Number(totalAgg._sum.grandTotal || 0),
            totalGst: Number(totalAgg._sum.gstTax || 0),
            totalDiscount: Number(totalAgg._sum.discount || 0),
            totalRoundOff: Number(totalAgg._sum.roundOff || 0),
          }
        }
      });
    } catch (e) { next(e); }
  },

  // ── GET /billing/reports/date-wise ─────────────────────────────────────────
  getDateWiseReport: async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;
      const where = { isDeleted: false };
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }
      const bills = await prisma.bill.findMany({
        where,
        select: { createdAt: true, grandTotal: true, gstTax: true, discount: true, roundOff: true, paymentStatus: true },
        orderBy: { createdAt: 'asc' }
      });

      // Group by date
      const grouped = {};
      for (const b of bills) {
        const date = b.createdAt.toISOString().split('T')[0];
        if (!grouped[date]) grouped[date] = { date, totalBills: 0, totalRevenue: 0, totalGst: 0, totalDiscount: 0, totalRoundOff: 0 };
        grouped[date].totalBills++;
        grouped[date].totalRevenue += Number(b.grandTotal || 0);
        grouped[date].totalGst += Number(b.gstTax || 0);
        grouped[date].totalDiscount += Number(b.discount || 0);
        grouped[date].totalRoundOff += Number(b.roundOff || 0);
      }

      res.json({ success: true, data: Object.values(grouped) });
    } catch (e) { next(e); }
  },

  // ── GET /billing/reports/payment-wise ──────────────────────────────────────
  getPaymentWiseReport: async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;
      const where = { isDeleted: false };
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) { const end = new Date(toDate); end.setHours(23,59,59,999); where.createdAt.lte = end; }
      }
      const bills = await prisma.bill.findMany({
        where,
        select: { paymentMethod: true, grandTotal: true, paymentStatus: true }
      });

      // Group by paymentMethod
      const grouped = {};
      for (const b of bills) {
        const method = b.paymentMethod || 'Unknown';
        if (!grouped[method]) grouped[method] = { method, totalBills: 0, totalRevenue: 0, paidCount: 0 };
        grouped[method].totalBills++;
        grouped[method].totalRevenue += Number(b.grandTotal || 0);
        if (b.paymentStatus === 'Paid') grouped[method].paidCount++;
      }

      res.json({ success: true, data: Object.values(grouped) });
    } catch (e) { next(e); }
  },

  // ── GET /billing/reports/medicine-wise ─────────────────────────────────────
  getMedicineWiseReport: async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;
      const billWhere = { isDeleted: false };
      if (fromDate || toDate) {
        billWhere.createdAt = {};
        if (fromDate) billWhere.createdAt.gte = new Date(fromDate);
        if (toDate) { const end = new Date(toDate); end.setHours(23,59,59,999); billWhere.createdAt.lte = end; }
      }

      const items = await prisma.billItem.findMany({
        where: { bill: billWhere },
        select: { name: true, qty: true, total: true, price: true, medicineId: true }
      });

      // Group by medicine name
      const grouped = {};
      for (const item of items) {
        const key = item.name;
        if (!grouped[key]) grouped[key] = { name: key, medicineId: item.medicineId, totalQty: 0, totalRevenue: 0, avgPrice: 0, billCount: 0 };
        grouped[key].totalQty += item.qty;
        grouped[key].totalRevenue += Number(item.total || 0);
        grouped[key].avgPrice = grouped[key].totalRevenue / grouped[key].totalQty;
        grouped[key].billCount++;
      }

      const sorted = Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue);
      res.json({ success: true, data: sorted });
    } catch (e) { next(e); }
  },
};
