import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── OUTLETS MODULE ────────────────────────────────────────────────────────────

export const outletsController = {
  getAll: async (req, res, next) => {
    try { const d = await prisma.outlet.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { const d = await prisma.outlet.create({ data: req.body }); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getStock: async (req, res, next) => {
    try {
      const outlet = await prisma.outlet.findUnique({ where: { id: req.params.id } });
      if (!outlet) return next(new AppError('Outlet not found', 404, 'NOT_FOUND'));
      const stock = await prisma.outletStock.findMany({
        where: { outletId: req.params.id },
        include: { medicine: { select: { medicineName: true, skuCode: true, reorderLevel: true } } }
      });
      res.json({ success: true, data: stock, outlet });
    } catch (e) { next(e); }
  },
  updateStock: async (req, res, next) => {
    try {
      const { outletId, medicineId, stock, rack } = req.body;
      const d = await prisma.outletStock.upsert({
        where: { outletId_medicineId: { outletId, medicineId } },
        update: { stock, rack },
        create: { outletId, medicineId, stock: stock || 0, rack }
      });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  }
};
