import React, { useState, useEffect } from 'react';
import { useDB } from '../../db/DBContext';
import { 
  Building2, Package, ArrowLeftRight, Activity, Thermometer, ShieldAlert, 
  Plus, Edit3, Eye, FileText, CheckCircle2, AlertTriangle, AlertCircle,
  Truck, ArrowRight, ShieldCheck, ClipboardList, Info, FileSpreadsheet, X, Search, Filter, TrendingUp, Calendar, Lock, Users, ChevronRight, Layers, FileSignature, CheckSquare, PlusCircle, Database, Bell
} from 'lucide-react';
import { warehouseAPI, racksAPI, inventoryAPI } from '../../db/api';

export default function WarehouseView({ role, setSchemaModalTable }) {
  // ── SECURITY ACCESS CHECK ──
  if (role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-emerald-100 p-12 shadow-sm text-center">
        <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Lock size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">Admin Access Only</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
          The Enterprise Warehouse Management module is locked. Switch your active role to <strong className="text-emerald-700">Admin</strong> in the header bar to unlock full administrative controls.
        </p>
      </div>
    );
  }

  // ── DATABASE CONTEXT STATE ──
  const {
    medicines,
    setMedicines,
    warehouseStock,
    setWarehouseStock,
    outletStocks,
    setOutletStocks,
    inventoryLogs,
    setInventoryLogs,
    notifications,
    setNotifications,
    auditLogs,
    setAuditLogs,
    batches,
    setBatches
  } = useDB();

  // ── LOCAL STATES FOR WAREHOUSES & OPERATIONS ──
  // Warehouses list
  const [warehousesList, setWarehousesList] = useState([]);

  // Racks and Compartments inside Warehouses
  const [racksData, setRacksData] = useState([]);

  // Warehouse Documents
  const [documents, setDocuments] = useState([
    { id: 'DOC-001', name: 'Drug License', uploadDate: '2026-01-10', expiryDate: '2028-12-31', status: 'Active' },
    { id: 'DOC-002', name: 'GST Certificate', uploadDate: '2026-01-12', expiryDate: '2031-12-31', status: 'Active' },
    { id: 'DOC-003', name: 'Fire Safety Certificate', uploadDate: '2026-02-15', expiryDate: '2027-02-15', status: 'Active' },
    { id: 'DOC-004', name: 'Warehouse Agreement', uploadDate: '2026-01-01', expiryDate: '2029-01-01', status: 'Active' }
  ]);

  // Cold Storage Temperature logs
  const [tempLogs, setTempLogs] = useState([
    { logId: 'TLOG-001', date: '2026-06-19 09:00 AM', temperature: 4.1, status: 'Stable' },
    { logId: 'TLOG-002', date: '2026-06-19 08:00 AM', temperature: 4.3, status: 'Stable' },
    { logId: 'TLOG-003', date: '2026-06-19 07:00 AM', temperature: 4.2, status: 'Stable' },
    { logId: 'TLOG-004', date: '2026-06-19 06:00 AM', temperature: 4.0, status: 'Stable' },
    { logId: 'TLOG-005', date: '2026-06-19 05:00 AM', temperature: 3.9, status: 'Stable' }
  ]);

  // Warehouse-to-Warehouse Stock Transfers
  const [warehouseTransfers, setWarehouseTransfers] = useState([]);

  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        const whRes = await warehouseAPI.getWarehouses();
        if (whRes.success) setWarehousesList(whRes.data);

        const stockRes = await warehouseAPI.getStock();
        if (stockRes.success) setWarehouseStock(stockRes.data);

        const transRes = await warehouseAPI.getTransfers();
        if (transRes.success) setWarehouseTransfers(transRes.data);

        const racksRes = await racksAPI.getAll();
        if (racksRes.success) setRacksData(racksRes.data);
      } catch (err) {
        console.error("Failed to fetch warehouse data:", err);
      }
    };
    fetchWarehouseData();
  }, [setWarehouseStock]);

  // ── ACTIVE NAVIGATION SUB-VIEWS ──
  // 'dashboard' or 'warehouse-details'
  const [activeSubView, setActiveSubView] = useState('dashboard');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [detailsTab, setDetailsTab] = useState('info'); // info, inventory, racks, transfers, history, docs

  // Active Rack explorer state
  const [activeRackId, setActiveRackId] = useState(null); // e.g. 'RACK-A'
  const [activeCompartmentId, setActiveCompartmentId] = useState(null); // e.g. 'A1'

  // Search & Filter state for Inventory table
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBatch, setSearchBatch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  // ── MODAL STATES ──
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState(null);

  const [isTransferW2WOpen, setIsTransferW2WOpen] = useState(false);
  const [isTransferW2ROpen, setIsTransferW2ROpen] = useState(false);
  const [isTransferR2WOpen, setIsTransferR2WOpen] = useState(false);
  const [isGRNOpen, setIsGRNOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isAddCompartmentOpen, setIsAddCompartmentOpen] = useState(false);

  // ── FORM BINDINGS ──
  // Add/Edit Warehouse
  const [formDataWH, setFormDataWH] = useState({
    code: '', name: '', type: 'Branch', parentWarehouse: 'Main Warehouse',
    address: '', city: '', state: '', pincode: '', gps: '',
    licenseNumber: '', licenseExpiry: '', gst: '',
    contactPerson: '', contactNumber: '', email: '',
    storageCapacity: '', tempZone: 'Controlled Room Temp (20°C to 25°C)', status: 'Active'
  });

  // Transfer W2W
  const [formW2W, setFormW2W] = useState({
    source: 'Main Warehouse', dest: 'Branch Warehouse 1', medicineId: '', batchNumber: '', qty: '',
    reason: '', requestedBy: 'Admin', dispatchDate: '', expectedArrival: '', remarks: ''
  });

  // Transfer W2R
  const [formW2R, setFormW2R] = useState({
    warehouse: 'Main Warehouse', rackId: 'RACK-A', compartmentId: 'A1',
    medicineId: '', batchNumber: '', qty: '', date: '', remarks: ''
  });

  // Transfer R2W
  const [formR2W, setFormR2W] = useState({
    rackId: 'RACK-A', compartmentId: 'A1', warehouse: 'Main Warehouse',
    medicineId: '', batchNumber: '', qty: '', reason: '', date: ''
  });

  // GRN Receipt
  const [formGRN, setFormGRN] = useState({
    grnNumber: '', supplier: 'Apex Medical Supplies', invoiceNumber: '',
    medicineId: '', batchNumber: '', qty: '', mfgDate: '', expiryDate: '',
    warehouse: 'Main Warehouse', rackAllocation: 'A1'
  });

  // Stock Adjustment
  const [formAdj, setFormAdj] = useState({
    medicineId: '', batchNumber: '', qty: '', reason: 'Damaged Stock', remarks: ''
  });

  // Add Compartment
  const [formComp, setFormComp] = useState({
    name: '', category: 'Analgesic', capacity: '500'
  });

  // Pre-populate medicine details inside selected compartment view
  const currentSelectedWH = warehousesList.find(w => w.id === selectedWarehouseId);

  // Derive inventory items dynamically joining warehouseStock + medicines
  const derivedInventory = React.useMemo(() => {
    return warehouseStock.map((w, idx) => {
      const med = w.medicine || {};
      const wh = w.warehouse || {};
      return {
        id: w.id || `INV-WH-${idx + 100}`,
        medicineId: w.medicineId,
        name: med.medicineName || w.name || 'Unknown',
        genericName: med.genericName || 'Generic Formulation',
        brandName: med.brandName || 'Brand Name',
        batchNumber: w.batchNumber || 'B-LOT-99',
        mfgDate: '2025-10-12',
        expiryDate: '2027-12-31',
        qty: w.qty,
        unit: 'Units',
        rackLocation: w.locationBin || 'Unallocated',
        warehouseLocation: wh.name || w.warehouseName || 'Central Warehouse A',
        supplier: med.companyName || 'Supplier',
        status: w.qty > 0 ? 'Active' : 'Empty',
        movementStatus: w.movementStatus || 'In warehouse'
      };
    });
  }, [warehouseStock]);

  // Sync default medicine and warehouse IDs in forms
  useEffect(() => {
    if (medicines.length > 0) {
      setFormW2W(prev => ({ ...prev, medicineId: medicines[0].id.toString() }));
      setFormW2R(prev => ({ ...prev, medicineId: medicines[0].id.toString() }));
      setFormR2W(prev => ({ ...prev, medicineId: medicines[0].id.toString() }));
      setFormGRN(prev => ({ ...prev, medicineId: medicines[0].id.toString() }));
      setFormAdj(prev => ({ ...prev, medicineId: medicines[0].id.toString() }));
    }
    if (warehousesList.length > 0) {
      setFormW2R(prev => ({ ...prev, warehouse: warehousesList[0].id }));
      setFormR2W(prev => ({ ...prev, warehouse: warehousesList[0].id }));
    }
  }, [medicines, warehousesList]);

  // Compute metrics dynamically for the main dashboard
  const totalWHCount = warehousesList.length;
  const activeWHCount = warehousesList.filter(w => w.status === 'Active').length;
  const branchWHCount = warehousesList.filter(w => w.type === 'Branch').length;

  const totalStockQty = warehouseStock.reduce((sum, item) => sum + item.qty, 0);

  // Main stock value (join with medicine price)
  const totalWHStockValue = warehouseStock.reduce((sum, w) => {
    const med = medicines.find(m => m.id === w.medicineId);
    const price = med ? med.price : 10;
    return sum + (w.qty * price);
  }, 0);

  const pendingTransfersCount = warehouseTransfers.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;

  // Near Expiry batches (< 90 days from today)
  const nearExpiryBatchesCount = batches.filter(b => {
    const exp = new Date(b.expiryDate);
    const diff = exp.getTime() - new Date().getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 && days < 90;
  }).length;

  // Low stock items in warehouse (qty < 50)
  const lowStockItemsCount = warehouseStock.filter(w => w.qty < 50).length;

  // Capacity utilization percentage
  const totalCapacitySum = warehousesList.reduce((sum, w) => sum + (w.storageCapacity || 1000), 0);
  const capacityUtilization = Math.min(100, Math.round((totalStockQty / totalCapacitySum) * 100)) || 0;


  // ── CUSTOM HELPER FOR AUDIT LOG & NOTIFICATIONS ──
  const triggerAuditAndAlert = (actionText, prevVal = 'N/A', newVal = 'N/A', module = 'Warehouse Management', alertMsg) => {
    const timestamp = new Date().toLocaleString();
    
    // Add Notification
    setNotifications(prev => [
      { id: Date.now(), type: 'success', message: alertMsg, time: 'Just now', resolved: false },
      ...prev
    ]);

    // Add Audit Log
    setAuditLogs(prev => [
      { id: `LOG-${Date.now().toString().slice(-3)}`, timestamp, user: 'Admin', action: actionText, details: `Prev: ${prevVal} | New: ${newVal}`, module },
      ...prev
    ]);
  };


  // ── CRUD HANDLERS ──

  // Add Warehouse
  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formDataWH,
        storageCapacity: parseInt(formDataWH.storageCapacity) || 1000,
        createdBy: 'Admin'
      };
      
      const res = await warehouseAPI.createWarehouse(payload);
      
      if (res.success) {
        setWarehousesList(prev => [...prev, res.data]);
        setIsAddWarehouseOpen(false);

        // Dynamic audit + alert
        triggerAuditAndAlert(
          'Create Warehouse',
          'None',
          `${res.data.name} (${res.data.code})`,
          'Warehouse Management',
          `Warehouse ${res.data.name} Created Successfully`
        );

        // Reset Form
        setFormDataWH({
          code: '', name: '', type: 'Branch', parentWarehouse: 'Main Warehouse',
          address: '', city: '', state: '', pincode: '', gps: '',
          licenseNumber: '', licenseExpiry: '', gst: '',
          contactPerson: '', contactNumber: '', email: '',
          storageCapacity: '', tempZone: 'Controlled Room Temp (20°C to 25°C)', status: 'Active'
        });
      }
    } catch (err) {
      alert("Error adding warehouse: " + err.message);
    }
  };

  // Edit Warehouse
  const handleEditWarehouse = (e) => {
    e.preventDefault();
    setWarehousesList(prev => prev.map(w => w.id === warehouseToEdit.id ? { ...w, ...formDataWH } : w));
    setIsEditWarehouseOpen(false);

    triggerAuditAndAlert(
      'Update Warehouse Specs',
      warehouseToEdit.name,
      formDataWH.name,
      'Warehouse Management',
      `Warehouse details updated successfully for ${formDataWH.name}`
    );
  };

  // Trigger Edit Form Pre-fill
  const openEditModal = (wh) => {
    setWarehouseToEdit(wh);
    setFormDataWH({
      code: wh.code, name: wh.name, type: wh.type, parentWarehouse: wh.parentWarehouse,
      address: wh.address, city: wh.city, state: wh.state, pincode: wh.pincode, gps: wh.gps,
      licenseNumber: wh.licenseNumber, licenseExpiry: wh.licenseExpiry, gst: wh.gst,
      contactPerson: wh.contactPerson, contactNumber: wh.contactNumber, email: wh.email,
      storageCapacity: wh.storageCapacity, tempZone: wh.tempZone, status: wh.status
    });
    setIsEditWarehouseOpen(true);
  };


  // ── TRANSFER OPERATIONS ──

  // 1. Warehouse to Warehouse (W2W)
  const handleW2WSubmit = (e) => {
    e.preventDefault();
    const selectedMed = medicines.find(m => m.id === formW2W.medicineId);
    if (!selectedMed) return;

    const qty = parseInt(formW2W.qty);
    if (qty <= 0 || isNaN(qty)) {
      alert('Enter a valid transfer quantity');
      return;
    }

    // Verify stock at source
    const sourceWHStock = warehouseStock.find(w => w.warehouseName === formW2W.source && w.medicineId === selectedMed.id);
    if (!sourceWHStock || sourceWHStock.qty < qty) {
      alert(`Insufficient stock in ${formW2W.source}. Available: ${sourceWHStock ? sourceWHStock.qty : 0} units.`);
      return;
    }

    // Register Transfer
    const trfId = `TRF-W2W-${Date.now().toString().slice(-4)}`;
    const newTransfer = {
      id: trfId,
      sourceWarehouse: formW2W.source,
      destWarehouse: formW2W.dest,
      medicineName: selectedMed.name,
      batchNumber: formW2W.batchNumber || 'B-GEN-01',
      qty,
      reason: formW2W.reason || 'General Restocking',
      requestedBy: formW2W.requestedBy,
      approvedBy: 'Admin',
      dispatchDate: formW2W.dispatchDate || new Date().toISOString().split('T')[0],
      arrivalDate: formW2W.expectedArrival || new Date().toISOString().split('T')[0],
      remarks: formW2W.remarks,
      status: 'Requested'
    };

    setWarehouseTransfers(prev => [newTransfer, ...prev]);
    setIsTransferW2WOpen(false);

    triggerAuditAndAlert(
      'W2W Transfer Requested',
      'None',
      `${qty} units of ${selectedMed.name} from ${formW2W.source} to ${formW2W.dest}`,
      'Warehouse Operations',
      `Transfer Request ${trfId} Created`
    );
  };

  // Process W2W Transfer Status Workflow
  const processTransferWorkflow = (trfId, nextStatus) => {
    setWarehouseTransfers(prev => prev.map(t => {
      if (t.id !== trfId) return t;

      // When transitioning to Completed, update active stock quantities
      if (nextStatus === 'Completed') {
        const selectedMed = medicines.find(m => m.name === t.medicineName);
        if (selectedMed) {
          // Deduct from source warehouse
          setWarehouseStock(whStock => {
            let updated = whStock.map(w => {
              if (w.warehouseName === t.sourceWarehouse && w.medicineId === selectedMed.id) {
                return { ...w, qty: Math.max(0, w.qty - t.qty) };
              }
              return w;
            }).filter(w => w.qty > 0 || w.warehouseName === 'Central Warehouse A');
            return updated;
          });

          // Add to destination warehouse
          setWarehouseStock(whStock => {
            const destExists = whStock.find(w => w.warehouseName === t.destWarehouse && w.medicineId === selectedMed.id);
            if (destExists) {
              return whStock.map(w => {
                if (w.warehouseName === t.destWarehouse && w.medicineId === selectedMed.id) {
                  return { ...w, qty: w.qty + t.qty };
                }
                return w;
              });
            } else {
              return [
                ...whStock,
                { warehouseName: t.destWarehouse, medicineId: selectedMed.id, name: selectedMed.name, qty: t.qty, location: 'Overflow-Sec' }
              ];
            }
          });
        }
      }

      return { ...t, status: nextStatus };
    }));

    const alertMessage = nextStatus === 'Approved' ? 'Transfer Approved' : nextStatus === 'Completed' ? 'Transfer Completed' : `Transfer status updated to ${nextStatus}`;
    triggerAuditAndAlert(
      `W2W State Switch: ${nextStatus}`,
      'Pending',
      trfId,
      'Warehouse Operations',
      alertMessage
    );
  };


  // 2. Warehouse to Rack Transfer (W2R)
  const handleW2RSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(formW2R.qty);
    if (qty <= 0 || isNaN(qty)) return alert('Enter a valid transfer quantity');

    try {
      const selectedMed = medicines.find(m => m.id === formW2R.medicineId);
      const res = await warehouseAPI.createTransfer({
        transferType: 'Warehouse to Rack',
        medicineId: formW2R.medicineId,
        medicineName: selectedMed?.name || 'Unknown',
        fromLocation: formW2R.warehouse,
        toRack: formW2R.compartmentId,
        qty,
        transferredBy: 'Admin',
        remarks: formW2R.remarks,
        batchNumber: formW2R.batchNumber
      });

      if (res.success) {
        setIsTransferW2ROpen(false);
        triggerAuditAndAlert('Warehouse to Rack Transfer', `Warehouse stock`, `Rack stock increase`, 'Rack Operations', `Transferred ${qty} units to Rack`);
        
        // Refresh data from API
        const stockRes = await warehouseAPI.getStock();
        if (stockRes.success) setWarehouseStock(stockRes.data);
        const transRes = await warehouseAPI.getTransfers();
        if (transRes.success) setWarehouseTransfers(transRes.data);
        const racksRes = await racksAPI.getAll();
        if (racksRes.success) setRacksData(racksRes.data);
      }
    } catch (err) {
      alert("Transfer Error: " + err.message);
    }
  };


  // 3. Rack to Warehouse Transfer (R2W)
  const handleR2WSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(formR2W.qty);
    if (qty <= 0 || isNaN(qty)) return alert('Enter a valid transfer quantity');

    try {
      const selectedMed = medicines.find(m => m.id === formR2W.medicineId);
      const res = await warehouseAPI.createTransfer({
        transferType: 'Rack to Warehouse',
        medicineId: formR2W.medicineId,
        medicineName: selectedMed?.name || 'Unknown',
        fromLocation: formR2W.compartmentId,
        toRack: formR2W.warehouse,
        qty,
        transferredBy: 'Admin',
        remarks: formR2W.reason,
        batchNumber: formR2W.batchNumber
      });

      if (res.success) {
        setIsTransferR2WOpen(false);
        triggerAuditAndAlert('Rack to Warehouse Transfer', `Rack stock`, `Warehouse stock increase`, 'Warehouse Operations', `Transferred ${qty} units to Warehouse`);
        
        // Refresh data from API
        const stockRes = await warehouseAPI.getStock();
        if (stockRes.success) setWarehouseStock(stockRes.data);
        const transRes = await warehouseAPI.getTransfers();
        if (transRes.success) setWarehouseTransfers(transRes.data);
        const racksRes = await racksAPI.getAll();
        if (racksRes.success) setRacksData(racksRes.data);
      }
    } catch (err) {
      alert("Transfer Error: " + err.message);
    }
  };


  // 4. Purchase Goods Receipt (GRN)
  const handleGRNSubmit = async (e) => {
    e.preventDefault();
    const selectedMed = medicines.find(m => m.id === formGRN.medicineId);
    if (!selectedMed) return;

    const qty = parseInt(formGRN.qty);
    if (qty <= 0 || isNaN(qty)) {
      alert('Enter a valid receive quantity');
      return;
    }

    try {
      const currentStockRecord = warehouseStock.find(w => w.warehouseId === selectedWarehouseId && w.medicineId === selectedMed.id);
      const currentQty = currentStockRecord ? currentStockRecord.qty : 0;
      const newQty = currentQty + qty;

      const res = await warehouseAPI.updateStock({
        warehouseId: selectedWarehouseId || 'Central Warehouse A',
        medicineId: selectedMed.id,
        qty: newQty,
        locationBin: `Rack ${formGRN.rackAllocation}`
      });

      if (res.success) {
        await inventoryAPI.adjust({
          medicineId: selectedMed.id,
          qty: qty,
          type: 'Stock In',
          remarks: `Purchase Received from ${formGRN.supplier} | Invoice #${formGRN.invoiceNumber}`
        });

        setIsGRNOpen(false);

        triggerAuditAndAlert(
          'Purchase Goods Receipt Logged',
          'None',
          `${qty} units of ${selectedMed.name} (Batch: ${formGRN.batchNumber}) allocated to WH ${formGRN.warehouse} / Rack ${formGRN.rackAllocation}`,
          'Purchase Operations',
          `Stock Received Successfully from ${formGRN.supplier}`
        );

        // Refresh data
        const stockRes = await warehouseAPI.getStock();
        if (stockRes.success) setWarehouseStock(stockRes.data);
      }
    } catch (err) {
      alert("GRN Error: " + err.message);
    }
  };


  // 5. Stock Adjustment
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    const selectedMed = medicines.find(m => m.id === formAdj.medicineId);
    if (!selectedMed) return;

    const qty = parseInt(formAdj.qty);
    if (qty <= 0 || isNaN(qty)) {
      alert('Enter a valid adjustment quantity');
      return;
    }

    try {
      const currentStockRecord = warehouseStock.find(w => w.warehouseId === selectedWarehouseId && w.medicineId === selectedMed.id);
      const currentQty = currentStockRecord ? currentStockRecord.qty : 0;
      const newQty = Math.max(0, currentQty - qty);

      const res = await warehouseAPI.updateStock({
        warehouseId: selectedWarehouseId,
        medicineId: selectedMed.id,
        qty: newQty,
        locationBin: currentStockRecord?.locationBin || 'Unallocated'
      });

      if (res.success) {
        await inventoryAPI.adjust({
          medicineId: selectedMed.id,
          qty: -qty,
          type: 'Adjustment',
          remarks: `${formAdj.reason} - ${formAdj.remarks}`
        });

        setIsAdjustmentOpen(false);

        triggerAuditAndAlert(
          'Stock Adjustment Logged',
          `Warehouse Stock deducted by ${qty}`,
          `${formAdj.reason} applied.`,
          'Warehouse Operations',
          `Stock Adjustment Completed: ${formAdj.reason}`
        );

        // Refresh data
        const stockRes = await warehouseAPI.getStock();
        if (stockRes.success) setWarehouseStock(stockRes.data);
      }
    } catch (err) {
      alert("Adjustment Error: " + err.message);
    }
  };


  // 6. Add Compartment
  const handleAddCompartment = async (e) => {
    e.preventDefault();
    if (!formComp.name) {
      alert('Please fill out the compartment name');
      return;
    }

    const genCompId = `COMP-${activeRackId.split('-')[1] || activeRackId}-${formComp.name.toUpperCase()}`;

    try {
      const res = await racksAPI.createCompartment(activeRackId, {
        id: genCompId,
        name: formComp.name,
        category: formComp.category || 'Analgesic',
        maxCapacity: parseInt(formComp.capacity) || 500,
        status: 'Active',
        createdBy: 'Admin'
      });

      if (res.success) {
        setIsAddCompartmentOpen(false);

        triggerAuditAndAlert(
          'Add Sub-Rack Compartment',
          'None',
          `Added compartment ${formComp.name} to Rack ${activeRackId}`,
          'Rack Allocation Operations',
          `Compartment ${formComp.name} added successfully`
        );

        // Refresh racks
        const racksRes = await racksAPI.getAll();
        if (racksRes.success) setRacksData(racksRes.data);
      }
    } catch (err) {
      alert("Error adding compartment: " + err.message);
    }
  };


  // ── INVENTORY GRID FILTER LOGIC ──
  const filteredInventory = derivedInventory.filter(item => {
    const matchesName = searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesBatch = searchBatch ? item.batchNumber.toLowerCase().includes(searchBatch.toLowerCase()) : true;
    const matchesCategory = filterCategory ? item.genericName.toLowerCase().includes(filterCategory.toLowerCase()) || item.name.toLowerCase().includes(filterCategory.toLowerCase()) : true;
    const matchesWarehouse = filterWarehouse ? item.warehouseLocation === filterWarehouse : true;

    let matchesExpiry = true;
    if (filterExpiry === 'Expired') {
      matchesExpiry = item.status === 'Expired';
    } else if (filterExpiry === 'Near Expiry') {
      const exp = new Date(item.expiryDate);
      const diff = exp.getTime() - new Date().getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      matchesExpiry = days > 0 && days < 90;
    }

    // If viewing warehouse details, filter by this warehouse
    const matchesDetailsContext = (activeSubView === 'warehouse-details') 
      ? item.warehouseLocation === currentSelectedWH.name
      : true;

    return matchesName && matchesBatch && matchesCategory && matchesWarehouse && matchesExpiry && matchesDetailsContext;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* ── HEADER BANNER (EMERALD WHITE CLEAN CLINICAL FEEL) ── */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-950/20">
        <div className="space-y-2 text-left">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/30">
            Enterprise Warehouse module
          </span>
          <h2 className="text-3xl font-black tracking-tight font-sans">Warehouse &amp; Stock Operations</h2>
          <p className="text-sm text-emerald-100/80 max-w-xl font-medium">
            Monitor branch pharmaceutical logistics, manage temperature-controlled vaccine stockpiles, track quarantine lots, and dispatch supplies to rack compartments.
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsAddWarehouseOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-black transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform cursor-pointer"
          >
            <Plus size={16} />
            Add Warehouse
          </button>
        </div>
      </div>


      {/* ── CONDITIONAL SUB-VIEWS (DASHBOARD OR DETAILS) ── */}
      
      {activeSubView === 'dashboard' ? (
        <>
          {/* 📊 SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Total WH */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Warehouses</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{totalWHCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">Physical units</span>
              </div>
              <button onClick={() => document.getElementById('warehouse-grid')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Active WH */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-emerald-600">{activeWHCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">Active zones</span>
              </div>
              <button onClick={() => document.getElementById('warehouse-grid')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Branch WH */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Hubs</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{branchWHCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">Branch warehouses</span>
              </div>
              <button onClick={() => document.getElementById('warehouse-grid')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Stock Value */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Stock Value</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">₹{totalWHStockValue.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold">Total valuation</span>
              </div>
              <button onClick={() => { setActiveSubView('warehouse-details'); if(warehousesList[0]) setSelectedWarehouseId(warehousesList[0].id); setDetailsTab('inventory'); }} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Total Qty */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{totalStockQty} <span className="text-xs text-slate-400">bx</span></span>
                <span className="text-[9px] text-slate-400 font-bold">Stored boxes</span>
              </div>
              <button onClick={() => { setActiveSubView('warehouse-details'); if(warehousesList[0]) setSelectedWarehouseId(warehousesList[0].id); setDetailsTab('inventory'); }} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Pending Transfers */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Trans</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className={`text-2xl font-black ${pendingTransfersCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{pendingTransfersCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">In transit</span>
              </div>
              <button onClick={() => { setActiveSubView('warehouse-details'); if(warehousesList[0]) setSelectedWarehouseId(warehousesList[0].id); setDetailsTab('transfers'); }} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Near Expiry */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Near Expiry</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className={`text-2xl font-black ${nearExpiryBatchesCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>{nearExpiryBatchesCount}</span>
                {nearExpiryBatchesCount > 0 ? (
                  <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Near expiry</span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold">Batches</span>
                )}
              </div>
              <button onClick={() => { setActiveSubView('warehouse-details'); if(warehousesList[0]) setSelectedWarehouseId(warehousesList[0].id); setDetailsTab('inventory'); }} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Low stock */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock SKU</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className={`text-2xl font-black ${lowStockItemsCount > 0 ? 'text-rose-500 font-black' : 'text-slate-800'}`}>{lowStockItemsCount}</span>
                {lowStockItemsCount > 0 ? (
                  <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">Low stock</span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold">Items</span>
                )}
              </div>
              <button onClick={() => { setActiveSubView('warehouse-details'); if(warehousesList[0]) setSelectedWarehouseId(warehousesList[0].id); setDetailsTab('inventory'); }} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

            {/* Utilization */}
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{capacityUtilization}%</span>
                <span className="text-[9px] text-slate-400 font-bold">Space occupied</span>
              </div>
              <button onClick={() => document.getElementById('warehouse-grid')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider text-left mt-2 hover:underline cursor-pointer">View Details →</button>
            </div>

          </div>



          {/* 🏬 WAREHOUSE CARDS LIST */}
          <div id="warehouse-grid" className="space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Building2 size={20} className="text-emerald-700" />
                Active Pharmacy Warehousing Network
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTransferW2WOpen(true)}
                  className="px-4 py-2 border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Transfer Stock (W2W)
                </button>
                <button
                  onClick={() => setIsGRNOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Receive Purchase (GRN)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehousesList.map((wh) => {
                // Compute warehouse specific stock count
                const whItems = warehouseStock.filter(item => item.warehouseId === wh.id || item.warehouseName === wh.name || (item.warehouse && item.warehouse.name === wh.name));
                const stockQty = whItems.reduce((sum, item) => sum + item.qty, 0);
                const occupiedPct = Math.min(100, Math.round((stockQty / wh.storageCapacity) * 100));
                const availableCap = Math.max(0, wh.storageCapacity - stockQty);

                return (
                  <div 
                    key={wh.id}
                    className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition duration-300 flex flex-col justify-between text-left space-y-4"
                  >
                    {/* Header line */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base">{wh.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">{wh.code}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        wh.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {wh.status}
                      </span>
                    </div>

                    {/* Stats details */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Type</span>
                        <span className="text-xs font-bold text-slate-700">{wh.type}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Stock Quantity</span>
                        <span className="text-xs font-black text-emerald-800">{stockQty} boxes</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-1">
                          <span>Capacity Used ({occupiedPct}%)</span>
                          <span>Available: {availableCap} / {wh.storageCapacity}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              occupiedPct > 90 ? 'bg-rose-500' : occupiedPct > 75 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${occupiedPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Meta info info */}
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0"/>{wh.address}, {wh.city}</p>
                      <p className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0"/>Contact: {wh.contactPerson} ({wh.contactNumber})</p>
                    </div>

                    {/* Card Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setSelectedWarehouseId(wh.id);
                          setDetailsTab('info');
                          setActiveSubView('warehouse-details');
                        }}
                        className="py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={12} />
                        View
                      </button>
                      <button 
                        onClick={() => openEditModal(wh)}
                        className="py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setFormW2W(prev => ({ ...prev, source: wh.name }));
                          setIsTransferW2WOpen(true);
                        }}
                        className="py-2 border border-emerald-100 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeftRight size={12} />
                        Transfer
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedWarehouseId(wh.id);
                          setDetailsTab('inventory');
                          setActiveSubView('warehouse-details');
                        }}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Package size={12} />
                        Inventory
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        
        // ── VIEW WAREHOUSE DETAILS PAGE ──
        <div className="space-y-6 text-left">
          
          {/* Detail view header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <button 
                onClick={() => {
                  setActiveSubView('dashboard');
                  setActiveRackId(null);
                  setActiveCompartmentId(null);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-700 font-bold mb-2 transition"
              >
                <ArrowRight size={14} className="rotate-180" />
                Back to Warehouses Dashboard
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{currentSelectedWH.name}</h3>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {currentSelectedWH.type} WH
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAdjustmentOpen(true)}
                className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Stock Adjustment
              </button>
              <button 
                onClick={() => setIsTransferW2ROpen(true)}
                className="px-4 py-2 border border-emerald-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Allocate to Rack
              </button>
              <button 
                onClick={() => setIsTransferR2WOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Pull from Rack
              </button>
            </div>
          </div>

          {/* Sub-page inventory metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Medicines */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Medicines</span>
              <span className="text-xl font-black text-slate-800">{derivedInventory.filter(item => item.warehouseLocation === currentSelectedWH.name).length} types</span>
            </div>
            {/* Total Batches */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Batches</span>
              <span className="text-xl font-black text-slate-800">
                {batches.length} lots
              </span>
            </div>
            {/* Total Stock Value */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Stock Value</span>
              <span className="text-xl font-black text-slate-800">
                ₹{derivedInventory.filter(item => item.warehouseLocation === currentSelectedWH.name).reduce((sum, item) => sum + (item.qty * 32), 0).toLocaleString()}
              </span>
            </div>
            {/* Low stock */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Low Stock SKU</span>
              <span className="text-xl font-black text-rose-500">
                {derivedInventory.filter(item => item.warehouseLocation === currentSelectedWH.name && item.qty < 50).length} items
              </span>
            </div>
            {/* Near Expiry */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Near Expiry Items</span>
              <span className="text-xl font-black text-amber-500">
                {derivedInventory.filter(item => {
                  if (item.warehouseLocation !== currentSelectedWH.name) return false;
                  const exp = new Date(item.expiryDate);
                  const diff = exp.getTime() - new Date().getTime();
                  return diff / (1000*60*60*24) < 90;
                }).length} batches
              </span>
            </div>
            {/* Available capacity */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Available Capacity</span>
              <span className="text-xl font-black text-emerald-600">
                {Math.max(0, currentSelectedWH.storageCapacity - derivedInventory.filter(item => item.warehouseLocation === currentSelectedWH.name).reduce((sum, item) => sum + item.qty, 0))} units
              </span>
            </div>
          </div>

          {/* Details Tabs Menu */}
          <div className="flex border-b border-slate-200 gap-6">
            {[
              { id: 'info', label: 'Warehouse Info', icon: Building2 },
              { id: 'inventory', label: 'Inventory Overview', icon: Package },
              { id: 'racks', label: 'Rack Management', icon: Layers },
              { id: 'transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
              { id: 'history', label: 'Transaction History', icon: ClipboardList },
              { id: 'reports', label: 'Warehouse Reports', icon: TrendingUp },
              { id: 'docs', label: 'Warehouse Documents', icon: FileText }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setDetailsTab(tab.id);
                    setActiveRackId(null);
                    setActiveCompartmentId(null);
                  }}
                  className={`flex items-center gap-2 pb-3.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                    detailsTab === tab.id
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
            
            {/* TAB: INFO */}
            {detailsTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {/* WH details */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Administrative Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Warehouse ID</span>
                      <span className="font-mono font-bold text-slate-800">{currentSelectedWH.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Warehouse Code</span>
                      <span className="font-mono font-bold text-slate-800">{currentSelectedWH.code}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Warehouse Type</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Parent Warehouse</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.parentWarehouse}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Storage Capacity</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.storageCapacity} bulk boxes</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Temperature Zone</span>
                      <span className="font-bold text-emerald-700">{currentSelectedWH.tempZone}</span>
                    </div>
                  </div>
                </div>

                {/* Legal & Contacts */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Legal Compliance &amp; Contacts</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Drug License Number</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.licenseNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">License Expiry Date</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.licenseExpiry}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">GST Number</span>
                      <span className="font-mono font-bold text-slate-800">{currentSelectedWH.gst}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">GPS Coordinates</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.gps}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Contact Person</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Email / Phone</span>
                      <span className="font-bold text-slate-800">{currentSelectedWH.email} / {currentSelectedWH.contactNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Address block */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-1 font-bold">Physical Address</span>
                  <span className="font-semibold text-slate-700">{currentSelectedWH.address}, {currentSelectedWH.city}, {currentSelectedWH.state} - {currentSelectedWH.pincode}</span>
                </div>
              </div>
            )}


            {/* TAB: INVENTORY OVERVIEW */}
            {detailsTab === 'inventory' && (
              <div className="space-y-4">
                
                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Medicine Name/Generic..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter Batch Number..."
                      value={searchBatch}
                      onChange={(e) => setSearchBatch(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <select
                      value={filterExpiry}
                      onChange={(e) => setFilterExpiry(e.target.value)}
                      className="p-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    >
                      <option value="">All Expiry Status</option>
                      <option value="Near Expiry">Near Expiry (&lt;90 Days)</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="p-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    >
                      <option value="">All Categories</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Anti-diabetic">Anti-diabetic</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Antacid">Antacid</option>
                      <option value="Vaccine">Vaccine</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                        <th className="py-3 px-4">Med ID</th>
                        <th className="py-3 px-4">Medicine details</th>
                        <th className="py-3 px-4">Batch Info</th>
                        <th className="py-3 px-4 text-center">Dates (Mfg/Exp)</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-center">Rack Location</th>
                        <th className="py-3 px-4 text-center">Movement</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">{item.medicineId}</td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-700 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">{item.genericName} ({item.brandName})</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.batchNumber}</td>
                          <td className="py-3 px-4 text-center text-slate-500 font-mono">
                            <span className="block text-[10px]">{item.mfgDate}</span>
                            <span className="block text-[10px] font-bold">{item.expiryDate}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-800 font-mono">{item.qty} {item.unit}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-emerald-800 font-bold text-[10px]">
                              {item.rackLocation}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              item.movementStatus === 'Moved to rack' ? 'bg-emerald-50 text-emerald-700' :
                              item.movementStatus === 'Partially moved' || item.movementStatus === 'Partially moved to rack' ? 'bg-amber-50 text-amber-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {item.movementStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{item.supplier}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.status === 'Expired' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                            No warehouse inventory logged matching active filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* TAB: RACK MANAGEMENT EXPLORER */}
            {detailsTab === 'racks' && (
              <div className="space-y-6">
                
                {/* Breadcrumbs for Racks */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 border-b border-slate-100 pb-3">
                  <span 
                    onClick={() => {
                      setActiveRackId(null);
                      setActiveCompartmentId(null);
                    }}
                    className={`cursor-pointer transition ${!activeRackId ? 'text-emerald-800' : 'hover:text-emerald-600'}`}
                  >
                    Racks Grid
                  </span>
                  {activeRackId && (
                    <>
                      <ChevronRight size={14} />
                      <span 
                        onClick={() => setActiveCompartmentId(null)}
                        className={`cursor-pointer transition ${!activeCompartmentId ? 'text-emerald-800' : 'hover:text-emerald-600'}`}
                      >
                        {racksData.find(r => r.id === activeRackId)?.name}
                      </span>
                    </>
                  )}
                  {activeCompartmentId && (
                    <>
                      <ChevronRight size={14} />
                      <span className="text-emerald-800">Rack {activeCompartmentId}</span>
                    </>
                  )}
                </div>

                {/* Subview 1: Grid of Racks */}
                {!activeRackId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {racksData
                      .filter(rack => rack.warehouse === currentSelectedWH.name)
                      .map((rack) => {
                        const totalCap = rack.compartments.reduce((sum, c) => sum + c.capacity, 0);
                        const usedCap = rack.compartments.reduce((sum, c) => sum + c.usedCapacity, 0);
                        const availCap = Math.max(0, totalCap - usedCap);

                        return (
                          <div 
                            key={rack.id}
                            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition text-left flex flex-col justify-between space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <h5 className="font-extrabold text-slate-800 text-sm">{rack.name}</h5>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{rack.compartments.length} Compartments</span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between font-medium">
                                <span className="text-slate-400">Total Capacity:</span>
                                <span className="text-slate-700 font-bold">{totalCap} units</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span className="text-slate-400">Capacity Used:</span>
                                <span className="text-slate-700 font-bold">{usedCap} units</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span className="text-slate-400">Available Space:</span>
                                <span className="text-emerald-700 font-black">{availCap} units</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setActiveRackId(rack.id)}
                              className="py-2 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black transition cursor-pointer"
                            >
                              Explore Racks
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Subview 2: Compartments inside selected Rack */}
                {activeRackId && !activeCompartmentId && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {racksData.find(r => r.id === activeRackId)?.name} Rack Layout
                      </h4>
                      <button
                        onClick={() => setIsAddCompartmentOpen(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle size={14} />
                        Add Rack
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {racksData
                        .find(r => r.id === activeRackId)
                        ?.compartments.map((comp) => (
                          <div 
                            key={comp.id}
                            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition text-left flex flex-col justify-between space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="font-extrabold text-slate-800 text-sm">Rack {comp.name}</h5>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{comp.category} Zone</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[9px] uppercase tracking-wider">
                                {comp.status}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <p className="flex justify-between font-semibold"><span className="text-slate-400 font-medium">Compartment ID:</span> {comp.id}</p>
                              <p className="flex justify-between font-semibold"><span className="text-slate-400 font-medium">Medicines Stored:</span> {comp.medicineCount} SKUs</p>
                              <p className="flex justify-between font-semibold"><span className="text-slate-400 font-medium">Capacity limits:</span> {comp.capacity} units</p>
                              <p className="flex justify-between font-semibold"><span className="text-slate-400 font-medium">Occupied:</span> {comp.usedCapacity} units</p>
                              <p className="flex justify-between font-semibold"><span className="text-slate-400 font-medium">Available:</span> {Math.max(0, comp.capacity - comp.usedCapacity)} units</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => setActiveCompartmentId(comp.id)}
                                className="py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                View Medicines
                              </button>
                              <button
                                onClick={() => {
                                  setFormW2R(prev => ({ ...prev, rackId: activeRackId, compartmentId: comp.id }));
                                  setIsTransferW2ROpen(true);
                                }}
                                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black transition cursor-pointer"
                              >
                                Move Stock In
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Subview 3: Medicines list inside specific Compartment */}
                {activeRackId && activeCompartmentId && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        Medicines stored inside rack {activeCompartmentId}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setFormR2W(prev => ({ ...prev, rackId: activeRackId, compartmentId: activeCompartmentId }));
                            setIsTransferR2WOpen(true);
                          }}
                          className="px-4 py-2 border border-emerald-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer animate-pulse"
                        >
                          Transfer to Warehouse (R2W)
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                            <th className="py-3 px-4">Med ID</th>
                            <th className="py-3 px-4">Medicine Name</th>
                            <th className="py-3 px-4">Batch lot</th>
                            <th className="py-3 px-4">Expiry date</th>
                            <th className="py-3 px-4 text-right">Quantity Stored</th>
                            <th className="py-3 px-4 text-center">Unit</th>
                            <th className="py-3 px-4">Supplier</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory
                            .filter(item => item.rackLocation === activeCompartmentId)
                            .map((item) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-mono font-bold text-slate-400">{item.medicineId}</td>
                                <td className="py-3 px-4 font-extrabold text-slate-700">{item.name}</td>
                                <td className="py-3 px-4 font-mono font-semibold text-slate-500">{item.batchNumber}</td>
                                <td className="py-3 px-4 font-mono text-slate-500">{item.expiryDate}</td>
                                <td className="py-3 px-4 text-right font-black text-emerald-800">{item.qty}</td>
                                <td className="py-3 px-4 text-center text-slate-500 font-bold">{item.unit}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{item.supplier}</td>
                              </tr>
                            ))}
                          {filteredInventory.filter(item => item.rackLocation === activeCompartmentId).length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                                No medicines allocated directly to this compartment yet. Use "Move Stock In" to allocate.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}


            {/* TAB: STOCK TRANSFERS */}
            {detailsTab === 'transfers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-800 text-sm">Warehouse-to-Warehouse Stock transfers</h4>
                  <button
                    onClick={() => setIsTransferW2WOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Initiate W2W Transfer
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                        <th className="py-3 px-4">Transfer ID</th>
                        <th className="py-3 px-4">Route (From → To)</th>
                        <th className="py-3 px-4">Medicine (Batch)</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-center">Dates</th>
                        <th className="py-3 px-4">Reason / Remarks</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseTransfers.map((t) => (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{t.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700 block">{t.sourceWarehouse}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">to {t.destWarehouse}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-800 block">{t.medicineName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">Batch: {t.batchNumber}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-800 font-mono">{t.qty}</td>
                          <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">
                            <span className="block">Disp: {t.dispatchDate}</span>
                            <span className="block">Est: {t.arrivalDate}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-600 max-w-xs truncate">{t.reason}</p>
                            {t.remarks && <p className="text-[10px] text-slate-400 italic">Note: {t.remarks}</p>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              t.status === 'In Transit' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              t.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {t.status === 'Requested' && (
                              <button 
                                onClick={() => processTransferWorkflow(t.id, 'Approved')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {t.status === 'Approved' && (
                              <button 
                                onClick={() => processTransferWorkflow(t.id, 'Dispatched')}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer"
                              >
                                Dispatch
                              </button>
                            )}
                            {t.status === 'Dispatched' && (
                              <button 
                                onClick={() => processTransferWorkflow(t.id, 'In Transit')}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer"
                              >
                                Ship
                              </button>
                            )}
                            {t.status === 'In Transit' && (
                              <button 
                                onClick={() => processTransferWorkflow(t.id, 'Received')}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer"
                              >
                                Receive
                              </button>
                            )}
                            {t.status === 'Received' && (
                              <button 
                                onClick={() => processTransferWorkflow(t.id, 'Completed')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer"
                              >
                                Complete
                              </button>
                            )}
                            {t.status === 'Completed' && (
                              <span className="text-[10px] text-slate-400 font-bold">Logged</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* TAB: TRANSACTION HISTORY */}
            {detailsTab === 'history' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3">Warehouse activity trail log</h4>
                
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                        <th className="py-3 px-4">Trx ID</th>
                        <th className="py-3 px-4">Date Time</th>
                        <th className="py-3 px-4">Medicine</th>
                        <th className="py-3 px-4">Log Type</th>
                        <th className="py-3 px-4 text-right">Adjustment Qty</th>
                        <th className="py-3 px-4 text-center">User</th>
                        <th className="py-3 px-4">System Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{log.id}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.date}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-700">{log.medicineName}</td>
                          <td className="py-3 px-4 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              log.type === 'Stock In' ? 'bg-emerald-50 text-emerald-700' :
                              log.type === 'Stock Out' ? 'bg-rose-50 text-rose-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono">{log.qty} boxes</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-600">{log.user}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">{log.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* TAB: WAREHOUSE REPORTS */}
            {detailsTab === 'reports' && (() => {
              const whInv = derivedInventory.filter(item => item.warehouseLocation === currentSelectedWH?.name || warehouseStock.some(ws => ws.warehouseId === currentSelectedWH?.id && ws.medicineId === item.medicineId));
              const totalQtyInWH = whInv.reduce((s, i) => s + i.qty, 0);
              const totalValueInWH = whInv.reduce((s, i) => {
                const med = medicines.find(m => m.id === i.medicineId);
                return s + (i.qty * (med?.price || 10));
              }, 0);
              const stockInMeds = warehouseStock.filter(ws => ws.warehouseId === currentSelectedWH?.id);
              const movedToRack = stockInMeds.filter(ws => ws.movementStatus === 'Moved to rack' || ws.movementStatus === 'Partially moved to rack').length;
              const nearExpiry = batches.filter(b => {
                const days = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
                return days > 0 && days < 90;
              }).length;

              return (
                <div className="space-y-6">
                  <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    Warehouse Performance Reports
                  </h4>

                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Boxes in WH', value: totalQtyInWH.toLocaleString(), unit: 'boxes', color: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
                      { label: 'Stock Valuation', value: `₹${totalValueInWH.toLocaleString()}`, unit: 'total value', color: 'bg-blue-50 text-blue-800 border-blue-100' },
                      { label: 'Moved to Rack', value: movedToRack, unit: 'SKUs transferred', color: 'bg-amber-50 text-amber-800 border-amber-100' },
                      { label: 'Near Expiry Batches', value: nearExpiry, unit: 'batches', color: nearExpiry > 0 ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100' },
                    ].map(kpi => (
                      <div key={kpi.label} className={`rounded-2xl p-4 border ${kpi.color} text-left`}>
                        <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-60">{kpi.label}</span>
                        <span className="text-xl font-black block">{kpi.value}</span>
                        <span className="text-[9px] font-medium opacity-50">{kpi.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stock by Medicine Table */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Stock Breakdown by Medicine</h5>
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                            <th className="py-3 px-4">Medicine Name</th>
                            <th className="py-3 px-4 text-center">Batch No.</th>
                            <th className="py-3 px-4 text-right">WH Qty (boxes)</th>
                            <th className="py-3 px-4 text-right">Unit Value</th>
                            <th className="py-3 px-4 text-right">Total Value</th>
                            <th className="py-3 px-4 text-center">Movement Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockInMeds.length > 0 ? stockInMeds.map((ws, idx) => {
                            const med = medicines.find(m => m.id === ws.medicineId);
                            const unitPrice = med?.price || 10;
                            const totalVal = ws.qty * unitPrice;
                            return (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-extrabold text-slate-700">{med?.name || ws.medicine?.medicineName || 'Unknown'}</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-500">{ws.batchNumber || '—'}</td>
                                <td className="py-3 px-4 text-right font-black text-slate-800">{ws.qty}</td>
                                <td className="py-3 px-4 text-right text-slate-500">₹{unitPrice}</td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{totalVal.toLocaleString()}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    ws.movementStatus === 'Moved to rack' ? 'bg-slate-100 text-slate-500' :
                                    ws.movementStatus === 'Partially moved to rack' ? 'bg-amber-50 text-amber-700' :
                                    'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {ws.movementStatus || 'In warehouse'}
                                  </span>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">No stock records found for this warehouse</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Stock Movements Summary */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Recent Stock Movements</h5>
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                            <th className="py-3 px-4">Movement ID</th>
                            <th className="py-3 px-4">Medicine</th>
                            <th className="py-3 px-4">Transfer Type</th>
                            <th className="py-3 px-4 text-right">Qty</th>
                            <th className="py-3 px-4">By</th>
                            <th className="py-3 px-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warehouseTransfers.slice(0, 15).map((trx, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">{trx.id?.slice(0,12) || `MOV-${idx}`}</td>
                              <td className="py-3 px-4 font-bold text-slate-700">{trx.medicineName || trx.medicine?.medicineName || '—'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  trx.transferType === 'Warehouse to Rack' || trx.transferType === 'GRN_RECEIVE' ? 'bg-emerald-50 text-emerald-700' :
                                  trx.transferType === 'Rack to Warehouse' ? 'bg-amber-50 text-amber-700' :
                                  'bg-blue-50 text-blue-700'
                                }`}>
                                  {trx.transferType || 'W2R'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-slate-800">{trx.qty}</td>
                              <td className="py-3 px-4 text-slate-500">{trx.movedBy || trx.transferredBy || 'Staff'}</td>
                              <td className="py-3 px-4 text-slate-400">{trx.remarks || '—'}</td>
                            </tr>
                          ))}
                          {warehouseTransfers.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-400">No stock movements recorded yet</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* TAB: WAREHOUSE DOCUMENTS */}
            {detailsTab === 'docs' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3">Stored compliance certificates &amp; agreements</h4>
                
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                        <th className="py-3 px-4">Document ID</th>
                        <th className="py-3 px-4">Document Name</th>
                        <th className="py-3 px-4 text-center">Upload Date</th>
                        <th className="py-3 px-4 text-center">Compliance Expiry</th>
                        <th className="py-3 px-4 text-center">Verification Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{doc.id}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-700">{doc.name}</td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{doc.uploadDate}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{doc.expiryDate}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[10px]">
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => alert(`Downloading Document: ${doc.name}`)}
                              className="px-3 py-1 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 font-bold cursor-pointer"
                            >
                              Download File
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Special view rendering for Cold Chain Warehouse */}
          {currentSelectedWH.name === 'Cold Storage Warehouse' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Cold storage logs */}
              <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm text-left space-y-4 lg:col-span-2">
                <h4 className="font-black text-slate-800 flex items-center gap-2">
                  <Thermometer className="text-emerald-600 animate-pulse" size={18} />
                  Continuous Temperature Logs (24h)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[9px]">
                        <th className="py-2.5">Log ID</th>
                        <th className="py-2.5">Time Stamp</th>
                        <th className="py-2.5 text-center">Temperature Reading</th>
                        <th className="py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempLogs.map((log) => (
                        <tr key={log.logId} className="border-b border-slate-100">
                          <td className="py-3 font-mono font-bold text-slate-500">{log.logId}</td>
                          <td className="py-3 text-slate-600 font-medium">{log.date}</td>
                          <td className="py-3 text-center font-black text-emerald-800 font-mono">{log.temperature}°C</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vaccine & Insulin tracker list */}
              <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm text-left space-y-4">
                <h4 className="font-black text-slate-800">Cold-chain Medicines Stock</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-700 text-xs block">Vaccine Inventory</span>
                      <span className="text-[10px] text-slate-400 font-medium">Covishield / Hepatitis B</span>
                    </div>
                    <span className="font-mono font-black text-emerald-800 text-sm">80 boxes</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-700 text-xs block">Insulin Inventory</span>
                      <span className="text-[10px] text-slate-400 font-medium">Insulin Glargine / Humalog</span>
                    </div>
                    <span className="font-mono font-black text-emerald-800 text-sm">50 boxes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special view rendering for Quarantine Warehouse */}
          {currentSelectedWH.name === 'Quarantine Warehouse' && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 shadow-sm text-left space-y-4 mt-6">
              <h4 className="font-black text-rose-800 flex items-center gap-2">
                <ShieldAlert size={18} />
                Isolated Quarantine inventory (Damaged, Returned, or Expired)
              </h4>
              <p className="text-xs text-rose-600 font-medium">
                The items below are blocked from standard sales distribution channels and await final review or disposal authorization.
              </p>
              
              <div className="overflow-x-auto bg-white rounded-2xl border border-rose-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                      <th className="py-3 px-4">Med ID</th>
                      <th className="py-3 px-4">Medicine details</th>
                      <th className="py-3 px-4">Batch number</th>
                      <th className="py-3 px-4 text-center">Expiry date</th>
                      <th className="py-3 px-4 text-right">Blocked Quantity</th>
                      <th className="py-3 px-4 text-center">Rack Location</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory
                      .filter(item => item.warehouseLocation === 'Quarantine Warehouse')
                      .map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-3 px-4 font-mono font-bold text-rose-500">{item.medicineId}</td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-700 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">{item.genericName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{item.batchNumber}</td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{item.expiryDate}</td>
                          <td className="py-3 px-4 text-right font-black text-rose-700">{item.qty}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] font-bold">
                              {item.rackLocation}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              Quarantined
                            </span>
                          </td>
                        </tr>
                      ))}
                    {filteredInventory.filter(item => item.warehouseLocation === 'Quarantine Warehouse').length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                          No quarantine items present inside this warehouse room.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── NOTIFICATIONS FEED & AUDIT TRAIL PREVIEW (Dashboard only) ── */}
      {activeSubView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          
          {/* Alerts feed */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Bell size={18} className="text-emerald-600" />
              Live Warehouse Alerts Feed
            </h4>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between text-xs">
                  <div className="flex gap-2.5">
                    <span className={`p-1 rounded-xl shrink-0 mt-0.5 ${
                      n.type === 'danger' ? 'bg-rose-50 text-rose-600' :
                      n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <AlertCircle size={14} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-700">{n.message}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">No alerts at this time.</p>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Admin Action Audit Ledger
            </h4>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-emerald-800 uppercase tracking-widest text-[9px]">{log.module || 'Warehouse'}</span>
                      <span className="text-slate-400 font-mono text-[9px]">{log.timestamp}</span>
                    </div>
                    <p className="font-semibold text-slate-700">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">{log.details}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-bold text-[9px]">
                    {typeof log.user === 'object' ? log.user?.username : log.user || 'Admin'}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">No admin actions logged.</p>
              )}
            </div>
          </div>

        </div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/* ── MODALS POPUPS ── */}
      {/* ──────────────────────────────────────────────────────── */}
      
      {/* 1. Add Warehouse Modal */}
      {isAddWarehouseOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-emerald-700" />
                Register New Warehouse Facility
              </h3>
              <button onClick={() => setIsAddWarehouseOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddWarehouse} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse ID (Auto)</label>
                  <input type="text" value="WH-REG-AUTO" disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Code</label>
                  <input type="text" placeholder="e.g. WH-BR3" value={formDataWH.code} onChange={(e) => setFormDataWH({ ...formDataWH, code: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Name</label>
                  <input type="text" placeholder="e.g. Branch Warehouse 3" value={formDataWH.name} onChange={(e) => setFormDataWH({ ...formDataWH, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Type</label>
                  <select value={formDataWH.type} onChange={(e) => setFormDataWH({ ...formDataWH, type: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white cursor-pointer">
                    <option value="Central">Central</option>
                    <option value="Branch">Branch</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="Quarantine">Quarantine</option>
                    <option value="Returns">Returns</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parent Warehouse</label>
                  <input type="text" placeholder="e.g. Main Warehouse" value={formDataWH.parentWarehouse} onChange={(e) => setFormDataWH({ ...formDataWH, parentWarehouse: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Storage Capacity</label>
                  <input type="number" placeholder="e.g. 2000" value={formDataWH.storageCapacity} onChange={(e) => setFormDataWH({ ...formDataWH, storageCapacity: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">GPS Coordinates</label>
                  <input type="text" placeholder="e.g. 13.0827° N, 80.2707° E" value={formDataWH.gps} onChange={(e) => setFormDataWH({ ...formDataWH, gps: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Drug License Number</label>
                  <input type="text" placeholder="DL-TN-CH3-2026" value={formDataWH.licenseNumber} onChange={(e) => setFormDataWH({ ...formDataWH, licenseNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">License Expiry Date</label>
                  <input type="date" value={formDataWH.licenseExpiry} onChange={(e) => setFormDataWH({ ...formDataWH, licenseExpiry: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">GST Number</label>
                  <input type="text" placeholder="33AAAAA1111A1Z1" value={formDataWH.gst} onChange={(e) => setFormDataWH({ ...formDataWH, gst: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input type="text" placeholder="John Doe" value={formDataWH.contactPerson} onChange={(e) => setFormDataWH({ ...formDataWH, contactPerson: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input type="text" placeholder="+91 99000 88877" value={formDataWH.contactNumber} onChange={(e) => setFormDataWH({ ...formDataWH, contactNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" placeholder="facility@hospital.com" value={formDataWH.email} onChange={(e) => setFormDataWH({ ...formDataWH, email: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Temperature Zone</label>
                  <select value={formDataWH.tempZone} onChange={(e) => setFormDataWH({ ...formDataWH, tempZone: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white cursor-pointer">
                    <option value="Controlled Room Temp (20°C to 25°C)">Controlled Room Temp (20°C to 25°C)</option>
                    <option value="Refrigerated (2°C to 8°C)">Refrigerated (2°C to 8°C)</option>
                    <option value="Frozen (-20°C to -10°C)">Frozen (-20°C to -10°C)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={formDataWH.status} onChange={(e) => setFormDataWH({ ...formDataWH, status: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                <textarea rows="2" placeholder="Facility address street details..." value={formDataWH.address} onChange={(e) => setFormDataWH({ ...formDataWH, address: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                  <input type="text" placeholder="Chennai" value={formDataWH.city} onChange={(e) => setFormDataWH({ ...formDataWH, city: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                  <input type="text" placeholder="Tamil Nadu" value={formDataWH.state} onChange={(e) => setFormDataWH({ ...formDataWH, state: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pincode</label>
                  <input type="text" placeholder="600001" value={formDataWH.pincode} onChange={(e) => setFormDataWH({ ...formDataWH, pincode: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsAddWarehouseOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Warehouse Modal */}
      {isEditWarehouseOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Edit3 size={20} className="text-emerald-700" />
                Modify Warehouse Settings: {warehouseToEdit?.name}
              </h3>
              <button onClick={() => setIsEditWarehouseOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditWarehouse} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse ID</label>
                  <input type="text" value={warehouseToEdit?.id} disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Code</label>
                  <input type="text" value={formDataWH.code} onChange={(e) => setFormDataWH({ ...formDataWH, code: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Name</label>
                  <input type="text" value={formDataWH.name} onChange={(e) => setFormDataWH({ ...formDataWH, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Type</label>
                  <input type="text" value={formDataWH.type} disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parent Warehouse</label>
                  <input type="text" value={formDataWH.parentWarehouse} onChange={(e) => setFormDataWH({ ...formDataWH, parentWarehouse: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Storage Capacity</label>
                  <input type="number" value={formDataWH.storageCapacity} onChange={(e) => setFormDataWH({ ...formDataWH, storageCapacity: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">GPS Coordinates</label>
                  <input type="text" value={formDataWH.gps} onChange={(e) => setFormDataWH({ ...formDataWH, gps: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Drug License Number</label>
                  <input type="text" value={formDataWH.licenseNumber} onChange={(e) => setFormDataWH({ ...formDataWH, licenseNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">License Expiry Date</label>
                  <input type="date" value={formDataWH.licenseExpiry} onChange={(e) => setFormDataWH({ ...formDataWH, licenseExpiry: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">GST Number</label>
                  <input type="text" value={formDataWH.gst} onChange={(e) => setFormDataWH({ ...formDataWH, gst: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input type="text" value={formDataWH.contactPerson} onChange={(e) => setFormDataWH({ ...formDataWH, contactPerson: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input type="text" value={formDataWH.contactNumber} onChange={(e) => setFormDataWH({ ...formDataWH, contactNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={formDataWH.email} onChange={(e) => setFormDataWH({ ...formDataWH, email: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Temperature Zone</label>
                  <select value={formDataWH.tempZone} onChange={(e) => setFormDataWH({ ...formDataWH, tempZone: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white cursor-pointer">
                    <option value="Controlled Room Temp (20°C to 25°C)">Controlled Room Temp (20°C to 25°C)</option>
                    <option value="Refrigerated (2°C to 8°C)">Refrigerated (2°C to 8°C)</option>
                    <option value="Frozen (-20°C to -10°C)">Frozen (-20°C to -10°C)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={formDataWH.status} onChange={(e) => setFormDataWH({ ...formDataWH, status: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                <textarea rows="2" value={formDataWH.address} onChange={(e) => setFormDataWH({ ...formDataWH, address: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsEditWarehouseOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. W2W Transfer Modal */}
      {isTransferW2WOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-xl text-left space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ArrowLeftRight size={20} className="text-emerald-700" />
                Inter-Warehouse Bulk Stock Transfer (W2W)
              </h3>
              <button onClick={() => setIsTransferW2WOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleW2WSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Source Warehouse</label>
                  <select value={formW2W.source} onChange={(e) => setFormW2W({ ...formW2W, source: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {warehousesList.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Destination Warehouse</label>
                  <select value={formW2W.dest} onChange={(e) => setFormW2W({ ...formW2W, dest: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {warehousesList.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Select Medicine</label>
                <select value={formW2W.medicineId} onChange={(e) => setFormW2W({ ...formW2W, medicineId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Shop stock: {m.stock} pcs)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Batch number</label>
                  <input type="text" placeholder="e.g. B-CALP42" value={formW2W.batchNumber} onChange={(e) => setFormW2W({ ...formW2W, batchNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Quantity (Boxes)</label>
                  <input type="number" placeholder="e.g. 50" value={formW2W.qty} onChange={(e) => setFormW2W({ ...formW2W, qty: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Dispatch Date</label>
                  <input type="date" value={formW2W.dispatchDate} onChange={(e) => setFormW2W({ ...formW2W, dispatchDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Expected Arrival Date</label>
                  <input type="date" value={formW2W.expectedArrival} onChange={(e) => setFormW2W({ ...formW2W, expectedArrival: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Reason for transfer</label>
                <input type="text" placeholder="e.g. Near expiry segregation, stock replenishment" value={formW2W.reason} onChange={(e) => setFormW2W({ ...formW2W, reason: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Remarks</label>
                <input type="text" placeholder="Additional logistics info..." value={formW2W.remarks} onChange={(e) => setFormW2W({ ...formW2W, remarks: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsTransferW2WOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Submit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. W2R Transfer Modal */}
      {isTransferW2ROpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-md text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-emerald-700" />
                Allocate stock from Warehouse to Rack Compartment
              </h3>
              <button onClick={() => setIsTransferW2ROpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleW2RSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Source Warehouse</label>
                <select value={formW2R.warehouse} onChange={(e) => setFormW2R({ ...formW2R, warehouse: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  {warehousesList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Target Main Rack</label>
                  <select value={formW2R.rackId} onChange={(e) => setFormW2R({ ...formW2R, rackId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {racksData.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Sub Compartment</label>
                  <select value={formW2R.compartmentId} onChange={(e) => setFormW2R({ ...formW2R, compartmentId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {racksData.find(r => r.id === formW2R.rackId)?.compartments.map(c => <option key={c.id} value={c.id}>{c.name} ({c.category})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Medicine Name</label>
                <select value={formW2R.medicineId} onChange={(e) => setFormW2R({ ...formW2R, medicineId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                  <input type="text" placeholder="e.g. B-INS202" value={formW2R.batchNumber} onChange={(e) => setFormW2R({ ...formW2R, batchNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Quantity (Boxes)</label>
                  <input type="number" placeholder="e.g. 20" value={formW2R.qty} onChange={(e) => setFormW2R({ ...formW2R, qty: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Allocation Date</label>
                <input type="date" value={formW2R.date} onChange={(e) => setFormW2R({ ...formW2R, date: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Remarks</label>
                <input type="text" placeholder="Shelf mapping notes..." value={formW2R.remarks} onChange={(e) => setFormW2R({ ...formW2R, remarks: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsTransferW2ROpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Allocate Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Rack to Warehouse Transfer Modal */}
      {isTransferR2WOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-md text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-emerald-700" />
                Pull stock from Rack Compartment back to Warehouse Area
              </h3>
              <button onClick={() => setIsTransferR2WOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleR2WSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Source Main Rack</label>
                  <select value={formR2W.rackId} onChange={(e) => setFormR2W({ ...formR2W, rackId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {racksData.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Compartment</label>
                  <select value={formR2W.compartmentId} onChange={(e) => setFormR2W({ ...formR2W, compartmentId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {racksData.find(r => r.id === formR2W.rackId)?.compartments.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Target Warehouse</label>
                <select value={formR2W.warehouse} onChange={(e) => setFormR2W({ ...formR2W, warehouse: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  {warehousesList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Medicine Name</label>
                <select value={formR2W.medicineId} onChange={(e) => setFormR2W({ ...formR2W, medicineId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Batch number</label>
                  <input type="text" placeholder="e.g. B-AMX99" value={formR2W.batchNumber} onChange={(e) => setFormR2W({ ...formR2W, batchNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Quantity (Boxes)</label>
                  <input type="number" placeholder="e.g. 10" value={formR2W.qty} onChange={(e) => setFormR2W({ ...formR2W, qty: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Date</label>
                <input type="date" value={formR2W.date} onChange={(e) => setFormR2W({ ...formR2W, date: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Reason</label>
                <input type="text" placeholder="e.g. Stock consolidation, packaging correction" value={formR2W.reason} onChange={(e) => setFormR2W({ ...formR2W, reason: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsTransferR2WOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Transfer Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Purchase Receiving GRN Modal */}
      {isGRNOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Truck size={20} className="text-emerald-700" />
                Goods Receipt Note Registry (GRN)
              </h3>
              <button onClick={() => setIsGRNOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGRNSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">GRN Number (Auto/Custom)</label>
                  <input type="text" placeholder="e.g. GRN-2026-99" value={formGRN.grnNumber} onChange={(e) => setFormGRN({ ...formGRN, grnNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Supplier</label>
                  <select value={formGRN.supplier} onChange={(e) => setFormGRN({ ...formGRN, supplier: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    <option value="Apex Medical Supplies">Apex Medical Supplies</option>
                    <option value="Biocare Pharma Distributors">Biocare Pharma Distributors</option>
                    <option value="Universal Healthcare Ltd">Universal Healthcare Ltd</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Invoice Number</label>
                  <input type="text" placeholder="INV-SUP-123" value={formGRN.invoiceNumber} onChange={(e) => setFormGRN({ ...formGRN, invoiceNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Medicine SKU</label>
                  <select value={formGRN.medicineId} onChange={(e) => setFormGRN({ ...formGRN, medicineId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                  <input type="text" placeholder="B-LOT-NEW" value={formGRN.batchNumber} onChange={(e) => setFormGRN({ ...formGRN, batchNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Receive Quantity (Boxes)</label>
                  <input type="number" placeholder="e.g. 100" value={formGRN.qty} onChange={(e) => setFormGRN({ ...formGRN, qty: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">MFG Date</label>
                  <input type="date" value={formGRN.mfgDate} onChange={(e) => setFormGRN({ ...formGRN, mfgDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                  <input type="date" value={formGRN.expiryDate} onChange={(e) => setFormGRN({ ...formGRN, expiryDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Target Warehouse</label>
                  <select value={formGRN.warehouse} onChange={(e) => setFormGRN({ ...formGRN, warehouse: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    {warehousesList.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Rack Location Allocation</label>
                  <select value={formGRN.rackAllocation} onChange={(e) => setFormGRN({ ...formGRN, rackAllocation: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                    <option value="A1">Rack A - A1</option>
                    <option value="A2">Rack A - A2</option>
                    <option value="A3">Rack A - A3</option>
                    <option value="B2">Rack B - B2</option>
                    <option value="COLD-1">Cold Storage Freezer 1</option>
                    <option value="COLD-2">Cold Storage Freezer 2</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsGRNOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Receive Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Stock Adjustment Modal */}
      {isAdjustmentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-md text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 text-rose-700">
                <ShieldAlert size={20} />
                Stock Adjustment Registry
              </h3>
              <button onClick={() => setIsAdjustmentOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Select Medicine</label>
                <select value={formAdj.medicineId} onChange={(e) => setFormAdj({ ...formAdj, medicineId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                  <input type="text" placeholder="e.g. B-CALP42" value={formAdj.batchNumber} onChange={(e) => setFormAdj({ ...formAdj, batchNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Adjust Quantity</label>
                  <input type="number" placeholder="e.g. 5" value={formAdj.qty} onChange={(e) => setFormAdj({ ...formAdj, qty: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Adjustment Type</label>
                <select value={formAdj.reason} onChange={(e) => setFormAdj({ ...formAdj, reason: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  <option value="Damaged Stock">Damaged Stock</option>
                  <option value="Expired Stock">Expired Stock</option>
                  <option value="Missing Stock">Missing Stock</option>
                  <option value="Manual Correction">Manual Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Remarks &amp; Explanations</label>
                <input type="text" placeholder="Why are we adjusting this stock?" value={formAdj.remarks} onChange={(e) => setFormAdj({ ...formAdj, remarks: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl text-[10px] text-rose-700 leading-relaxed flex gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                Note: Adjustments marked as 'Expired' or 'Damaged' are automatically removed from standard inventories and routed directly to isolation blocks inside the Quarantine Warehouse.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsAdjustmentOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Add Compartment Modal */}
      {isAddCompartmentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-emerald-100 shadow-2xl p-8 w-full max-w-md text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-700" />
                Add New Sub-Rack
              </h3>
              <button onClick={() => setIsAddCompartmentOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCompartment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Rack Name</label>
                <input type="text" placeholder="e.g. A6" value={formComp.name} onChange={(e) => setFormComp({ ...formComp, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Target Medicine Category</label>
                <select value={formComp.category} onChange={(e) => setFormComp({ ...formComp, category: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
                  <option value="Analgesic">Analgesic</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Anti-diabetic">Anti-diabetic</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Antacid">Antacid</option>
                  <option value="Vaccine">Vaccine</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Capacity (Boxes limit)</label>
                <input type="number" placeholder="500" value={formComp.capacity} onChange={(e) => setFormComp({ ...formComp, capacity: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" required />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsAddCompartmentOpen(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer">
                  Create Rack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
