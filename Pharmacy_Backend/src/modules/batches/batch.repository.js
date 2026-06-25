// ─── BATCHES MODULE ─────────────────────────────────────────────────────────
import prisma from '../../config/prisma.js';

export const batchRepository = {
  create: async (data) => prisma.medicineBatch.create({ data, include: { medicine: true } }),

  findAll: async ({ medicineId, status, skip, take }) => {
    const where = { isDeleted: false };
    if (medicineId) where.medicineId = medicineId;
    if (status) where.status = status;
    const query = { where, include: { medicine: { select: { medicineName: true, skuCode: true } } }, orderBy: { expiryDate: 'asc' } };
    if (skip !== undefined && take !== undefined) { query.skip = skip; query.take = take; }
    const [data, total] = await Promise.all([
      prisma.medicineBatch.findMany(query),
      prisma.medicineBatch.count({ where })
    ]);
    return { data, total };
  },

  findById: async (id) => prisma.medicineBatch.findFirst({
    where: { id, isDeleted: false },
    include: { medicine: true }
  }),

  findExpiring: async (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    return prisma.medicineBatch.findMany({
      where: { isDeleted: false, status: 'Active', expiryDate: { lte: target, gte: new Date() } },
      include: { medicine: { select: { medicineName: true } } },
      orderBy: { expiryDate: 'asc' }
    });
  },

  update: async (id, data) => prisma.medicineBatch.update({ where: { id }, data }),

  countAll: async () => prisma.medicineBatch.count({ where: { isDeleted: false } })
};
