export const SKU_REGEX = /^[A-Z0-9-]{2,30}$/;

export const STORAGE_TYPES = {
  NORMAL: 'Normal',
  COLD: 'Cold',
  CONTROLLED: 'Controlled'
};

export const SORT_FIELDS = ['medicineName', 'skuCode', 'pricePerPiece', 'stockQuantity', 'createdAt'];
export const SORT_ORDERS = ['asc', 'desc'];
