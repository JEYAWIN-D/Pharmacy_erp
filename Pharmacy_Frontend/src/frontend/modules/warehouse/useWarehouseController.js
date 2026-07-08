import { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';
import { warehouseAPI } from '../../db/api';

export function useWarehouseController(role) {
  const {
    medicines,
    warehouseStock,
    setWarehouseStock,
    inventoryLogs,
    setInventoryLogs,
    outletStocks,
    setOutletStocks,
    selectedOutlet,
    selectedWarehouse,
    erpTopology,
    setErpTopology,
    warehouses,
    refetch
  } = useDB();

  const [transferMedId, setTransferMedId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferDirection, setTransferDirection] = useState('RackToWH');
  
  // Custom states for Source Warehouse and Target Outlet in transfers
  const [sourceWarehouse, setSourceWarehouse] = useState(selectedWarehouse);
  const [targetOutlet, setTargetOutlet] = useState(selectedOutlet);

  // Set default medicine when medicines load
  useEffect(() => {
    if (medicines.length > 0 && !transferMedId) {
      setTransferMedId(medicines[0].id);
    }
  }, [medicines, transferMedId]);

  // Keep dropdown values in sync with active configurations
  useEffect(() => {
    setSourceWarehouse(selectedWarehouse);
  }, [selectedWarehouse]);

  useEffect(() => {
    setTargetOutlet(selectedOutlet);
  }, [selectedOutlet]);

  const handleWarehouseTransfer = async (e) => {
    e.preventDefault();
    const qty = parseInt(transferQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      alert('Enter a valid transfer quantity.');
      return;
    }

    const med = medicines.find(m => m.id === transferMedId);
    if (!med) {
      alert('Selected medicine not found.');
      return;
    }

    try {
      const type = transferDirection === 'RackToWH' ? 'Rack to Warehouse' : 'Warehouse to Rack';
      await warehouseAPI.transfer({
        transferType: type,
        medicineId: med.id,
        fromLocation: transferDirection === 'RackToWH' ? targetOutlet : sourceWarehouse,
        toRack: transferDirection === 'RackToWH' ? sourceWarehouse : targetOutlet,
        qty,
        transferredBy: role || 'Admin',
        remarks: `${type}: ${qty} units of ${med.name || med.medicineName}`,
        batchNumber: ""
      });

      alert(`Successfully transferred ${qty} units of ${med.name || med.medicineName}.`);
      setTransferQty('');
      refetch();
    } catch (err) {
      alert('Transfer failed: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  return {
    medicines,
    warehouseStock,
    transferMedId,
    setTransferMedId,
    transferQty,
    setTransferQty,
    transferDirection,
    setTransferDirection,
    sourceWarehouse,
    setSourceWarehouse,
    targetOutlet,
    setTargetOutlet,
    selectedOutlet,
    selectedWarehouse,
    erpTopology,
    setErpTopology,
    warehouses,
    handleWarehouseTransfer
  };
}
