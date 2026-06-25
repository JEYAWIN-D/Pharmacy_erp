import { useState, useMemo } from 'react';
import { useDB } from '../../db/DBContext';

/**
 * useRackController
 * MVC Controller hook for the Pharmacy Rack Management module.
 * Encapsulates all state management, derived data, and action handlers.
 * The View (RackView.jsx) consumes this hook and renders the UI.
 */
export function useRackController(role) {
  const { notifications: dbNotifications, setNotifications: setDbNotifications } = useDB();

  // ──────────────────────────────────────────────────────────
  // VIEW STATE MANAGEMENT (Sub-pages)
  // ──────────────────────────────────────────────────────────
  const [viewState, setViewState] = useState('dashboard');
  const [selectedRackId, setSelectedRackId] = useState('RACK-A');
  const [selectedCompId, setSelectedCompId] = useState('COMP-A1');
  const [activeModal, setActiveModal] = useState(null);

  // ──────────────────────────────────────────────────────────
  // REACTIVE SEED DATA (Model layer)
  // ──────────────────────────────────────────────────────────
  const [racks, setRacks] = useState([
    { id: 'RACK-A', name: 'Rack A', code: 'A', type: 'Dry Storage', category: 'Tablets', maxCapacity: 500, location: 'Front Counter A', description: 'Primary tablets shelf', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-10' },
    { id: 'RACK-B', name: 'Rack B', code: 'B', type: 'Dry Storage', category: 'Syrups', maxCapacity: 400, location: 'Shelf Row B', description: 'Liquid bottles storage', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-11' },
    { id: 'RACK-C', name: 'Rack C', code: 'C', type: 'Dry Storage', category: 'Injections', maxCapacity: 300, location: 'Dispenser Desk C', description: 'Controlled injections space', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-12' },
    { id: 'RACK-D', name: 'Rack D', code: 'D', type: 'Dry Storage', category: 'Ointments', maxCapacity: 300, location: 'Rear Shelf D', description: 'Ointments and gels', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-12' },
    { id: 'RACK-COLD', name: 'Cold Rack', code: 'COLD', type: 'Refrigerated', category: 'Insulins / Vaccines', maxCapacity: 200, location: 'Cold Chain Freezer', description: 'Insulins & vaccine storage', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-13' },
    { id: 'RACK-WH', name: 'Warehouse Rack', code: 'WH', type: 'Bulk Storage', category: 'Warehouse Stock', maxCapacity: 1000, location: 'Back Warehouse', description: 'Excess inventory backup', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-01' }
  ]);

  const [compartments, setCompartments] = useState([
    { id: 'COMP-A1', rackId: 'RACK-A', name: 'A1', category: 'Tablets', suitableType: 'Boxes', maxCapacity: 100, description: 'Shelf slot A1', status: 'Full', createdBy: 'Admin', createdDate: '2026-06-10' },
    { id: 'COMP-A2', rackId: 'RACK-A', name: 'A2', category: 'Tablets', suitableType: 'Boxes', maxCapacity: 100, description: 'Shelf slot A2', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-10' },
    { id: 'COMP-A3', rackId: 'RACK-A', name: 'A3', category: 'Tablets', suitableType: 'Boxes', maxCapacity: 100, description: 'Shelf slot A3', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-10' },
    { id: 'COMP-A4', rackId: 'RACK-A', name: 'A4', category: 'Tablets', suitableType: 'Boxes', maxCapacity: 100, description: 'Shelf slot A4', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-10' },
    { id: 'COMP-A5', rackId: 'RACK-A', name: 'A5', category: 'Tablets', suitableType: 'Boxes', maxCapacity: 100, description: 'Shelf slot A5', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-10' },
    { id: 'COMP-B1', rackId: 'RACK-B', name: 'B1', category: 'Syrups', suitableType: 'Bottles', maxCapacity: 100, description: 'Liquid slot B1', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-11' },
    { id: 'COMP-B2', rackId: 'RACK-B', name: 'B2', category: 'Syrups', suitableType: 'Bottles', maxCapacity: 100, description: 'Liquid slot B2', status: 'Full', createdBy: 'Admin', createdDate: '2026-06-11' },
    { id: 'COMP-B3', rackId: 'RACK-B', name: 'B3', category: 'Syrups', suitableType: 'Bottles', maxCapacity: 100, description: 'Liquid slot B3', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-11' },
    { id: 'COMP-C1', rackId: 'RACK-C', name: 'C1', category: 'Injections', suitableType: 'Vials', maxCapacity: 100, description: 'Injections slot C1', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-12' },
    { id: 'COMP-D1', rackId: 'RACK-D', name: 'D1', category: 'Ointments', suitableType: 'Tubes', maxCapacity: 100, description: 'Ointment slot D1', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-12' },
    { id: 'COMP-COLD1', rackId: 'RACK-COLD', name: 'Cold-1', category: 'Insulins', suitableType: 'Vials', maxCapacity: 100, description: 'Cold storage sub-rack 1', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-13' },
    { id: 'COMP-COLD2', rackId: 'RACK-COLD', name: 'Cold-2', category: 'Vaccines', suitableType: 'Vials', maxCapacity: 100, description: 'Cold storage sub-rack 2', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-13' },
    { id: 'COMP-WH1', rackId: 'RACK-WH', name: 'W-Bin1', category: 'Warehouse Stock', suitableType: 'Bulk Boxes', maxCapacity: 500, description: 'Bulk warehouse bin 1', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-01' },
    { id: 'COMP-WH2', rackId: 'RACK-WH', name: 'W-Bin2', category: 'Warehouse Stock', suitableType: 'Bulk Boxes', maxCapacity: 500, description: 'Bulk warehouse bin 2', status: 'Active', createdBy: 'Admin', createdDate: '2026-06-01' }
  ]);

  const [storedMedicines, setStoredMedicines] = useState([
    { id: 'MED-101', name: 'Calpol 650mg', brandName: 'Calpol', batchNumber: 'B-CALP42', quantity: 100, unit: 'Boxes', supplier: 'Apex Medical Supplies', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-A1' },
    { id: 'MED-102', name: 'Amoxicillin 500mg', brandName: 'Novamox', batchNumber: 'B-AMX99', quantity: 30, unit: 'Boxes', supplier: 'Biocare Pharma', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-A2' },
    { id: 'MED-103', name: 'Lipitor 10mg', brandName: 'Lipitor', batchNumber: 'B-LIP09', quantity: 60, unit: 'Boxes', supplier: 'Pfizer Ltd', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-B1' },
    { id: 'MED-104', name: 'Pantocid 40mg', brandName: 'Pantocid', batchNumber: 'B-PAN88', quantity: 100, unit: 'Boxes', supplier: 'Sun Pharma', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-B2' },
    { id: 'MED-105', name: 'Insulin Glargine', brandName: 'Lantus', batchNumber: 'B-INS20', quantity: 15, unit: 'Boxes', supplier: 'Sanofi India', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-COLD1' },
    { id: 'MED-106', name: 'Covishield Vaccine', brandName: 'Covishield', batchNumber: 'B-COV55', quantity: 45, unit: 'Boxes', supplier: 'Serum Institute', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-COLD2' },
    { id: 'MED-107', name: 'Narcotic Fentanyl', brandName: 'Fentanyl', batchNumber: 'B-FEN88', quantity: 20, unit: 'Boxes', supplier: 'Apex Medical Supplies', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-C1' },
    { id: 'MED-109', name: 'Aspirin (Headache Relief)', brandName: 'Bayer', batchNumber: 'B-ASP99', quantity: 0, unit: 'Boxes', supplier: 'Bayer Pharma', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-A3' },
    { id: 'MED-110', name: 'Ibuprofen (Migraine)', brandName: 'Advil', batchNumber: 'B-ADV02', quantity: 0, unit: 'Boxes', supplier: 'Pfizer Ltd', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-A4' },
    { id: 'MED-111', name: 'Gastro-resistant Omeprazole', brandName: 'Omez', batchNumber: 'B-OMZ03', quantity: 0, unit: 'Boxes', supplier: 'Dr. Reddys', addedBy: 'Admin', addedDate: '2026-06-18', compartmentId: 'COMP-A5' },
    { id: 'MED-101-WH', name: 'Calpol 650mg', brandName: 'Calpol', batchNumber: 'B-CALP99_WH', quantity: 350, unit: 'Boxes', supplier: 'Apex Medical Supplies', addedBy: 'Admin', addedDate: '2026-06-10', compartmentId: 'COMP-WH1' },
    { id: 'MED-108', name: 'Metformin 500mg', brandName: 'Glycomet', batchNumber: 'B-MET301_WH', quantity: 250, unit: 'Boxes', supplier: 'USV Pharma', addedBy: 'Admin', addedDate: '2026-06-12', compartmentId: 'COMP-WH2' }
  ]);

  const [transferHistory, setTransferHistory] = useState([
    { transactionId: 'TXN-001', transferType: 'Warehouse to Rack', source: 'Warehouse Storage (W-Bin1)', destination: 'Rack A (A1)', medicineName: 'Calpol 650mg', batchNumber: 'B-CALP42', quantity: 100, doneBy: 'Admin', dateTime: '2026-06-18 09:30 AM', status: 'Completed' },
    { transactionId: 'TXN-002', transferType: 'Rack to Rack', source: 'Rack A (A1)', destination: 'Rack B (B2)', medicineName: 'Pantocid 40mg', batchNumber: 'B-PAN88', quantity: 50, doneBy: 'Admin', dateTime: '2026-06-18 10:15 AM', status: 'Completed' }
  ]);

  const [localNotifications, setLocalNotifications] = useState([
    { id: 1, text: 'Rack A1 is full' },
    { id: 2, text: 'Rack A2 has available space' },
    { id: 3, text: 'Rack A created successfully' },
    { id: 4, text: 'Capacity updated successfully' }
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

  const submitNewRack = (e) => {
    e.preventDefault();
    if (!rackNameInput.trim() || !rackCodeInput.trim()) return;
    const targetId = `RACK-${rackCodeInput.trim().toUpperCase()}`;
    const newRack = {
      id: targetId, name: rackNameInput.trim(), code: rackCodeInput.trim().toUpperCase(),
      type: rackTypeInput, category: rackCatInput || 'General',
      maxCapacity: parseInt(rackCapInput) || 500,
      location: rackLocationInput || 'Counter Area',
      description: rackDescInput || 'General Storage Rack',
      status: rackStatusInput, createdBy: role || 'Admin',
      createdDate: new Date().toISOString().substring(0, 10)
    };
    const compCount = parseInt(rackCompCountInput) || 5;
    const compCapacity = Math.floor(newRack.maxCapacity / compCount);
    const newComps = [];
    for (let i = 1; i <= compCount; i++) {
      const compName = `${newRack.code}${i}`;
      newComps.push({
        id: `COMP-${newRack.code.toUpperCase()}-${compName}`,
        rackId: targetId, name: compName, category: newRack.category,
        suitableType: 'Boxes', maxCapacity: compCapacity,
        description: `Automated slot ${compName}`, status: 'Active',
        createdBy: role || 'Admin', createdDate: new Date().toISOString().substring(0, 10)
      });
    }
    setRacks(prev => [...prev, newRack]);
    setCompartments(prev => [...prev, ...newComps]);
    addNotification(`Rack ${newRack.name} created successfully`);
    addNotification('Capacity updated successfully');
    setActiveModal(null);
    setRackNameInput(''); setRackCodeInput(''); setRackCatInput('');
    setRackLocationInput(''); setRackDescInput(''); setRackCompCountInput('5');
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

  const submitNewCompartment = (e) => {
    e.preventDefault();
    if (!compNameInput.trim()) return;
    const genCompId = `COMP-${activeRack.code.toUpperCase()}-${compNameInput.trim().toUpperCase()}`;
    const newComp = {
      id: genCompId, rackId: selectedRackId, name: compNameInput.trim(),
      category: compCatInput || 'General', suitableType: compTypeInput,
      maxCapacity: parseInt(compCapInput) || 100,
      description: compDescInput || 'Shelf Partition Sub-Rack',
      status: compStatusInput, createdBy: role || 'Admin',
      createdDate: new Date().toISOString().substring(0, 10)
    };
    setCompartments(prev => [...prev, newComp]);
    addNotification(`${newComp.name} sub-rack added successfully`);
    addNotification('Capacity updated successfully');
    setActiveModal(null);
    setCompNameInput(''); setCompCatInput(''); setCompDescInput('');
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

  const submitAddMedicine = (e) => {
    e.preventDefault();
    if (!medNameInput.trim() || !medBatchInput.trim()) return;
    const qtyVal = parseInt(medQtyInput) || 10;
    if (activeCompartmentUsage + qtyVal > activeCompartment.maxCapacity) {
      alert(`Capacity exceeded! Maximum allowed space left: ${activeCompartment.maxCapacity - activeCompartmentUsage} units.`);
      return;
    }
    const newMed = {
      id: `MED-${Date.now().toString().slice(-3)}`,
      name: medNameInput.trim(),
      brandName: medBrandInput.trim() || medNameInput.trim(),
      batchNumber: medBatchInput.trim().toUpperCase(),
      quantity: qtyVal, unit: medUnitInput,
      supplier: medSupplierInput || 'Generic Supplier',
      addedBy: role || 'Admin',
      addedDate: new Date().toISOString().substring(0, 10),
      compartmentId: selectedCompId
    };
    setStoredMedicines(prev => [...prev, newMed]);
    setCompartments(prev => prev.map(c => {
      if (c.id === selectedCompId) {
        const nextUsage = getCompartmentUsage(selectedCompId) + qtyVal;
        return { ...c, status: nextUsage >= c.maxCapacity ? 'Full' : 'Active' };
      }
      return c;
    }));
    addNotification(`Medicine successfully allocated: ${newMed.name} to ${activeCompartment.name}`);
    addNotification('Capacity updated successfully');
    if (activeCompartmentUsage + qtyVal >= activeCompartment.maxCapacity) {
      addNotification(`Rack ${activeCompartment.name} is full`);
    }
    setActiveModal(null);
    setMedNameInput(''); setMedBrandInput(''); setMedBatchInput(''); setMedSupplierInput('');
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

  const submitRackToRack = (e) => {
    e.preventDefault();
    const qtyVal = parseInt(xQty);
    const sourceComp = compartments.find(c => c.id === xFromComp);
    const destComp = compartments.find(c => c.id === xToComp);
    const sourceRackObj = racks.find(r => r.id === xFromRack);
    const destRackObj = racks.find(r => r.id === xToRack);
    if (!sourceComp || !destComp || !xMedName.trim() || isNaN(qtyVal) || qtyVal <= 0) return;
    const sourceMed = storedMedicines.find(m => m.compartmentId === xFromComp && m.name === xMedName);
    if (!sourceMed || sourceMed.quantity < qtyVal) {
      alert(`Insufficient stock. Available in ${sourceComp.name}: ${sourceMed ? sourceMed.quantity : 0} units.`); return;
    }
    const destUsage = getCompartmentUsage(xToComp);
    if (destUsage + qtyVal > destComp.maxCapacity) {
      alert(`Destination capacity exceeded. Space available: ${destComp.maxCapacity - destUsage} units.`); return;
    }
    setStoredMedicines(prev => prev.map(m => m.compartmentId === xFromComp && m.name === xMedName ? { ...m, quantity: m.quantity - qtyVal } : m).filter(m => m.quantity > 0));
    setStoredMedicines(prev => {
      const exists = prev.find(m => m.compartmentId === xToComp && m.name === xMedName);
      if (exists) return prev.map(m => m.compartmentId === xToComp && m.name === xMedName ? { ...m, quantity: m.quantity + qtyVal } : m);
      return [...prev, { id: `MED-${Date.now().toString().slice(-3)}`, name: sourceMed.name, brandName: sourceMed.brandName, batchNumber: sourceMed.batchNumber || xBatch || 'B-GENERIC', quantity: qtyVal, unit: sourceMed.unit, supplier: sourceMed.supplier, addedBy: role || 'Admin', addedDate: new Date().toISOString().substring(0, 10), compartmentId: xToComp }];
    });
    setCompartments(prev => prev.map(c => {
      if (c.id === xFromComp) return { ...c, status: 'Active' };
      if (c.id === xToComp) { const nextUsage = getCompartmentUsage(xToComp) + qtyVal; return { ...c, status: nextUsage >= c.maxCapacity ? 'Full' : 'Active' }; }
      return c;
    }));
    const newTxn = {
      transactionId: `TXN-RR-${Date.now().toString().slice(-3)}`,
      transferType: 'Rack to Rack',
      source: `${sourceRackObj?.name} (${sourceComp.name})`,
      destination: `${destRackObj?.name} (${destComp.name})`,
      medicineName: xMedName, batchNumber: sourceMed.batchNumber || 'B-GENERIC',
      quantity: qtyVal, doneBy: role || 'Admin',
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Completed'
    };
    setTransferHistory(prev => [newTxn, ...prev]);
    addNotification('Stock transferred successfully');
    addNotification(`Stock moved from ${sourceComp.name} to ${destComp.name}`);
    addNotification('Capacity updated successfully');
    if (getCompartmentUsage(xToComp) + qtyVal >= destComp.maxCapacity) addNotification(`Rack ${destComp.name} is full`);
    setActiveModal(null);
  };

  const submitRackToWarehouse = (e) => {
    e.preventDefault();
    const qtyVal = parseInt(xQty);
    const sourceComp = compartments.find(c => c.id === xFromComp);
    const sourceRackObj = racks.find(r => r.id === xFromRack);
    const whComp = compartments.find(c => c.id === xWHName);
    if (!sourceComp || !xMedName.trim() || isNaN(qtyVal) || qtyVal <= 0 || !whComp) return;
    const sourceMed = storedMedicines.find(m => m.compartmentId === xFromComp && m.name === xMedName);
    if (!sourceMed || sourceMed.quantity < qtyVal) {
      alert(`Insufficient stock. Available in ${sourceComp.name}: ${sourceMed ? sourceMed.quantity : 0} units.`); return;
    }
    setStoredMedicines(prev => prev.map(m => m.compartmentId === xFromComp && m.name === xMedName ? { ...m, quantity: m.quantity - qtyVal } : m).filter(m => m.quantity > 0));
    setStoredMedicines(prev => {
      const exists = prev.find(m => m.compartmentId === xWHName && m.name === xMedName);
      if (exists) return prev.map(m => m.compartmentId === xWHName && m.name === xMedName ? { ...m, quantity: m.quantity + qtyVal } : m);
      return [...prev, { id: `MED-${Date.now().toString().slice(-3)}`, name: sourceMed.name, brandName: sourceMed.brandName, batchNumber: sourceMed.batchNumber, quantity: qtyVal, unit: sourceMed.unit, supplier: sourceMed.supplier, addedBy: role || 'Admin', addedDate: new Date().toISOString().substring(0, 10), compartmentId: xWHName }];
    });
    setCompartments(prev => prev.map(c => c.id === xFromComp ? { ...c, status: 'Active' } : c));
    const newTxn = {
      transactionId: `TXN-RW-${Date.now().toString().slice(-3)}`, transferType: 'Rack to Warehouse',
      source: `${sourceRackObj?.name} (${sourceComp.name})`, destination: `Warehouse Storage (${whComp.name})`,
      medicineName: xMedName, batchNumber: sourceMed.batchNumber, quantity: qtyVal,
      doneBy: role || 'Admin', dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Completed'
    };
    setTransferHistory(prev => [newTxn, ...prev]);
    addNotification('Stock moved to warehouse successfully');
    addNotification(`Stock moved from ${sourceComp.name} to Warehouse`);
    addNotification('Capacity updated successfully');
    setActiveModal(null);
  };

  const submitWarehouseToRack = (e) => {
    e.preventDefault();
    const qtyVal = parseInt(xQty);
    const destComp = compartments.find(c => c.id === xToComp);
    const destRackObj = racks.find(r => r.id === xToRack);
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
    setStoredMedicines(prev => prev.map(m => m.compartmentId === xWHName && m.name === xMedName ? { ...m, quantity: m.quantity - qtyVal } : m).filter(m => m.quantity > 0));
    setStoredMedicines(prev => {
      const exists = prev.find(m => m.compartmentId === xToComp && m.name === xMedName);
      if (exists) return prev.map(m => m.compartmentId === xToComp && m.name === xMedName ? { ...m, quantity: m.quantity + qtyVal } : m);
      return [...prev, { id: `MED-${Date.now().toString().slice(-3)}`, name: sourceMed.name, brandName: sourceMed.brandName, batchNumber: sourceMed.batchNumber, quantity: qtyVal, unit: sourceMed.unit, supplier: sourceMed.supplier, addedBy: role || 'Admin', addedDate: new Date().toISOString().substring(0, 10), compartmentId: xToComp }];
    });
    setCompartments(prev => prev.map(c => {
      if (c.id === xToComp) { const nextUsage = getCompartmentUsage(xToComp) + qtyVal; return { ...c, status: nextUsage >= c.maxCapacity ? 'Full' : 'Active' }; }
      return c;
    }));
    const newTxn = {
      transactionId: `TXN-WR-${Date.now().toString().slice(-3)}`, transferType: 'Warehouse to Rack',
      source: `Warehouse Storage (${whComp.name})`, destination: `${destRackObj?.name} (${destComp.name})`,
      medicineName: xMedName, batchNumber: sourceMed.batchNumber, quantity: qtyVal,
      doneBy: role || 'Admin', dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Completed'
    };
    setTransferHistory(prev => [newTxn, ...prev]);
    addNotification('Stock moved from warehouse to rack successfully');
    addNotification(`Stock moved from Warehouse to ${destComp.name}`);
    addNotification('Capacity updated successfully');
    if (getCompartmentUsage(xToComp) + qtyVal >= destComp.maxCapacity) addNotification(`Rack ${destComp.name} is full`);
    setActiveModal(null);
  };

  // ──────────────────────────────────────────────────────────
  // STOCK REQUEST FROM WAREHOUSE (Cross-module notification)
  // ──────────────────────────────────────────────────────────
  const [reqMedName, setReqMedName] = useState('');
  const [reqQty, setReqQty] = useState('50');
  const [reqReason, setReqReason] = useState('');
  const [reqRackId, setReqRackId] = useState('COMP-A1');

  const submitStockRequest = (e) => {
    e.preventDefault();
    if (!reqMedName.trim() || !reqQty || parseInt(reqQty) <= 0) {
      alert('Please fill in medicine name and a valid quantity.'); return;
    }
    const qtyVal = parseInt(reqQty);
    const rackLabel = compartments.find(c => c.id === reqRackId)?.name || reqRackId;
    const message = `📦 Stock Request: Rack [${rackLabel}] requested ${qtyVal} units of "${reqMedName.trim()}" from Warehouse. Reason: ${reqReason.trim() || 'Low stock'}`;

    // Push to global DB notifications — visible in Warehouse Alert Feed
    pushGlobalNotification(message, 'warning');

    // Add local rack notification too
    addNotification(`Stock request sent: ${qtyVal} units of ${reqMedName.trim()}`);

    // Log the transfer history as a pending request
    const newTxn = {
      transactionId: `TXN-REQ-${Date.now().toString().slice(-4)}`,
      transferType: 'Stock Request to Warehouse',
      source: `Rack [${rackLabel}]`,
      destination: 'Warehouse',
      medicineName: reqMedName.trim(),
      batchNumber: 'PENDING',
      quantity: qtyVal,
      doneBy: role || 'Admin',
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Pending Approval'
    };
    setTransferHistory(prev => [newTxn, ...prev]);

    alert(`✅ Stock request for ${qtyVal} units of "${reqMedName.trim()}" has been submitted to Warehouse Management. The warehouse admin will be notified.`);
    setActiveModal(null);
    setReqMedName(''); setReqQty('50'); setReqReason('');
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
