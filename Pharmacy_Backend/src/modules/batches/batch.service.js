import { batchRepository } from './batch.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const batchService = {
  create: async (data) => {
    // Auto-update stock on medicine
    return batchRepository.create(data);
  },

  getAll: async (params) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const { data, total } = await batchRepository.findAll({
      medicineId: params.medicineId, status: params.status, skip, take: limit
    });
    return { batches: data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  getById: async (id) => {
    const b = await batchRepository.findById(parseInt(id));
    if (!b) throw new AppError('Batch not found', 404, 'NOT_FOUND');
    return b;
  },

  update: async (id, data) => {
    const b = await batchRepository.findById(parseInt(id));
    if (!b) throw new AppError('Batch not found', 404, 'NOT_FOUND');
    return batchRepository.update(parseInt(id), data);
  },

  delete: async (id) => {
    const b = await batchRepository.findById(parseInt(id));
    if (!b) throw new AppError('Batch not found', 404, 'NOT_FOUND');
    return batchRepository.update(parseInt(id), { isDeleted: true, status: 'Blocked' });
  },

  getExpiring: async (days = 30) => batchRepository.findExpiring(days)
};
