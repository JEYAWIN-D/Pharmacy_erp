import { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';
import { SupplierModel } from './SupplierModel';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('pharmacy_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useSupplierController() {
  const { 
    auditLogs, setAuditLogs
  } = useDB();

  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [supplierLedger, setSupplierLedger] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Supplier Selection state
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // New Supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    code: '',
    gstNumber: '',
    drugLicenseNo: ''
  });

  // New Supplier Invoice form state
  const [invoiceSupplierId, setInvoiceSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceVehicleNumber, setInvoiceVehicleNumber] = useState('');
  const [invoiceDeliveredBy, setInvoiceDeliveredBy] = useState('');
  const [invoiceReceivedBy, setInvoiceReceivedBy] = useState('');
  const [invoiceContactNumber, setInvoiceContactNumber] = useState('');
  const [invoiceRemarks, setInvoiceRemarks] = useState('');

  // New Supplier Payment form state
  const [paymentSupplierId, setPaymentSupplierId] = useState('');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Local storage lists for returns and documents (persistent mocks)
  const [supplierReturns, setSupplierReturns] = useState(() => {
    const saved = localStorage.getItem('supplier_returns');
    if (saved) return JSON.parse(saved);
    // Pre-populate some returns for visual compliance
    return [
      { id: 'RET-1001', supplierId: 'dummy- Novartis', date: new Date(Date.now() - 86400000 * 3).toLocaleString(), medicineName: 'Novamox 500mg', batchNumber: 'B-NVMX02', qty: 25, reason: 'Expired', amount: 375.00, status: 'Credit Note Issued' },
      { id: 'RET-1002', supplierId: 'dummy- Novartis', date: new Date(Date.now() - 86400000 * 10).toLocaleString(), medicineName: 'Amoxicillin 250mg', batchNumber: 'B-AMX984', qty: 10, reason: 'Damaged', amount: 120.00, status: 'Completed' }
    ];
  });

  const [supplierDocuments, setSupplierDocuments] = useState(() => {
    const saved = localStorage.getItem('supplier_documents');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'DOC-201', supplierId: 'all', name: 'GST Registration Certificate', fileName: 'GST_Certificate_2026.pdf', uploadedDate: '2026-01-10', status: 'Active' },
      { id: 'DOC-202', supplierId: 'all', name: 'Drug Distribution License', fileName: 'Drug_License_DL-4929.pdf', uploadedDate: '2026-02-15', status: 'Active' },
      { id: 'DOC-203', supplierId: 'all', name: 'Supplier Agreement Contract', fileName: 'Agreement_Contract_Signed.pdf', uploadedDate: '2026-03-01', status: 'Active' }
    ];
  });

  // Sync back to localStorage
  useEffect(() => {
    localStorage.setItem('supplier_returns', JSON.stringify(supplierReturns));
  }, [supplierReturns]);

  useEffect(() => {
    localStorage.setItem('supplier_documents', JSON.stringify(supplierDocuments));
  }, [supplierDocuments]);

  // Helper to map and compute supplier fields
  const mapBackendSupplier = (s, currentInvoices = supplierInvoices, currentPayments = supplierPayments, currentReturns = supplierReturns) => {
    const sInvoices = currentInvoices.filter(inv => inv.supplierId === s.id);
    const sPayments = currentPayments.filter(pay => pay.supplierId === s.id);
    const sReturns = currentReturns.filter(ret => ret.supplierId === s.id || ret.supplierId === `dummy-${s.name}`);

    const totalInvoices = sInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalPayments = sPayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    const totalReturns = sReturns.reduce((sum, ret) => sum + parseFloat(ret.amount), 0);

    const balanceDue = Math.max(0, totalInvoices - totalPayments - totalReturns);
    const paymentStatus = balanceDue === 0 ? 'Paid' : 'Credit';

    return {
      id: s.id,
      name: s.name,
      contact: s.contactPerson || 'N/A',
      phone: s.phone || 'N/A',
      email: s.email || 'N/A',
      code: s.code || `SUP-${s.name.slice(0, 3).toUpperCase()}`,
      gstNumber: s.gstNumber || '29AAFCS9829K1Z4',
      drugLicenseNo: s.drugLicenseNo || 'DL-BLR-482942',
      isActive: s.isActive !== undefined ? s.isActive : true,
      balanceDue,
      paymentStatus,
      totalPurchase: totalInvoices,
      totalPaid: totalPayments,
      totalReturnsAmount: totalReturns,
      returnsCount: sReturns.length,
      creditLimit: s.creditLimit !== undefined && s.creditLimit !== null ? parseFloat(s.creditLimit) : 200000.00
    };
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [invRes, payRes, ldgRes, supRes, poRes, medRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/suppliers/invoices`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/suppliers/payments`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/suppliers/ledger`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/suppliers`, { headers: getAuthHeader(), params: { limit: 1000 } }),
        axios.get(`${API_BASE_URL}/suppliers/purchase-orders`, { headers: getAuthHeader() }).catch(() => ({ data: { success: true, data: [] } })),
        axios.get(`${API_BASE_URL}/medicines`, { headers: getAuthHeader(), params: { limit: 1000 } }).catch(() => ({ data: { success: true, data: [] } }))
      ]);

      let formattedInvoices = [];
      let formattedPayments = [];

      if (invRes.data && invRes.data.success) {
        formattedInvoices = invRes.data.data.map(inv => ({
          ...inv,
          amount: parseFloat(inv.amount),
          date: inv.date ? new Date(inv.date).toLocaleString() : ''
        }));
        setSupplierInvoices(formattedInvoices);
      }
      if (payRes.data && payRes.data.success) {
        formattedPayments = payRes.data.data.map(pay => ({
          ...pay,
          amount: parseFloat(pay.amount),
          date: pay.date ? new Date(pay.date).toLocaleString() : ''
        }));
        setSupplierPayments(formattedPayments);
      }
      if (ldgRes.data && ldgRes.data.success) {
        setSupplierLedger(ldgRes.data.data.map(ldg => ({
          ...ldg,
          amount: parseFloat(ldg.amount),
          date: ldg.date ? new Date(ldg.date).toLocaleString() : ''
        })));
      }
      if (poRes && poRes.data && poRes.data.success) {
        setPurchaseOrders(poRes.data.data.map(po => ({
          ...po,
          total: parseFloat(po.total),
          orderDate: po.orderDate ? new Date(po.orderDate).toLocaleString() : ''
        })));
      }
      if (medRes && medRes.data && medRes.data.success) {
        const meds = medRes.data.data.medicines || medRes.data.data || [];
        setMedicinesList(meds);
      }
      if (supRes.data && supRes.data.success) {
        const list = supRes.data.data.suppliers || [];
        const mappedList = list.map(s => mapBackendSupplier(s, formattedInvoices, formattedPayments));
        setSuppliersList(mappedList);

        // Keep selectedSupplier reference updated
        if (selectedSupplier) {
          const updatedSelected = mappedList.find(s => s.id === selectedSupplier.id);
          if (updatedSelected) {
            setSelectedSupplier(updatedSelected);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch supplier database data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    const validation = SupplierModel.validate(newSupplier);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    try {
      const payload = {
        name: newSupplier.name.trim(),
        contactPerson: newSupplier.contact.trim(),
        phone: newSupplier.phone.trim(),
        email: newSupplier.email.trim(),
        code: newSupplier.code.trim() || `SUP-${newSupplier.name.slice(0, 3).toUpperCase()}`,
        gstNumber: newSupplier.gstNumber.trim() || '29AAFCS9829K1Z4',
        drugLicenseNo: newSupplier.drugLicenseNo.trim() || 'DL-BLR-482942'
      };

      const response = await axios.post(`${API_BASE_URL}/suppliers`, payload, {
        headers: getAuthHeader()
      });

      if (response.data && response.data.success) {
        alert('Supplier profile logged successfully in supplier_master.');
        setNewSupplier({ name: '', contact: '', phone: '', email: '', code: '', gstNumber: '', drugLicenseNo: '' });
        fetchAllData();
      } else {
        alert(response.data.message || 'Failed to add supplier.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to connect to backend.');
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    const supId = invoiceSupplierId;
    const amt = parseFloat(invoiceAmount);
    if (!invoiceSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Please enter an invoice number.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const targetSupplier = suppliersList.find(s => s.id === supId);
    if (!targetSupplier) return;

    try {
      const payload = {
        supplierId: supId,
        invoiceNumber: invoiceNumber.trim(),
        amount: amt,
        vehicleNumber: invoiceVehicleNumber.trim() || 'N/A',
        deliveredBy: invoiceDeliveredBy.trim() || 'N/A',
        receivedBy: invoiceReceivedBy.trim() || 'N/A',
        contactNumber: invoiceContactNumber.trim() || 'N/A',
        remarks: invoiceRemarks.trim() || 'N/A',
        status: 'Unpaid'
      };

      const response = await axios.post(`${API_BASE_URL}/suppliers/invoices`, payload, {
        headers: getAuthHeader()
      });

      if (response.data && response.data.success) {
        setAuditLogs([{
          id: `LOG-${Date.now().toString().slice(-3)}`,
          timestamp: new Date().toLocaleString(),
          user: 'Admin',
          action: 'Supplier Invoice Logged',
          details: `Registered invoice ${invoiceNumber.trim()} (₹ ${amt.toFixed(2)}) for supplier ${targetSupplier.name}`
        }, ...auditLogs]);

        alert('Supplier invoice recorded. Balance due updated.');
        setInvoiceSupplierId('');
        setInvoiceNumber('');
        setInvoiceAmount('');
        setInvoiceVehicleNumber('');
        setInvoiceDeliveredBy('');
        setInvoiceReceivedBy('');
        setInvoiceContactNumber('');
        setInvoiceRemarks('');
        
        await fetchAllData();
      } else {
        alert(response.data.message || 'Failed to add supplier invoice.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to record supplier invoice.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const supId = paymentSupplierId;
    const amt = parseFloat(paymentAmount);
    if (!paymentSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (!paymentRefNumber.trim()) {
      alert('Please enter a payment reference number.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const targetSupplier = suppliersList.find(s => s.id === supId);
    if (!targetSupplier) return;

    try {
      const payload = {
        supplierId: supId,
        referenceNumber: paymentRefNumber.trim(),
        amount: amt,
        method: paymentMethod,
        remarks: paymentRemarks.trim() || 'N/A'
      };

      const response = await axios.post(`${API_BASE_URL}/suppliers/payments`, payload, {
        headers: getAuthHeader()
      });

      if (response.data && response.data.success) {
        setAuditLogs([{
          id: `LOG-${Date.now().toString().slice(-3)}`,
          timestamp: new Date().toLocaleString(),
          user: 'Admin',
          action: 'Supplier Payment Recorded',
          details: `Paid ₹ ${amt.toFixed(2)} to supplier ${targetSupplier.name} (Ref: ${paymentRefNumber.trim()})`
        }, ...auditLogs]);

        alert('Supplier payment recorded. Balance due updated.');
        setPaymentSupplierId('');
        setPaymentRefNumber('');
        setPaymentAmount('');
        setPaymentRemarks('');
        
        await fetchAllData();
      } else {
        alert(response.data.message || 'Failed to record supplier payment.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to record supplier payment.');
    }
  };

  // Add Return Transaction helper
  const handleAddReturn = (supId, returnItem) => {
    const newRet = {
      id: `RET-${Math.floor(10000 + Math.random() * 90000)}`,
      supplierId: supId,
      date: new Date().toLocaleString(),
      medicineName: returnItem.medicineName,
      batchNumber: returnItem.batchNumber,
      qty: parseInt(returnItem.qty),
      reason: returnItem.reason,
      amount: parseFloat(returnItem.amount),
      status: 'Credit Note Issued'
    };

    const nextReturns = [newRet, ...supplierReturns];
    setSupplierReturns(nextReturns);

    // Add to audit logs
    setAuditLogs([{
      id: `LOG-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toLocaleString(),
      user: 'Admin',
      action: 'Supplier Return Logged',
      details: `Processed return of ${returnItem.qty} units of ${returnItem.medicineName} (Credit: ₹${returnItem.amount})`
    }, ...auditLogs]);

    // Also simulate adding a return entry in the local supplier ledger state
    const newLedgerEntry = {
      id: `LDG-RET-${Date.now().toString().slice(-4)}`,
      supplierId: supId,
      type: 'Return',
      amount: parseFloat(returnItem.amount),
      remarks: `Goods Returned: ${returnItem.medicineName} (${returnItem.reason})`,
      date: new Date().toLocaleString()
    };
    setSupplierLedger(prev => [newLedgerEntry, ...prev]);

    fetchAllData();
  };

  // Add Document upload helper
  const handleUploadDocument = (supId, docName, fileName) => {
    const newDoc = {
      id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: supId,
      name: docName,
      fileName: fileName,
      uploadedDate: new Date().toISOString().slice(0, 10),
      status: 'Active'
    };
    setSupplierDocuments(prev => [newDoc, ...prev]);
  };

  const handleAddPurchaseOrder = async (poData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/suppliers/purchase-orders`, poData, {
        headers: getAuthHeader()
      });
      if (response.data && response.data.success) {
        alert('Purchase Order logged successfully.');
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create Purchase Order.');
    }
    return false;
  };

  const handleUpdatePurchaseOrderStatus = async (poId, status) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/suppliers/purchase-orders/${poId}/status`, { status }, {
        headers: getAuthHeader()
      });
      if (response.data && response.data.success) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update Purchase Order status.');
    }
    return false;
  };

  const handleReceivePurchaseOrder = async (po) => {
    try {
      const statusOk = await handleUpdatePurchaseOrderStatus(po.id, 'Received');
      if (statusOk) {
        const invoicePayload = {
          supplierId: po.supplierId,
          invoiceNumber: `INV-PO-${po.id.slice(-6).toUpperCase()}`,
          amount: parseFloat(po.total),
          remarks: `Auto-generated from PO #${po.id.slice(0,8).toUpperCase()}`,
          status: 'Unpaid',
          vehicleNumber: 'N/A',
          deliveredBy: 'Courier',
          receivedBy: 'Pharmacy System',
          contactNumber: 'N/A'
        };
        const response = await axios.post(`${API_BASE_URL}/suppliers/invoices`, invoicePayload, {
          headers: getAuthHeader()
        });
        if (response.data && response.data.success) {
          alert('Stock received! Supplier Invoice auto-generated and added to ledger.');
          await fetchAllData();
        }
      }
    } catch (err) {
      console.error('Failed to automatically record invoice on receipt:', err);
    }
  };

  return {
    suppliers: suppliersList,
    newSupplier,
    setNewSupplier,
    handleAddSupplier,

    // Invoices
    supplierInvoices,
    invoiceSupplierId,
    setInvoiceSupplierId,
    invoiceNumber,
    setInvoiceNumber,
    invoiceAmount,
    setInvoiceAmount,
    invoiceVehicleNumber,
    setInvoiceVehicleNumber,
    invoiceDeliveredBy,
    setInvoiceDeliveredBy,
    invoiceReceivedBy,
    setInvoiceReceivedBy,
    invoiceContactNumber,
    setInvoiceContactNumber,
    invoiceRemarks,
    setInvoiceRemarks,
    handleAddInvoice,

    // Payments
    supplierPayments,
    paymentSupplierId,
    setPaymentSupplierId,
    paymentRefNumber,
    setPaymentRefNumber,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentRemarks,
    setPaymentRemarks,
    handleRecordPayment,

    // Ledger
    supplierLedger,
    loading,

    // Selection
    selectedSupplier,
    setSelectedSupplier,

    // Returns & Documents
    supplierReturns,
    handleAddReturn,
    supplierDocuments,
    handleUploadDocument,

    // Purchase Orders
    purchaseOrders,
    handleAddPurchaseOrder,
    handleUpdatePurchaseOrderStatus,
    handleReceivePurchaseOrder,
    fetchAllData,
    
    // Medicines
    medicinesList
  };
}
