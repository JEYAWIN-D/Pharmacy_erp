import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── WAREHOUSE REPOSITORY ────────────────────────────────────────────────────
export const warehouseRepository = {
  findAllWarehouses: async () => prisma.warehouse.findMany({ where: { isDeleted: false } }),
  findAllStock: async (warehouseId) => prisma.warehouseStock.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: {
      medicine: { select: { medicineName: true, skuCode: true, category: { select: { name: true } } } },
      warehouse: { select: { name: true } }
    },
    orderBy: { receivedDate: 'desc' }
  }),
  createWarehouse: async (data) => prisma.warehouse.create({ data }),
  upsertStock: async (warehouseId, medicineId, qty, locationBin, batchNumber = "") => prisma.warehouseStock.upsert({
    where: { warehouseId_medicineId_batchNumber: { warehouseId, medicineId, batchNumber } },
    update: { qty, locationBin },
    create: { warehouseId, medicineId, batchNumber, qty: qty || 0, locationBin }
  }),
  findTransfers: async () => prisma.stockMovement.findMany({
    include: { medicine: { select: { medicineName: true, skuCode: true } } },
    orderBy: { movedDate: 'desc' },
    take: 100
  }),
  findWarehouseById: async (id) => prisma.warehouse.findFirst({ where: { id, isDeleted: false } }),
  updateWarehouse: async (id, data) => prisma.warehouse.update({ where: { id }, data })
};

