import express from 'express';
import { returnsController } from './returns.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);
router.get('/patient', returnsController.getAllPatient);
router.post('/patient', returnsController.createPatient);
router.get('/supplier', returnsController.getAllSupplier);
router.post('/supplier', returnsController.createSupplier);
router.put('/supplier/:id', returnsController.updateSupplier);

// Alias routes for V2 POS Returns
router.get('/', returnsController.getAllPatient);
router.post('/', returnsController.createPatient);

export default router;
