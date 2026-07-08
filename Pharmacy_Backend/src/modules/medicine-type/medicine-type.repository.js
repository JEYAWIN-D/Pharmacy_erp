import prisma from '../../config/prisma.js';

export const medicineTypeRepository = {
  create: async (data) => {
    return prisma.medicineType.create({ data });
  },

  findAll: async () => {
    return prisma.medicineType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  findById: async (id) => {
    return prisma.medicineType.findUnique({
      where: { id }
    });
  },

  findByName: async (name) => {
    return prisma.medicineType.findUnique({
      where: { name }
    });
  },

  update: async (id, data) => {
    return prisma.medicineType.update({
      where: { id },
      data
    });
  },

  delete: async (id) => {
    return prisma.medicineType.update({
      where: { id },
      data: { isActive: false }
    });
  }
};
