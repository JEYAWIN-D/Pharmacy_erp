const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

export const SupplierModel = {
  validate(supplier) {
    const errors = [];
    if (!supplier.name?.trim()) errors.push('Supplier name is required.');
    if (!supplier.contactPerson?.trim() && !supplier.contact?.trim()) errors.push('Contact person name is required.');
    if (supplier.gstNumber && !GST_REGEX.test(supplier.gstNumber.trim())) {
      errors.push('Invalid GST format (e.g., 29AAFCS9829K1Z4).');
    }
    if (supplier.panNumber && !PAN_REGEX.test(supplier.panNumber.trim())) {
      errors.push('Invalid PAN format (e.g., ABCDE1234F).');
    }
    if (supplier.email && !EMAIL_REGEX.test(supplier.email.trim())) {
      errors.push('Invalid email address.');
    }
    if (supplier.phone) {
      const phone = supplier.phone.replace(/[\s\-\+]/g, '');
      if (phone.length >= 10 && !PHONE_REGEX.test(phone.slice(-10))) {
        errors.push('Invalid phone number (must be 10-digit Indian mobile).');
      }
    }
    return { isValid: errors.length === 0, errors };
  },

  getEmptyForm() {
    return {
      name: '', supplierType: 'Distributor', contactPerson: '', phone: '', alternatePhone: '',
      email: '', website: '', addressStreet: '', addressCity: '', addressState: '',
      addressCountry: 'India', addressPincode: '', gstNumber: '', panNumber: '',
      drugLicenseNo: '', fssaiNumber: '', creditLimit: '200000', creditPeriod: '30',
      paymentMode: 'Bank Transfer', openingBalance: '0', remarks: '', status: 'Active',
      isPreferred: false
    };
  },

  categoryOptions: [
    'Tablets', 'Capsules', 'Syrups', 'Injection', 'Drops', 'Creams',
    'Ointments', 'Surgical', 'Consumables', 'OTC', 'Ayurvedic', 'Cosmetics'
  ],

  supplierTypes: ['Distributor', 'Manufacturer', 'Wholesaler', 'Importer', 'Agent'],

  paymentModes: ['Bank Transfer', 'Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Card'],

  returnReasons: ['Near Expiry', 'Expired', 'Wrong Supply', 'Damaged', 'Quality Issue', 'Slow Moving'],

  documentTypes: ['GST Certificate', 'Drug License', 'PAN Card', 'Agreement', 'FSSAI Certificate', 'Other'],

  statusOptions: ['Active', 'Inactive', 'Blacklisted', 'Suspended']
};
