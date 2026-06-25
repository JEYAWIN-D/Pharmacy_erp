import { body, param } from 'express-validator';

export const createUserValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),

  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('roleId')
    .notEmpty()
    .withMessage('Role is required')
];

export const updateUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('User id is required'),

  body('username')
    .optional()
    .notEmpty()
    .withMessage('Username cannot be empty'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('roleId')
    .optional()
    .notEmpty()
    .withMessage('Role cannot be empty')
];

export const getUserByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('User id is required')
];
