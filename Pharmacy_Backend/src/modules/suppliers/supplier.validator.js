import { AppError } from '../../shared/errors/AppError.js';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

export const supplierValidator = {
  validateCreate: (req, res, next) => {
    const { name } = req.body;
    const errors = [];

    if (!name?.trim()) errors.push('Supplier name is required.');

    if (req.body.gstNumber && !GST_REGEX.test(req.body.gstNumber.trim())) {
      errors.push('Invalid GST number format. Expected: 15-char alphanumeric (e.g., 29AAFCS9829K1Z4).');
    }
    if (req.body.panNumber && !PAN_REGEX.test(req.body.panNumber.trim())) {
      errors.push('Invalid PAN number format. Expected: 10-char (e.g., ABCDE1234F).');
    }
    if (req.body.email && !EMAIL_REGEX.test(req.body.email.trim())) {
      errors.push('Invalid email address format.');
    }
    if (req.body.phone) {
      const phone = req.body.phone.replace(/[\s\-\+]/g, '');
      if (phone.length >= 10 && !PHONE_REGEX.test(phone.slice(-10))) {
        errors.push('Invalid phone number. Must be a valid 10-digit Indian mobile number.');
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join(' '), 400, 'VALIDATION_ERROR'));
    }
    next();
  },

  validateUpdate: (req, res, next) => {
    const errors = [];
    if (req.body.gstNumber && !GST_REGEX.test(req.body.gstNumber.trim())) {
      errors.push('Invalid GST number format.');
    }
    if (req.body.panNumber && !PAN_REGEX.test(req.body.panNumber.trim())) {
      errors.push('Invalid PAN number format.');
    }
    if (req.body.email && !EMAIL_REGEX.test(req.body.email.trim())) {
      errors.push('Invalid email address format.');
    }
    if (errors.length > 0) {
      return next(new AppError(errors.join(' '), 400, 'VALIDATION_ERROR'));
    }
    next();
  },

  validateCategory: (req, res, next) => {
    const { supplierId, categoryName } = req.body;
    if (!supplierId) return next(new AppError('Supplier ID is required.', 400, 'VALIDATION_ERROR'));
    if (!categoryName?.trim()) return next(new AppError('Category name is required.', 400, 'VALIDATION_ERROR'));
    next();
  },

  validateBrandMapping: (req, res, next) => {
    const { supplierId, brandName } = req.body;
    if (!supplierId) return next(new AppError('Supplier ID is required.', 400, 'VALIDATION_ERROR'));
    if (!brandName?.trim()) return next(new AppError('Brand name is required.', 400, 'VALIDATION_ERROR'));
    next();
  },

  validatePurchaseTerm: (req, res, next) => {
    const { supplierId, purchasePrice } = req.body;
    if (!supplierId) return next(new AppError('Supplier ID is required.', 400, 'VALIDATION_ERROR'));
    if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
      return next(new AppError('Valid purchase price is required.', 400, 'VALIDATION_ERROR'));
    }
    next();
  },

  validatePayment: (req, res, next) => {
    const { supplierId, amount } = req.body;
    if (!supplierId) return next(new AppError('Supplier ID is required.', 400, 'VALIDATION_ERROR'));
    if (!amount || parseFloat(amount) <= 0) {
      return next(new AppError('Valid payment amount is required.', 400, 'VALIDATION_ERROR'));
    }
    next();
  },

  validateReturn: (req, res, next) => {
    const { supplierId, reason } = req.body;
    if (!supplierId) return next(new AppError('Supplier ID is required.', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim()) return next(new AppError('Return reason is required.', 400, 'VALIDATION_ERROR'));
    next();
  },

  validateCreditNote: (req, res, next) => {
    const { supplierId, amount } = req.body;
    if (!supplierId) return next(new AppError('Supplier ID is required.', 400, 'VALIDATION_ERROR'));
    if (!amount || parseFloat(amount) <= 0) {
      return next(new AppError('Valid credit note amount is required.', 400, 'VALIDATION_ERROR'));
    }
    next();
  }
};
