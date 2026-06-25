import prisma from '../../config/prisma.js';

// ─── INVENTORY LOGS MODULE ─────────────────────────────────────────────────────

export const inventoryController = {
  getLogs: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.medicineId) where.medicineId = req.query.medicineId;
      if (req.query.type) where.type = req.query.type;
      const d = await prisma.inventoryLog.findMany({
        where,
        include: { medicine: { select: { medicineName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200
      });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  adjust: async (req, res, next) => {
    try {
      const { medicineId, medicineName, type, qty, user, remarks } = req.body;
      // Create inventory log
      const log = await prisma.inventoryLog.create({
        data: { medicineId, medicineName, type, qty: parseInt(qty), user, remarks }
      });

      // Adjust medicine stockQuantity
      if (medicineId) {
        const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
        if (med) {
          let delta = parseInt(qty);
          if (type === 'Stock Out' || type === 'Adjustment' && qty < 0) delta = -Math.abs(delta);
          if (type === 'Stock In') delta = Math.abs(delta);
          await prisma.medicine.update({
            where: { id: medicineId },
            data: { stockQuantity: Math.max(0, med.stockQuantity + delta) }
          });
        }
      }
      res.status(201).json({ success: true, data: log });
    } catch (e) { next(e); }
  }
};
