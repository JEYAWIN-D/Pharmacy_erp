import { validationResult } from 'express-validator';
import {
  createNewCategory,
  fetchAllCategories,
  fetchCategoryById,
  updateExistingCategory,
  removeCategory,
  toggleStatus
} from './category.service.js';
import { AppError } from '../../shared/errors/AppError.js';

const handleValidationErrors = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((item) => item.msg).join(', ');
    throw new AppError(message, 422, 'VALIDATION_ERROR');
  }
};

export const create = async (req, res, next) => {
  try {
    handleValidationErrors(req, next);
    
    const category = await createNewCategory(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const categories = await fetchAllCategories();
    
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const category = await fetchCategoryById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    handleValidationErrors(req, next);
    
    const category = await updateExistingCategory(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCategoryStatus = async (req, res, next) => {
  try {
    handleValidationErrors(req, next);
    
    const category = await toggleStatus(req.params.id, req.body.isActive);
    
    res.status(200).json({
      success: true,
      message: `Category ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await removeCategory(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
