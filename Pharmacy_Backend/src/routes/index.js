import express from 'express';

// Existing modules
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import supplierRoutes from '../modules/suppliers/index.js';
import medicineRoutes from '../modules/medicine/index.js';
import medicineTypeRoutes from '../modules/medicine-type/index.js';

// New modules
import manufacturerRoutes from '../modules/manufacturers/index.js';
import batchRoutes from '../modules/batches/index.js';
import rackRoutes from '../modules/racks/index.js';
import warehouseRoutes from '../modules/warehouse/index.js';
import purchaseRoutes from '../modules/purchase/index.js';
import prescriptionRoutes from '../modules/prescriptions/index.js';
import dispensingRoutes from '../modules/dispensing/index.js';
import billingRoutes from '../modules/billing/index.js';
import returnsRoutes from '../modules/returns/index.js';
import customerRoutes from '../modules/customers/index.js';
import notificationRoutes from '../modules/notifications/index.js';
import inventoryRoutes from '../modules/inventory/index.js';
import expiryRoutes from '../modules/expiry/index.js';
import dashboardRoutes from '../modules/dashboard/index.js';
import administrationRoutes from '../modules/administration/index.js';
import coldStorageRoutes from '../modules/coldstorage/index.js';
import outletRoutes from '../modules/outlets/index.js';
import { hrRoutes } from '../modules/hr/hr.module.js';

const router = express.Router();

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Master Data
router.use('/categories', categoryRoutes);
router.use('/medicines', medicineRoutes);
router.use('/medicine-types', medicineTypeRoutes);
router.use('/manufacturers', manufacturerRoutes);

// Suppliers
router.use('/suppliers', supplierRoutes);

// Storage
router.use('/racks', rackRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/outlets', outletRoutes);

// Inventory & Batches
router.use('/batches', batchRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/expiry', expiryRoutes);

// Procurement
router.use('/purchase', purchaseRoutes);

// Clinical
router.use('/prescriptions', prescriptionRoutes);
router.use('/dispensing', dispensingRoutes);

// Billing
router.use('/billing', billingRoutes);

// Returns
router.use('/returns', returnsRoutes);

// Customers
router.use('/customers', customerRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Administration
router.use('/administration', administrationRoutes);

// Cold Storage
router.use('/cold-storage', coldStorageRoutes);

// HR Management
router.use('/hr', hrRoutes);

export default router;