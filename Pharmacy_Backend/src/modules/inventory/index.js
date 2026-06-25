import express from 'express';
import { inventoryController } from './inventory.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);
router.get('/logs', inventoryController.getLogs);
router.post('/adjust', inventoryController.adjust);
export default router;
