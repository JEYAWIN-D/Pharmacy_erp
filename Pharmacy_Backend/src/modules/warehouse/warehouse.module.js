import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── WAREHOUSE REPOSITORY ────────────────────────────────────────────────────
export const warehouseRepository = {
  findAllWarehouses: async () => prisma.warehouse.findMany({ where: { isDeleted: false } }),
  findAllStock: async (warehouseId) => prisma.warehouseStock.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: { medicine: { select: { medicineName: true, skuCode: true } }, warehouse: { select: { name: true } } }
  }),
  createWarehouse: async (data) => prisma.warehouse.create({ data }),
  upsertStock: async (warehouseId, medicineId, qty, locationBin) => prisma.warehouseStock.upsert({
    where: { warehouseId_medicineId: { warehouseId, medicineId } },
    update: { qty, locationBin },
    create: { warehouseId, medicineId, qty: qty || 0, locationBin }
  }),
  findTransfers: async () => prisma.stockTransfer.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  createTransfer: async (data) => prisma.stockTransfer.create({ data }),
  findWarehouseById: async (id) => prisma.warehouse.findFirst({ where: { id, isDeleted: false } }),
  updateWarehouse: async (id, data) => prisma.warehouse.update({ where: { id }, data })
};

// ─── WAREHOUSE SERVICE ───────────────────────────────────────────────────────
export const warehouseService = {
  getWarehouses: async () => warehouseRepository.findAllWarehouses(),

  createWarehouse: async (data) => warehouseRepository.createWarehouse(data),

  getStock: async (warehouseId) => warehouseRepository.findAllStock(warehouseId),

  updateStock: async (warehouseId, medicineId, qty, locationBin) => {
    const wh = await warehouseRepository.findWarehouseById(warehouseId);
    if (!wh) throw new AppError('Warehouse not found', 404, 'NOT_FOUND');
    return warehouseRepository.upsertStock(warehouseId, medicineId, qty, locationBin);
  },

  transfer: async (data) => {
    const { transferType, medicineId, medicineName, fromLocation, toRack, qty, transferredBy, remarks, batchNumber } = data;
    
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          transferType: transferType || 'Warehouse to Rack',
          medicineId,
          medicineName,
          fromLocation,
          toRack,
          qty,
          transferredBy,
          remarks,
          status: 'Completed'
        }
      });

      if (transferType === 'Warehouse to Rack') {
        // fromLocation = warehouseId, toRack = compartmentId
        const whStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: fromLocation, medicineId }
        });
        if (!whStock || whStock.qty < qty) throw new AppError('Insufficient stock in warehouse', 400, 'BAD_REQUEST');
        await tx.warehouseStock.update({
          where: { id: whStock.id },
          data: { qty: whStock.qty - qty }
        });

        const rackStock = await tx.medicineLocation.findFirst({
          where: { compartmentId: toRack, medicineId, batchNumber: batchNumber || null }
        });
        if (rackStock) {
          await tx.medicineLocation.update({
            where: { id: rackStock.id },
            data: { qty: rackStock.qty + qty }
          });
        } else {
          await tx.medicineLocation.create({
            data: { compartmentId: toRack, medicineId, batchNumber: batchNumber || null, qty }
          });
        }
      } else if (transferType === 'Rack to Warehouse') {
        // fromLocation = compartmentId, toRack = warehouseId
        const rackStock = await tx.medicineLocation.findFirst({
          where: { compartmentId: fromLocation, medicineId, batchNumber: batchNumber || null }
        });
        if (!rackStock || rackStock.qty < qty) throw new AppError('Insufficient stock in rack', 400, 'BAD_REQUEST');
        await tx.medicineLocation.update({
          where: { id: rackStock.id },
          data: { qty: rackStock.qty - qty }
        });

        const whStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: toRack, medicineId }
        });
        if (whStock) {
          await tx.warehouseStock.update({
            where: { id: whStock.id },
            data: { qty: whStock.qty + qty }
          });
        } else {
          await tx.warehouseStock.create({
            data: { warehouseId: toRack, medicineId, qty }
          });
        }
      }

      return transfer;
    });
  },

  getTransfers: async () => warehouseRepository.findTransfers()
};

// ─── WAREHOUSE CONTROLLER ────────────────────────────────────────────────────
export const warehouseController = {
  getWarehouses: async (req, res, next) => {
    try { const w = await warehouseService.getWarehouses(); res.json({ success: true, data: w }); } catch (e) { next(e); }
  },
  createWarehouse: async (req, res, next) => {
    try { const w = await warehouseService.createWarehouse(req.body); res.status(201).json({ success: true, data: w }); } catch (e) { next(e); }
  },
  getStock: async (req, res, next) => {
    try { const s = await warehouseService.getStock(req.query.warehouseId); res.json({ success: true, data: s }); } catch (e) { next(e); }
  },
  updateStock: async (req, res, next) => {
    try {
      const { warehouseId, medicineId, qty, locationBin } = req.body;
      const s = await warehouseService.updateStock(warehouseId, medicineId, qty, locationBin);
      res.json({ success: true, data: s });
    } catch (e) { next(e); }
  },
  transfer: async (req, res, next) => {
    try { const t = await warehouseService.transfer(req.body); res.status(201).json({ success: true, data: t }); } catch (e) { next(e); }
  },
  getTransfers: async (req, res, next) => {
    try { const t = await warehouseService.getTransfers(); res.json({ success: true, data: t }); } catch (e) { next(e); }
  }
};
