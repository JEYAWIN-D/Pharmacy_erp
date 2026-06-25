import { AppError } from '../errors/AppError.js';

/**
 * Validates the POST /bills request body before it reaches the controller.
 * Ensures required fields are present and sane so the DB never receives garbage data.
 */
export const validateCreateBill = (req, res, next) => {
  const { patient, patientName, total, grandTotal, items, paidAmount } = req.body;

  // ── Patient name ────────────────────────────────────────────────────────────
  const name = (patient || patientName || '').toString().trim();
  if (!name || name.length < 2) {
    return next(new AppError('Patient name is required (min 2 characters)', 400, 'VALIDATION_ERROR'));
  }

  // ── Grand total ─────────────────────────────────────────────────────────────
  const amount = total ?? grandTotal;
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return next(new AppError('Grand total is required and must be a number', 400, 'VALIDATION_ERROR'));
  }
  if (Number(amount) < 0) {
    return next(new AppError('Grand total cannot be negative', 400, 'VALIDATION_ERROR'));
  }

  // ── Items list ───────────────────────────────────────────────────────────────
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Bill must contain at least one medicine item', 400, 'VALIDATION_ERROR'));
  }

  // ── Per-item validation ──────────────────────────────────────────────────────
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = `Item ${i + 1}`;

    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      return next(new AppError(`${label}: medicine name is required`, 400, 'VALIDATION_ERROR'));
    }
    if (!item.qty || isNaN(Number(item.qty)) || Number(item.qty) <= 0) {
      return next(new AppError(`${label}: quantity must be a positive number`, 400, 'VALIDATION_ERROR'));
    }
    if (item.price === undefined || item.price === null || isNaN(Number(item.price)) || Number(item.price) < 0) {
      return next(new AppError(`${label}: price must be a non-negative number`, 400, 'VALIDATION_ERROR'));
    }
    if (item.total === undefined || item.total === null || isNaN(Number(item.total)) || Number(item.total) < 0) {
      return next(new AppError(`${label}: line total is required and must be >= 0`, 400, 'VALIDATION_ERROR'));
    }
  }

  // ── Paid amount (optional but must be non-negative if provided) ───────────────
  if (paidAmount !== undefined && paidAmount !== null && Number(paidAmount) < 0) {
    return next(new AppError('Paid amount cannot be negative', 400, 'VALIDATION_ERROR'));
  }

  next(); // ✅ all checks passed
};