// ─── WAREHOUSE SERVICE ───────────────────────────────────────────────────────
export const warehouseService = {
  getWarehouses: async () => warehouseRepository.findAllWarehouses(),

  createWarehouse: async (data) => warehouseRepository.createWarehouse(data),

  getStock: async (warehouseId) => {
    const stockRecords = await warehouseRepository.findAllStock(warehouseId);
    
    // Enrich with dynamic movement status
    const enriched = [];
    for (const record of stockRecords) {
      const rackQtyAgg = await prisma.rackStock.aggregate({
        where: { medicineId: record.medicineId, batchNumber: record.batchNumber || "" },
        _sum: { qty: true }
      });
      const rackQty = rackQtyAgg._sum.qty || 0;
      
      let movementStatus = "In warehouse";
      if (record.qty === 0 && rackQty > 0) {
        movementStatus = "Moved to rack";
      } else if (record.qty > 0 && rackQty > 0) {
        movementStatus = "Partially moved to rack";
      }
      
      enriched.push({
        ...record,
        movementStatus,
        rackQty
      });
    }
    return enriched;
  },

  updateStock: async (warehouseId, medicineId, qty, locationBin, batchNumber = "") => {
    const wh = await warehouseRepository.findWarehouseById(warehouseId);
    if (!wh) throw new AppError('Warehouse not found', 404, 'NOT_FOUND');
    return warehouseRepository.upsertStock(warehouseId, medicineId, qty, locationBin, batchNumber);
  },

  transfer: async (data) => {
    const { transferType, medicineId, fromLocation, toRack, qty, transferredBy, remarks, batchNumber } = data;
    const batchNo = batchNumber || "";
    
    return prisma.$transaction(async (tx) => {
      // 1. Create StockMovement log
      const movement = await tx.stockMovement.create({
        data: {
          medicineId,
          batchNumber: batchNo,
          warehouseId: transferType === 'Warehouse to Rack' ? fromLocation : toRack,
          rackId: transferType === 'Warehouse to Rack' ? toRack : fromLocation,
          qty,
          movedBy: transferredBy || 'Staff',
          transferType: transferType || 'Warehouse to Rack',
          remarks: remarks || '',
          status: 'Completed'
        }
      });

      if (transferType === 'Warehouse to Rack') {
        // Decrement Warehouse Stock
        const whStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: fromLocation, medicineId, batchNumber: batchNo }
        });
        if (!whStock || whStock.qty < qty) {
          throw new AppError(`Insufficient stock in warehouse. Available: ${whStock ? whStock.qty : 0}`, 400);
        }
        await tx.warehouseStock.update({
          where: { id: whStock.id },
          data: { qty: whStock.qty - qty }
        });

        // Resolve parent rack and compartment ID (toRack from frontend contains the compartment ID)
        const destCompId = toRack;
        const comp = await tx.compartment.findFirst({ where: { id: destCompId } });
        const parentRackId = comp ? comp.rackId : destCompId;

        // Increment Compartment Stock (medicineLocation)
        const medLoc = await tx.medicineLocation.findFirst({
          where: { compartmentId: destCompId, medicineId, batchNumber: batchNo || null }
        });
        if (medLoc) {
          await tx.medicineLocation.update({
            where: { id: medLoc.id },
            data: { qty: medLoc.qty + qty }
          });
        } else {
          await tx.medicineLocation.create({
            data: { compartmentId: destCompId, medicineId, batchNumber: batchNo || null, qty, unit: 'Boxes' }
          });
        }

        // Increment Rack Stock
        const rackStock = await tx.rackStock.findFirst({
          where: { rackId: parentRackId, medicineId, batchNumber: batchNo }
        });
        if (rackStock) {
          await tx.rackStock.update({
            where: { id: rackStock.id },
            data: { qty: rackStock.qty + qty }
          });
        } else {
          await tx.rackStock.create({
            data: { rackId: parentRackId, medicineId, batchNumber: batchNo, qty }
          });
        }

        // Update aggregated Inventory
        await tx.inventory.upsert({
          where: { medicineId },
          update: {
            warehouseStock: { decrement: qty },
            rackStock: { increment: qty }
          },
          create: {
            medicineId,
            totalStock: qty,
            warehouseStock: 0,
            rackStock: qty
          }
        });

      } else if (transferType === 'Rack to Warehouse') {
        // Resolve parent rack and compartment ID (fromLocation contains the compartment ID)
        const sourceCompId = fromLocation;
        const comp = await tx.compartment.findFirst({ where: { id: sourceCompId } });
        const parentRackId = comp ? comp.rackId : sourceCompId;

        // Decrement Compartment Stock
        const medLoc = await tx.medicineLocation.findFirst({
          where: { compartmentId: sourceCompId, medicineId, batchNumber: batchNo || null }
        });
        if (!medLoc || medLoc.qty < qty) {
          throw new AppError(`Insufficient stock in compartment. Available: ${medLoc ? medLoc.qty : 0}`, 400);
        }
        await tx.medicineLocation.update({
          where: { id: medLoc.id },
          data: { qty: medLoc.qty - qty }
        });

        // Decrement Rack Stock
        const rackStock = await tx.rackStock.findFirst({
          where: { rackId: parentRackId, medicineId, batchNumber: batchNo }
        });
        if (rackStock) {
          await tx.rackStock.update({
            where: { id: rackStock.id },
            data: { qty: Math.max(0, rackStock.qty - qty) }
          });
        }

        // Increment Warehouse Stock
        const whStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: toRack, medicineId, batchNumber: batchNo }
        });
        if (whStock) {
          await tx.warehouseStock.update({
            where: { id: whStock.id },
            data: { qty: whStock.qty + qty }
          });
        } else {
          await tx.warehouseStock.create({
            data: { warehouseId: toRack, medicineId, batchNumber: batchNo, qty }
          });
        }

        // Update aggregated Inventory
        await tx.inventory.upsert({
          where: { medicineId },
          update: {
            warehouseStock: { increment: qty },
            rackStock: { decrement: qty }
          },
          create: {
            medicineId,
            totalStock: qty,
            warehouseStock: qty,
            rackStock: 0
          }
        });
      }

      // Sync the main Medicine stock quantity just in case
      const totalInv = await tx.inventory.findUnique({ where: { medicineId } });
      if (totalInv) {
        await tx.medicine.update({
          where: { id: medicineId },
          data: { stockQuantity: totalInv.totalStock }
        });
      }

      return movement;
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
      const { warehouseId, medicineId, qty, locationBin, batchNumber } = req.body;
      const s = await warehouseService.updateStock(warehouseId, medicineId, qty, locationBin, batchNumber);
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
