import { rackRepository } from './rack.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const rackService = {
  create: async (data) => rackRepository.create(data),
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
  }
};
