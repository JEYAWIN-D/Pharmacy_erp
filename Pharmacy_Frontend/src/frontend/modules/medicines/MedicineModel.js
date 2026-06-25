export const MedicineModel = {
  validate(medicine) {
    const errors = [];
    if (!medicine.name?.trim()) errors.push('Name is required.');
    if (!medicine.sku?.trim()) errors.push('SKU is required.');
    if (!medicine.price || isNaN(medicine.price) || parseFloat(medicine.price) < 0) {
      errors.push('A valid positive price is required.');
    }
    if (!medicine.stock || isNaN(medicine.stock) || parseInt(medicine.stock) < 0) {
      errors.push('A valid positive stock quantity is required.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  create(rawData, nextId) {
    return {
      id: nextId,
      name: rawData.name.trim(),
      generic: rawData.generic.trim() || rawData.name.trim(),
      brand: rawData.brand.trim() || rawData.name.trim(),
      sku: rawData.sku.trim(),
      category: rawData.category || 'Analgesic',
      manufacturer: rawData.manufacturer.trim() || 'Unknown',
      price: parseFloat(rawData.price),
      stock: parseInt(rawData.stock),
      minStock: parseInt(rawData.minStock || 10),
      rack: rawData.rack || 'A1',
      tempRequirement: rawData.tempRequirement || 'Normal',
      gstRate: parseInt(rawData.gstRate || 12),
      rxRequired: !!rawData.rxRequired,
      activeBatches: 1
    };
  }
};
