import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { purchaseAPI } from '../../db/api.js';

export function useGRNController() {
  const {
    goodsReceipts, setGoodsReceipts,
    purchaseOrders, setPurchaseOrders,
    medicines, setMedicines,
    batches, setBatches,
    racks, setRacks,
    warehouseStock, setWarehouseStock,
    inventoryLogs, setInventoryLogs,
    notifications, setNotifications,
    auditLogs, setAuditLogs
  } = useDB();

  // POs that are Delivered or Partially Received and can undergo GRN receiving
  const pendingGRNOrders = purchaseOrders.filter(po => {
    return po.status === 'Delivered' || po.status === 'Partially Received' || po.status === 'Shipped' || po.status === 'In Transit';
  });

  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [grnItems, setGrnItems] = useState([]);
  const [receivedBy, setReceivedBy] = useState('Inventory Staff');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const loadPOItems = (poId, shipmentId = '') => {
    setSelectedPOId(poId);
    setSelectedShipmentId(shipmentId);

    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || !po.items) {
      setGrnItems([]);
      return;
    }

    // If shipment is selected, we filter/load items and quantities from the shipment
    let itemsToLoad = po.items;
    if (shipmentId && po.shipments) {
      const shipment = po.shipments.find(s => s.id === shipmentId);
      if (shipment && shipment.items) {
        itemsToLoad = po.items.filter(pi => 
          shipment.items.some(si => si.medicineId === pi.medicineId)
        );
      }
    }

    setGrnItems(itemsToLoad.map(item => {
      // Find shipment item qty if shipment links
      let defaultRx = item.qty - (item.receivedQty || 0);
      if (shipmentId && po.shipments) {
        const shipment = po.shipments.find(s => s.id === shipmentId);
        const shItem = shipment?.items?.find(si => si.medicineId === item.medicineId);
        if (shItem) defaultRx = shItem.qty;
      }

      return {
        medicineId: item.medicineId,
        medicineName: item.medicineName || item.medicine?.medicineName || item.medicine?.name || 'Unknown Medicine',
        orderedQty: item.qty,
        alreadyReceived: item.receivedQty || 0,
        receivedQty: Math.max(0, defaultRx),
        damagedQty: 0,
        batchNumber: `B-${(item.medicineName || 'MED').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year default
        mfgDate: new Date().toISOString().split('T')[0],
        remarks: '',
        unitPrice: Number(item.unitPrice || 0)
      };
    }));
  };

  const updateGrnItem = (idx, field, value) => {
    setGrnItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmitGRN = async (toast, confirm) => {
    if (!selectedPOId) {
      toast.error('Please select a Purchase Order.');
      return false;
    }
    if (!invoiceNumber.trim()) {
      toast.error('Please enter the Supplier Invoice reference number.');
      return false;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Validations
    for (const item of grnItems) {
      const rawRx = parseInt(item.receivedQty) || 0;
      const dmg = parseInt(item.damagedQty) || 0;
      const accepted = rawRx - dmg;
      const rem = item.orderedQty - item.alreadyReceived;

      if (item.orderedQty <= 0) {
        toast.error(`Ordered Quantity must be greater than zero for ${item.medicineName}.`);
        return false;
      }
      if (rawRx <= 0) {
        toast.error(`Received quantity must be greater than zero for ${item.medicineName}.`);
        return false;
      }
      if (rawRx > rem) {
        toast.error(`Received quantity (${rawRx}) cannot exceed remaining ordered quantity (${rem}) for ${item.medicineName}.`);
        return false;
      }
      if (dmg < 0) {
        toast.error(`Damaged Quantity cannot be negative for ${item.medicineName}.`);
        return false;
      }
      if (dmg > rawRx) {
        toast.error(`Damaged quantity (${dmg}) cannot exceed received quantity (${rawRx}) for ${item.medicineName}.`);
        return false;
      }
      if (accepted > 0) {
        if (!item.batchNumber || !item.batchNumber.trim()) {
          toast.error(`Batch Number is mandatory for accepted stock of ${item.medicineName}.`);
          return false;
        }
        if (!item.expiryDate) {
          toast.error(`Expiry Date is mandatory for accepted stock of ${item.medicineName}.`);
          return false;
        }

        const mfg = new Date(item.mfgDate);
        const exp = new Date(item.expiryDate);

        if (mfg >= exp) {
          toast.error(`Manufacturing Date must be before Expiry Date for ${item.medicineName}.`);
          return false;
        }
        if (item.expiryDate <= todayStr) {
          toast.error(`Expired medicine ${item.medicineName} cannot be accepted. Expiry Date must be in the future.`);
          return false;
        }
      }
    }

    const ok = await confirm(`Are you sure you want to save this Goods Receipt Note against PO ${selectedPOId}?`);
    if (!ok) return false;

    // Prepare payload
    const grnPayload = {
      poId: selectedPOId,
      shipmentId: selectedShipmentId || null,
      invoiceNumber: invoiceNumber.trim(),
      receivedBy,
      items: grnItems.map(item => {
        const rawRx = parseInt(item.receivedQty) || 0;
        const dmg = parseInt(item.damagedQty) || 0;
        const accepted = rawRx - dmg;
        return {
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchNumber: (item.batchNumber || '').trim(),
          expiryDate: item.expiryDate,
          mfgDate: item.mfgDate,
          receivedQty: accepted, // Accepted quantity maps to receivedQty in DB
          damagedQty: dmg,       // Damaged quantity maps to damagedQty in DB
          remarks: item.remarks || '',
          unitPrice: item.unitPrice
        };
      })
    };

    try {
      const response = await purchaseAPI.createGRN(grnPayload);
      if (response && response.success) {
        const createdGRN = response.data;
        setGoodsReceipts(prev => [createdGRN, ...prev]);

        // Refetch all POs
        const updatedPOs = await purchaseAPI.getAllPOs();
        if (updatedPOs && updatedPOs.success) {
          setPurchaseOrders(updatedPOs.data);
        }

        setNotifications([{ id: Date.now(), type: 'success', message: `GRN ${createdGRN.id} generated successfully! Stock updated.`, time: 'Just now', resolved: false }, ...notifications]);
        setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: receivedBy, action: 'GRN Logged', details: `GRN ${createdGRN.id} created against PO ${selectedPOId}` }, ...auditLogs]);

        toast.success(`Goods Receipt Note ${createdGRN.id} submitted successfully and stock updated!`);
        
        // Reset states
        setSelectedPOId('');
        setSelectedShipmentId('');
        setInvoiceNumber('');
        setGrnItems([]);
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating GRN: ' + err.message);
    }
    return false;
  };

  return {
    goodsReceipts,
    setGoodsReceipts,
    pendingGRNOrders,
    selectedPOId,
    setSelectedPOId,
    selectedShipmentId,
    setSelectedShipmentId,
    grnItems,
    setGrnItems,
    receivedBy,
    setReceivedBy,
    invoiceNumber,
    setInvoiceNumber,
    loadPOItems,
    updateGrnItem,
    handleSubmitGRN
  };
}
