import { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';

export function useDispenseController(
  role,
  fefoMedId,
  setFefoMedId,
  fefoPrescriptionId,
  setFefoPrescriptionId
) {
  const {
    medicines, setMedicines,
    batches, setBatches,
    inventoryLogs, setInventoryLogs,
    dispensingLogs, setDispensingLogs,
    auditLogs, setAuditLogs
  } = useDB();

  const [fefoSelectedBatch, setFefoSelectedBatch] = useState('');
  const [fefoDispenseQty, setFefoDispenseQty] = useState('5');

  // ─── SUBSTITUTION STATE ───────────────────────────────────────────────────
  // When a medicine has no stock, show substitution panel
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [substitutes, setSubstitutes] = useState([]);

  const getFefoBatches = (medId) => {
    return batches
      .filter(b => b.medicineId === parseInt(medId) && b.status === 'Active')
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  };

  // ─── FIND SUBSTITUTES BY GENERIC NAME ────────────────────────────────────
  const findSubstitutes = (medId) => {
    const targetMed = medicines.find(m => m.id === parseInt(medId));
    if (!targetMed) return [];
    // Match medicines that share the same generic name but have stock
    return medicines.filter(m =>
      m.id !== targetMed.id &&
      m.generic.toLowerCase() === targetMed.generic.toLowerCase() &&
      m.stock > 0
    );
  };

  // Auto-select earliest expiring batch and check substitution when medId changes
  useEffect(() => {
    const activeB = getFefoBatches(fefoMedId);
    if (activeB.length > 0) {
      setFefoSelectedBatch(activeB[0].id);
      setShowSubstitution(false);
      setSubstitutes([]);
    } else {
      setFefoSelectedBatch('');
      // No batches available — check substitutes
      const subs = findSubstitutes(fefoMedId);
      setSubstitutes(subs);
      setShowSubstitution(subs.length > 0);
    }
  }, [fefoMedId, batches]);

  // ─── SWITCH TO SUBSTITUTE ─────────────────────────────────────────────────
  const handleSelectSubstitute = (substituteId) => {
    setFefoMedId(substituteId);
    setShowSubstitution(false);
  };

  // ─── DISPENSE ─────────────────────────────────────────────────────────────
  const handleFefoDispenseSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(fefoDispenseQty);
    const targetBatch = batches.find(b => b.id === parseInt(fefoSelectedBatch));
    if (!targetBatch || qty <= 0 || isNaN(qty)) {
      alert('Please select a valid medicine and quantity.');
      return;
    }
    if (targetBatch.stock < qty) {
      alert(`Not enough stock in this box. Only ${targetBatch.stock} pieces left.`);
      return;
    }

    const medFefoBatches = getFefoBatches(fefoMedId);
    const oldestBatch = medFefoBatches[0];
    if (oldestBatch && oldestBatch.id !== targetBatch.id) {
      const ok = window.confirm(
        `⚠️ Box ${targetBatch.batchNumber} is not the oldest. Box ${oldestBatch.batchNumber} expires earlier on ${oldestBatch.expiryDate}. Override FEFO rule?`
      );
      if (!ok) return;
    }

    const med = medicines.find(m => m.id === parseInt(fefoMedId));
    setBatches(batches.map(b => b.id === targetBatch.id ? { ...b, stock: b.stock - qty } : b));
    setMedicines(medicines.map(m => m.id === med.id ? { ...m, stock: Math.max(0, m.stock - qty) } : m));

    const logId = `TRX-${Date.now().toString().slice(-4)}`;
    setInventoryLogs([{
      id: logId,
      date: new Date().toLocaleString(),
      medicineName: med.name,
      type: 'Stock Out',
      qty,
      user: role || 'Pharmacist',
      remarks: `Dispensed from batch ${targetBatch.batchNumber}${fefoPrescriptionId ? ' — Rx ' + fefoPrescriptionId : ''}`
    }, ...inventoryLogs]);

    const dispLogId = `DISP-${Date.now().toString().slice(-4)}`;
    setDispensingLogs([{
      id: dispLogId,
      date: new Date().toLocaleString(),
      prescriptionId: fefoPrescriptionId || null,
      patientName: 'Walk-in',
      medicineId: med.id,
      medicineName: med.name,
      batchId: targetBatch.id,
      batchNumber: targetBatch.batchNumber,
      qty,
      dispensedBy: role || 'Pharmacist',
      fefoApplied: oldestBatch?.id === targetBatch.id
    }, ...dispensingLogs]);

    setAuditLogs([{
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString(),
      user: role || 'Pharmacist',
      action: 'Medicine Dispensed',
      details: `${qty} × ${med.name} from batch ${targetBatch.batchNumber}`
    }, ...(auditLogs || [])]);

    alert(`✅ Dispensed ${qty} pcs of ${med.name} from batch ${targetBatch.batchNumber}.`);
    setFefoDispenseQty('');
    setFefoPrescriptionId('');
  };

  return {
    medicines,
    batches,
    fefoSelectedBatch, setFefoSelectedBatch,
    fefoDispenseQty, setFefoDispenseQty,
    getFefoBatches,
    handleFefoDispenseSubmit,
    showSubstitution,
    substitutes,
    handleSelectSubstitute
  };
}
