import express from 'express';
import { supplierController } from './supplier.controller.js';
import { supplierValidator } from './supplier.validator.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

// ─── DASHBOARD & REPORTS ────────────────────────────────────────────────────
router.get('/dashboard-stats', supplierController.getDashboardStats);
router.get('/reports/:type', supplierController.getReport);
router.get('/expiring-licenses', supplierController.getExpiringLicenses);
router.get('/export', supplierController.exportCSV);

// ─── CATEGORIES ─────────────────────────────────────────────────────────────
router.get('/categories', supplierController.getCategories);
router.post('/categories', supplierValidator.validateCategory, supplierController.createCategory);
router.put('/categories/:id', supplierController.updateCategory);
router.delete('/categories/:id', supplierController.deleteCategory);

// ─── BRAND MAPPINGS ────────────────────────────────────────────────────────
router.get('/brand-mapping', supplierController.getBrandMappings);
router.post('/brand-mapping', supplierValidator.validateBrandMapping, supplierController.createBrandMapping);
router.put('/brand-mapping/:id', supplierController.updateBrandMapping);
router.delete('/brand-mapping/:id', supplierController.deleteBrandMapping);

// ─── PURCHASE TERMS ────────────────────────────────────────────────────────
router.get('/purchase-terms', supplierController.getPurchaseTerms);
router.post('/purchase-terms', supplierValidator.validatePurchaseTerm, supplierController.createPurchaseTerm);
router.put('/purchase-terms/:id', supplierController.updatePurchaseTerm);
router.delete('/purchase-terms/:id', supplierController.deletePurchaseTerm);

// ─── PRICE HISTORY ─────────────────────────────────────────────────────────
router.get('/price-history', supplierController.getPriceHistory);
router.post('/price-history', supplierController.createPriceHistory);

// ─── INVOICES ──────────────────────────────────────────────────────────────
router.get('/invoices', supplierController.getInvoices);
router.post('/invoices', supplierController.createInvoice);

// ─── PAYMENTS ──────────────────────────────────────────────────────────────
router.get('/payments', supplierController.getPayments);
router.post('/payments', supplierValidator.validatePayment, supplierController.createPayment);
router.put('/payments/:id', supplierController.updatePayment);
router.delete('/payments/:id', supplierController.deletePayment);

// ─── LEDGER ────────────────────────────────────────────────────────────────
router.get('/ledger', supplierController.getLedger);
router.get('/ledger/:supplierId', supplierController.getLedgerBySupplier);

// ─── RETURNS ───────────────────────────────────────────────────────────────
router.get('/returns', supplierController.getReturns);
router.post('/returns', supplierValidator.validateReturn, supplierController.createReturn);
router.put('/returns/:id', supplierController.updateReturn);
router.delete('/returns/:id', supplierController.deleteReturn);

// ─── CREDIT NOTES ──────────────────────────────────────────────────────────
router.get('/credit-notes', supplierController.getCreditNotes);
router.post('/credit-notes', supplierValidator.validateCreditNote, supplierController.createCreditNote);
router.put('/credit-notes/:id', supplierController.updateCreditNote);

// ─── DOCUMENTS ─────────────────────────────────────────────────────────────
router.get('/documents', supplierController.getDocuments);
router.post('/documents', supplierController.createDocument);
router.delete('/documents/:id', supplierController.deleteDocument);

// ─── PERFORMANCE ───────────────────────────────────────────────────────────
router.get('/performance', supplierController.getPerformance);
router.post('/performance/:supplierId/refresh', supplierController.refreshPerformance);

// ─── PURCHASE ORDERS ───────────────────────────────────────────────────────
router.get('/purchase-orders', supplierController.getPurchaseOrders);
router.post('/purchase-orders', supplierController.createPurchaseOrder);
router.put('/purchase-orders/:id/status', supplierController.updatePurchaseOrderStatus);

// ─── MEDICINE SUPPLIER MAPPINGS ────────────────────────────────────────────
router.get('/medicine-mappings', supplierController.getMedicineMappings);
router.post('/medicine-mappings', supplierController.createMedicineMapping);
router.put('/medicine-mappings/:id', supplierController.updateMedicineMapping);
router.delete('/medicine-mappings/:id', supplierController.deleteMedicineMapping);

// ─── SUPPLIER MASTER CRUD ──────────────────────────────────────────────────
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', supplierValidator.validateCreate, supplierController.create);
router.put('/:id', supplierValidator.validateUpdate, supplierController.update);
router.patch('/:id/status', supplierController.toggleStatus);
router.patch('/:id/preferred', supplierController.togglePreferred);
router.delete('/:id', supplierController.remove);

export default router;
