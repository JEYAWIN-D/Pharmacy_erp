import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5002/api') + '/suppliers';

const getHeaders = () => {
  const token = localStorage.getItem('pharmacy_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = {
  get: (url, params) => axios.get(`${API}${url}`, { headers: getHeaders(), params }),
  post: (url, data) => axios.post(`${API}${url}`, data, { headers: getHeaders() }),
  put: (url, data) => axios.put(`${API}${url}`, data, { headers: getHeaders() }),
  patch: (url, data) => axios.patch(`${API}${url}`, data, { headers: getHeaders() }),
  del: (url) => axios.delete(`${API}${url}`, { headers: getHeaders() })
};

export function useSupplierController() {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({ total: 0, active: 0, preferred: 0, blacklisted: 0 });

  // Sub-entity states
  const [categories, setCategories] = useState([]);
  const [brandMappings, setBrandMappings] = useState([]);
  const [purchaseTerms, setPurchaseTerms] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [returns, setReturns] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);

  // ─── FETCH SUPPLIERS ────────────────────────────────────────────────────
  const fetchSuppliers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('', { limit: 1000, ...params });
      if (res.data?.success) {
        const list = res.data.data.suppliers || res.data.data || [];
        setSuppliers(list);
        if (res.data.data.pagination) setPagination(res.data.data.pagination);
      }
    } catch (err) { console.error('fetchSuppliers:', err); }
    finally { setLoading(false); }
  }, []);

  // ─── FETCH DASHBOARD STATS ─────────────────────────────────────────────
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await api.get('/dashboard-stats');
      if (res.data?.success) setDashboardStats(res.data.data);
    } catch (err) { console.error('fetchDashboardStats:', err); }
  }, []);

  // ─── FETCH ALL SUB-ENTITY DATA ─────────────────────────────────────────
  const fetchAllSubData = useCallback(async () => {
    try {
      const [catRes, bmRes, ptRes, phRes, invRes, payRes, ldgRes, retRes, cnRes, docRes, perfRes, poRes, medRes] = await Promise.allSettled([
        api.get('/categories'),
        api.get('/brand-mapping'),
        api.get('/purchase-terms'),
        api.get('/price-history'),
        api.get('/invoices'),
        api.get('/payments'),
        api.get('/ledger'),
        api.get('/returns'),
        api.get('/credit-notes'),
        api.get('/documents'),
        api.get('/performance'),
        api.get('/purchase-orders'),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/medicines`, { headers: getHeaders(), params: { limit: 1000 } })
      ]);

      const extract = (r) => r.status === 'fulfilled' && r.value?.data?.success ? (r.value.data.data || []) : [];
      setCategories(extract(catRes));
      setBrandMappings(extract(bmRes));
      setPurchaseTerms(extract(ptRes));
      const phData = extract(phRes);
      setPriceHistory(phData.records || phData);
      setInvoices(extract(invRes));
      setPayments(extract(payRes));
      setLedger(extract(ldgRes));
      setReturns(extract(retRes));
      setCreditNotes(extract(cnRes));
      setDocuments(extract(docRes));
      setPerformance(extract(perfRes));
      setPurchaseOrders(extract(poRes));
      if (medRes.status === 'fulfilled') {
        const meds = medRes.value?.data?.data?.medicines || medRes.value?.data?.data || [];
        setMedicinesList(meds);
      }
    } catch (err) { console.error('fetchAllSubData:', err); }
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchDashboardStats();
    fetchAllSubData();
  }, [fetchSuppliers, fetchDashboardStats, fetchAllSubData]);

  // ─── SUPPLIER CRUD ──────────────────────────────────────────────────────
  const createSupplier = async (data) => {
    const res = await api.post('', data);
    if (res.data?.success) { await fetchSuppliers(); await fetchDashboardStats(); }
    return res.data;
  };

  const updateSupplier = async (id, data) => {
    const res = await api.put(`/${id}`, data);
    if (res.data?.success) { await fetchSuppliers(); }
    return res.data;
  };

  const deleteSupplier = async (id) => {
    const res = await api.del(`/${id}`);
    if (res.data?.success) { await fetchSuppliers(); await fetchDashboardStats(); }
    return res.data;
  };

  const toggleSupplierStatus = async (id, isActive) => {
    const res = await api.patch(`/${id}/status`, { isActive });
    if (res.data?.success) { await fetchSuppliers(); }
    return res.data;
  };

  const toggleSupplierPreferred = async (id, isPreferred) => {
    const res = await api.patch(`/${id}/preferred`, { isPreferred });
    if (res.data?.success) { await fetchSuppliers(); }
    return res.data;
  };

  // ─── CATEGORIES ─────────────────────────────────────────────────────────
  const createCategory = async (data) => {
    const res = await api.post('/categories', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updateCategory = async (id, data) => {
    const res = await api.put(`/categories/${id}`, data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const deleteCategory = async (id) => {
    const res = await api.del(`/categories/${id}`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── BRAND MAPPINGS ────────────────────────────────────────────────────
  const createBrandMapping = async (data) => {
    const res = await api.post('/brand-mapping', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updateBrandMapping = async (id, data) => {
    const res = await api.put(`/brand-mapping/${id}`, data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const deleteBrandMapping = async (id) => {
    const res = await api.del(`/brand-mapping/${id}`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── PURCHASE TERMS ────────────────────────────────────────────────────
  const createPurchaseTerm = async (data) => {
    const res = await api.post('/purchase-terms', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updatePurchaseTerm = async (id, data) => {
    const res = await api.put(`/purchase-terms/${id}`, data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const deletePurchaseTerm = async (id) => {
    const res = await api.del(`/purchase-terms/${id}`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── PRICE HISTORY ─────────────────────────────────────────────────────
  const createPriceHistory = async (data) => {
    const res = await api.post('/price-history', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── INVOICES ──────────────────────────────────────────────────────────
  const createInvoice = async (data) => {
    const res = await api.post('/invoices', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── PAYMENTS ──────────────────────────────────────────────────────────
  const createPayment = async (data) => {
    const res = await api.post('/payments', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updatePayment = async (id, data) => {
    const res = await api.put(`/payments/${id}`, data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const deletePayment = async (id) => {
    const res = await api.del(`/payments/${id}`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── RETURNS ───────────────────────────────────────────────────────────
  const createReturn = async (data) => {
    const res = await api.post('/returns', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updateReturn = async (id, data) => {
    const res = await api.put(`/returns/${id}`, data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const deleteReturn = async (id) => {
    const res = await api.del(`/returns/${id}`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── CREDIT NOTES ─────────────────────────────────────────────────────
  const createCreditNote = async (data) => {
    const res = await api.post('/credit-notes', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updateCreditNote = async (id, data) => {
    const res = await api.put(`/credit-notes/${id}`, data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────
  const createDocument = async (data) => {
    const res = await api.post('/documents', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const deleteDocument = async (id) => {
    const res = await api.del(`/documents/${id}`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── PERFORMANCE ───────────────────────────────────────────────────────
  const refreshPerformance = async (supplierId) => {
    const res = await api.post(`/performance/${supplierId}/refresh`);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── PURCHASE ORDERS ──────────────────────────────────────────────────
  const createPurchaseOrder = async (data) => {
    const res = await api.post('/purchase-orders', data);
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  const updatePurchaseOrderStatus = async (id, status) => {
    const res = await api.put(`/purchase-orders/${id}/status`, { status });
    if (res.data?.success) await fetchAllSubData();
    return res.data;
  };

  // ─── REPORTS ───────────────────────────────────────────────────────────
  const getReport = async (type, params = {}) => {
    const res = await api.get(`/reports/${type}`, params);
    return res.data?.success ? res.data.data : null;
  };

  const exportCSV = async (params = {}) => {
    try {
      const res = await axios.get(`${API}/export`, { headers: getHeaders(), params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error('Export error:', err); }
  };

  return {
    loading, suppliers, pagination, selectedSupplier, setSelectedSupplier, dashboardStats,
    categories, brandMappings, purchaseTerms, priceHistory, invoices, payments, ledger,
    returns, creditNotes, documents, performance, purchaseOrders, medicinesList,
    fetchSuppliers, fetchDashboardStats, fetchAllSubData,
    createSupplier, updateSupplier, deleteSupplier, toggleSupplierStatus, toggleSupplierPreferred,
    createCategory, updateCategory, deleteCategory,
    createBrandMapping, updateBrandMapping, deleteBrandMapping,
    createPurchaseTerm, updatePurchaseTerm, deletePurchaseTerm,
    createPriceHistory, createInvoice,
    createPayment, updatePayment, deletePayment,
    createReturn, updateReturn, deleteReturn,
    createCreditNote, updateCreditNote,
    createDocument, deleteDocument,
    refreshPerformance,
    createPurchaseOrder, updatePurchaseOrderStatus,
    getReport, exportCSV
  };
}
