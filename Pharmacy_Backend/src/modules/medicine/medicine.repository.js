import prisma from '../../config/prisma.js';

export const medicineRepository = {

  // ── CREATE ──────────────────────────────────────────────────
  create: async (data) => {
    return prisma.medicine.create({
      data,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, code: true } }
      }
    });
  },

  // ── FIND ALL (paginated + filtered) ─────────────────────────
  findAll: async ({ search, isActive, categoryId, sortBy = 'createdAt', sortOrder = 'desc', skip, take }) => {
    const where = { isDeleted: false };

    if (search) {
      where.OR = [
        { medicineName: { contains: search, mode: 'insensitive' } },
        { genericName:  { contains: search, mode: 'insensitive' } },
        { skuCode:      { contains: search, mode: 'insensitive' } },
        { companyName:  { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const query = {
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, code: true } }
      }
    };

    if (skip !== undefined && take !== undefined) {
      query.skip = skip;
      query.take = take;
    }

    const [data, total] = await Promise.all([
      prisma.medicine.findMany(query),
      prisma.medicine.count({ where })
    ]);

    return { data, total };
  },

  // ── FIND BY ID ───────────────────────────────────────────────
  findById: async (id) => {
    return prisma.medicine.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, code: true } }
      }
    });
  },

  // ── FIND BY SKU (for duplicate check) ────────────────────────
  findBySku: async (skuCode) => {
    return prisma.medicine.findFirst({
      where: { skuCode, isDeleted: false }
    });
  },

  // ── UPDATE ───────────────────────────────────────────────────
  update: async (id, data) => {
    return prisma.medicine.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, code: true } }
      }
    });
  },

  // ── COUNT (for SKU auto-generation) ─────────────────────────
  countAll: async () => {
    return prisma.medicine.count({ where: { isDeleted: false } });
  }
};
