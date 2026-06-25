import { manufacturerRepository } from './manufacturer.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const manufacturerService = {
  create: async (data, userId) => {
    data.createdBy = userId;
    return manufacturerRepository.create(data);
  },

  getAll: async (params) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 100;
    const skip = (page - 1) * limit;
    let isActiveParsed = undefined;
    if (params.isActive === 'true') isActiveParsed = true;
    if (params.isActive === 'false') isActiveParsed = false;
    const { data, total } = await manufacturerRepository.findAll({
      search: params.search, isActive: isActiveParsed,
      sortBy: params.sortBy || 'name', sortOrder: params.sortOrder || 'asc',
      skip, take: limit
    });
    return { manufacturers: data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  getById: async (id) => {
    const m = await manufacturerRepository.findById(id);
    if (!m) throw new AppError('Manufacturer not found', 404, 'NOT_FOUND');
    return m;
  },

  update: async (id, data, userId) => {
    const m = await manufacturerRepository.findById(id);
    if (!m) throw new AppError('Manufacturer not found', 404, 'NOT_FOUND');
    data.updatedBy = userId;
    return manufacturerRepository.update(id, data);
  },

  delete: async (id, userId) => {
    const m = await manufacturerRepository.findById(id);
    if (!m) throw new AppError('Manufacturer not found', 404, 'NOT_FOUND');
    return manufacturerRepository.update(id, { isDeleted: true, isActive: false, updatedBy: userId });
  }
};
