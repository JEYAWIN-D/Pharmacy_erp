import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { purchaseAPI } from '../../db/api.js';

// Normalize a PR from the backend into the local shape expected by the UI
const normalizePR = (pr) => {
  const items = (pr.items || []).map(item => ({
    id: item.id,
    medicineId: item.medicineId,
    medicineName: item.medicineName || item.medicine?.medicineName || item.medicine?.name || 'Unknown',
    requestedQty: item.requestedQty,
    unit: item.unit || 'Boxes',
    remarks: item.remarks || '',
    status: item.status || 'Pending'
  }));

  // Parse date safely to avoid double-normalizing already formatted dates
  let formattedDate = pr.requestDate;
  if (formattedDate && typeof formattedDate === 'string' && !formattedDate.includes('/') && !formattedDate.includes('Invalid Date')) {
    const d = new Date(formattedDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-IN');
    }
  } else if (!formattedDate || (typeof formattedDate === 'string' && formattedDate.includes('Invalid Date'))) {
    const d = pr.createdAt ? new Date(pr.createdAt) : new Date();
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-IN');
    }
  }

  return {
    ...pr,
    items,
    medicineId: items[0]?.medicineId || pr.medicineId,
    medicineName: items[0]?.medicineName || pr.medicineName,
    requestedQty: items[0]?.requestedQty || pr.requestedQty,
    remarks: pr.remarks || pr.items?.[0]?.remarks || '',
    requestDate: formattedDate
  };
};

