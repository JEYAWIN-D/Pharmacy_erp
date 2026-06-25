import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  medicinesAPI, categoriesAPI, manufacturersAPI, suppliersAPI, batchesAPI,
  racksAPI, warehouseAPI, purchaseAPI, prescriptionsAPI, dispensingAPI,
  billingAPI, returnsAPI, customersAPI, notificationsAPI, inventoryAPI,
  expiryAPI, coldStorageAPI, administrationAPI, outletsAPI, dashboardAPI
} from './api.js';

const DBContext = createContext(null);

// Helper: safely parse JSON from localStorage (fallback only)
const fromLS = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
};

export function DBProvider({ children }) {
  // ─── TOPOLOGY CONFIG ──────────────────────────────────────────────────────
  const [erpTopology, setErpTopology] = useState(() => localStorage.getItem('db_erp_topology') || 'MultiplePharmacies_OneWarehouse');
  const [selectedOutlet, setSelectedOutlet] = useState(() => localStorage.getItem('db_selected_outlet') || 'Main Pharmacy Branch');
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => localStorage.getItem('db_selected_warehouse') || 'Central Warehouse A');
  const warehouses = ['Central Warehouse A', 'Secondary Warehouse B'];

  useEffect(() => { localStorage.setItem('db_erp_topology', erpTopology); }, [erpTopology]);
  useEffect(() => { localStorage.setItem('db_selected_outlet', selectedOutlet); }, [selectedOutlet]);
  useEffect(() => { localStorage.setItem('db_selected_warehouse', selectedWarehouse); }, [selectedWarehouse]);

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [medicineCategories, setMedicineCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [medicines, setMedicinesState] = useState([]);
  const [batches, setBatches] = useState([]);
  const [racks, setRacks] = useState([]);
  const [medicineLocations, setMedicineLocations] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [stockTransfers, setStockTransfers] = useState([]);
  const [outletStocks, setOutletStocks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensingLogs, setDispensingLogs] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [cashRegister, setCashRegister] = useState([]);
  const [patientReturns, setPatientReturns] = useState([]);
  const [supplierReturns, setSupplierReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [supplierLedger, setSupplierLedger] = useState([]);
  const [currentTemp, setCurrentTemp] = useState(4.2);
  const [tempLogs, setTempLogs] = useState([]);

  // ─── LOADING & ERROR STATE ─────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // ─── FETCH ALL DATA ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('pharmacy_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        categoriesAPI.getAll(),
        manufacturersAPI.getAll(),
        medicinesAPI.getAll({ limit: 500 }),
        suppliersAPI.getAll({ limit: 200 }),
        batchesAPI.getAll({ limit: 500 }),
        racksAPI.getAll(),
        warehouseAPI.getStock(),
        warehouseAPI.getTransfers(),
        purchaseAPI.getAllPRs(),
        purchaseAPI.getAllPOs(),
        purchaseAPI.getAllGRNs(),
        prescriptionsAPI.getAll(),
        dispensingAPI.getAll(),
        billingAPI.getAllBills({ limit: 200 }),
        billingAPI.getRegisters(),
        returnsAPI.getAllPatient(),
        returnsAPI.getAllSupplier(),
        customersAPI.getAll(),
        notificationsAPI.getAll(),
        inventoryAPI.getLogs(),
        expiryAPI.getAlerts(),
        coldStorageAPI.getLogs(),
        coldStorageAPI.getLatest(),
        administrationAPI.getExpenses(),
        administrationAPI.getAuditLogs(),
        administrationAPI.getSupplierInvoices(),
        administrationAPI.getSupplierPayments(),
        administrationAPI.getSupplierLedger()
      ]);

      // Smart extractor: handles both flat {data:[]} and nested paginated {data:{suppliers:[], pagination:{}}}
      const getValue = (result, fallback = []) => {
        if (result.status !== 'fulfilled') return fallback;
        const v = result.value;
        if (!v) return fallback;
        // Flat array in data
        if (Array.isArray(v.data)) return v.data;
        // Nested paginated: data.suppliers / data.medicines / data.batches / etc.
        if (v.data && typeof v.data === 'object') {
          const nested = v.data.suppliers ?? v.data.medicines ?? v.data.batches ??
            v.data.categories ?? v.data.manufacturers ?? v.data.customers ??
            v.data.prescriptions ?? v.data.notifications ?? v.data.bills ?? null;
          if (Array.isArray(nested)) return nested;
        }
        // Direct array at root level
        if (Array.isArray(v.suppliers)) return v.suppliers;
        if (Array.isArray(v.medicines)) return v.medicines;
        if (Array.isArray(v.batches)) return v.batches;
        return fallback;
      };

      setMedicineCategories(getValue(results[0]));
      setManufacturers(getValue(results[1]));
      
      const rawMedicines = getValue(results[2], []);
      const mappedMedicines = rawMedicines.map(med => ({
        ...med,
        name: med.name || med.medicineName || 'Unknown',
        generic: med.generic || med.genericName || 'Unknown',
        brand: med.brand || med.brandName || 'Unknown',
        sku: med.sku || med.skuCode || 'Unknown',
        price: Number(med.price ?? med.pricePerPiece ?? 0),
        stock: Number(med.stock ?? med.stockQuantity ?? 0),
        minStock: Number(med.minStock ?? med.reorderLevel ?? 10),
        rack: med.rack || med.shelfLocation || 'A1',
        tempRequirement: med.tempRequirement || med.storageType || 'Normal',
        gstRate: Number(med.gstRate ?? med.taxPercentage ?? 12),
        rxRequired: med.rxRequired !== undefined ? med.rxRequired : !!med.requiresDoctorSlip,
        category: (typeof med.category === 'object' ? med.category?.name : med.category) || med.categoryName || 'General',
        manufacturer: (typeof med.supplier === 'object' ? med.supplier?.name : null) || med.manufacturer || med.manufacturerName || 'General',
        medicineType: med.medicineType || med.companyName || 'Tablet'
      }));
      setMedicinesState(mappedMedicines);

      setSuppliers(getValue(results[3]));
      setBatches(getValue(results[4]));
      setRacks(getValue(results[5]));
      setWarehouseStock(getValue(results[6]));
      setStockTransfers(getValue(results[7]));
      setPurchaseRequests(getValue(results[8]));
      setPurchaseOrders(getValue(results[9]));
      setGoodsReceipts(getValue(results[10]));
      setPrescriptions(getValue(results[11]));
      setDispensingLogs(getValue(results[12]));
      setSalesHistory(getValue(results[13]));
      setCashRegister(getValue(results[14]));
      setPatientReturns(getValue(results[15]));
      setSupplierReturns(getValue(results[16]));
      setCustomers(getValue(results[17]));
      setNotifications(getValue(results[18]));
      setInventoryLogs(getValue(results[19]));
      setExpiryAlerts(getValue(results[20]));
      const tempLogsData = getValue(results[21]);
      setTempLogs(tempLogsData);
      if (results[22].status === 'fulfilled' && results[22].value?.data) {
        setCurrentTemp(Number(results[22].value.data.temperature || 4.2));
      }
      setExpenses(getValue(results[23]));
      setAuditLogs(getValue(results[24]));
      setSupplierInvoices(getValue(results[25]));
      setSupplierPayments(getValue(results[26]));
      setSupplierLedger(getValue(results[27]));
    } catch (err) {
      setApiError(err.message);
      console.error('DBContext fetchAll error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const handleAuthChange = () => {
      fetchAll();
    };

    window.addEventListener('pharmacy-auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('pharmacy-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchAll]);

  // ─── SETMEDICINES WRAPPER ─────────────────────────────────────────────────
  // Kept for backward compatibility — actual mutations go through API calls
  const setMedicines = (updater) => {
    if (typeof updater === 'function') {
      setMedicinesState(prev => updater(prev));
    } else {
      setMedicinesState(updater);
    }
  };

  return (
    <DBContext.Provider value={{
      // Topology
      erpTopology, setErpTopology,
      selectedOutlet, setSelectedOutlet,
      selectedWarehouse, setSelectedWarehouse,
      warehouses,
      outletStocks, setOutletStocks,
      // Loading
      loading, apiError, refetch: fetchAll,
      // Master Data
      medicineCategories, setMedicineCategories,
      manufacturers, setManufacturers,
      medicines, setMedicines,
      batches, setBatches,
      racks, setRacks,
      medicineLocations, setMedicineLocations,
      // Warehouse
      warehouseStock, setWarehouseStock,
      stockTransfers, setStockTransfers,
      // Suppliers & Procurement
      suppliers, setSuppliers,
      purchaseRequests, setPurchaseRequests,
      purchaseOrders, setPurchaseOrders,
      goodsReceipts, setGoodsReceipts,
      // Clinical
      prescriptions, setPrescriptions,
      dispensingLogs, setDispensingLogs,
      // Billing & Payments
      salesHistory, setSalesHistory,
      cashRegister, setCashRegister,
      // Returns
      patientReturns, setPatientReturns,
      supplierReturns, setSupplierReturns,
      // Inventory & Alerts
      inventoryLogs, setInventoryLogs,
      expiryAlerts, setExpiryAlerts,
      notifications, setNotifications,
      // Customers & Finance
      customers, setCustomers,
      expenses, setExpenses,
      auditLogs, setAuditLogs,
      // Supplier Finance
      supplierInvoices, setSupplierInvoices,
      supplierPayments, setSupplierPayments,
      supplierLedger, setSupplierLedger,
      // Cold Storage
      currentTemp, setCurrentTemp,
      tempLogs, setTempLogs
    }}>
      {children}
    </DBContext.Provider>
  );
}

export function useDB() {
  const context = useContext(DBContext);
  if (!context) throw new Error('useDB must be used within a DBProvider');
  return context;
}
