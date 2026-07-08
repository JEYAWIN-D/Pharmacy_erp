import { useState, useMemo, useEffect } from 'react';
import { useDB } from '../../db/DBContext';
import { racksAPI, warehouseAPI, notificationsAPI } from '../../db/api';

/**
 * useRackController
 * MVC Controller hook for the Pharmacy Rack Management module.
 * Encapsulates all state management, derived data, and action handlers.
 * The View (RackView.jsx) consumes this hook and renders the UI.
 */
export function useRackController(role) {
  const { 
    racks: dbRacks, 
    refetch, 
    stockTransfers: dbStockTransfers, 
    medicines: dbAllMedicines, 
    notifications: dbNotifications, 
    setNotifications: setDbNotifications,
    warehouseStock: dbWarehouseStock
  } = useDB();

  const warehouseStock = dbWarehouseStock || [];

  // Trigger refetch once on mount to ensure fresh state
  useEffect(() => {
    refetch();
  }, [refetch]);

  // ──────────────────────────────────────────────────────────
  // VIEW STATE MANAGEMENT (Sub-pages)
  // ──────────────────────────────────────────────────────────
  const [viewState, setViewState] = useState('dashboard');
  const [selectedRackId, setSelectedRackId] = useState('A1');
  const [selectedCompId, setSelectedCompId] = useState('A1');
  const [activeModal, setActiveModal] = useState(null);

  // ──────────────────────────────────────────────────────────
  // REACTIVE REAL-TIME DATA (Model layer)
  // ──────────────────────────────────────────────────────────
  const racks = useMemo(() => {
    const list = [...(dbRacks || [])];
    if (!list.some(r => r.id === 'RACK-WH')) {
      list.push({
        id: 'RACK-WH',
        name: 'Main Warehouse',
        code: 'WH',
        type: 'Central Warehouse',
        category: 'Bulk Storage',
        maxCapacity: 10000,
        status: 'Active',
        compartments: [
          {
            id: 'COMP-WH1',
            name: 'Central Warehouse Bin A',
            maxCapacity: 10000,
            category: 'Bulk Storage',
            status: 'Active',
            createdBy: 'System',
            createdDate: '2026-01-01'
          }
        ]
      });
    }
    return list;
  }, [dbRacks]);

  const compartments = useMemo(() => {
    return racks.flatMap(r => (r.compartments || []).map(c => ({
      ...c,
      rackId: r.id
    })));
  }, [racks]);

  const storedMedicines = useMemo(() => {
    const list = [];
    racks.forEach(r => {
      if (r.compartments && r.compartments.length > 0) {
        r.compartments.forEach(c => {
          if (c.medicineLocations && c.medicineLocations.length > 0) {
            c.medicineLocations.forEach(ml => {
              list.push({
                id: String(ml.id),
                medicineId: ml.medicineId,
                name: ml.medicine?.medicineName || ml.medicine?.name || 'Unknown',
                brandName: ml.medicine?.brandName || '',
                batchNumber: ml.batchNumber || 'N/A',
                quantity: ml.qty,
                unit: ml.unit || 'Boxes',
                supplier: ml.medicine?.supplier?.name || 'Generic Supplier',
                addedBy: ml.medicine?.createdBy || 'Admin',
                addedDate: ml.createdAt?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                compartmentId: c.id,
                rackId: r.id
              });
            });
          }
        });
      }
      if (r.rackStocks && r.rackStocks.length > 0) {
        r.rackStocks.forEach(rs => {
          if (!list.some(item => item.rackId === r.id && item.medicineId === rs.medicineId && item.batchNumber === rs.batchNumber)) {
            list.push({
              id: rs.id,
              medicineId: rs.medicineId,
              name: rs.medicine?.medicineName || rs.medicine?.name || 'Unknown',
              brandName: rs.medicine?.brandName || '',
              batchNumber: rs.batchNumber || 'N/A',
              quantity: rs.qty,
              unit: 'Units',
              supplier: 'Supplier',
              addedBy: 'System',
              addedDate: rs.createdAt?.substring(0, 10) || new Date().toISOString().substring(0, 10),
              compartmentId: r.code + '1',
              rackId: r.id
            });
          }
        });
      }
    });

    // Add warehouse stocks as virtual compartment COMP-WH1 medicines:
    warehouseStock.forEach(ws => {
      list.push({
        id: `WS-${ws.id}`,
        medicineId: ws.medicineId,
        name: ws.medicine?.medicineName || ws.medicine?.name || 'Unknown',
        brandName: ws.medicine?.brandName || '',
        batchNumber: ws.batchNumber || 'N/A',
        quantity: ws.qty,
        unit: 'Boxes',
        supplier: ws.medicine?.supplier?.name || 'Generic Supplier',
        addedBy: ws.medicine?.createdBy || 'Admin',
        addedDate: ws.receivedDate?.substring(0, 10) || new Date().toISOString().substring(0, 10),
        compartmentId: 'COMP-WH1',
        rackId: 'RACK-WH'
      });
    });

    return list;
  }, [racks, warehouseStock]);

  const transferHistory = useMemo(() => {
    return (dbStockTransfers || []).map(t => ({
      transactionId: t.id,
      transferType: t.transferType || 'Rack to Rack',
      source: t.fromLocation || 'Unknown',
      destination: t.toRack || 'Unknown',
      medicineName: t.medicineName || 'Unknown',
      batchNumber: 'N/A',
      quantity: t.qty,
      doneBy: t.transferredBy || 'Admin',
      dateTime: t.createdAt?.replace('T', ' ').substring(0, 16) || new Date().toISOString().substring(0, 10),
      status: t.status || 'Completed'
    }));
  }, [dbStockTransfers]);

  const [localNotifications, setLocalNotifications] = useState([
    { id: 1, text: 'Rack system operational' }
  ]);

  // ──────────────────────────────────────────────────────────
  // HELPER UTILITIES
  // ──────────────────────────────────────────────────────────
  const addNotification = (text) => {
    setLocalNotifications(prev => [{ id: Date.now(), text }, ...prev]);
  };

  /**
   * Push a notification to the global DB (Warehouse alert feed).
   * Used when a stock request is raised from Rack Management.
   */
  const pushGlobalNotification = (message, type = 'warning') => {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      type,
      message,
      time: new Date().toLocaleString(),
      resolved: false,
      source: 'rack-management'
    };
    setDbNotifications(prev => [newNotif, ...prev]);
  };

  const getCompartmentUsage = (compId) => {
    return storedMedicines
      .filter(m => m.compartmentId === compId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getRackUsage = (rackId) => {
    const associatedComps = compartments.filter(c => c.rackId === rackId);
    return associatedComps.reduce((sum, c) => sum + getCompartmentUsage(c.id), 0);
  };

  const getRackTotalCapacity = (rackId) => {
    const associatedComps = compartments.filter(c => c.rackId === rackId);
    return associatedComps.reduce((sum, c) => sum + c.maxCapacity, 0);
  };

  // ──────────────────────────────────────────────────────────
  // DERIVED STATISTICS & ANALYTICS
  // ──────────────────────────────────────────────────────────
  const dashboardStats = useMemo(() => {
    const totalRacks = racks.length;
    const totalComps = compartments.length;
    const fullComps = compartments.filter(c => getCompartmentUsage(c.id) >= c.maxCapacity).length;
    const availComps = totalComps - fullComps;
    const whStock = storedMedicines
      .filter(m => m.compartmentId.startsWith('COMP-WH'))
      .reduce((sum, item) => sum + item.quantity, 0);
    const r2rTransfersCount = transferHistory.filter(t => t.transferType === 'Rack to Rack').length;
    const r2wTransfersCount = transferHistory.filter(t => t.transferType === 'Rack to Warehouse').length;
    return { totalRacks, totalComps, fullComps, availComps, whStock, r2rTransfersCount, r2wTransfersCount };
  }, [racks, compartments, storedMedicines, transferHistory]);

  const activeRack = useMemo(() => racks.find(r => r.id === selectedRackId), [racks, selectedRackId]);
  const activeCompartments = useMemo(() => compartments.filter(c => c.rackId === selectedRackId), [compartments, selectedRackId]);
  const activeCompartment = useMemo(() => compartments.find(c => c.id === selectedCompId), [compartments, selectedCompId]);
  const activeCompartmentUsage = useMemo(() => getCompartmentUsage(selectedCompId), [storedMedicines, selectedCompId]);
  const activeCompartmentMeds = useMemo(() => storedMedicines.filter(m => m.compartmentId === selectedCompId), [storedMedicines, selectedCompId]);

  // ──────────────────────────────────────────────────────────
  // ADD NEW RACK FORM STATE & HANDLER
  // ──────────────────────────────────────────────────────────
  const [rackNameInput, setRackNameInput] = useState('');
  const [rackCodeInput, setRackCodeInput] = useState('');
  const [rackTypeInput, setRackTypeInput] = useState('Dry Storage');
  const [rackCatInput, setRackCatInput] = useState('');
  const [rackCapInput, setRackCapInput] = useState('500');
  const [rackCompCountInput, setRackCompCountInput] = useState('5');
  const [rackLocationInput, setRackLocationInput] = useState('');
  const [rackDescInput, setRackDescInput] = useState('');
  const [rackStatusInput, setRackStatusInput] = useState('Active');

  const submitNewRack = async (e) => {
    e.preventDefault();
    if (!rackNameInput.trim() || !rackCodeInput.trim()) return;
    const targetId = rackCodeInput.trim().toUpperCase(); // Using code directly as ID matches seeded schema patterns

    try {
      const res = await racksAPI.create({
        id: targetId,
        name: rackNameInput.trim(),
        code: rackCodeInput.trim().toUpperCase(),
        type: rackTypeInput,
        category: rackCatInput || 'General',
        maxCapacity: parseInt(rackCapInput) || 500,
        location: rackLocationInput || 'Counter Area',
        description: rackDescInput || 'General Storage Rack',
        status: rackStatusInput,
        createdBy: role || 'Admin'
      });

      if (res.success) {
        await refetch();
        addNotification(`Rack ${rackNameInput.trim()} created successfully`);
        addNotification('Capacity updated successfully');
        setActiveModal(null);
        setRackNameInput(''); setRackCodeInput(''); setRackCatInput('');
        setRackLocationInput(''); setRackDescInput(''); setRackCompCountInput('5');
      }
    } catch (err) {
      alert('Error creating rack: ' + err.message);
    }
  };

  // ──────────────────────────────────────────────────────────
  // ADD NEW SUB-RACK (COMPARTMENT) FORM STATE & HANDLER
  // ──────────────────────────────────────────────────────────
  const [compNameInput, setCompNameInput] = useState('');
  const [compCatInput, setCompCatInput] = useState('');
  const [compTypeInput, setCompTypeInput] = useState('Boxes');
  const [compCapInput, setCompCapInput] = useState('100');
  const [compDescInput, setCompDescInput] = useState('');
  const [compStatusInput, setCompStatusInput] = useState('Active');

  const submitNewCompartment = async (e) => {
    e.preventDefault();
    if (!compNameInput.trim()) return;
    const genCompId = `COMP-${activeRack.code.toUpperCase()}-${compNameInput.trim().toUpperCase()}`;

    try {
      await racksAPI.createCompartment(selectedRackId, {
        id: genCompId,
        name: compNameInput.trim(),
        category: compCatInput || 'General',
        suitableType: compTypeInput,
        maxCapacity: parseInt(compCapInput) || 100,
        description: compDescInput || 'Shelf Partition Sub-Rack',
        status: compStatusInput,
        createdBy: role || 'Admin'
      });
      await refetch();
      addNotification(`${compNameInput.trim()} sub-rack added successfully`);
      addNotification('Capacity updated successfully');
      setActiveModal(null);
      setCompNameInput(''); setCompCatInput(''); setCompDescInput('');
    } catch (err) {
      alert('Error creating compartment: ' + err.message);
    }
  };

  // ──────────────────────────────────────────────────────────
  // ADD MEDICINE FORM STATE & HANDLER
  // ──────────────────────────────────────────────────────────
  const [medNameInput, setMedNameInput] = useState('');
  const [medBrandInput, setMedBrandInput] = useState('');
  const [medBatchInput, setMedBatchInput] = useState('');
  const [medQtyInput, setMedQtyInput] = useState('50');
  const [medUnitInput, setMedUnitInput] = useState('Boxes');
  const [medSupplierInput, setMedSupplierInput] = useState('');

  const submitAddMedicine = async (e) => {
    e.preventDefault();
    if (!medNameInput.trim() || !medBatchInput.trim()) return;
    const qtyVal = parseInt(medQtyInput) || 10;
    if (activeCompartmentUsage + qtyVal > activeCompartment.maxCapacity) {
      alert(`Capacity exceeded! Maximum allowed space left: ${activeCompartment.maxCapacity - activeCompartmentUsage} units.`);
      return;
    }

    const existingMed = dbAllMedicines.find(
      m => (m.name || '').toLowerCase() === medNameInput.trim().toLowerCase() ||
           (m.brandName || '').toLowerCase() === medNameInput.trim().toLowerCase() ||
           (m.medicineName || '').toLowerCase() === medNameInput.trim().toLowerCase()
    );

    if (!existingMed) {
      alert(`Medicine "${medNameInput}" not found in the database. Please add it to the Medicine Master catalog first.`);
      return;
    }

    try {
      await racksAPI.allocate({
        compartmentId: selectedCompId,
        medicineId: existingMed.id,
        qty: qtyVal,
        batchNumber: medBatchInput.trim().toUpperCase(),
        unit: medUnitInput,
        rackId: selectedRackId
      });
      await refetch();
      addNotification(`Medicine successfully allocated: ${existingMed.name || existingMed.medicineName} to ${activeCompartment.name}`);
      addNotification('Capacity updated successfully');
      setActiveModal(null);
      setMedNameInput(''); setMedBrandInput(''); setMedBatchInput(''); setMedSupplierInput('');
    } catch (err) {
      alert('Error allocating medicine to rack: ' + err.message);
    }
  };

  // ──────────────────────────────────────────────────────────
  // TRANSFER FORM STATES
  // ──────────────────────────────────────────────────────────
  const [xFromRack, setXFromRack] = useState('RACK-A');
  const [xFromComp, setXFromComp] = useState('COMP-A1');
  const [xToRack, setXToRack] = useState('RACK-B');
  const [xToComp, setXToComp] = useState('COMP-B1');
  const [xWHName, setXWHName] = useState('COMP-WH1');
  const [xMedName, setXMedName] = useState('');
  const [xBatch, setXBatch] = useState('');
  const [xQty, setXQty] = useState('25');
  const [xRemarks, setXRemarks] = useState('');
  const [xReason, setXReason] = useState('');

  const handleSourceCompChange = (compId) => {
    setXFromComp(compId);
    const availableMeds = storedMedicines.filter(m => m.compartmentId === compId);
    if (availableMeds.length > 0) { setXMedName(availableMeds[0].name); setXBatch(availableMeds[0].batchNumber); }
    else { setXMedName(''); setXBatch(''); }
  };

  const handleWHCompChange = (compId) => {
    setXWHName(compId);
    const availableMeds = storedMedicines.filter(m => m.compartmentId === compId);
    if (availableMeds.length > 0) { setXMedName(availableMeds[0].name); setXBatch(availableMeds[0].batchNumber); }
    else { setXMedName(''); setXBatch(''); }
  };

  const submitRackToRack = async (e) => {
    e.preventDefault();
    const qtyVal = parseInt(xQty);
    const sourceComp = compartments.find(c => c.id === xFromComp);
    const destComp = compartments.find(c => c.id === xToComp);
    if (!sourceComp || !destComp || !xMedName.trim() || isNaN(qtyVal) || qtyVal <= 0) return;
    const sourceMed = storedMedicines.find(m => m.compartmentId === xFromComp && m.name === xMedName);
    if (!sourceMed || sourceMed.quantity < qtyVal) {
      alert(`Insufficient stock. Available in ${sourceComp.name}: ${sourceMed ? sourceMed.quantity : 0} units.`); return;
    }
    const destUsage = getCompartmentUsage(xToComp);
    if (destUsage + qtyVal > destComp.maxCapacity) {
      alert(`Destination capacity exceeded. Space available: ${destComp.maxCapacity - destUsage} units.`); return;
    }

    try {
      const res = await racksAPI.transfer({
        sourceCompId: xFromComp,
        destCompId: xToComp,
        medicineId: sourceMed.medicineId,
        medicineName: sourceMed.name,
        qty: qtyVal,
        transferredBy: role || 'Admin',
        batchNumber: sourceMed.batchNumber,
        remarks: xRemarks || 'Rack to Rack Transfer'
      });

      if (res.success) {
        await refetch();
        addNotification('Stock transferred successfully');
        addNotification(`Stock moved from ${sourceComp.name} to ${destComp.name}`);
        addNotification('Capacity updated successfully');
        setActiveModal(null);
      }
    } catch (err) {
      alert('Error transferring stock: ' + err.message);
    }
  };

  const submitRackToWarehouse = async (e) => {
    e.preventDefault();
    const qtyVal = parseInt(xQty);
    const sourceComp = compartments.find(c => c.id === xFromComp);
    const whComp = compartments.find(c => c.id === xWHName);
    if (!sourceComp || !xMedName.trim() || isNaN(qtyVal) || qtyVal <= 0 || !whComp) return;
    const sourceMed = storedMedicines.find(m => m.compartmentId === xFromComp && m.name === xMedName);
    if (!sourceMed || sourceMed.quantity < qtyVal) {
      alert(`Insufficient stock. Available in ${sourceComp.name}: ${sourceMed ? sourceMed.quantity : 0} units.`); return;
    }

    try {
      const res = await warehouseAPI.createTransfer({
        transferType: 'Rack to Warehouse',
        medicineId: sourceMed.medicineId,
        medicineName: sourceMed.name,
        fromLocation: xFromComp,
        toRack: '00000000-0000-0000-0000-000000000001',
        qty: qtyVal,
        transferredBy: role || 'Admin',
        remarks: xRemarks || 'Rack to Warehouse Transfer',
        batchNumber: sourceMed.batchNumber
      });

      if (res.success) {
        await refetch();
        addNotification('Stock moved to warehouse successfully');
        addNotification(`Stock moved from ${sourceComp.name} to Warehouse`);
        addNotification('Capacity updated successfully');
        setActiveModal(null);
      }
    } catch (err) {
      alert('Error transferring stock to warehouse: ' + err.message);
    }
  };

  const submitWarehouseToRack = async (e) => {
    e.preventDefault();
    const qtyVal = parseInt(xQty);
    const destComp = compartments.find(c => c.id === xToComp);
    const whComp = compartments.find(c => c.id === xWHName);
    if (!destComp || !xMedName.trim() || isNaN(qtyVal) || qtyVal <= 0 || !whComp) return;
    const sourceMed = storedMedicines.find(m => m.compartmentId === xWHName && m.name === xMedName);
    if (!sourceMed || sourceMed.quantity < qtyVal) {
      alert(`Insufficient stock in warehouse sub-rack. Available: ${sourceMed ? sourceMed.quantity : 0} units.`); return;
    }
    const destUsage = getCompartmentUsage(xToComp);
    if (destUsage + qtyVal > destComp.maxCapacity) {
      alert(`Destination capacity exceeded. Space available: ${destComp.maxCapacity - destUsage} units.`); return;
    }

    try {
      const res = await warehouseAPI.createTransfer({
        transferType: 'Warehouse to Rack',
        medicineId: sourceMed.medicineId,
        medicineName: sourceMed.name,
        fromLocation: '00000000-0000-0000-0000-000000000001',
        toRack: xToComp,
        qty: qtyVal,
        transferredBy: role || 'Admin',
        remarks: xRemarks || 'Warehouse to Rack Transfer',
        batchNumber: sourceMed.batchNumber
      });

      if (res.success) {
        await refetch();
        addNotification('Stock moved from warehouse to rack successfully');
        addNotification(`Stock moved from Warehouse to ${destComp.name}`);
        addNotification('Capacity updated successfully');
        setActiveModal(null);
      }
    } catch (err) {
      alert('Error transferring stock from warehouse: ' + err.message);
    }
  };

  // ──────────────────────────────────────────────────────────
  // STOCK REQUEST FROM WAREHOUSE (Cross-module notification)
  // ──────────────────────────────────────────────────────────
  const [reqMedName, setReqMedName] = useState('');
  const [reqQty, setReqQty] = useState('50');
  const [reqReason, setReqReason] = useState('');
  const [reqRackId, setReqRackId] = useState('COMP-A1');

  const submitStockRequest = async (e) => {
    e.preventDefault();
    if (!reqMedName.trim() || !reqQty || parseInt(reqQty) <= 0) {
      alert('Please fill in medicine name and a valid quantity.'); return;
    }
    const qtyVal = parseInt(reqQty);
    const rackLabel = compartments.find(c => c.id === reqRackId)?.name || reqRackId;
    const message = `📦 Stock Request: Rack [${rackLabel}] requested ${qtyVal} units of "${reqMedName.trim()}" from Warehouse. Reason: ${reqReason.trim() || 'Low stock'}`;

    try {
      // Create server-side notification
      await notificationsAPI.create({
        type: 'warning',
        message: message,
        resolved: false
      });

      // Also request transfer (logs as request/pending if applicable)
      await refetch();
      addNotification(`Stock request sent: ${qtyVal} units of ${reqMedName.trim()}`);
      alert(`✅ Stock request for ${qtyVal} units of "${reqMedName.trim()}" has been submitted to Warehouse Management. The warehouse admin will be notified.`);
      setActiveModal(null);
      setReqMedName(''); setReqQty('50'); setReqReason('');
    } catch (err) {
      alert('Error submitting stock request: ' + err.message);
    }
  };

  // ──────────────────────────────────────────────────────────
  // TRANSACTION LEDGER FILTERS
  // ──────────────────────────────────────────────────────────
  const [filterType, setFilterType] = useState('All');
  const [filterFromRack, setFilterFromRack] = useState('All');
  const [filterToRack, setFilterToRack] = useState('All');
  const [filterMedName, setFilterMedName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredHistory = useMemo(() => {
    return transferHistory.filter(t => {
      const typeMatch = filterType === 'All' || t.transferType === filterType;
      const fromMatch = filterFromRack === 'All' || t.source.includes(filterFromRack);
      const toMatch = filterToRack === 'All' || t.destination.includes(filterToRack);
      const medMatch = !filterMedName.trim() || t.medicineName.toLowerCase().includes(filterMedName.toLowerCase());
      const dateMatch = !filterDate || t.dateTime.includes(filterDate);
      const statusMatch = filterStatus === 'All' || t.status === filterStatus;
      return typeMatch && fromMatch && toMatch && medMatch && dateMatch && statusMatch;
    });
  }, [transferHistory, filterType, filterFromRack, filterToRack, filterMedName, filterDate, filterStatus]);

  // ──────────────────────────────────────────────────────────
  // EXPOSED INTERFACE
  // ──────────────────────────────────────────────────────────
  return {
    // View state
    viewState, setViewState, selectedRackId, setSelectedRackId,
    selectedCompId, setSelectedCompId, activeModal, setActiveModal,
    // Data
    racks, compartments, storedMedicines, transferHistory, localNotifications,
    // Derived
    dashboardStats, activeRack, activeCompartments, activeCompartment,
    activeCompartmentUsage, activeCompartmentMeds, filteredHistory,
    // Helpers
    getCompartmentUsage, getRackUsage, getRackTotalCapacity, addNotification,
    // New Rack form
    rackNameInput, setRackNameInput, rackCodeInput, setRackCodeInput,
    rackTypeInput, setRackTypeInput, rackCatInput, setRackCatInput,
    rackCapInput, setRackCapInput, rackCompCountInput, setRackCompCountInput,
    rackLocationInput, setRackLocationInput, rackDescInput, setRackDescInput,
    rackStatusInput, setRackStatusInput, submitNewRack,
    // New Compartment form
    compNameInput, setCompNameInput, compCatInput, setCompCatInput,
    compTypeInput, setCompTypeInput, compCapInput, setCompCapInput,
    compDescInput, setCompDescInput, compStatusInput, setCompStatusInput,
    submitNewCompartment,
    // Add Medicine form
    medNameInput, setMedNameInput, medBrandInput, setMedBrandInput,
    medBatchInput, setMedBatchInput, medQtyInput, setMedQtyInput,
    medUnitInput, setMedUnitInput, medSupplierInput, setMedSupplierInput,
    submitAddMedicine,
    // Transfer forms
    xFromRack, setXFromRack, xFromComp, setXFromComp,
    xToRack, setXToRack, xToComp, setXToComp,
    xWHName, setXWHName, xMedName, setXMedName,
    xBatch, setXBatch, xQty, setXQty, xRemarks, setXRemarks,
    xReason, setXReason,
    handleSourceCompChange, handleWHCompChange,
    submitRackToRack, submitRackToWarehouse, submitWarehouseToRack,
    // Stock Request from Warehouse
    reqMedName, setReqMedName, reqQty, setReqQty,
    reqReason, setReqReason, reqRackId, setReqRackId,
    submitStockRequest,
    // Ledger filters
    filterType, setFilterType, filterFromRack, setFilterFromRack,
    filterToRack, setFilterToRack, filterMedName, setFilterMedName,
    filterDate, setFilterDate, filterStatus, setFilterStatus
  };
}
