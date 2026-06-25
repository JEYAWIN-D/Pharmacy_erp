import { useState } from 'react';
import { useDB } from '../../db/DBContext';

export function useBatchController() {
  const {
    batches,
    setBatches,
    medicines,
    setMedicines,
    notifications,
    setNotifications,
    inventoryLogs,
    setInventoryLogs
  } = useDB();

  const [batchMedicineId, setBatchMedicineId] = useState(medicines[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchStock, setBatchStock] = useState('');

  const handleAddBatch = (e) => {
    e.preventDefault();
    const qty = parseInt(batchStock);
    if (!batchMedicineId) {
      alert('Please select a medicine.');
      return;
    }
    if (!batchNumber.trim()) {
      alert('Please enter a batch lot number.');
      return;
    }
    if (!expiryDate) {
      alert('Please select an expiration date.');
      return;
    }
    if (!qty || isNaN(qty) || qty <= 0) {
      alert('Please enter a valid lot quantity.');
      return;
    }

    const nextId = batches.length > 0 ? Math.max(...batches.map(b => b.id)) + 1 : 1;
    const newBatch = {
      id: nextId,
      medicineId: parseInt(batchMedicineId),
      batchNumber: batchNumber.trim(),
      expiryDate,
      stock: qty,
      status: 'Active'
    };

    setBatches([...batches, newBatch]);
    alert('Batch lot created and registered successfully.');
    
    // Reset form
    setBatchNumber('');
    setExpiryDate('');
    setBatchStock('');
  };

  const recallBatch = (batchId) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    if (window.confirm(`Are you sure you want to trigger a PRODUCT RECALL for Batch ${targetBatch.batchNumber}? This will lock the batch and remove all associated shelf stock.`)) {
      const recalledStock = targetBatch.stock;
      const med = medicines.find(m => m.id === targetBatch.medicineId);

      // Lock the batch
      setBatches(batches.map(b => 
        b.id === batchId ? { ...b, status: 'Recalled', stock: 0 } : b
      ));

      if (med && recalledStock > 0) {
        // Subtract stock from shelf
        setMedicines(medicines.map(m => 
          m.id === med.id ? { ...m, stock: Math.max(0, m.stock - recalledStock) } : m
        ));

        // Log Stock transaction
        setInventoryLogs([
          {
            id: `TRX-${Date.now().toString().slice(-3)}`,
            date: new Date().toLocaleString(),
            medicineName: med.name,
            type: 'Stock Out',
            qty: recalledStock,
            user: 'Admin',
            remarks: `PRODUCT RECALL: Recalled Batch ${targetBatch.batchNumber}`
          },
          ...inventoryLogs
        ]);
      }

      // Add warning alert
      setNotifications([
        {
          id: Date.now(),
          type: 'danger',
          message: `⚠️ PRODUCT RECALL ALERT: Batch ${targetBatch.batchNumber} has been recalled from circulation.`,
          time: 'Just now',
          resolved: false
        },
        ...notifications
      ]);

      alert(`Product recall initiated. Batch ${targetBatch.batchNumber} locked. Alert broadcasted to staff.`);
    }
  };

  return {
    batches,
    medicines,
    batchMedicineId,
    setBatchMedicineId,
    batchNumber,
    setBatchNumber,
    expiryDate,
    setExpiryDate,
    batchStock,
    setBatchStock,
    handleAddBatch,
    recallBatch
  };
}
