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
    return po.status === 'Delivered' || po.status === 'Partially Received' || po.status === 'Shipped' || po.status === 'In Transit' || po.status === 'PO_CONFIRMED' || po.status === 'Sent' || po.status === 'Accepted';
  });

  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [grnItems, setGrnItems] = useState([]);
  const [receivedBy, setReceivedBy] = useState('Inventory Staff');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceError, setInvoiceError] = useState('');

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
      let defaultRx = item.qty - (item.receivedQty || 0) - (item.cancelledQty || 0);
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
        alreadyCancelled: item.cancelledQty || 0,
        receivedQty: '',
        damagedQty: '',
        cancelledQty: '',
        batchNumber: '',
        expiryDate: '',
        mfgDate: '',
        remarks: '',
        unitPrice: Number(item.unitPrice || 0),
        cancelledBy: '',
        cancelledDate: '',
        cancelledTime: '',
        cancelReason: '',
        itemStatus: 'Pending'
      };
    }));
  };

  const loadDraftGRN = (draft) => {
    setSelectedPOId(draft.poId);
    setInvoiceNumber(draft.invoiceNumber || '');
    setReceivedBy(draft.receivedBy || 'Inventory Staff');
    setEditingDraftId(draft.id);
    
    // Check PO to get total ordered qty
    const po = purchaseOrders.find(p => p.id === draft.poId);
    
    setGrnItems(draft.items.map(item => {
      const poItem = po?.items?.find(pi => pi.medicineId === item.medicineId);
      return {
        medicineId: item.medicineId,
        medicineName: item.medicineName || item.medicine?.medicineName || item.medicine?.name || 'Unknown Medicine',
        orderedQty: poItem ? poItem.qty : (item.receivedQty + item.damagedQty + item.cancelledQty),
        alreadyReceived: poItem ? (poItem.receivedQty || 0) : 0,
        alreadyCancelled: poItem ? (poItem.cancelledQty || 0) : 0,
        receivedQty: item.receivedQty !== undefined && item.receivedQty !== null && item.receivedQty !== '' ? item.receivedQty : '',
        damagedQty: item.damagedQty !== undefined && item.damagedQty !== null && item.damagedQty !== '' && item.damagedQty !== 0 ? item.damagedQty : '',
        cancelledQty: item.cancelledQty !== undefined && item.cancelledQty !== null && item.cancelledQty !== '' && item.cancelledQty !== 0 ? item.cancelledQty : '',
        batchNumber: item.batchNumber || '',
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        mfgDate: item.mfgDate ? new Date(item.mfgDate).toISOString().split('T')[0] : '',
        remarks: item.remarks || '',
        unitPrice: Number(item.unitPrice || 0),
        cancelledBy: item.cancelledBy || '',
        cancelledDate: item.cancelledDate || '',
        cancelledTime: item.cancelledTime || '',
        cancelReason: item.cancelReason || '',
        itemStatus: item.status || 'Pending'
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

  const handleSubmitGRN = async (savedAsDraft, toast, confirm) => {
    if (!selectedPOId) {
      toast.error('Please select a Purchase Order.');
      return false;
    }

    const isFinal = !savedAsDraft;

    if (isFinal) {
      if (!invoiceNumber || !invoiceNumber.trim()) {
        toast.error('Invoice Number is required for final GRN.');
        return false;
      }
      if (invoiceError) {
        toast.error('Cannot submit: Invoice number already exists.');
        return false;
      }
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Validations only if finalizing
    if (isFinal) {
      for (const item of grnItems) {
        const rawRx = parseInt(item.receivedQty) || 0;
        const dmg = parseInt(item.damagedQty) || 0;
        const cancelled = parseInt(item.cancelledQty) || 0;
        const accepted = rawRx - dmg;
        const rem = item.orderedQty - item.alreadyReceived - item.alreadyCancelled;

        if (item.orderedQty <= 0) {
          toast.error(`Ordered Quantity must be greater than zero for ${item.medicineName}.`);
          return false;
        }
        if (rawRx + cancelled <= 0) {
          toast.error(`Total processed quantity (Received + Cancelled) for ${item.medicineName} must be greater than zero.`);
          return false;
        }
        if (rawRx + cancelled > rem) {
          toast.error(`Processed quantity (${rawRx + cancelled}) cannot exceed remaining ordered quantity (${rem}) for ${item.medicineName}.`);
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
        if (cancelled > 0) {
          if (!item.cancelReason || !item.cancelReason.trim()) {
            toast.error(`Cancel reason is required for cancelled items of ${item.medicineName}.`);
            return false;
          }
        }
      }
    }

    const message = savedAsDraft 
      ? `Are you sure you want to save this Goods Receipt Note as a DRAFT against PO ${selectedPOId}?` 
      : `Are you sure you want to finalize and approve this Goods Receipt Note against PO ${selectedPOId}? This will update inventory.`;

    const ok = await confirm(message);
    if (!ok) return false;

    // Prepare payload
    const grnPayload = {
      poId: selectedPOId,
      shipmentId: selectedShipmentId || null,
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : '',
      receivedBy,
      savedAsDraft: !!savedAsDraft,
      items: grnItems.map(item => {
        const rawRx = parseInt(item.receivedQty) || 0;
        const dmg = parseInt(item.damagedQty) || 0;
        const cancelled = parseInt(item.cancelledQty) || 0;
        return {
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchNumber: (item.batchNumber || '').trim(),
          expiryDate: item.expiryDate || null,
          mfgDate: item.mfgDate || null,
          receivedQty: rawRx,
          damagedQty: dmg,
          cancelledQty: cancelled,
          remarks: item.remarks || '',
          unitPrice: item.unitPrice,
          cancelledBy: cancelled > 0 ? (receivedBy || 'Inventory Staff') : null,
          cancelledDate: cancelled > 0 ? todayStr : null,
          cancelledTime: cancelled > 0 ? today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
          cancelReason: cancelled > 0 ? item.cancelReason : null
        };
      })
    };

    try {
      let response;
      if (editingDraftId) {
        response = await purchaseAPI.updateGRN(editingDraftId, grnPayload);
      } else {
        response = await purchaseAPI.createGRN(grnPayload);
      }
      
      if (response && response.success) {
        const createdGRN = response.data;
        setGoodsReceipts(prev => {
          const filtered = prev.filter(g => g.id !== createdGRN.id && g.id !== editingDraftId);
          return [createdGRN, ...filtered];
        });

        // Refetch all POs
        const updatedPOs = await purchaseAPI.getAllPOs();
        if (updatedPOs && updatedPOs.success) {
          setPurchaseOrders(updatedPOs.data);
        }

        const logAction = savedAsDraft ? 'GRN Draft Saved' : 'GRN Logged';
        const logDetails = savedAsDraft 
          ? `GRN Draft ${createdGRN.id} created against PO ${selectedPOId}` 
          : `GRN ${createdGRN.id} created against PO ${selectedPOId}`;

        setNotifications([{ id: Date.now(), type: savedAsDraft ? 'info' : 'success', message: `${logAction} successfully!`, time: 'Just now', resolved: false }, ...notifications]);
        setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: receivedBy, action: logAction, details: logDetails }, ...auditLogs]);

        toast.success(savedAsDraft ? `Goods Receipt Note Draft saved successfully!` : `Goods Receipt Note finalized and inventory updated!`);
        
        // Reset states
        setSelectedPOId('');
        setSelectedShipmentId('');
        setEditingDraftId(null);
        setInvoiceNumber('');
        setGrnItems([]);
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting GRN: ' + err.message);
    }
    return false;
  };

  const handleDeleteGRNDraft = async (grnId, toast, confirm) => {
    const ok = await confirm(`Are you sure you want to delete GRN Draft ${grnId}?`);
    if (!ok) return false;

    try {
      const res = await purchaseAPI.deleteGRN(grnId);
      if (res && res.success) {
        toast.success(`GRN Draft ${grnId} deleted successfully.`);
        setGoodsReceipts(prev => prev.filter(g => g.id !== grnId));
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete GRN Draft: ' + err.message);
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
    invoiceNumber, setInvoiceNumber,
    invoiceError, setInvoiceError,
    loadPOItems,
    loadDraftGRN,
    editingDraftId, setEditingDraftId,
    updateGrnItem,
    handleSubmitGRN,
    handleDeleteGRNDraft
  };
}
