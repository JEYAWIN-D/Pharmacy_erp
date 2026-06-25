import express from 'express';
import { administrationController } from './administration.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);

// Audit Logs
router.get('/audit-logs', administrationController.getAuditLogs);
router.post('/audit-logs', administrationController.createAuditLog);

// Expenses
router.get('/expenses', administrationController.getExpenses);
router.post('/expenses', administrationController.createExpense);
router.put('/expenses/:id', administrationController.updateExpense);
router.delete('/expenses/:id', administrationController.deleteExpense);

// Supplier Finance
router.get('/supplier-invoices', administrationController.getSupplierInvoices);
router.post('/supplier-invoices', administrationController.createSupplierInvoice);
router.get('/supplier-payments', administrationController.getSupplierPayments);
router.post('/supplier-payments', administrationController.createSupplierPayment);
router.get('/supplier-ledger', administrationController.getSupplierLedger);
router.post('/supplier-ledger', administrationController.createSupplierLedger);

export default router;
