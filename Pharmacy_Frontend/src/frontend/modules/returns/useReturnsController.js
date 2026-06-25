import { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';

export function useReturnsController(role) {
  const {
    medicines, setMedicines,
    inventoryLogs, setInventoryLogs,
    salesHistory,
    patientReturns, setPatientReturns,
    supplierReturns, setSupplierReturns,
    suppliers,
    auditLogs, setAuditLogs
  } = useDB();

  // ─── PATIENT RETURN STATE ─────────────────────────────────────────────────
  const [returnBillId, setReturnBillId] = useState('');
  const [returnMedId, setReturnMedId] = useState(medicines[0]?.id || 1);
  const [returnQty, setReturnQty] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  const calculateRefund = () => {
    const qty = parseInt(returnQty);
    if (!qty || isNaN(qty) || qty <= 0) { setRefundAmount(0); return; }
    const med = medicines.find(m => m.id === parseInt(returnMedId));
    if (med) {
      const raw = med.price * qty;
      setRefundAmount(raw - (raw * 0.12)); // 12% deduction
    }
  };

  useEffect(() => { calculateRefund(); }, [returnMedId, returnQty, medicines]);

  const handleProcessReturn = (e) => {
    e.preventDefault();
    const qty = parseInt(returnQty);
    if (!returnBillId.trim() || !qty || isNaN(qty) || qty <= 0) {
      alert('Please enter a valid bill number and return quantity.');
      return;
    }
    const med = medicines.find(m => m.id === parseInt(returnMedId));
    if (!med) return;

    setMedicines(medicines.map(m => m.id === med.id ? { ...m, stock: m.stock + qty } : m));
    const returnId = `PRET-${Date.now().toString().slice(-4)}`;
    setPatientReturns([{
      id: returnId, date: new Date().toLocaleString(),
      billId: returnBillId.trim(), patientName: 'Customer',
      medicineName: med.name, returnQty: qty,
      refundAmount: parseFloat(refundAmount.toFixed(2)),
      reason: 'Customer Return', processedBy: role || 'Billing Staff'
    }, ...patientReturns]);

    setInventoryLogs([{
      id: `TRX-${Date.now().toString().slice(-3)}`,
      date: new Date().toLocaleString(),
      medicineName: med.name, type: 'Stock In', qty,
      user: role || 'Billing Staff',
      remarks: `Patient return (Bill: ${returnBillId.trim()})`
    }, ...inventoryLogs]);

    setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: role || 'Billing Staff', action: 'Patient Return Processed', details: `${qty} × ${med.name} returned. Refund: ₹${refundAmount.toFixed(2)}` }, ...auditLogs]);
    alert(`Return processed. Refund ₹${refundAmount.toFixed(2)} payable to customer.`);
    setReturnBillId(''); setReturnQty(''); setRefundAmount(0);
  };

  // ─── SUPPLIER RETURN STATE ────────────────────────────────────────────────
  const [supReturnSupplierId, setSupReturnSupplierId] = useState(suppliers[0]?.id || 1);
  const [supReturnMedId, setSupReturnMedId] = useState(medicines[0]?.id || 1);
  const [supReturnQty, setSupReturnQty] = useState('');
  const [supReturnReason, setSupReturnReason] = useState('');

  const handleProcessSupplierReturn = (e) => {
    e.preventDefault();
    const qty = parseInt(supReturnQty);
    if (!qty || isNaN(qty) || qty <= 0) { alert('Enter a valid return quantity.'); return; }
    const med = medicines.find(m => m.id === parseInt(supReturnMedId));
    const sup = suppliers.find(s => s.id === parseInt(supReturnSupplierId));
    if (!med || !sup) return;
    if (med.stock < qty) { alert(`Only ${med.stock} units in stock. Cannot return more.`); return; }
    if (!supReturnReason.trim()) { alert('Please enter a reason for return.'); return; }

    setMedicines(medicines.map(m => m.id === med.id ? { ...m, stock: m.stock - qty } : m));
    const returnId = `SRET-${Date.now().toString().slice(-4)}`;
    const creditAmt = parseFloat((med.price * qty * 0.85).toFixed(2)); // 85% credit
    setSupplierReturns([{
      id: returnId, date: new Date().toLocaleString(),
      supplierId: sup.id, supplierName: sup.name,
      medicineId: med.id, medicineName: med.name,
      returnQty: qty, reason: supReturnReason.trim(),
      creditAmount: creditAmt, status: 'Pending Acceptance', processedBy: role || 'Purchase Manager'
    }, ...supplierReturns]);

    setInventoryLogs([{
      id: `TRX-${Date.now().toString().slice(-3)}`,
      date: new Date().toLocaleString(),
      medicineName: med.name, type: 'Stock Out', qty,
      user: role || 'Purchase Manager',
      remarks: `Returned to supplier ${sup.name} (${returnId})`
    }, ...inventoryLogs]);

    setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: role || 'Purchase Manager', action: 'Supplier Return Initiated', details: `${qty} × ${med.name} returned to ${sup.name}. Credit: ₹${creditAmt}` }, ...auditLogs]);
    alert(`Supplier return ${returnId} submitted. Expected credit: ₹${creditAmt}`);
    setSupReturnQty(''); setSupReturnReason('');
  };

  return {
    medicines, suppliers,
    returnBillId, setReturnBillId,
    returnMedId, setReturnMedId,
    returnQty, setReturnQty,
    refundAmount,
    handleProcessReturn,
    patientReturns,
    supplierReturns,
    supReturnSupplierId, setSupReturnSupplierId,
    supReturnMedId, setSupReturnMedId,
    supReturnQty, setSupReturnQty,
    supReturnReason, setSupReturnReason,
    handleProcessSupplierReturn
  };
}
