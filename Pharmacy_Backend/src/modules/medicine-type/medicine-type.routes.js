import express from 'express';
import { medicineTypeController } from './medicine-type.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

const readRoles = ['Super Admin', 'Admin', 'Pharmacy Manager', 'Pharmacist', 'Store Manager', 'Cashier'];
const writeRoles = ['Super Admin', 'Admin', 'Pharmacy Manager', 'Pharmacist', 'Store Manager'];

router.get('/', authorize(...readRoles), medicineTypeController.getAll);
router.get('/:id', authorize(...readRoles), medicineTypeController.getById);
router.post('/', authorize(...writeRoles), medicineTypeController.create);
router.put('/:id', authorize(...writeRoles), medicineTypeController.update);
router.delete('/:id', authorize(...writeRoles), medicineTypeController.delete);

export default router;
