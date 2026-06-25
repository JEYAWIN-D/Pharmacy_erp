import prisma from '../../config/prisma.js';

// ─── NOTIFICATIONS MODULE ──────────────────────────────────────────────────────

export const notificationsController = {
  getAll: async (req, res, next) => {
    try {
      const where = {};
      if (req.query.resolved === 'false') where.resolved = false;
      if (req.query.resolved === 'true') where.resolved = true;
      const d = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { const d = await prisma.notification.create({ data: req.body }); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  resolve: async (req, res, next) => {
    try {
      const d = await prisma.notification.update({ where: { id: parseInt(req.params.id) }, data: { resolved: true } });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  resolveAll: async (req, res, next) => {
    try {
      await prisma.notification.updateMany({ where: { resolved: false }, data: { resolved: true } });
      res.json({ success: true, message: 'All notifications resolved' });
    } catch (e) { next(e); }
  },
  getUnresolved: async (req, res, next) => {
    try {
      const count = await prisma.notification.count({ where: { resolved: false } });
      res.json({ success: true, count });
    } catch (e) { next(e); }
  }
};
