import express from 'express';
import {
  create,
  getAll,
  getById,
  update,
  toggleCategoryStatus,
  remove
} from './category.controller.js';
import {
  createCategoryValidation,
  updateCategoryValidation,
  toggleStatusValidation
} from './category.validation.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const router = express.Router();

// Apply authentication to all category routes
router.use(authenticate);

// Allow access to Admin, Super Admin, Pharmacy Manager, Pharmacist, and Store Manager
const categoryAccessRoles = ['Super Admin', 'Admin', 'Pharmacy Manager', 'Pharmacist', 'Store Manager'];

router.post(
  '/',
  authorize(...categoryAccessRoles),
  createCategoryValidation,
  create
);

router.get(
  '/',
  authorize(...categoryAccessRoles, 'Cashier'), // Cashier can read categories
  getAll
);

router.get(
  '/:id',
  authorize(...categoryAccessRoles, 'Cashier'),
  getById
);

router.put(
  '/:id',
  authorize(...categoryAccessRoles),
  updateCategoryValidation,
  update
);

router.patch(
  '/:id/toggle-status',
  authorize('Super Admin', 'Admin', 'Store Manager'), // Stricter access for status toggle
  toggleStatusValidation,
  toggleCategoryStatus
);

router.delete(
  '/:id',
  authorize('Super Admin', 'Admin'), // Only Admins can delete
  remove
);

export default router;
