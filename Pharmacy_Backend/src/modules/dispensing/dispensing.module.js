import prisma from '../../config/prisma.js';

// ─── DISPENSING MODULE ────────────────────────────────────────────────────────
const dispensingRepo = {
  create: async (data) => prisma.dispensingLog.create({
    data,
    include: { prescription: true, medicine: true, batch: true }
  }),
  findAll: async ({ prescriptionId, medicineId } = {}) => {
    const where = {};
    if (prescriptionId) where.prescriptionId = prescriptionId;
    if (medicineId) where.medicineId = medicineId;
    return prisma.dispensingLog.findMany({
      where, include: { medicine: { select: { medicineName: true } }, batch: { select: { batchNumber: true } } },
      orderBy: { createdAt: 'desc' }, take: 200
    });
  }
};

export const dispensingController = {
  getAll: async (req, res, next) => {
    try { const d = await dispensingRepo.findAll(req.query); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const data = req.body;
      // FEFO: auto-select earliest expiry batch for medicine if batchId not provided
      if (!data.batchId && data.medicineId) {
        const earliest = await prisma.medicineBatch.findFirst({
          where: { medicineId: data.medicineId, status: 'Active', isDeleted: false },
          orderBy: { expiryDate: 'asc' }
        });
        if (earliest) { data.batchId = earliest.id; data.batchNumber = earliest.batchNumber; data.fefoApplied = true; }
      }
      const log = await dispensingRepo.create(data);
      res.status(201).json({ success: true, data: log });
    } catch (e) { next(e); }
  }
};
