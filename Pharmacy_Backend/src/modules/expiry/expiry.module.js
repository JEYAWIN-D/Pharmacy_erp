import prisma from '../../config/prisma.js';

// ─── EXPIRY ALERTS MODULE ──────────────────────────────────────────────────────

export const expiryController = {
  getAlerts: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.action) where.action = req.query.action;
      const d = await prisma.expiryAlert.findMany({
        where,
        include: { batch: true },
        orderBy: { daysLeft: 'asc' }
      });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },

  // Generate/refresh expiry alerts from active batches
  refresh: async (req, res, next) => {
    try {
      const today = new Date();
      const criticalDays = parseInt(req.query.criticalDays) || 30;
      const warnDays = parseInt(req.query.warnDays) || 90;

      const batches = await prisma.medicineBatch.findMany({
        where: { status: 'Active', isDeleted: false },
        include: { medicine: true }
      });

      const created = [];
      for (const b of batches) {
        const diff = Math.ceil((new Date(b.expiryDate) - today) / (1000 * 60 * 60 * 24));
        if (diff <= warnDays) {
          const tier = diff <= criticalDays ? 'Critical' : 'Warning';
          // Upsert based on batchId
          const existing = await prisma.expiryAlert.findFirst({ where: { batchId: b.id } });
          if (existing) {
            await prisma.expiryAlert.update({ where: { id: existing.id }, data: { daysLeft: diff, alertTier: tier } });
          } else {
            const alert = await prisma.expiryAlert.create({
              data: {
                batchId: b.id, medicineId: b.medicineId,
                medicineName: b.medicine?.medicineName, expiryDate: b.expiryDate,
                daysLeft: diff, alertTier: tier
              }
            });
            created.push(alert);
          }
        }
      }

      res.json({ success: true, message: `${created.length} new alerts created`, data: created });
    } catch (e) { next(e); }
  },

  updateAlert: async (req, res, next) => {
    try {
      const d = await prisma.expiryAlert.update({ where: { id: req.params.id }, data: req.body });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  }
};
