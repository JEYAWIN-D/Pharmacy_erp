import { useState } from 'react';
import { useDB } from '../../db/DBContext';

export function useGRNController() {
  const {
    goodsReceipts, setGoodsReceipts,
    purchaseOrders, setPurchaseOrders,
    medicines, setMedicines,
    batches, setBatches,
    inventoryLogs, setInventoryLogs,
    notifications, setNotifications,
    auditLogs, setAuditLogs
  } = useDB();

  // Approved POs that haven't been received yet
  const pendingGRNOrders = purchaseOrders.filter(po => po.status === 'Approved');

  const [selectedPOId, setSelectedPOId] = useState('');
  const [grnItems, setGrnItems] = useState([]);
  const [receivedBy, setReceivedBy] = useState('Inventory Staff');

  const loadPOItems = (poId) => {
    setSelectedPOId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || !po.items) {
      setGrnItems([]);
      return;
    }
    setGrnItems(po.items.map(item => ({
      ...item,
      batchNumber: '',
      expiryDate: '',
      receivedQty: item.qty
    })));
  };

  const updateGrnItem = (idx, field, value) => {
    setGrnItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmitGRN = (e) => {
    e.preventDefault();
    if (!selectedPOId) { alert('Please select a Purchase Order.'); return; }
    for (const item of grnItems) {
      if (!item.batchNumber?.trim()) { alert(`Please enter batch number for ${item.medicineName}.`); return; }
      if (!item.expiryDate) { alert(`Please enter expiry date for ${item.medicineName}.`); return; }
      if (!item.receivedQty || item.receivedQty <= 0) { alert(`Invalid quantity for ${item.medicineName}.`); return; }
    }

    const po = purchaseOrders.find(p => p.id === selectedPOId);
    const grnId = `GRN-${Date.now().toString().slice(-4)}`;

    // Create GRN record
    const newGRN = {
      id: grnId,
      poId: selectedPOId,
      supplierName: po.supplier,
      receivedDate: new Date().toLocaleString(),
      receivedBy,
      status: 'Completed',
      items: grnItems.map(item => ({ ...item }))
    };
    setGoodsReceipts([newGRN, ...goodsReceipts]);

    // Create batches and update medicine stock
    let newBatches = [...batches];
    let updatedMedicines = [...medicines];
    let newLogs = [...inventoryLogs];
    let nextBatchId = batches.length > 0 ? Math.max(...batches.map(b => b.id)) + 1 : 1;

    for (const item of grnItems) {
      const qty = parseInt(item.receivedQty);
      const newBatch = {
        id: nextBatchId++,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber.trim(),
        expiryDate: item.expiryDate,
        stock: qty,
        status: 'Active'
      };
      newBatches.push(newBatch);

      updatedMedicines = updatedMedicines.map(m =>
        m.id === item.medicineId ? { ...m, stock: m.stock + qty, activeBatches: (m.activeBatches || 0) + 1 } : m
      );

      newLogs.unshift({
        id: `TRX-${Date.now().toString().slice(-3)}-${item.medicineId}`,
        date: new Date().toLocaleString(),
        medicineName: item.medicineName,
        type: 'Stock In',
        qty,
        user: receivedBy,
        remarks: `GRN ${grnId} — Batch ${item.batchNumber}`
      });
    }

    setBatches(newBatches);
    setMedicines(updatedMedicines);
    setInventoryLogs(newLogs);
    setPurchaseOrders(purchaseOrders.map(p => p.id === selectedPOId ? { ...p, status: 'Goods Received' } : p));
    setNotifications([{ id: Date.now(), type: 'success', message: `GRN ${grnId} completed. Stock updated for ${grnItems.length} medicine(s).`, time: 'Just now', resolved: false }, ...notifications]);
    setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: receivedBy, action: 'GRN Completed', details: `GRN ${grnId} received against PO ${selectedPOId}` }, ...auditLogs]);

    alert(`GRN ${grnId} submitted. Batches created and stock updated.`);
    setSelectedPOId('');
    setGrnItems([]);
  };

  return {
    goodsReceipts,
    pendingGRNOrders,
    selectedPOId,
    setSelectedPOId,
    grnItems,
    receivedBy,
    setReceivedBy,
    loadPOItems,
    updateGrnItem,
    handleSubmitGRN
  };
}
