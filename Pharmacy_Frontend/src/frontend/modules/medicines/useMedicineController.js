import { useEffect, useState } from 'react';
import { useDB } from '../../db/DBContext';
import { medicinesAPI } from '../../db/api';

export function useMedicineController(role) {
  const { medicines, setMedicines, medicineCategories, manufacturers } = useDB();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: '', generic: '', brand: '', sku: '',
    category: medicineCategories[0]?.name || '',
    manufacturer: manufacturers[0]?.name || '',
    price: '', stock: '', minStock: '10',
    rack: 'A1', tempRequirement: 'Normal', gstRate: '12', rxRequired: false
  };

  const [newMedicine, setNewMedicine] = useState(emptyForm);

  useEffect(() => {
    setNewMedicine(prev => {
      const nextCategory = prev.category || medicineCategories[0]?.name || '';
      const nextManufacturer = prev.manufacturer || manufacturers[0]?.name || '';

      if (prev.category === nextCategory && prev.manufacturer === nextManufacturer) {
        return prev;
      }

      return {
        ...prev,
        category: nextCategory,
        manufacturer: nextManufacturer
      };
    });
  }, [medicineCategories, manufacturers]);

  // Build the API payload matching the backend Medicine model
  const buildPayload = (form, categories, mfrs) => {
    // Resolve categoryId from category name
    const cat = categories.find(c => c.name === form.category);
    const mfr = mfrs.find(m => m.name === form.manufacturer);
    return {
      medicineName: form.name.trim(),
      genericName: form.generic?.trim() || form.name.trim(),
      brandName: form.brand?.trim() || undefined,
      skuCode: form.sku?.trim() || undefined,
      categoryId: cat?.id || undefined,
      manufacturerId: mfr?.id || undefined,
      pricePerPiece: parseFloat(form.price) || 0,
      stockQuantity: parseInt(form.stock) || 0,
      reorderLevel: parseInt(form.minStock) || 10,
      shelfLocation: form.rack?.trim() || undefined,
      storageType: form.tempRequirement || 'Normal',
      taxPercentage: parseFloat(form.gstRate) || 12,
      requiresDoctorSlip: !!form.rxRequired,
      isActive: true
    };
  };

  // ── ADD ───────────────────────────────────────────────────────────────────
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicine.name.trim()) { alert('Medicine name is required'); return; }
    setSaving(true);
    try {
      const payload = buildPayload(newMedicine, medicineCategories, manufacturers);
      const res = await medicinesAPI.create(payload);
      if (res.success && res.data) {
        // Add to local state so it shows immediately
        const added = {
          ...res.data,
          // Map API fields back to UI fields
          name: res.data.medicineName,
          generic: res.data.genericName || res.data.medicineName,
          brand: res.data.brandName || '',
          sku: res.data.skuCode || '',
          category: medicineCategories.find(c => c.id === res.data.categoryId)?.name || newMedicine.category,
          manufacturer: manufacturers.find(m => m.id === res.data.manufacturerId)?.name || newMedicine.manufacturer,
          price: res.data.pricePerPiece || 0,
          stock: res.data.stockQuantity || 0,
          minStock: res.data.reorderLevel || 10,
          rack: res.data.shelfLocation || 'A1',
          tempRequirement: res.data.storageType || 'Normal',
          gstRate: res.data.taxPercentage || 12,
          rxRequired: res.data.requiresDoctorSlip || false
        };
        setMedicines(prev => [...prev, added]);
      }
      alert(`Medicine "${newMedicine.name}" saved to database successfully.`);
      setNewMedicine(emptyForm);
    } catch (err) {
      alert('Error saving medicine: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ── OPEN EDIT FORM ────────────────────────────────────────────────────────
  const handleEditMedicine = (med) => {
    setEditingMedicine(med);
    setNewMedicine({
      name: med.medicineName || med.name || '',
      generic: med.genericName || med.generic || '',
      brand: med.brandName || med.brand || '',
      sku: med.skuCode || med.sku || '',
      category: med.category || '',
      manufacturer: med.manufacturer || '',
      price: med.pricePerPiece || med.price || '',
      stock: med.stockQuantity ?? med.stock ?? '',
      minStock: med.reorderLevel || med.minStock || '10',
      rack: med.shelfLocation || med.rack || 'A1',
      tempRequirement: med.storageType || med.tempRequirement || 'Normal',
      gstRate: String(med.taxPercentage || med.gstRate || 12),
      rxRequired: med.requiresDoctorSlip || med.rxRequired || false
    });
    setFormMode('edit');
  };

  // ── SAVE EDIT ─────────────────────────────────────────────────────────────
  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicine.name.trim()) { alert('Medicine name is required'); return; }
    setSaving(true);
    try {
      const payload = buildPayload(newMedicine, medicineCategories, manufacturers);
      const res = await medicinesAPI.update(editingMedicine.id, payload);
      if (res.success) {
        const updated = {
          ...editingMedicine,
          ...payload,
          name: newMedicine.name,
          generic: newMedicine.generic,
          brand: newMedicine.brand,
          sku: newMedicine.sku,
          category: newMedicine.category,
          manufacturer: newMedicine.manufacturer,
          price: parseFloat(newMedicine.price),
          stock: parseInt(newMedicine.stock),
          minStock: parseInt(newMedicine.minStock || 10),
          rack: newMedicine.rack,
          tempRequirement: newMedicine.tempRequirement,
          gstRate: parseInt(newMedicine.gstRate),
          rxRequired: !!newMedicine.rxRequired
        };
        setMedicines(prev => prev.map(m => m.id === editingMedicine.id ? updated : m));
        alert(`"${updated.name}" updated in database successfully.`);
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
    if (!window.confirm(`Permanently remove "${med.name}" from the catalog? This cannot be undone.`)) return;
    try {
      await medicinesAPI.delete(id);
      setMedicines(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert('Error deleting medicine: ' + (err.message || 'Unknown error'));
    }
  };

  // ── FILTER & MAP ──────────────────────────────────────────────────────────
  const mappedMedicines = medicines.map(m => ({
    ...m,
    name: m.medicineName || m.name || '',
    generic: m.genericName || m.generic || '',
    brand: m.brandName || m.brand || '',
    sku: m.skuCode || m.sku || '',
    category: (typeof m.category === 'object' ? m.category?.name : m.category) || medicineCategories.find(c => c.id === m.categoryId)?.name || '',
    manufacturer: (typeof m.manufacturer === 'object' ? m.manufacturer?.name : m.manufacturer) || manufacturers.find(mf => mf.id === m.manufacturerId)?.name || '',
    price: parseFloat(m.pricePerPiece || m.price || 0),
    stock: parseInt(m.stockQuantity ?? m.stock ?? 0, 10),
    minStock: parseInt(m.reorderLevel || m.minStock || 10, 10),
    rack: m.shelfLocation || m.rackLocation || m.rack || 'A1',
    tempRequirement: m.storageType || m.storageCondition || m.tempRequirement || 'Normal',
    gstRate: parseFloat(m.taxPercentage || m.gstRate || 12),
    rxRequired: m.requiresDoctorSlip || m.requiresPrescription || m.rxRequired || false
  }));

  const uniqueCategories = Array.from(new Set(mappedMedicines.map(m => m.category).filter(Boolean)));

  const filteredMedicines = mappedMedicines.filter(m => {
    const query = searchQuery.toLowerCase().trim();
    const name = m.name.toLowerCase();
    const generic = m.generic.toLowerCase();
    const sku = m.sku.toLowerCase();
    const matchesQuery = !query || name.includes(query) || generic.includes(query) || sku.includes(query);
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    return matchesQuery && matchesCat;
  });

  return {
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
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
    medicineCategories,
    manufacturers,
    hasMedicineMetadata: medicineCategories.length > 0 && manufacturers.length > 0
  };
}
