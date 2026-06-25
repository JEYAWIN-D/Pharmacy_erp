import { body } from 'express-validator';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 3 })
    .withMessage('Category name must be at least 3 characters long'),
    
  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string')
];

export const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 3 })
    .withMessage('Category name must be at least 3 characters long'),
    
  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string')
];

export const toggleStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];
