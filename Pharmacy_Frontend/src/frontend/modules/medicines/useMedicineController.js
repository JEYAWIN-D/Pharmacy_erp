import { useEffect, useState } from 'react';
import { useDB } from '../../db/DBContext';
import { medicinesAPI } from '../../db/api';

// ── Medicine Types full list ──────────────────────────────────────────────────
export const MEDICINE_TYPES = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment',
  'Drops', 'Powder', 'Cream', 'Gel', 'Inhaler',
  'Patch', 'Suppository', 'Surgical', 'Consumable', 'Other'
];

// ── Static Medicine Statuses (fallback if DB returns empty) ──────────────────
export const MEDICINE_STATUSES = ['Active', 'Inactive', 'Recovered', 'Blacklisted', 'Exported'];

// ── Storage Temperature presets ──────────────────────────────────────────────
export const STORAGE_TEMPS = [
  'Room Temperature (15–25°C)',
  'Cool Storage (8–15°C)',
  'Cold Storage (2–8°C)',
  'Deep Freeze (−20°C)',
  'Refrigerated'
];

export function useMedicineController(role) {
  const {
    medicines, setMedicines,
    medicineCategories, manufacturers,
    suppliers,
    medicineStatuses,
    medicineTypes,
  } = useDB();

  const resolvedTypes = (medicineTypes && medicineTypes.length > 0)
    ? medicineTypes.map(t => (typeof t === 'string' ? t : t.name))
    : MEDICINE_TYPES;

  const [searchQuery, setSearchQuery]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [typeFilter, setTypeFilter]         = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formMode, setFormMode]             = useState('add');
  const [saving, setSaving]                 = useState(false);

  // Resolved status list: DB > fallback
  const resolvedStatuses = (medicineStatuses && medicineStatuses.length > 0)
    ? medicineStatuses.map(s => (typeof s === 'string' ? s : s.name))
    : MEDICINE_STATUSES;

  const emptyForm = {
    name: '',
    generic: '',
    brand: '',
    sku: '',
    medicineCode: '',
    category: medicineCategories[0]?.name || '',
    supplierId: '',
    manufacturer: manufacturers[0]?.name || '',
    medicineType: 'Tablet',
    unit: 'Box',
    mrp: '',
    purchasePrice: '',
    sellingPrice: '',
    price: '',          // pricePerPiece
    stock: '',
    minStock: '10',
    lowestStockLevel: '5',
    rack: '',
    warehouse: 'Central Warehouse A',
    storageTemp: 'Room Temperature (15–25°C)',
    tempRequirement: 'Normal',
    gstRate: '12',
    rxRequired: false,
    coldStorageRequired: false,
    statusName: 'Active',
  };

  const [newMedicine, setNewMedicine] = useState(emptyForm);

  // Keep category/manufacturer/supplier defaults in sync on first load
  useEffect(() => {
    setNewMedicine(prev => {
      const nextCat  = prev.category  || medicineCategories[0]?.name || '';
      const nextMfr  = prev.manufacturer || manufacturers[0]?.name || '';
      if (prev.category === nextCat && prev.manufacturer === nextMfr) return prev;
      return { ...prev, category: nextCat, manufacturer: nextMfr };
    });
  }, [medicineCategories, manufacturers]);

  // ── Build API payload from form state ────────────────────────────────────
  const buildPayload = (form) => {
    const cat = medicineCategories.find(c => c.name === form.category);
    const mfr = manufacturers.find(m => m.name === form.manufacturer);
    return {
      medicineName:        form.name.trim(),
      genericName:         form.generic?.trim() || form.name.trim(),
      brandName:           form.brand?.trim()   || undefined,
      skuCode:             form.sku?.trim()      || undefined,
      medicineCode:        form.medicineCode?.trim() || undefined,
      categoryId:          cat?.id || undefined,
      supplierId:          form.supplierId || undefined,
      manufacturerId:      mfr?.id || undefined,
      medicineType:        form.medicineType || 'Tablet',
      unit:                form.unit || 'Box',
      mrp:                 parseFloat(form.mrp)           || 0,
      purchasePrice:       parseFloat(form.purchasePrice) || 0,
      sellingPrice:        parseFloat(form.sellingPrice)  || 0,
      pricePerPiece:       parseFloat(form.price)         || 0,
      stockQuantity:       parseInt(form.stock)           || 0,
      reorderLevel:        parseInt(form.minStock)        || 10,
      lowestStockLevel:    parseInt(form.lowestStockLevel) || 5,
      shelfLocation:       form.rack?.trim()  || undefined,
      storageType:         form.tempRequirement || 'Normal',
      taxPercentage:       parseFloat(form.gstRate) || 12,
      requiresDoctorSlip:  !!form.rxRequired,
      isActive:            form.statusName === 'Active',
      coldStorageRequired: !!form.coldStorageRequired,
      statusName:          form.statusName || 'Active',
    };
  };

  // ── ADD ───────────────────────────────────────────────────────────────────
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicine.name.trim()) { alert('Medicine name is required'); return; }
    setSaving(true);
    try {
      const payload = buildPayload(newMedicine);
      const res = await medicinesAPI.create(payload);
      if (res.success && res.data) {
        const added = normalizeMed(res.data, medicineCategories, manufacturers, suppliers);
        setMedicines(prev => [...prev, added]);
      }
      setNewMedicine(emptyForm);
    } catch (err) {
      alert('Error saving medicine: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ── OPEN EDIT ─────────────────────────────────────────────────────────────
  const handleEditMedicine = (med) => {
    setEditingMedicine(med);
    setNewMedicine({
      name:              med.medicineName || med.name || '',
      generic:           med.genericName  || med.generic || '',
      brand:             med.brandName    || med.brand || '',
      sku:               med.skuCode      || med.sku || '',
      medicineCode:      med.medicineCode || '',
      category:          typeof med.category === 'object' ? med.category?.name : (med.category || ''),
      supplierId:        med.supplierId || '',
      manufacturer:      typeof med.manufacturer === 'object' ? med.manufacturer?.name : (med.manufacturer || ''),
      medicineType:      med.medicineType || 'Tablet',
      unit:              med.unit || 'Box',
      mrp:               String(med.mrp || ''),
      purchasePrice:     String(med.purchasePrice || ''),
      sellingPrice:      String(med.sellingPrice  || ''),
      price:             String(med.pricePerPiece || med.price || ''),
      stock:             String(med.stockQuantity ?? med.stock ?? ''),
      minStock:          String(med.reorderLevel  || med.minStock || '10'),
      lowestStockLevel:  String(med.lowestStockLevel || '5'),
      rack:              med.shelfLocation || med.rack || '',
      warehouse:         med.warehouse || 'Central Warehouse A',
      storageTemp:       med.storageTemp || 'Room Temperature (15–25°C)',
      tempRequirement:   med.storageType || med.tempRequirement || 'Normal',
      gstRate:           String(med.taxPercentage || med.gstRate || '12'),
      rxRequired:        !!(med.requiresDoctorSlip || med.rxRequired),
      coldStorageRequired: !!med.coldStorageRequired,
      statusName:        med.statusName || 'Active',
    });
    setFormMode('edit');
  };

  // ── SAVE EDIT ─────────────────────────────────────────────────────────────
  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicine.name.trim()) { alert('Medicine name is required'); return; }
    setSaving(true);
    try {
      const payload = buildPayload(newMedicine);
      const res = await medicinesAPI.update(editingMedicine.id, payload);
      if (res.success) {
        const updated = normalizeMed(
          { ...editingMedicine, ...payload, id: editingMedicine.id },
          medicineCategories, manufacturers, suppliers
        );
        // Merge back names from form
        updated.name = newMedicine.name;
        updated.generic = newMedicine.generic;
        updated.category = newMedicine.category;
        updated.manufacturer = newMedicine.manufacturer;
        updated.supplierId = newMedicine.supplierId;
        setMedicines(prev => prev.map(m => m.id === editingMedicine.id ? updated : m));
      }
      setFormMode('add');
      setEditingMedicine(null);
      setNewMedicine(emptyForm);
    } catch (err) {
      alert('Error updating medicine: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ── CANCEL EDIT ───────────────────────────────────────────────────────────
  const handleCancelEdit = () => {
    setFormMode('add');
    setEditingMedicine(null);
    setNewMedicine(emptyForm);
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDeleteMedicine = async (id) => {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    if (!window.confirm(`Remove "${med.medicineName || med.name}" from catalog? This cannot be undone.`)) return;
    try {
      await medicinesAPI.delete(id);
      setMedicines(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert('Error deleting medicine: ' + (err.message || 'Unknown error'));
    }
  };

  // ── NORMALIZE RAW MEDICINE ────────────────────────────────────────────────
  const normalizeMed = (m, cats, mfrs, sups) => ({
    ...m,
    name:           m.medicineName || m.name || '',
    generic:        m.genericName  || m.generic || '',
    brand:          m.brandName    || m.brand || '',
    sku:            m.skuCode      || m.sku || '',
    category:       (typeof m.category === 'object' ? m.category?.name : m.category)
                      || cats.find(c => c.id === m.categoryId)?.name || '',
    manufacturer:   (typeof m.manufacturer === 'object' ? m.manufacturer?.name : m.manufacturer)
                      || mfrs.find(mf => mf.id === m.manufacturerId)?.name || '',
    supplierName:   (typeof m.supplier === 'object' ? m.supplier?.name : '')
                      || sups.find(s => s.id === m.supplierId)?.name || '',
    price:          parseFloat(m.pricePerPiece || m.price || 0),
    stock:          parseInt(m.stockQuantity ?? m.stock ?? 0, 10),
    minStock:       parseInt(m.reorderLevel   || m.minStock || 10, 10),
    lowestStockLevel: parseInt(m.lowestStockLevel || 5, 10),
    rack:           m.shelfLocation || m.rackLocation || m.rack || '',
    tempRequirement: m.storageType  || m.tempRequirement || 'Normal',
    gstRate:        parseFloat(m.taxPercentage || m.gstRate || 12),
    rxRequired:     !!(m.requiresDoctorSlip || m.rxRequired),
    mrp:            parseFloat(m.mrp || 0),
    purchasePrice:  parseFloat(m.purchasePrice || 0),
    sellingPrice:   parseFloat(m.sellingPrice  || 0),
    coldStorageRequired: !!m.coldStorageRequired,
    statusName:     m.statusName || 'Active',
    unit:           m.unit || 'Box',
    medicineCode:   m.medicineCode || '',
    medicineType:   (typeof m.medicineType === 'object' ? m.medicineType?.name : m.medicineType) || 'Tablet',
  });

  // ── MAPPED + FILTERED LIST ────────────────────────────────────────────────
  const mappedMedicines = medicines.map(m =>
    normalizeMed(m, medicineCategories, manufacturers, suppliers)
  );

  const uniqueCategories = Array.from(new Set(mappedMedicines.map(m => m.category).filter(Boolean)));
  const uniqueSuppliers  = Array.from(
    new Map(
      suppliers.map(s => [s.id, s.name])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  const q = searchQuery.toLowerCase().trim();
  const filteredMedicines = mappedMedicines.filter(m => {
    const matchQ = !q
      || m.name.toLowerCase().startsWith(q)
      || m.sku.toLowerCase().startsWith(q)
      || (m.medicineCode || '').toLowerCase().startsWith(q);
    const matchCat      = categoryFilter === 'All' || m.category === categoryFilter;
    const matchStatus   = statusFilter   === 'All' || m.statusName === statusFilter;
    const matchType     = typeFilter     === 'All' || m.medicineType === typeFilter;
    const matchSupplier = supplierFilter === 'All' || m.supplierId === supplierFilter;
    return matchQ && matchCat && matchStatus && matchType && matchSupplier;
  });

  return {
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    supplierFilter, setSupplierFilter,
    newMedicine, setNewMedicine,
    formMode,
    editingMedicine,
    saving,
    handleAddMedicine,
    handleEditMedicine,
    handleUpdateMedicine,
    handleCancelEdit,
    handleDeleteMedicine,
    filteredMedicines,
    uniqueCategories,
    uniqueSuppliers,
    medicineCategories,
    manufacturers,
    suppliers,
    resolvedStatuses,
    resolvedTypes,
    hasMedicineMetadata: medicineCategories.length > 0,
  };
}
