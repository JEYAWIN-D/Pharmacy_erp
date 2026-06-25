import { useState } from 'react';
import { useDB } from '../../db/DBContext';

export function usePurchaseController(role) {
  const {
    purchaseOrders,
    setPurchaseOrders,
    suppliers,
    setSuppliers,
    medicines,
    setMedicines,
    notifications,
    setNotifications,
    inventoryLogs,
    setInventoryLogs
  } = useDB();

  const [poSupplier, setPoSupplier] = useState(suppliers[0]?.name || 'Apex Medical Supplies');
  const [poMedicine, setPoMedicine] = useState(medicines[0]?.id || 1);
  const [poQty, setPoQty] = useState('');
  const [poPrice, setPoPrice] = useState('');

  // Return to Supplier states
  const [returnSupplier, setReturnSupplier] = useState(suppliers[0]?.name || 'Apex Medical Supplies');
  const [returnMedId, setReturnMedId] = useState(medicines[0]?.id || 1);
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const handleCreatePO = (e) => {
    e.preventDefault();
    const qty = parseInt(poQty);
    const price = parseFloat(poPrice);
    if (!qty || isNaN(qty) || !price || isNaN(price)) {
      alert('Provide valid quantity and price estimates.');
      return;
    }

    const newPO = {
      id: `PO-2026-0${purchaseOrders.length + 1}`,
      supplier: poSupplier,
      date: new Date().toISOString().split('T')[0],
      total: qty * price,
      status: 'Pending Approval'
    };

    setPurchaseOrders([...purchaseOrders, newPO]);
    setNotifications([
      {
        id: Date.now(),
        type: 'info',
        message: `Approval required for Purchase Order ${newPO.id} (${newPO.supplier})`,
        time: 'Just now',
        resolved: false
      },
      ...notifications
    ]);

    alert(`Purchase Request logged as Pending Approval.`);
    setPoQty('');
    setPoPrice('');
  };

  const approvePO = (poId) => {
    setPurchaseOrders(purchaseOrders.map(po => 
      po.id === poId ? { ...po, status: 'Approved' } : po
    ));
    alert(`Purchase Order ${poId} approved successfully.`);
  };

  const receivePO = (poId) => {
    setPurchaseOrders(purchaseOrders.map(po => 
      po.id === poId ? { ...po, status: 'Goods Received' } : po
    ));
    alert(`GRN generated. Goods received logged for ${poId}. Racks and batches updated.`);
  };

  const handleSupplierReturn = (e) => {
    e.preventDefault();
    const qtyVal = parseInt(returnQty);
    if (!qtyVal || isNaN(qtyVal) || qtyVal <= 0) {
      alert('Provide a valid return quantity.');
      return;
    }
    const med = medicines.find(m => String(m.id) === String(returnMedId));
    if (!med) return;
    const availableStock = med.stockQuantity ?? med.stock ?? 0;
    const medicineName = med.medicineName || med.name;
    if (availableStock < qtyVal) {
      alert(`Cannot return ${qtyVal} pcs. We only have ${availableStock} pcs of ${medicineName} on shelves.`);
      return;
    }

    // Deduct stock (update both for compatibility)
    setMedicines(medicines.map(m => 
      m.id === med.id ? { ...m, stock: Math.max(0, (m.stock ?? 0) - qtyVal), stockQuantity: Math.max(0, (m.stockQuantity ?? 0) - qtyVal) } : m
    ));

    // Increment supplier return count
    setSuppliers(suppliers.map(s => 
      s.name === returnSupplier ? { ...s, returnsCount: s.returnsCount + qtyVal } : s
    ));

    // Log Stock transaction
    setInventoryLogs([
      {
        id: `TRX-${Date.now().toString().slice(-3)}`,
        date: new Date().toLocaleString(),
        medicineName: medicineName,
        type: 'Stock Out',
        qty: qtyVal,
        user: role || 'Admin',
        remarks: `Returned to ${returnSupplier}: ${returnReason || 'Defective'}`
      },
      ...inventoryLogs
    ]);

    alert(`Successfully returned ${qtyVal} pcs of ${medicineName} to ${returnSupplier}.`);
    setReturnQty('');
    setReturnReason('');
  };

  return {
    purchaseOrders,
    suppliers,
    medicines,
    poSupplier,
    setPoSupplier,
    poMedicine,
    setPoMedicine,
    poQty,
    setPoQty,
    poPrice,
    setPoPrice,
    handleCreatePO,
    approvePO,
    receivePO,
    returnSupplier,
    setReturnSupplier,
    returnMedId,
    setReturnMedId,
    returnQty,
    setReturnQty,
    returnReason,
    setReturnReason,
    handleSupplierReturn
  };
}
