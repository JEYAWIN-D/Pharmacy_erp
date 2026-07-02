import express from 'express';
import { purchaseController } from './purchase.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

const router = express.Router();

router.get('/debug-low-stock', purchaseController.getLowStockMedicines);

// ── Low Stock & Dashboard ──────────────────────────────────────────────────────
router.use(authenticate);

router.get('/low-stock', purchaseController.getLowStockMedicines);
router.post('/orders/from-low-stock', purchaseController.createPOFromLowStock);
// ── Purchase Requests ──────────────────────────────────────────────────────────
router.get('/requests', purchaseController.getAllPRs);
router.get('/requests/:id', purchaseController.getPRById);
router.post('/requests', purchaseController.createPR);
router.put('/requests/:id', purchaseController.updatePR);
router.put('/requests/:id/approve', purchaseController.approvePR);
router.put('/requests/:id/reject', purchaseController.rejectPR);

// ── Purchase Orders ────────────────────────────────────────────────────────────
router.get('/orders/completed', purchaseController.getCompletedPOs);
router.get('/orders', purchaseController.getAllPOs);
router.get('/orders/:id', purchaseController.getPOById);
router.post('/orders', purchaseController.createPO);
router.post('/orders/from-pr', purchaseController.createPOFromPR);
router.put('/orders/:id', purchaseController.updatePO);
router.put('/orders/:id/send', purchaseController.sendPO);
router.put('/orders/:id/confirm', purchaseController.confirmPO);
router.put('/orders/:id/cancel', purchaseController.cancelPO);
router.put('/orders/:id/close', purchaseController.closePO);
router.get('/orders/:id/progress', purchaseController.getPOProgress);
router.put('/orders/:id/status', purchaseController.updatePOStatus);

// ── Shipments ─────────────────────────────────────────────────────────────────
router.get('/shipments', purchaseController.getAllShipments);
router.get('/shipments/po/:poId', purchaseController.getShipmentsByPO);
router.post('/shipments', purchaseController.createShipment);
router.put('/shipments/:id/status', purchaseController.updateShipmentStatus);

// ── GRN ───────────────────────────────────────────────────────────────────────
router.get('/grn/completed', purchaseController.getCompletedGRNs);
router.get('/grn/po/:poId', purchaseController.getGRNByPOId);
router.get('/grn/validate-invoice', purchaseController.validateInvoiceNumber);
router.get('/grn', purchaseController.getAllGRNs);
router.get('/grn/:id', purchaseController.getGRNById);
router.post('/grn', purchaseController.createGRN);
router.put('/grn/:id', purchaseController.updateGRN);
router.delete('/grn/:id', purchaseController.deleteGRN);
router.put('/stock', purchaseController.updateStockAfterGRN);

// ── Procurement History ────────────────────────────────────────────────────────
router.get('/history', purchaseController.getProcurementHistory);

export default router;