export function usePurchaseRequestController(role) {
  const {
    purchaseRequests, setPurchaseRequests,
    purchaseOrders,
    medicines,
    notifications, setNotifications,
    auditLogs, setAuditLogs
  } = useDB();

  const [newPR, setNewPR] = useState({
    items: [{ medicineId: medicines[0]?.id || '', requestedQty: '', unit: 'Boxes', remarks: '' }],
    priority: 'Medium',
    remarks: ''
  });

  const handleAutoCreatePR = async (medicineId, qtyNeeded, priority = 'Medium', remarks = 'Automated Low Stock Alert') => {
    const med = medicines.find(m => String(m.id) === String(medicineId));
    if (!med) return;

    // Check duplicate active PR or PO
    const activePR = purchaseRequests.find(pr =>
      ['Pending', 'Approved', 'Partially Approved', 'PO Generated'].includes(pr.status) &&
      pr.items?.some(it => it.medicineId === medicineId)
    );
    const activePO = purchaseOrders.find(po =>
      ['Draft', 'Sent', 'Accepted', 'Shipped', 'In Transit', 'Delivered', 'Partially Received'].includes(po.status) &&
      po.items?.some(it => it.medicineId === medicineId)
    );

    if (activePR || activePO) {
      alert(`A active procurement workflow is already running for ${med.name || med.medicineName || 'this medicine'}. Duplicate requests are blocked.`);
      return;
    }
    
    const payload = {
      priority,
      remarks,
      requestedBy: 'System Monitor',
      department: 'Pharmacy Storage',
      items: [{
        medicineId,
        requestedQty: parseInt(qtyNeeded) || 100,
        unit: 'Boxes',
        remarks: 'Auto-replenishment low stock trigger'
      }]
    };

    try {
      const response = await purchaseAPI.createPR(payload);
      if (response && response.success) {
        const created = normalizePR(response.data);
        setPurchaseRequests(prev => [created, ...prev]);
        setNotifications([{ id: Date.now(), type: 'info', message: `Low Stock Alert: Auto PR ${created.id} raised for ${created.medicineName}`, time: 'Just now', resolved: false }, ...notifications]);
        setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: 'System Monitor', action: 'Purchase Request Created', details: `Auto-PR ${created.id} raised for ${created.medicineName} × ${created.requestedQty}` }, ...auditLogs]);
        alert(`Purchase Request ${created.id} generated automatically.`);
      }
    } catch (err) {
      console.error('Auto PR creation failed:', err);
      // Fallback local state if API fails
      const fallbackId = `PR-${Date.now().toString().slice(-4)}`;
      const fallback = {
        id: fallbackId,
        priority,
        remarks,
        requestedBy: 'System Monitor',
        department: 'Pharmacy Storage',
        status: 'Pending',
        requestDate: new Date().toLocaleDateString('en-IN'),
        items: [{
          id: Date.now(),
          medicineId,
          medicineName: med.name || med.medicineName,
          requestedQty: parseInt(qtyNeeded) || 100,
          unit: 'Boxes',
          remarks: 'Auto-replenishment low stock trigger',
          status: 'Pending'
        }],
        medicineId,
        medicineName: med.name || med.medicineName,
        requestedQty: parseInt(qtyNeeded) || 100
      };
      setPurchaseRequests(prev => [fallback, ...prev]);
    }
  };

  const addPRItem = () => {
    setNewPR(prev => ({
      ...prev,
      items: [...prev.items, { medicineId: medicines[0]?.id || '', requestedQty: '', unit: 'Boxes', remarks: '' }]
    }));
  };

  const removePRItem = (index) => {
    setNewPR(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  };

  const updatePRItem = (index, field, value) => {
    setNewPR(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleCreateRequest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const validItems = newPR.items.filter(item => item.medicineId && parseInt(item.requestedQty) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid item with positive quantity.');
      return;
    }

    const prItems = validItems.map(item => {
      const med = medicines.find(m => String(m.id) === String(item.medicineId));
      return {
        medicineId: item.medicineId,
        medicineName: med ? (med.name || med.medicineName) : 'Unknown',
        requestedQty: parseInt(item.requestedQty),
        unit: item.unit || 'Boxes',
        remarks: item.remarks || ''
      };
    });

    // Check duplicates for each item in the PR list
    for (const item of prItems) {
      const activePR = purchaseRequests.find(pr =>
        ['Pending', 'Approved', 'Partially Approved', 'PO Generated'].includes(pr.status) &&
        pr.items?.some(it => it.medicineId === item.medicineId)
      );
      const activePO = purchaseOrders.find(po =>
        ['Draft', 'Sent', 'Accepted', 'Shipped', 'In Transit', 'Delivered', 'Partially Received'].includes(po.status) &&
        po.items?.some(it => it.medicineId === item.medicineId)
      );

      if (activePR || activePO) {
        alert(`A active procurement workflow is already running for medicine "${item.medicineName}". Duplicate requests are blocked.`);
        return;
      }
    }

    const payload = {
      priority: newPR.priority,
      remarks: newPR.remarks?.trim() || '',
      requestedBy: role || 'Staff',
      department: 'Main Pharmacy',
      items: prItems
    };

    try {
      const response = await purchaseAPI.createPR(payload);
      if (response && response.success) {
        const created = normalizePR(response.data);
        setPurchaseRequests(prev => [created, ...prev]);
        setNotifications([{ id: Date.now(), type: 'info', message: `New Purchase Request ${created.id} raised with ${prItems.length} item(s)`, time: 'Just now', resolved: false }, ...notifications]);
        setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: role || 'Staff', action: 'Purchase Request Created', details: `PR ${created.id} raised with ${prItems.length} items` }, ...auditLogs]);
        alert(`Purchase Request ${created.id} submitted for manager approval.`);
        setNewPR({ items: [{ medicineId: medicines[0]?.id || '', requestedQty: '', unit: 'Boxes', remarks: '' }], priority: 'Medium', remarks: '' });
      }
    } catch (err) {
      console.error('Error creating PR:', err);
      alert('Error creating Purchase Request: ' + err.message);
    }
  };

  const handleApprovePR = async (prId, itemsApproval) => {
    // itemsApproval is array of { itemId, status: 'Approved' | 'Rejected' }
    if (!window.confirm(`Submit approval/rejection decisions for PR ${prId}?`)) return null;
    try {
      const response = await purchaseAPI.approvePR(prId, itemsApproval);
      if (response && response.success) {
        const updated = normalizePR(response.data);
        setPurchaseRequests(prev => prev.map(r => r.id === prId ? updated : r));
        setNotifications([{ id: Date.now(), type: 'success', message: `PR ${prId} decisions saved. Overall: ${updated.status}`, time: 'Just now', resolved: false }, ...notifications]);
        alert(`Purchase Request ${prId} status updated to: ${updated.status}`);
        return updated;
      }
    } catch (err) {
      console.error(err);
      alert('Error approving/processing purchase request: ' + err.message);
    }
    return null;
  };

  const handleRejectPR = async (prId, remarks) => {
    if (!window.confirm(`Reject the entire Purchase Request ${prId}?`)) return;
    try {
      const response = await purchaseAPI.rejectPR(prId, remarks);
      if (response && response.success) {
        const updated = normalizePR(response.data);
        setPurchaseRequests(prev => prev.map(r => r.id === prId ? updated : r));
        setNotifications([{ id: Date.now(), type: 'warning', message: `PR ${prId} has been rejected. Reason: ${remarks || 'None'}`, time: 'Just now', resolved: false }, ...notifications]);
        alert(`Purchase Request ${prId} has been rejected.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting purchase request: ' + err.message);
    }
  };

  return {
    purchaseRequests: purchaseRequests.map(normalizePR),
    medicines,
    newPR,
    setNewPR,
    addPRItem,
    removePRItem,
    updatePRItem,
    handleCreateRequest,
    handleAutoCreatePR,
    handleApprovePR,
    handleRejectPR
  };
}
