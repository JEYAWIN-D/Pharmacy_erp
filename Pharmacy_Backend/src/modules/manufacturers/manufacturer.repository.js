import prisma from '../../config/prisma.js';

export const manufacturerRepository = {
  create: async (data) => prisma.manufacturer.create({ data }),

  findAll: async ({ search, isActive, sortBy = 'name', sortOrder = 'asc', skip, take }) => {
    const where = { isDeleted: false };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } }
    ];
    if (isActive !== undefined) where.isActive = isActive;
    const query = { where, orderBy: { [sortBy]: sortOrder } };
    if (skip !== undefined && take !== undefined) { query.skip = skip; query.take = take; }
    const [data, total] = await Promise.all([
      prisma.manufacturer.findMany(query),
      prisma.manufacturer.count({ where })
    ]);
    return { data, total };
  },

  findById: async (id) => prisma.manufacturer.findFirst({ where: { id, isDeleted: false } }),

  update: async (id, data) => prisma.manufacturer.update({ where: { id }, data }),

  countAll: async () => prisma.manufacturer.count({ where: { isDeleted: false } })
};
