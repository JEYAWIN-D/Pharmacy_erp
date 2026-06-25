export const MedicineCategoryModel = {
  validate(data) {
    const errors = [];
    if (!data.name?.trim()) errors.push('Category name is required.');
    return { isValid: errors.length === 0, errors };
  },
  create(rawData, nextId) {
    return {
      id: nextId,
      name: rawData.name.trim(),
      description: rawData.description?.trim() || ''
    };
  }
};
