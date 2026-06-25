import express from 'express';
import { coldStorageController } from './coldstorage.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);
router.get('/logs', coldStorageController.getLogs);
router.get('/latest', coldStorageController.getLatest);
router.post('/record', coldStorageController.record);
export default router;
