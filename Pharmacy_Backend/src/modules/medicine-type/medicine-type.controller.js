import { medicineTypeService } from './medicine-type.service.js';

export const medicineTypeController = {
  create: async (req, res, next) => {
    try {
      const data = await medicineTypeService.create(req.body);
      res.status(201).json({ success: true, data, message: 'Medicine type created successfully' });
    } catch (err) { next(err); }
  },

  getAll: async (req, res, next) => {
    try {
      const data = await medicineTypeService.getAll();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const data = await medicineTypeService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const data = await medicineTypeService.update(req.params.id, req.body);
      res.json({ success: true, data, message: 'Medicine type updated successfully' });
    } catch (err) { next(err); }
  },

  delete: async (req, res, next) => {
    try {
      await medicineTypeService.delete(req.params.id);
      res.json({ success: true, message: 'Medicine type deleted/deactivated successfully' });
    } catch (err) { next(err); }
  }
};
