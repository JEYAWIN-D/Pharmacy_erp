import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { PurchaseRequestModel } from './PurchaseRequestModel';

export function usePurchaseRequestController(role) {
  const {
    purchaseRequests, setPurchaseRequests,
    purchaseOrders, setPurchaseOrders,
    medicines,
    notifications, setNotifications,
    auditLogs, setAuditLogs
  } = useDB();

  const [newPR, setNewPR] = useState({ medicineId: medicines[0]?.id || '', requestedQty: '', priority: 'Medium', remarks: '' });

  const handleCreateRequest = (e) => {
    e.preventDefault();
    const validation = PurchaseRequestModel.validate(newPR);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }
    const nextId = `PR-${Date.now().toString().slice(-4)}`;
    const created = PurchaseRequestModel.create(newPR, medicines, nextId);
    setPurchaseRequests([created, ...purchaseRequests]);
    setNotifications([{ id: Date.now(), type: 'info', message: `New Purchase Request ${nextId} raised for ${created.medicineName}`, time: 'Just now', resolved: false }, ...notifications]);
    setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: role || 'Staff', action: 'Purchase Request Created', details: `PR ${nextId} raised for ${created.medicineName} × ${created.requestedQty}` }, ...auditLogs]);
    alert(`Purchase Request ${nextId} submitted for manager approval.`);
    setNewPR({ medicineId: medicines[0]?.id || '', requestedQty: '', priority: 'Medium', remarks: '' });
  };

  const handleApprovePR = (prId) => {
    const pr = purchaseRequests.find(r => r.id === prId);
    if (!pr) return;
    if (window.confirm(`Approve Purchase Request ${prId} for ${pr.medicineName} × ${pr.requestedQty}? This will create a Purchase Order.`)) {
      setPurchaseRequests(purchaseRequests.map(r => r.id === prId ? { ...r, status: 'Approved' } : r));
      const med = medicines.find(m => m.id === pr.medicineId);
      const newPO = {
        id: `PO-${Date.now().toString().slice(-4)}`,
        supplier: 'To be assigned',
        prId: prId,
        date: new Date().toLocaleDateString('en-IN'),
        total: pr.requestedQty * (med?.price || 0),
        status: 'Pending Approval',
        items: [{ medicineId: pr.medicineId, medicineName: pr.medicineName, qty: pr.requestedQty, unitPrice: med?.price || 0, total: pr.requestedQty * (med?.price || 0) }]
      };
      setPurchaseOrders([newPO, ...purchaseOrders]);
      setNotifications([{ id: Date.now(), type: 'success', message: `PR ${prId} approved. PO ${newPO.id} auto-created.`, time: 'Just now', resolved: false }, ...notifications]);
      alert(`Approved. PO ${newPO.id} created and sent for manager sign-off.`);
    }
  };

  const handleRejectPR = (prId) => {
    const pr = purchaseRequests.find(r => r.id === prId);
    if (!pr) return;
    if (window.confirm(`Reject Purchase Request ${prId}?`)) {
      setPurchaseRequests(purchaseRequests.map(r => r.id === prId ? { ...r, status: 'Rejected' } : r));
      alert(`Purchase Request ${prId} has been rejected.`);
    }
  };

  return {
    purchaseRequests,
    medicines,
    newPR,
    setNewPR,
    handleCreateRequest,
    handleApprovePR,
    handleRejectPR
  };
}
