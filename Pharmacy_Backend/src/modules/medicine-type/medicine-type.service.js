import { medicineTypeRepository } from './medicine-type.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const medicineTypeService = {
  create: async (data) => {
    if (!data.name) throw new AppError('Medicine type name is required', 400);
    const existing = await medicineTypeRepository.findByName(data.name.trim());
    if (existing) throw new AppError('Medicine type already exists', 400);
    return medicineTypeRepository.create({ name: data.name.trim(), description: data.description });
  },

  getAll: async () => {
    return medicineTypeRepository.findAll();
  },

  getById: async (id) => {
    const res = await medicineTypeRepository.findById(id);
    if (!res) throw new AppError('Medicine type not found', 404);
    return res;
  },

  update: async (id, data) => {
    const existingType = await medicineTypeRepository.findById(id);
    if (!existingType) throw new AppError('Medicine type not found', 404);

    if (data.name) {
      const duplicate = await medicineTypeRepository.findByName(data.name.trim());
      if (duplicate && duplicate.id !== id) {
        throw new AppError('Another medicine type with this name already exists', 400);
      }
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return medicineTypeRepository.update(id, updateData);
  },

  delete: async (id) => {
    const existing = await medicineTypeRepository.findById(id);
    if (!existing) throw new AppError('Medicine type not found', 404);
    return medicineTypeRepository.delete(id);
  }
};
