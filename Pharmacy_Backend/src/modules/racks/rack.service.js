import { rackRepository } from './rack.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const rackService = {
  create: async (data) => {
    const rackId = data.id || data.code;
    return rackRepository.executeTransaction(async (tx) => {
      const rack = await tx.rack.create({ data });
      const suffixes = ['1', '2', '3', '4'];
      const compCapacity = Math.floor((data.maxCapacity || 500) / 4);
      for (const suffix of suffixes) {
        const compId = `${rackId}${suffix}`;
        await tx.compartment.create({
          data: {
            id: compId,
            rackId: rack.id,
            name: compId,
            description: `Compartment ${compId} for Rack ${rackId}`
          }
        });
      }
      return rack;
    });
  },
  getAll: async () => rackRepository.findAll(),
  getById: async (id) => {
    const r = await rackRepository.findById(id);
    if (!r) throw new AppError('Rack not found', 404, 'NOT_FOUND');
    return r;
  },
  update: async (id, data) => {
    const r = await rackRepository.findById(id);
    if (!r) throw new AppError('Rack not found', 404, 'NOT_FOUND');
    return rackRepository.update(id, data);
  },
  delete: async (id) => {
    const r = await rackRepository.findById(id);
    if (!r) throw new AppError('Rack not found', 404, 'NOT_FOUND');
    return rackRepository.update(id, { isDeleted: true });
  },
  createCompartment: async (rackId, data) => {
    const r = await rackRepository.findById(rackId);
    if (!r) throw new AppError('Rack not found', 404, 'NOT_FOUND');
    return rackRepository.createCompartment({ ...data, rackId });
  },
  transferStock: async (data) => {
    // Rack to Rack transfer logic
    const { sourceCompId, destCompId, medicineId, medicineName, qty, transferredBy, batchNumber, remarks } = data;
    
    return rackRepository.executeTransaction(async (tx) => {
      // 1. Deduct from source
      await rackRepository.updateMedicineLocation(tx, sourceCompId, medicineId, -qty, batchNumber);
      // 2. Add to dest
      await rackRepository.updateMedicineLocation(tx, destCompId, medicineId, qty, batchNumber);
      
      // 3. Log Transfer
      return tx.stockTransfer.create({
        data: {
          transferType: 'Rack to Rack',
          medicineId,
          medicineName,
          fromLocation: sourceCompId,
          toRack: destCompId,
          qty,
          transferredBy,
          remarks,
          status: 'Completed'
        }
      });
    });
  },
  allocateStock: async (data) => {
    const { compartmentId, medicineId, qty, batchNumber, unit } = data;
    const r = await rackRepository.findById(data.rackId || 'A1').catch(() => null); // dummy fallback
    return rackRepository.executeTransaction(async (tx) => {
      const existing = await tx.medicineLocation.findFirst({
        where: { compartmentId, medicineId, batchNumber: batchNumber || null }
      });
      if (existing) {
        return tx.medicineLocation.update({
          where: { id: existing.id },
          data: { qty: existing.qty + qty }
        });
      } else {
        return tx.medicineLocation.create({
          data: { compartmentId, medicineId, batchNumber: batchNumber || null, qty, unit: unit || 'Boxes' }
        });
      }
    });
  }
};
