export const SupplierModel = {
  validate(supplier) {
    const errors = [];
    if (!supplier.name?.trim()) errors.push('Company name is required.');
    if (!supplier.contact?.trim()) errors.push('Liaison contact name is required.');
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  create(rawData, nextId) {
    return {
      id: nextId,
      name: rawData.name.trim(),
      contact: rawData.contact.trim(),
      phone: rawData.phone.trim() || 'N/A',
      email: rawData.email.trim() || 'N/A',
      paymentStatus: 'Paid',
      returnsCount: 0,
      balanceDue: 0.00
    };
  }
};
