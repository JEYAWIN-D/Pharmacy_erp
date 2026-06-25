import express from 'express';
import { dashboardController } from './dashboard.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);
router.get('/stats', dashboardController.getStats);
router.get('/top-medicines', dashboardController.getTopMedicines);
export default router;
