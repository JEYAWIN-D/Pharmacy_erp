import express from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { medicineController } from './medicine.controller.js';
import {
  medicineValidation,
  toggleStatusValidation,
  queryParamsValidation
} from './medicine.validation.js';

const router = express.Router();

// All routes require a valid JWT
router.use(authenticate);

const { create, getAll, getById, update, toggleStatus, delete: deleteMedicine } = medicineController;

// Roles allowed to read / write medicines
const readRoles  = ['Super Admin', 'Admin', 'Pharmacy Manager', 'Pharmacist', 'Store Manager', 'Cashier'];
const writeRoles = ['Super Admin', 'Admin', 'Pharmacy Manager', 'Pharmacist', 'Store Manager'];
const adminRoles = ['Super Admin', 'Admin'];

// ── CRUD ───────────────────────────────────────────────────────
router.post('/',   authorize(...writeRoles), medicineValidation, create);

router.get('/statuses', authorize(...readRoles), medicineController.getStatuses);

router.get('/',    authorize(...readRoles),  queryParamsValidation, getAll);

router.get('/:id', authorize(...readRoles),  getById);

router.put('/:id', authorize(...writeRoles), medicineValidation, update);

router.patch('/:id/toggle-status', authorize(...writeRoles), toggleStatusValidation, toggleStatus);

router.delete('/:id', authorize(...adminRoles), deleteMedicine);

export default router;
