import express from 'express';
import { dispensingController } from './dispensing.module.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);
router.get('/', dispensingController.getAll);
router.post('/', dispensingController.create);
export default router;
