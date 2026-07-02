// ─── API Client Utility ───────────────────────────────────────────────────────
// All API calls go through this file. Uses the JWT token from localStorage.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const getToken = () => localStorage.getItem('pharmacy_token');

const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (body) => request('POST', '/auth/register', body),
  getMe: () => request('GET', '/auth/me'),
  getRoles: () => request('GET', '/auth/roles')
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => request('GET', '/dashboard/stats'),
  getTopMedicines: () => request('GET', '/dashboard/top-medicines')
};

// ─── Medicines ────────────────────────────────────────────────────────────────
export const medicinesAPI = {
  getAll: (params = {}) => request('GET', `/medicines?${new URLSearchParams(params)}`),
  getById: (id) => request('GET', `/medicines/${id}`),
  create: (body) => request('POST', '/medicines', body),
  update: (id, body) => request('PUT', `/medicines/${id}`, body),
  delete: (id) => request('DELETE', `/medicines/${id}`)
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => request('GET', '/categories'),
  create: (body) => request('POST', '/categories', body),
  update: (id, body) => request('PUT', `/categories/${id}`, body),
  delete: (id) => request('DELETE', `/categories/${id}`)
};

// ─── Manufacturers ────────────────────────────────────────────────────────────
export const manufacturersAPI = {
  getAll: () => request('GET', '/manufacturers?limit=100'),
  create: (body) => request('POST', '/manufacturers', body),
  update: (id, body) => request('PUT', `/manufacturers/${id}`, body),
  delete: (id) => request('DELETE', `/manufacturers/${id}`)
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersAPI = {
  getAll: (params = {}) => request('GET', `/suppliers?${new URLSearchParams(params)}`),
  getById: (id) => request('GET', `/suppliers/${id}`),
  create: (body) => request('POST', '/suppliers', body),
  update: (id, body) => request('PUT', `/suppliers/${id}`, body),
  delete: (id) => request('DELETE', `/suppliers/${id}`),
  getExpiringLicenses: (days = 30) => request('GET', `/suppliers/expiring-licenses?days=${days}`)
};

// ─── Batches ──────────────────────────────────────────────────────────────────
export const batchesAPI = {
  getAll: (params = {}) => request('GET', `/batches?${new URLSearchParams(params)}`),
  getById: (id) => request('GET', `/batches/${id}`),
  create: (body) => request('POST', '/batches', body),
  update: (id, body) => request('PUT', `/batches/${id}`, body),
  delete: (id) => request('DELETE', `/batches/${id}`),
  getExpiring: (days = 30) => request('GET', `/batches/expiring?days=${days}`)
};

// ─── Racks ────────────────────────────────────────────────────────────────────
export const racksAPI = {
  getAll: () => request('GET', '/racks'),
  getById: (id) => request('GET', `/racks/${id}`),
  create: (body) => request('POST', '/racks', body),
  update: (id, body) => request('PUT', `/racks/${id}`, body),
  delete: (id) => request('DELETE', `/racks/${id}`)
};

// ─── Warehouse ────────────────────────────────────────────────────────────────
export const warehouseAPI = {
  getWarehouses: () => request('GET', '/warehouse'),
  createWarehouse: (body) => request('POST', '/warehouse', body),
  getStock: (warehouseId) => request('GET', `/warehouse/stock${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
  updateStock: (body) => request('POST', '/warehouse/stock', body),
  getTransfers: () => request('GET', '/warehouse/transfers'),
  createTransfer: (body) => request('POST', '/warehouse/transfers', body)
};

// ─── Outlets ──────────────────────────────────────────────────────────────────
export const outletsAPI = {
  getAll: () => request('GET', '/outlets'),
  create: (body) => request('POST', '/outlets', body),
  getStock: (id) => request('GET', `/outlets/${id}/stock`),
  updateStock: (body) => request('POST', '/outlets/stock', body)
};

// ─── Purchase ─────────────────────────────────────────────────────────────────
export const purchaseAPI = {
  // Purchase Requests
  getAllPRs: () => request('GET', '/purchase/requests'),
  getPR: (id) => request('GET', `/purchase/requests/${id}`),
  createPR: (body) => request('POST', '/purchase/requests', body),
  updatePR: (id, body) => request('PUT', `/purchase/requests/${id}`, body),

  // Purchase Orders
  getAllPOs: () => request('GET', '/purchase/orders'),
  getPO: (id) => request('GET', `/purchase/orders/${id}`),
  createPO: (body) => request('POST', '/purchase/orders', body),
  updatePO: (id, body) => request('PUT', `/purchase/orders/${id}`, body),
  getCompletedPOs: () => request('GET', '/purchase/orders/completed'),
  createPOFromPR: (body) => request('POST', '/purchase/orders/from-pr', body),
  sendPO: (id) => request('PUT', `/purchase/orders/${id}/send`),
  updatePOStatus: (id, body) => request('PUT', `/purchase/orders/${id}/status`, body),
  closePO: (id) => request('PUT', `/purchase/orders/${id}/close`),

  // Shipments
  getAllShipments: () => request('GET', '/purchase/shipments'),
  createShipment: (body) => request('POST', '/purchase/shipments', body),
  updateShipmentStatus: (id, status) => request('PUT', `/purchase/shipments/${id}/status`, { status }),

  // Low Stock
  getLowStock: () => request('GET', '/purchase/low-stock'),
  createPOFromLowStock: (body) => request('POST', '/purchase/orders/from-low-stock', body),

  // GRN
  getAllGRNs: () => request('GET', '/purchase/grn'),
  getGRN: (id) => request('GET', `/purchase/grn/${id}`),
  createGRN: (body) => request('POST', '/purchase/grn', body),
  getCompletedGRNs: () => request('GET', '/purchase/grn/completed'),

  // Confirm & Cancel PO
  confirmPO: (id) => request('PUT', `/purchase/orders/${id}/confirm`),
  cancelPO: (id) => request('PUT', `/purchase/orders/${id}/cancel`),
  getPOProgress: (id) => request('GET', `/purchase/orders/${id}/progress`),

  // GRN by PO
  getGRNByPOId: (poId) => request('GET', `/purchase/grn/po/${poId}`),

  // GRN Validation & Update
  validateInvoiceNumber: (supplierId, invoiceNumber, excludeGrnId = '') => 
    request('GET', `/purchase/grn/validate-invoice?supplierId=${supplierId}&invoiceNumber=${invoiceNumber}&excludeGrnId=${excludeGrnId}`),
  updateGRN: (id, body) => request('PUT', `/purchase/grn/${id}`, body),

  // Procurement History
  getProcurementHistory: () => request('GET', '/purchase/history'),

  // Stock update after GRN
  updateStockAfterGRN: (body) => request('PUT', '/purchase/stock', body)
};

// ─── Prescriptions ────────────────────────────────────────────────────────────
export const prescriptionsAPI = {
  getAll: (params = {}) => request('GET', `/prescriptions?${new URLSearchParams(params)}`),
  getById: (id) => request('GET', `/prescriptions/${id}`),
  create: (body) => request('POST', '/prescriptions', body),
  update: (id, body) => request('PUT', `/prescriptions/${id}`, body),
  delete: (id) => request('DELETE', `/prescriptions/${id}`)
};

// ─── Dispensing ───────────────────────────────────────────────────────────────
export const dispensingAPI = {
  getAll: (params = {}) => request('GET', `/dispensing?${new URLSearchParams(params)}`),
  create: (body) => request('POST', '/dispensing', body)
};

  // ─── Billing ──────────────────────────────────────────────────────────────────
export const billingAPI = {
  getAllBills: (params = {}) => request('GET', `/billing/bills?${new URLSearchParams(params)}`),
  getBill: (id) => request('GET', `/billing/bills/${id}`),
  createBill: (body) => request('POST', '/billing/bills', body),
  updateBill: (id, body) => request('PUT', `/billing/bills/${id}`, body),
  returnBill: (id, body) => request('POST', `/billing/bills/${id}/return`, body),
  addPayment: (body) => request('POST', '/billing/payments', body),
  getRegisters: () => request('GET', '/billing/cash-register'),
  openRegister: (body) => request('POST', '/billing/cash-register/open', body),
  closeRegister: (id, body) => request('PUT', `/billing/cash-register/${id}/close`, body),
  getSettings: () => request('GET', '/billing/settings'),
  updateSettings: (body) => request('PUT', '/billing/settings', body),
  bulkDeleteBills: (billIds) => request('DELETE', '/billing/bills/bulk-delete', { billIds }),
};

// ─── Sales History ────────────────────────────────────────────────────────────
export const salesHistoryAPI = {
  getHistory: (params = {}) => request('GET', `/billing/sales-history?${new URLSearchParams(params)}`),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getDaily: () => request('GET', '/billing/reports/daily'),
  getDateWise: (params = {}) => request('GET', `/billing/reports/date-wise?${new URLSearchParams(params)}`),
  getPaymentWise: (params = {}) => request('GET', `/billing/reports/payment-wise?${new URLSearchParams(params)}`),
  getMedicineWise: (params = {}) => request('GET', `/billing/reports/medicine-wise?${new URLSearchParams(params)}`),
};

// ─── Returns ──────────────────────────────────────────────────────────────────
export const returnsAPI = {
  getAllPatient: () => request('GET', '/returns/patient'),
  createPatient: (body) => request('POST', '/returns/patient', body),
  getAllSupplier: () => request('GET', '/returns/supplier'),
  createSupplier: (body) => request('POST', '/returns/supplier', body),
  updateSupplier: (id, body) => request('PUT', `/returns/supplier/${id}`, body)
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll: (params = {}) => request('GET', `/customers?${new URLSearchParams(params)}`),
  getById: (id) => request('GET', `/customers/${id}`),
  create: (body) => request('POST', '/customers', body),
  update: (id, body) => request('PUT', `/customers/${id}`, body),
  delete: (id) => request('DELETE', `/customers/${id}`)
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params = {}) => request('GET', `/notifications?${new URLSearchParams(params)}`),
  create: (body) => request('POST', '/notifications', body),
  resolve: (id) => request('PUT', `/notifications/${id}/resolve`, {}),
  resolveAll: () => request('PUT', '/notifications/resolve-all', {}),
  getUnresolvedCount: () => request('GET', '/notifications/unresolved-count')
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getLogs: (params = {}) => request('GET', `/inventory/logs?${new URLSearchParams(params)}`),
  adjust: (body) => request('POST', '/inventory/adjust', body)
};

// ─── Expiry ───────────────────────────────────────────────────────────────────
export const expiryAPI = {
  getAlerts: (params = {}) => request('GET', `/expiry/alerts?${new URLSearchParams(params)}`),
  refreshAlerts: () => request('POST', '/expiry/alerts/refresh', {}),
  updateAlert: (id, body) => request('PUT', `/expiry/alerts/${id}`, body)
};

// ─── Cold Storage ─────────────────────────────────────────────────────────────
export const coldStorageAPI = {
  getLogs: () => request('GET', '/cold-storage/logs'),
  getLatest: () => request('GET', '/cold-storage/latest'),
  record: (body) => request('POST', '/cold-storage/record', body)
};

// ─── Administration ───────────────────────────────────────────────────────────
export const administrationAPI = {
  getAuditLogs: (params = {}) => request('GET', `/administration/audit-logs?${new URLSearchParams(params)}`),
  createAuditLog: (body) => request('POST', '/administration/audit-logs', body),
  getExpenses: () => request('GET', '/administration/expenses'),
  createExpense: (body) => request('POST', '/administration/expenses', body),
  updateExpense: (id, body) => request('PUT', `/administration/expenses/${id}`, body),
  deleteExpense: (id) => request('DELETE', `/administration/expenses/${id}`),
  getSupplierInvoices: (params = {}) => request('GET', `/administration/supplier-invoices?${new URLSearchParams(params)}`),
  createSupplierInvoice: (body) => request('POST', '/administration/supplier-invoices', body),
  getSupplierPayments: (params = {}) => request('GET', `/administration/supplier-payments?${new URLSearchParams(params)}`),
  createSupplierPayment: (body) => request('POST', '/administration/supplier-payments', body),
  getSupplierLedger: (params = {}) => request('GET', `/administration/supplier-ledger?${new URLSearchParams(params)}`),
  createSupplierLedger: (body) => request('POST', '/administration/supplier-ledger', body)
};

// ─── HR Management ────────────────────────────────────────────────────────────
export const hrAPI = {
  getDashboard: () => request('GET', '/hr/dashboard'),

  getDepartments: () => request('GET', '/hr/departments'),
  createDepartment: (body) => request('POST', '/hr/departments', body),
  updateDepartment: (id, body) => request('PUT', `/hr/departments/${id}`, body),
  deleteDepartment: (id) => request('DELETE', `/hr/departments/${id}`),

  getDesignations: () => request('GET', '/hr/designations'),
  createDesignation: (body) => request('POST', '/hr/designations', body),
  updateDesignation: (id, body) => request('PUT', `/hr/designations/${id}`, body),
  deleteDesignation: (id) => request('DELETE', `/hr/designations/${id}`),

  getEmployees: () => request('GET', '/hr/employees'),
  getEmployeeById: (id) => request('GET', `/hr/employees/${id}`),
  createEmployee: (body) => request('POST', '/hr/employees', body),
  updateEmployee: (id, body) => request('PUT', `/hr/employees/${id}`, body),
  deleteEmployee: (id) => request('DELETE', `/hr/employees/${id}`),

  getShifts: () => request('GET', '/hr/shifts'),
  createShift: (body) => request('POST', '/hr/shifts', body),
  updateShift: (id, body) => request('PUT', `/hr/shifts/${id}`, body),
  deleteShift: (id) => request('DELETE', `/hr/shifts/${id}`),
  assignShift: (body) => request('POST', '/hr/shifts/assign', body),

  checkIn: (body) => request('POST', '/hr/attendance/check-in', body),
  checkOut: (body) => request('POST', '/hr/attendance/check-out', body),
  getAttendance: (params = {}) => request('GET', `/hr/attendance?${new URLSearchParams(params)}`),

  applyLeave: (body) => request('POST', '/hr/leaves', body),
  getLeaves: (params = {}) => request('GET', `/hr/leaves?${new URLSearchParams(params)}`),
  updateLeaveStatus: (id, body) => request('PUT', `/hr/leaves/${id}/status`, body),

  generatePayroll: (body) => request('POST', '/hr/payrolls', body),
  getPayrolls: (params = {}) => request('GET', `/hr/payrolls?${new URLSearchParams(params)}`),
  getPayrollById: (id) => request('GET', `/hr/payrolls/${id}`),

  uploadDocument: (body) => request('POST', '/hr/documents', body),
  deleteDocument: (id) => request('DELETE', `/hr/documents/${id}`)
};
