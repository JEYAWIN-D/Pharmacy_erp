export const PurchaseRequestModel = {
  validate(data) {
    const errors = [];
    if (!data.medicineId) errors.push('Please select a medicine.');
    if (!data.requestedQty || parseInt(data.requestedQty) <= 0) errors.push('Requested quantity must be a positive number.');
    if (!data.priority) errors.push('Priority is required.');
    return { isValid: errors.length === 0, errors };
  },
  create(rawData, medicines, nextId) {
    const med = medicines.find(m => String(m.id) === String(rawData.medicineId));
    return {
      id: nextId,
      medicineId: rawData.medicineId,
      medicineName: med ? (med.medicineName || med.name) : 'Unknown',
      requestedQty: parseInt(rawData.requestedQty),
      priority: rawData.priority,
      status: 'Pending',
      requestDate: new Date().toLocaleDateString('en-IN'),
      requestedBy: rawData.requestedBy || 'Staff',
      remarks: rawData.remarks?.trim() || ''
    };
  }
};
