import { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';

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
    warehouses
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

  const handleWarehouseTransfer = (e) => {
    e.preventDefault();
    const qty = parseInt(transferQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      alert('Enter a valid transfer quantity.');
      return;
    }

    const med = medicines.find(m => m.id === parseInt(transferMedId));
    if (!med) {
      alert('Selected medicine not found.');
      return;
    }

    // Determine warehouse and outlet based on topology settings
    const activeWH = erpTopology === 'MultiplePharmacies_MultipleWarehouses' ? sourceWarehouse : 'Central Warehouse A';
    const activeOutlet = targetOutlet; // allow targeting any outlet in both modes

    if (transferDirection === 'RackToWH') {
      // Shop Shelf -> Warehouse
      // Find current stock at selected active outlet
      const currentOutletStockRecord = outletStocks.find(
        o => o.outlet === selectedOutlet && o.medicineId === med.id
      );
      const availableOutletStock = currentOutletStockRecord ? currentOutletStockRecord.stock : 0;

      if (availableOutletStock < qty) {
        alert(`Insufficient stock on Racks of ${selectedOutlet} (Current Stock: ${availableOutletStock} units).`);
        return;
      }

      // Deduct from outletStocks
      setOutletStocks(prev => prev.map(o => 
        (o.outlet === selectedOutlet && o.medicineId === med.id)
          ? { ...o, stock: o.stock - qty }
          : o
      ));

      // Add to warehouseStock
      setWarehouseStock(prev => {
        const whItemIdx = prev.findIndex(w => w.warehouseName === activeWH && w.medicineId === med.id);
        if (whItemIdx !== -1) {
          return prev.map((w, idx) => 
            idx === whItemIdx ? { ...w, qty: w.qty + qty } : w
          );
        } else {
          return [
            ...prev,
            {
              warehouseName: activeWH,
              medicineId: med.id,
              name: med.name,
              qty: qty,
              location: 'W-Overflow-Sect'
            }
          ];
        }
      });

      // Add logs
      setInventoryLogs([
        {
          id: `TRX-${Date.now().toString().slice(-3)}`,
          date: new Date().toLocaleString(),
          medicineName: med.name,
          type: 'Stock Out',
          qty: qty,
          user: role || 'Admin',
          remarks: `Moved from shelf (${selectedOutlet}) to Warehouse (${activeWH})`
        },
        ...inventoryLogs
      ]);

      alert(`Transferred ${qty} units of ${med.name} from shelf (${selectedOutlet}) to Warehouse (${activeWH}).`);
    } else {
      // Warehouse -> Shop Shelf
      // Check stock in warehouse
      const whItem = warehouseStock.find(w => w.warehouseName === activeWH && w.medicineId === med.id);
      const availableWHStock = whItem ? whItem.qty : 0;

      if (availableWHStock < qty) {
        alert(`Insufficient stock in ${activeWH} (Current Warehouse Stock: ${availableWHStock} units).`);
        return;
      }

      // Deduct from warehouseStock
      setWarehouseStock(prev => prev.map(w => 
        (w.warehouseName === activeWH && w.medicineId === med.id)
          ? { ...w, qty: w.qty - qty }
          : w
      ).filter(w => w.qty > 0 || w.warehouseName === 'Central Warehouse A')); // Keep placeholder if central

      // Add to target outletStocks
      setOutletStocks(prev => prev.map(o => 
        (o.outlet === activeOutlet && o.medicineId === med.id)
          ? { ...o, stock: o.stock + qty }
          : o
      ));

      // Add logs
      setInventoryLogs([
        {
          id: `TRX-${Date.now().toString().slice(-3)}`,
          date: new Date().toLocaleString(),
          medicineName: med.name,
          type: 'Stock In',
          qty: qty,
          user: role || 'Admin',
          remarks: `Received from Warehouse (${activeWH}) into shelf (${activeOutlet})`
        },
        ...inventoryLogs
      ]);

      alert(`Transferred ${qty} units of ${med.name} from Warehouse (${activeWH}) to shelf (${activeOutlet}).`);
    }
    setTransferQty('');
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
