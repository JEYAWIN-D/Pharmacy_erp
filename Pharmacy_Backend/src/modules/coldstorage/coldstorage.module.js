import prisma from '../../config/prisma.js';

// ─── COLD STORAGE MODULE ───────────────────────────────────────────────────────

export const coldStorageController = {
  getLogs: async (req, res, next) => {
    try {
      const d = await prisma.coldStorageLog.findMany({ orderBy: { recordedAt: 'desc' }, take: 100 });
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  record: async (req, res, next) => {
    try {
      const { temperature, notes } = req.body;
      const temp = parseFloat(temperature);
      const status = temp < 2 ? 'Alert' : temp > 8 ? 'Warning' : 'Normal';
      const d = await prisma.coldStorageLog.create({ data: { temperature: temp, status, notes } });

      // Auto-create notification if out of range
      if (status !== 'Normal') {
        await prisma.notification.create({
          data: {
            type: status === 'Alert' ? 'danger' : 'warning',
            message: `Cold Storage Temperature ${status}: ${temp}°C (Expected: 2–8°C)`
          }
        });
      }
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  getLatest: async (req, res, next) => {
    try {
      const d = await prisma.coldStorageLog.findFirst({ orderBy: { recordedAt: 'desc' } });
      res.json({ success: true, data: d || { temperature: 4.2, status: 'Normal' } });
    } catch (e) { next(e); }
  },
  getStock: async (req, res, next) => {
    try {
      const records = await prisma.coldStorage.findMany({
        include: {
          medicine: {
            include: {
              category: { select: { name: true } },
              batches: {
                where: { isDeleted: false, status: 'Active' },
                orderBy: { expiryDate: 'asc' }
              }
            }
          },
          batch: true
        }
      });
      res.json({ success: true, data: records });
    } catch (e) { next(e); }
  },
  updateStockRecord: async (req, res, next) => {
    try {
      const { requiredTemperature, storagePlace, rackFridgeLocation, currentTemperature, status } = req.body;
      const id = req.params.id;

      const record = await prisma.coldStorage.findUnique({ where: { id } });
      if (!record) throw new Error('Cold Storage record not found');

      const data = {};
      if (requiredTemperature !== undefined) data.requiredTemperature = requiredTemperature;
      if (storagePlace !== undefined) data.storagePlace = storagePlace;
      if (rackFridgeLocation !== undefined) data.rackFridgeLocation = rackFridgeLocation;
      if (currentTemperature !== undefined) data.currentTemperature = parseFloat(currentTemperature);
      if (status !== undefined) data.status = status;

      const updated = await prisma.coldStorage.update({
        where: { id },
        data,
        include: { medicine: true, batch: true }
      });
      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  }
};
