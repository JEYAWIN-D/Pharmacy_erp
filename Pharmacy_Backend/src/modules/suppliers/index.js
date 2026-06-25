import express from 'express';
import { supplierController } from './supplier.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.get('/expiring-licenses', supplierController.getExpiringLicenses);
router.get('/export', supplierController.exportCSV);

router.get('/invoices', supplierController.getInvoices);
router.post('/invoices', supplierController.createInvoice);
router.get('/payments', supplierController.getPayments);
router.post('/payments', supplierController.createPayment);
router.get('/ledger', supplierController.getLedger);
router.get('/purchase-orders', supplierController.getPurchaseOrders);
router.post('/purchase-orders', supplierController.createPurchaseOrder);
router.put('/purchase-orders/:id/status', supplierController.updatePurchaseOrderStatus);

router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', supplierController.create);
router.put('/:id', supplierController.update);
router.patch('/:id/status', supplierController.toggleStatus);
router.delete('/:id', supplierController.remove);

export default router;
