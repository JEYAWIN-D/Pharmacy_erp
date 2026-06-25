import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryByName,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from './category.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const createNewCategory = async (data) => {
  const existingCategory = await getCategoryByName(data.name);

  if (existingCategory) {
    throw new AppError('Category with this name already exists', 409, 'CATEGORY_EXISTS');
  }

  return createCategory(data);
};

export const fetchAllCategories = async () => {
  return getCategories();
};

export const fetchCategoryById = async (id) => {
  const category = await getCategoryById(id);

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  return category;
};

export const updateExistingCategory = async (id, data) => {
  const category = await getCategoryById(id);

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  if (data.name && data.name !== category.name) {
    const existingCategory = await getCategoryByName(data.name);
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 409, 'CATEGORY_EXISTS');
    }
  }

  return updateCategory(id, data);
};

export const removeCategory = async (id) => {
  const category = await getCategoryById(id);

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  return deleteCategory(id);
};

export const toggleStatus = async (id, isActive) => {
  const category = await getCategoryById(id);

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  return toggleCategoryStatus(id, isActive);
};
