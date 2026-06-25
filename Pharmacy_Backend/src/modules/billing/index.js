import express from 'express';
import { billingController } from './billing.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateCreateBill } from '../../shared/validators/billing.validator.js';

const router = express.Router();
router.use(authenticate);

// ── Bills ──────────────────────────────────────────────────────────────────────
// GET  /billing/bills?status=Paid&search=ram&fromDate=2026-06-01&toDate=2026-06-22&page=1&limit=30
router.get('/bills',         billingController.getAllBills);
router.get('/bills/:id',     billingController.getBillById);
// FIX #1: validateCreateBill middleware runs before the controller
router.post('/bills',        validateCreateBill, billingController.createBill);
// FIX #7: Whitelist-only update (no grand total tampering)
router.put('/bills/:id',     billingController.updateBill);
// FIX #8: Soft-delete via void (requires reason)
router.post('/bills/:id/void', billingController.voidBill);
router.post('/bills/:id/return', billingController.returnBill);

// ── Sales History (advanced search & filters) ─────────────────────────────────
router.get('/sales-history',          billingController.getSalesHistory);

// ── Bulk Operations ───────────────────────────────────────────────────────────
router.delete('/bills/bulk-delete',   billingController.bulkDeleteBills);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/daily',          billingController.getDailyReport);
router.get('/reports/date-wise',      billingController.getDateWiseReport);
router.get('/reports/payment-wise',   billingController.getPaymentWiseReport);
router.get('/reports/medicine-wise',  billingController.getMedicineWiseReport);

// POS V2 New Routes
router.get('/settings',           billingController.getSettings);
router.get('/history/:mobile',    billingController.getHistoryByMobile);
router.post('/hold',              billingController.addToQueue);
router.post('/resume',            billingController.resumeQueue);
router.post('/reprint',           billingController.reprintBill);
router.post('/collect-balance',   billingController.addPayment);

// Invoice Preview & Print
router.get('/invoice/:id',        billingController.getInvoice);
router.put('/print-count',        billingController.updatePrintCount);

router.post('/print',             billingController.printInvoice);
router.get('/bills/:id/pdf',      billingController.pdfInvoice);
router.post('/email',             billingController.emailInvoice);
router.post('/whatsapp',          billingController.whatsappInvoice);


// ── Billing Queue ─────────────────────────────────────────────────────────────
router.get('/queue',              billingController.getQueue);
router.post('/queue',             billingController.addToQueue);
router.delete('/queue/:queueId',  billingController.removeFromQueue);

// ── Payments ──────────────────────────────────────────────────────────────────
// FIX #2: addPayment now validates amount, checks bill exists, computes correct status
router.post('/payments', billingController.addPayment);

// ── Cash Register ─────────────────────────────────────────────────────────────
// FIX #5: openRegister is race-condition safe (Prisma transaction)
router.get('/cash-register',           billingController.getRegisters);
router.post('/cash-register/open',     billingController.openRegister);
router.put('/cash-register/:id/close', billingController.closeRegister);

export default router;

