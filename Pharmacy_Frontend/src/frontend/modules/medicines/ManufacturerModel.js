export const ManufacturerModel = {
  validate(data) {
    const errors = [];
    if (!data.name?.trim()) errors.push('Manufacturer name is required.');
    return { isValid: errors.length === 0, errors };
  },
  create(rawData, nextId) {
    return {
      id: nextId,
      name: rawData.name.trim(),
      country: rawData.country?.trim() || 'India',
      contactEmail: rawData.contactEmail?.trim() || 'N/A',
      phone: rawData.phone?.trim() || 'N/A'
    };
  }
};
