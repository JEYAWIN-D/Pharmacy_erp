import express from 'express';
import { expiryController } from './expiry.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);
router.get('/alerts', expiryController.getAlerts);
router.post('/alerts/refresh', expiryController.refresh);
router.put('/alerts/:id', expiryController.updateAlert);
export default router;
