import { useState } from 'react';
import { useDB } from '../../db/DBContext';

export function useInventoryController(role) {
  const {
    medicines,
    setMedicines,
    inventoryLogs,
    setInventoryLogs
  } = useDB();

  const [adjMedId, setAdjMedId] = useState(medicines[0]?.id || 1);
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('In');
  const [adjRemarks, setAdjRemarks] = useState('');

  const handleStockAdjustment = (e) => {
    e.preventDefault();
    const qtyVal = parseInt(adjQty);
    if (!qtyVal || isNaN(qtyVal) || qtyVal <= 0) {
      alert('Please enter a valid stock quantity.');
      return;
    }

    const med = medicines.find(m => m.id === parseInt(adjMedId));
    if (!med) return;

    const adjustment = adjType === 'In' ? qtyVal : -qtyVal;
    const nextStock = Math.max(0, med.stock + adjustment);

    // Apply change
    setMedicines(medicines.map(m => 
      m.id === med.id ? { ...m, stock: nextStock } : m
    ));

    setInventoryLogs([
      {
        id: `TRX-${Date.now().toString().slice(-3)}`,
        date: new Date().toLocaleString(),
        medicineName: med.name,
        type: adjType === 'In' ? 'Stock In' : 'Stock Out',
        qty: qtyVal,
        user: role || 'Admin',
        remarks: adjRemarks || 'Manual adjustment'
      },
      ...inventoryLogs
    ]);

    alert('Inventory adjusted successfully.');
    setAdjQty('');
    setAdjRemarks('');
  };

  return {
    medicines,
    adjMedId,
    setAdjMedId,
    adjQty,
    setAdjQty,
    adjType,
    setAdjType,
    adjRemarks,
    setAdjRemarks,
    handleStockAdjustment,
    inventoryLogs
  };
}
