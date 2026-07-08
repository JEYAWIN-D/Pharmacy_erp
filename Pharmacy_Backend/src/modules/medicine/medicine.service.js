import { medicineRepository } from './medicine.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { SORT_FIELDS, SORT_ORDERS } from './medicine.constants.js';
import prisma from '../../config/prisma.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates that a SKU is not already used by another medicine.
 * @param {string} skuCode
 * @param {string|null} excludeId - medicine ID to exclude (for updates)
 */
const validateUniqueSku = async (skuCode, excludeId = null) => {
  if (!skuCode) return;
  const existing = await medicineRepository.findBySku(skuCode);
  if (existing && existing.id !== excludeId) {
    throw new AppError('SKU Code already exists', 409, 'DUPLICATE_SKU');
  }
};

/**
 * Validates that a given categoryId actually exists and is active.
 */
const validateCategoryExists = async (categoryId) => {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({ where: { id: categoryId, isActive: true } });
  if (!category) {
    throw new AppError('Category not found or inactive', 404, 'CATEGORY_NOT_FOUND');
  }
};

/**
 * Validates that a given supplierId actually exists and is active.
 */
const validateSupplierExists = async (supplierId) => {
  if (!supplierId) return;
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, isActive: true, isDeleted: false } });
  if (!supplier) {
    throw new AppError('Supplier not found or inactive', 404, 'SUPPLIER_NOT_FOUND');
  }
};

/**
 * Validates that a given typeId actually exists and is active.
 */
const validateTypeExists = async (typeId) => {
  if (!typeId) return;
  const mType = await prisma.medicineType.findFirst({ where: { id: typeId, isActive: true } });
  if (!mType) {
    throw new AppError('Medicine type not found or inactive', 404, 'TYPE_NOT_FOUND');
  }
};

/**
 * Auto-generate an SKU code like MED-0001 if not provided.
 */
const generateSkuCode = async () => {
  const count = await medicineRepository.countAll();
  return `MED-${String(count + 1).padStart(4, '0')}`;
};

// ── Service ───────────────────────────────────────────────────────────────────

export const medicineService = {

  /**
   * Create a new medicine record.
   */
  create: async (data, userId) => {
    // Auto-generate SKU if not provided
    if (!data.skuCode) {
      data.skuCode = await generateSkuCode();
    }

    await Promise.all([
      validateUniqueSku(data.skuCode),
      validateCategoryExists(data.categoryId),
      validateSupplierExists(data.supplierId),
      validateTypeExists(data.typeId)
    ]);

    data.createdBy = userId;
    return medicineRepository.create(data);
  },

  /**
   * List medicines with search, filter, sort, pagination.
   */
  getAll: async (params) => {
    const page  = parseInt(params.page,  10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const sortBy    = SORT_FIELDS.includes(params.sortBy) ? params.sortBy : 'createdAt';
    const sortOrder = SORT_ORDERS.includes(params.sortOrder) ? params.sortOrder : 'desc';

    let isActiveParsed = undefined;
    if (params.isActive === 'true'  || params.isActive === true)  isActiveParsed = true;
    if (params.isActive === 'false' || params.isActive === false) isActiveParsed = false;

    const { data, total } = await medicineRepository.findAll({
      search:     params.search,
      isActive:   isActiveParsed,
      categoryId: params.categoryId,
      typeId:     params.typeId,
      sortBy,
      sortOrder,
      skip,
      take: limit
    });

    return {
      medicines: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  /**
   * Get a single medicine by ID.
   */
  getById: async (id) => {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) throw new AppError('Medicine not found', 404, 'NOT_FOUND');
    return medicine;
  },

  /**
   * Full update (PUT) of a medicine record.
   */
  update: async (id, data, userId) => {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) throw new AppError('Medicine not found', 404, 'NOT_FOUND');

    await Promise.all([
      validateUniqueSku(data.skuCode, id),
      validateCategoryExists(data.categoryId),
      validateSupplierExists(data.supplierId),
      validateTypeExists(data.typeId)
    ]);

    data.updatedBy = userId;
    return medicineRepository.update(id, data);
  },

  /**
   * Soft toggle isActive status.
   */
  toggleStatus: async (id, isActive, userId) => {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) throw new AppError('Medicine not found', 404, 'NOT_FOUND');
    return medicineRepository.update(id, { isActive, updatedBy: userId });
  },

  /**
   * Soft delete: marks isDeleted = true and deactivates.
   */
  delete: async (id, userId) => {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) throw new AppError('Medicine not found', 404, 'NOT_FOUND');
    return medicineRepository.update(id, {
      isDeleted: true,
      isActive:  false,
      updatedBy: userId
    });
  },

  getStatuses: async () => {
    return prisma.medicineStatus.findMany({ orderBy: { name: 'asc' } });
  }
};
