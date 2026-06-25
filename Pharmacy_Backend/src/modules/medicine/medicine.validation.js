import { body, query } from 'express-validator';
import { SKU_REGEX, STORAGE_TYPES } from './medicine.constants.js';

// ──────────────────────────────────────────────────────────────
// CREATE / UPDATE validation
// ──────────────────────────────────────────────────────────────
export const medicineValidation = [
  body('medicineName')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Medicine name must be between 2 and 150 characters'),

  body('genericName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Generic name must not exceed 150 characters'),

  body('skuCode')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(SKU_REGEX)
    .withMessage('SKU Code must be 2-30 uppercase alphanumeric characters or hyphens'),

  body('categoryId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('categoryId must be a valid UUID'),

  body('supplierId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('supplierId must be a valid UUID'),

  body('companyName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),

  body('pricePerPiece')
    .notEmpty()
    .withMessage('Price per piece is required')
    .isFloat({ min: 0 })
    .withMessage('Price per piece must be a positive number'),

  body('stockQuantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('reorderLevel')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),

  body('shelfLocation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Shelf location must not exceed 50 characters'),

  body('storageType')
    .optional({ checkFalsy: true })
    .isIn(Object.values(STORAGE_TYPES))
    .withMessage(`Storage type must be one of: ${Object.values(STORAGE_TYPES).join(', ')}`),

  body('taxPercentage')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax percentage must be between 0 and 100'),

  body('requiresDoctorSlip')
    .optional()
    .isBoolean()
    .withMessage('requiresDoctorSlip must be a boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// ──────────────────────────────────────────────────────────────
// PATCH /toggle-status validation
// ──────────────────────────────────────────────────────────────
export const toggleStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// ──────────────────────────────────────────────────────────────
// GET query-param validation
// ──────────────────────────────────────────────────────────────
export const queryParamsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('isActive').optional({ checkFalsy: true }).isBoolean(),
  query('categoryId').optional({ checkFalsy: true }).isUUID()
];
