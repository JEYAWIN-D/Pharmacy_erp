import { validationResult } from 'express-validator';
import { medicineService } from './medicine.service.js';
import { AppError } from '../../shared/errors/AppError.js';

// ── Helper ────────────────────────────────────────────────────────────────────
const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(', ');
    throw new AppError(message, 422, 'VALIDATION_ERROR');
  }
};

// ── Controller ────────────────────────────────────────────────────────────────
export const medicineController = {

  /**
   * POST /api/medicines
   * Create a new medicine.
   */
  create: async (req, res, next) => {
    try {
      handleValidationErrors(req);
      const data = await medicineService.create(req.body, req.user.userId);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/medicines
   * List all medicines with search, filter, sort, pagination.
   */
  getAll: async (req, res, next) => {
    try {
      handleValidationErrors(req);
      const result = await medicineService.getAll(req.query);
      res.status(200).json({
        success: true,
        data: {
          medicines:  result.medicines,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/medicines/:id
   * Get a single medicine by ID.
   */
  getById: async (req, res, next) => {
    try {
      const data = await medicineService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/medicines/:id
   * Full update of a medicine.
   */
  update: async (req, res, next) => {
    try {
      handleValidationErrors(req);
      const data = await medicineService.update(req.params.id, req.body, req.user.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/medicines/:id/toggle-status
   * Toggle active/inactive status.
   */
  toggleStatus: async (req, res, next) => {
    try {
      handleValidationErrors(req);
      const data = await medicineService.toggleStatus(
        req.params.id,
        req.body.isActive,
        req.user.userId
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/medicines/:id
   * Soft-delete a medicine.
   */
  delete: async (req, res, next) => {
    try {
      await medicineService.delete(req.params.id, req.user.userId);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  }
};
