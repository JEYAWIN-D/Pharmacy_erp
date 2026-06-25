export const CustomerModel = {
  validate(customer) {
    const errors = [];
    if (!customer.name?.trim()) errors.push('Customer name is required.');
    if (!customer.phone?.trim()) errors.push('Phone number is required.');
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  create(rawData, nextId) {
    return {
      id: nextId,
      name: rawData.name.trim(),
      email: rawData.email?.trim() || 'N/A',
      phone: rawData.phone.trim(),
      loyaltyPoints: parseInt(rawData.loyaltyPoints) || 0,
      outstandingBalance: parseFloat(rawData.outstandingBalance) || 0.00
    };
  }
};
