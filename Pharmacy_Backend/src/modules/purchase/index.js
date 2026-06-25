import express from 'express';
import { purchaseController } from './purchase.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);

// Purchase Requests
router.get('/requests', purchaseController.getAllPRs);
router.get('/requests/:id', purchaseController.getPRById);
router.post('/requests', purchaseController.createPR);
router.put('/requests/:id', purchaseController.updatePR);

// Purchase Orders
router.get('/orders', purchaseController.getAllPOs);
router.get('/orders/:id', purchaseController.getPOById);
router.post('/orders', purchaseController.createPO);
router.put('/orders/:id', purchaseController.updatePO);

// GRN
router.get('/grn', purchaseController.getAllGRNs);
router.get('/grn/:id', purchaseController.getGRNById);
router.post('/grn', purchaseController.createGRN);

export default router;
