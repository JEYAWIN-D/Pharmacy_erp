import prisma from '../../config/prisma.js';

export const medicineRepository = {

  // ── CREATE ──────────────────────────────────────────────────
  create: async (data) => {
    return prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.create({
        data,
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true, code: true } },
          status: { select: { id: true, name: true } },
          medicineType: { select: { id: true, name: true } }
        }
      });

      // Initialize aggregated inventory
      await tx.inventory.create({
        data: {
          medicineId: medicine.id,
          totalStock: 0,
          warehouseStock: 0,
          rackStock: 0
        }
      });

      // If cold storage is required, initialize cold storage record
      if (medicine.coldStorageRequired) {
        await tx.coldStorage.create({
          data: {
            medicineId: medicine.id,
            requiredTemperature: "2-8°C",
            storagePlace: medicine.shelfLocation || "Fridge 1",
            rackFridgeLocation: medicine.shelfLocation || "Tray A",
            status: "Active"
          }
        });
      }

      return medicine;
    });
  },

  // ── FIND ALL (paginated + filtered) ─────────────────────────
  findAll: async ({ search, isActive, categoryId, typeId, supplierId, statusName, sortBy = 'createdAt', sortOrder = 'desc', skip, take }) => {
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

    if (categoryId && categoryId !== 'All') {
      where.categoryId = categoryId;
    }

    if (typeId && typeId !== 'All') {
      where.typeId = typeId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (statusName) {
      where.statusName = statusName;
    }

    const query = {
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, code: true } },
        status: { select: { id: true, name: true } },
        medicineType: { select: { id: true, name: true } },
        inventory: true
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
        supplier: { select: { id: true, name: true, code: true } },
        status: { select: { id: true, name: true } },
        medicineType: { select: { id: true, name: true } },
        inventory: true,
        coldStorageRecords: true,
        supplierMappings: true
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
    return prisma.$transaction(async (tx) => {
      const updatedMed = await tx.medicine.update({
        where: { id },
        data,
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true, code: true } },
          status: { select: { id: true, name: true } },
          medicineType: { select: { id: true, name: true } },
          inventory: true
        }
      });

      // Update cold storage record status if coldStorageRequired toggles
      if (updatedMed.coldStorageRequired) {
        const existing = await tx.coldStorage.findFirst({ where: { medicineId: id } });
        if (!existing) {
          await tx.coldStorage.create({
            data: {
              medicineId: id,
              requiredTemperature: "2-8°C",
              storagePlace: updatedMed.shelfLocation || "Fridge 1",
              rackFridgeLocation: updatedMed.shelfLocation || "Tray A",
              status: "Active"
            }
          });
        }
      }

      return updatedMed;
    });
  },

  // ── COUNT (for SKU auto-generation) ─────────────────────────
  countAll: async () => {
    return prisma.medicine.count({ where: { isDeleted: false } });
  }
};
