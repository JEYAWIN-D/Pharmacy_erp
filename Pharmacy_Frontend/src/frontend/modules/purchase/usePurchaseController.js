import { useState, useEffect, useCallback } from 'react';
import { useDB } from '../../db/DBContext';
import { purchaseAPI } from '../../db/api.js';

export function usePurchaseController(role) {
  const {
    purchaseOrders, setPurchaseOrders,
    purchaseRequests, setPurchaseRequests,
    suppliers,
    medicines, setMedicines,
    notifications, setNotifications,
    inventoryLogs, setInventoryLogs,
    auditLogs, setAuditLogs,
    goodsReceipts, setGoodsReceipts,
    supplierReturns, setSupplierReturns,
    supplierInvoices, setSupplierInvoices,
    supplierPayments, setSupplierPayments,
    supplierLedger, setSupplierLedger,
    batches, setBatches,
    racks, setRacks,
    warehouseStock, setWarehouseStock,
    refetch
  } = useDB();

  const [verifiedSuppliersList, setVerifiedSuppliersList] = useState([]);
  const [poMode, setPoMode] = useState('Direct'); // 'PR' or 'Direct'
  const [linkedPRId, setLinkedPRId] = useState('');
  const [prApprovedItems, setPrApprovedItems] = useState([]);

  const [poSupplier, setPoSupplier] = useState('');
  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [poPaymentTerms, setPoPaymentTerms] = useState('Net 30');
  const [poCommunicationMethod, setPoCommunicationMethod] = useState('Email');

  // Shipment & completed history states
  const [shipments, setShipments] = useState([]);
  const [completedPOs, setCompletedPOs] = useState([]);
  const [completedGRNs, setCompletedGRNs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load verified suppliers
  useEffect(() => {
    const info = localStorage.getItem('supplier_verification_info');
    const parsed = info ? JSON.parse(info) : {};
    const activeVerified = suppliers.filter(s => {
      const extra = parsed[s.id] || { gstVerified: true, drugVerified: true, bankVerified: true, isActive: true };
      return extra.isActive && extra.gstVerified && extra.drugVerified && extra.bankVerified;
    });
    setVerifiedSuppliersList(activeVerified.length > 0 ? activeVerified : suppliers);
  }, [suppliers]);

  // Set defaults safely
  useEffect(() => {
    if (verifiedSuppliersList.length > 0 && !poSupplier) {
      setPoSupplier(verifiedSuppliersList[0].name);
    }
  }, [verifiedSuppliersList, poSupplier]);

  // Fetch shipments and completed history from the backend
  const fetchShipmentsAndHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [shipmentRes, compPORes, compGRNRes] = await Promise.allSettled([
        purchaseAPI.getAllShipments(),
        purchaseAPI.getCompletedPOs(),
        purchaseAPI.getCompletedGRNs()
      ]);

      if (shipmentRes.status === 'fulfilled' && shipmentRes.value?.success) {
        setShipments(shipmentRes.value.data);
      }
      if (compPORes.status === 'fulfilled' && compPORes.value?.success) {
        setCompletedPOs(compPORes.value.data);
      }
      if (compGRNRes.status === 'fulfilled' && compGRNRes.value?.success) {
        setCompletedGRNs(compGRNRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching procurement history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchShipmentsAndHistory();
  }, [fetchShipmentsAndHistory, purchaseOrders]);

  // PO creation
  const handleCreatePO = async (poData) => {
    const targetSupplier = verifiedSuppliersList.find(s => s.name === poSupplier) || verifiedSuppliersList[0] || { id: null };

    // Format items
    const poItems = (poData.items || []).map(item => {
      const qty = parseInt(item.qty) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const taxRate = parseFloat(item.tax) || 0;
      return {
        medicineId: item.medicineId,
        medicineName: item.medicineName || 'Unknown Medicine',
        qty,
        unitPrice: price,
        tax: taxRate,
        total: qty * price * (1 + (taxRate / 100))
      };
    });

    const totalVal = poItems.reduce((sum, item) => sum + item.total, 0);

    const payload = {
      supplierId: targetSupplier.id,
      total: totalVal,
      status: 'Draft',
      paymentTerms: poPaymentTerms,
      communicationMethod: poCommunicationMethod,
      expectedDelivery: poDeliveryDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      createdBy: role || 'Purchase Manager',
      items: poItems
    };

    try {
      const response = await purchaseAPI.createPO(payload);
      if (response && response.success) {
        setPurchaseOrders(prev => [response.data, ...prev]);
        setNotifications([{ id: Date.now(), type: 'info', message: `New Purchase Order Draft ${response.data.id} generated`, time: 'Just now', resolved: false }, ...notifications]);
        setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: role || 'Purchase Manager', action: 'PO Draft Created', details: `PO ${response.data.id} created for supplier (₹ ${totalVal.toFixed(2)})` }, ...auditLogs]);
        alert(`Purchase Order ${response.data.id} created as Draft.`);
        setPoDeliveryDate('');
        return response.data;
      }
    } catch (err) {
      console.error(err);
      alert('Error creating Purchase Order: ' + err.message);
    }
  };

  const handleCreatePOFromPR = async (prId, items, supplierVal, deliveryDate, paymentTerms, communicationMethod) => {
    // 1. Guard against duplicate POs from the same PR
    const duplicate = purchaseOrders.find(po => po.prId === prId && po.status !== 'Cancelled');
    if (duplicate) {
      alert(`Duplicate PO blocked! A Purchase Order (${duplicate.id}) already exists for PR ${prId}.`);
      return;
    }

    const targetSupplier = verifiedSuppliersList.find(s => s.name === supplierVal || s.id === supplierVal) || verifiedSuppliersList[0];
    const poItems = items.map(item => {
      let unitPrice = 15.00;
      if (targetSupplier && targetSupplier.medicinesSupplied) {
        const supplierMed = targetSupplier.medicinesSupplied.find(m => String(m.medicineId) === String(item.medicineId));
        if (supplierMed) unitPrice = Number(supplierMed.unitPrice || 15.00);
      }
      return {
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        qty: parseInt(item.requestedQty || item.qty),
        unitPrice: unitPrice,
        tax: 0,
        total: (item.requestedQty || item.qty) * unitPrice
      };
    });

    const poTotal = poItems.reduce((sum, it) => sum + it.total, 0);
    const payload = {
      prId,
      supplierId: targetSupplier.id,
      total: poTotal,
      status: 'Draft',
      paymentTerms: paymentTerms || 'Net 30',
      communicationMethod: communicationMethod || 'Email',
      expectedDelivery: deliveryDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      createdBy: role || 'Purchase Manager',
      items: poItems
    };

    try {
      const response = await purchaseAPI.createPOFromPR(payload);
      if (response && response.success) {
        setPurchaseOrders(prev => [response.data, ...prev]);
        
        // Update local PR status to PO Generated
        setPurchaseRequests(prev => prev.map(r => r.id === prId ? { ...r, status: 'PO Generated' } : r));

        setNotifications([{ id: Date.now(), type: 'success', message: `PO Draft ${response.data.id} created from PR ${prId}`, time: 'Just now', resolved: false }, ...notifications]);
        setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleString(), user: role || 'Purchase Manager', action: 'PO Generated from PR', details: `Created PO ${response.data.id} from Approved PR ${prId}` }, ...auditLogs]);
        alert(`PO Draft ${response.data.id} created successfully from PR ${prId}.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating Purchase Order: ' + err.message);
    }

    setPoMode('Direct');
    setLinkedPRId('');
    setPrApprovedItems([]);
  };

  const sendPO = async (poId) => {
    if (!window.confirm(`Send Purchase Order ${poId} to supplier?`)) return;
    try {
      const response = await purchaseAPI.sendPO(poId);
      if (response && response.success) {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: 'Sent' } : po));
        alert(`Purchase Order ${poId} marked as Sent.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send PO: ' + err.message);
    }
  };

  const supplierAcceptPO = async (poId) => {
    try {
      const response = await purchaseAPI.updatePOStatus(poId, { status: 'Accepted' });
      if (response && response.success) {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: 'Accepted' } : po));
        alert(`Supplier has accepted Purchase Order ${poId}.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to accept PO: ' + err.message);
    }
  };

  const supplierRejectPO = async (poId) => {
    if (!window.confirm(`Reject Purchase Order ${poId}?`)) return;
    try {
      const response = await purchaseAPI.updatePOStatus(poId, { status: 'Rejected' });
      if (response && response.success) {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: 'Rejected' } : po));
        alert(`Supplier has rejected Purchase Order ${poId}.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reject PO: ' + err.message);
    }
  };

  const closePO = async (poId) => {
    if (!window.confirm(`Close Purchase Order ${poId}?`)) return;
    try {
      const response = await purchaseAPI.closePO(poId);
      if (response && response.success) {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? response.data : po));
        alert(`Purchase Order ${poId} closed successfully and marked as Completed.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to close PO: ' + err.message);
    }
  };

  // Shipments Handlers
  const handleCreateShipment = async (poId, trackingId, invoiceNumber, items) => {
    const payload = {
      poId,
      trackingId,
      invoiceNumber,
      dispatchDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'Shipped',
      items: items.map(it => ({
        medicineId: it.medicineId,
        qty: parseInt(it.qty)
      }))
    };

    try {
      const response = await purchaseAPI.createShipment(payload);
      if (response && response.success) {
        setShipments(prev => [response.data, ...prev]);
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: 'Shipped' } : po));
        alert(`Shipment logged successfully. PO ${poId} marked as Shipped.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create shipment: ' + err.message);
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId, status) => {
    try {
      const response = await purchaseAPI.updateShipmentStatus(shipmentId, status);
      if (response && response.success) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? response.data : s));
        alert(`Shipment status updated to: ${status}`);
        
        // Refresh POs to fetch updated status
        const allPOs = await purchaseAPI.getAllPOs();
        if (allPOs && allPOs.success) setPurchaseOrders(allPOs.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update shipment status: ' + err.message);
    }
  };

  const handleSync = async () => {
    setLoadingHistory(true);
    try {
      if (refetch) await refetch();
      await fetchShipmentsAndHistory();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return {
    purchaseOrders,
    setPurchaseOrders,
    suppliers: verifiedSuppliersList,
    medicines,
    setMedicines,
    poSupplier,
    setPoSupplier,
    poDeliveryDate,
    setPoDeliveryDate,
    poPaymentTerms,
    setPoPaymentTerms,
    poCommunicationMethod,
    setPoCommunicationMethod,
    
    // Workflow actions
    sendPO,
    supplierAcceptPO,
    supplierRejectPO,
    closePO,
    handleCreatePO,

    // PO Mode states & actions
    poMode,
    setPoMode,
    linkedPRId,
    setLinkedPRId,
    prApprovedItems,
    setPrApprovedItems,
    handleCreatePOFromPR,

    // Shipments & History
    shipments,
    completedPOs,
    completedGRNs,
    loadingHistory,
    handleCreateShipment,
    handleUpdateShipmentStatus,
    refreshHistory: handleSync
  };
}
