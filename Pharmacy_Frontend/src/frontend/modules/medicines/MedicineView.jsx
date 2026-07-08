import React, { useState } from 'react';
import {
  Database, Search, Plus, Pencil, Trash2, Tag, Building2, X,
  AlertTriangle, Thermometer, Package, Snowflake, Filter,
  ChevronDown, CheckCircle2, XCircle, Clock, Ban, ArrowUpRight,
  FlaskConical, Warehouse, Users
} from 'lucide-react';
import { useMedicineController, MEDICINE_TYPES, MEDICINE_STATUSES, STORAGE_TEMPS } from './useMedicineController';
import { useMedicineCategoryController } from './useMedicineCategoryController';
import { useManufacturerController } from './useManufacturerController';
import { useDB } from '../../db/DBContext';
import { categoriesAPI } from '../../db/api';

// ─── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Active:      { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={10} /> },
  Inactive:    { color: 'bg-slate-50 text-slate-500 border-slate-200',       icon: <XCircle size={10} /> },
  Recovered:   { color: 'bg-blue-50 text-blue-700 border-blue-200',          icon: <Clock size={10} /> },
  Blacklisted: { color: 'bg-red-50 text-red-700 border-red-200',             icon: <Ban size={10} /> },
  Exported:    { color: 'bg-purple-50 text-purple-700 border-purple-200',    icon: <ArrowUpRight size={10} /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Active;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${cfg.color}`}>
      {cfg.icon} {status}
    </span>
  );
}

// ─── Form Label ────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Form Input ────────────────────────────────────────────────────────────────
const inputCls = "w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition";
const selectCls = inputCls + " cursor-pointer";

// ─── Preset Category Chips ─────────────────────────────────────────────────────
const PRESET_CATEGORIES = [
  { name: 'Antibiotic',   desc: 'Medicines that fight bacterial infections' },
  { name: 'Painkiller',   desc: 'Analgesic medicines for pain relief' },
  { name: 'Surgical',     desc: 'Surgical tools and accessories' },
  { name: 'Consumable',   desc: 'Single-use medical consumables' },
  { name: 'Diabetic',     desc: 'Medicines for diabetes management' },
  { name: 'Injection',    desc: 'Injectable medicines and vials' },
  { name: 'Tablet',       desc: 'Oral solid dosage medicines' },
  { name: 'Syrup',        desc: 'Liquid oral medicines' },
  { name: 'Vitamin',      desc: 'Nutritional supplements and vitamins' },
  { name: 'Antifungal',   desc: 'Medicines for fungal infections' },
  { name: 'Antihistamine',desc: 'Allergy relief medicines' },
  { name: 'Cardiac',      desc: 'Heart and blood pressure medicines' },
];

// ─── MAIN VIEW ────────────────────────────────────────────────────────────────
export default function MedicineView({ role, setSchemaModalTable, setAppTab }) {
  const [activeTab, setActiveTab] = useState('medicines');
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Medicine controller
  const {
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    supplierFilter, setSupplierFilter,
    newMedicine, setNewMedicine,
    formMode, editingMedicine, saving,
    handleAddMedicine, handleEditMedicine, handleUpdateMedicine,
    handleCancelEdit, handleDeleteMedicine,
    filteredMedicines, uniqueCategories, uniqueSuppliers,
    medicineCategories, manufacturers, suppliers,
    resolvedStatuses, resolvedTypes, hasMedicineMetadata,
  } = useMedicineController(role);

  const { setMedicineCategories } = useDB();

  const handleCategorySelectChange = async (val) => {
    if (val === 'ADD_NEW_CATEGORY') {
      const name = window.prompt('Enter new Category Name:');
      if (!name || !name.trim()) return;
      try {
        const res = await categoriesAPI.create({ name: name.trim() });
        if (res.success && res.data) {
          setMedicineCategories(prev => [...prev, res.data]);
          setNewMedicine(prev => ({ ...prev, category: res.data.name }));
          alert('Category created successfully');
        }
      } catch (err) {
        alert('Failed to create category: ' + err.message);
      }
    } else {
      setNewMedicine(prev => ({ ...prev, category: val }));
    }
  };

  // Category controller
  const {
    medicineCategories: cats,
    newCategory, setNewCategory,
    handleAddCategory, saving: catSaving,
    editingCategory, editForm, setEditForm, editSaving,
    handleStartEditCategory, handleCancelCategoryEdit,
    handleUpdateCategory, handleDeleteCategory,
  } = useMedicineCategoryController();

  // Manufacturer controller
  const {
    manufacturers: mfrs,
    newManufacturer, setNewManufacturer,
    handleAddManufacturer, handleDeleteManufacturer,
  } = useManufacturerController();

  const tabs = [
    { id: 'medicines',    label: 'Medicines',           icon: <FlaskConical size={13} /> },
    { id: 'categories',   label: 'Category Management', icon: <Tag size={13} /> },
    { id: 'manufacturers',label: 'Manufacturers',        icon: <Building2 size={13} /> },
  ];

  // ── Fill preset into add-category form ─────────────────────────────────────
  const fillPreset = (preset) => {
    const alreadyExists = cats.some(c => c.name.toLowerCase() === preset.name.toLowerCase());
    if (alreadyExists) {
      alert(`Category "${preset.name}" already exists in your database.`);
      return;
    }
    setNewCategory({ name: preset.name, description: preset.desc });
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Medicine Master
            <button
              onClick={() => setSchemaModalTable && setSchemaModalTable('medicine_master')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Table Schema"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage medicine catalog, categories, manufacturers & storage</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: MEDICINES                                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'medicines' && (
        <div className="space-y-4">
          {/* Search + Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, generic, SKU, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56"
              />
            </div>

            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs p-2 focus:outline-none cursor-pointer">
              <option value="All">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs p-2 focus:outline-none cursor-pointer">
              <option value="All">All Statuses</option>
              {resolvedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs p-2 focus:outline-none cursor-pointer">
              <option value="All">All Types</option>
              {resolvedTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {uniqueSuppliers.length > 0 && (
              <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl text-xs p-2 focus:outline-none cursor-pointer">
                <option value="All">All Suppliers</option>
                {uniqueSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}

            <span className="text-[10px] text-slate-400 font-semibold ml-auto">
              {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''} found
            </span>

            <button
              onClick={() => { setShowRegisterForm(true); if (formMode === 'edit') handleCancelEdit(); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Plus size={13} /> Register Medicine
            </button>
          </div>

          {/* ── Medicine Table (Full Width) ── */}
          <div className="unique-card p-5 text-left space-y-3 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-2.5 pr-3">Medicine</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Supplier</th>
                      <th className="py-2.5 text-center">Stock</th>
                      <th className="py-2.5 text-right">MRP</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-center">Flags</th>
                      <th className="py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map(med => {
                      const isOut = med.stock === 0;
                      const isLow = !isOut && med.stock <= med.minStock;
                      return (
                        <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/60 group">
                          <td className="py-3 pr-3">
                            <span className="font-bold text-slate-800 block leading-tight">{med.name}</span>
                            <span className="text-[10px] text-slate-400 italic">{med.generic}</span>
                            {med.medicineCode && (
                              <span className="text-[9px] text-slate-300 font-mono block">{med.medicineCode}</span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold">
                              {med.category || '—'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 text-[11px]">{med.medicineType || '—'}</td>
                          <td className="py-3 text-slate-400 text-[10px]">{med.supplierName || '—'}</td>
                          <td className="py-3 text-center">
                            <span className={`font-black text-xs ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                              {med.stock}
                            </span>
                            {isOut && <span className="block text-[9px] text-red-500 font-bold">Empty</span>}
                            {isLow && !isOut && <span className="block text-[9px] text-amber-500 font-bold">Low</span>}
                          </td>
                          <td className="py-3 text-right font-bold text-blue-600">
                            ₹{Number(med.mrp || med.price || 0).toFixed(2)}
                          </td>
                          <td className="py-3 text-center">
                            <StatusBadge status={med.statusName} />
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {med.coldStorageRequired && (
                                <span title="Cold Storage Required" className="text-blue-500">
                                  <Snowflake size={12} />
                                </span>
                              )}
                              {med.rxRequired && (
                                <span title="Requires Prescription" className="text-amber-600 text-[9px] font-black">Rx</span>
                              )}
                              {!med.coldStorageRequired && !med.rxRequired && (
                                <span className="text-slate-200">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isLow && (
                                <button
                                  onClick={() => setAppTab && setAppTab('purchase-management')}
                                  className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                  title="Low Stock — Raise Purchase Order"
                                >
                                  <AlertTriangle size={11} />
                                </button>
                              )}
                              <button
                                onClick={() => { handleEditMedicine(med); setShowRegisterForm(true); }}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(med.id)}
                                className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredMedicines.length === 0 && (
                      <tr>
                        <td colSpan="9" className="py-10 text-center text-slate-400 font-semibold text-xs">
                          No medicines matched your search or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Centered Modal: Register / Edit Medicine ── */}
            {showRegisterForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => { setShowRegisterForm(false); if (formMode === 'edit') handleCancelEdit(); }}
                />
                {/* Modal */}
                <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ animation: 'modalFadeIn 0.25s ease-out', maxHeight: '90vh' }}>
                  {/* Header */}
                  <div className="flex items-center gap-4 px-8 py-5 border-b border-slate-100">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                      {formMode === 'edit'
                        ? <Pencil size={20} className="text-white" />
                        : <FlaskConical size={20} className="text-white" />
                      }
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-base font-extrabold text-slate-800">
                        {formMode === 'edit' ? 'Edit Medicine' : 'Register New Medicine'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formMode === 'edit' ? 'Update the medicine details below' : 'Fill in the medicine details below'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowRegisterForm(false); if (formMode === 'edit') handleCancelEdit(); }}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="overflow-y-auto px-8 py-6 space-y-5" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    <form onSubmit={formMode === 'edit' ? handleUpdateMedicine : handleAddMedicine} className="space-y-5">

                      {/* ── Section: Basic Information ── */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Basic Information</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label required>Medicine Name</Label>
                            <input type="text" placeholder="e.g. Calpol 650mg" value={newMedicine.name}
                              onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })}
                              className={inputCls} required />
                          </div>
                          <div>
                            <Label>Generic Name</Label>
                            <input type="text" placeholder="e.g. Paracetamol" value={newMedicine.generic}
                              onChange={e => setNewMedicine({ ...newMedicine, generic: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label>Brand / Label</Label>
                            <input type="text" placeholder="e.g. GSK" value={newMedicine.brand}
                              onChange={e => setNewMedicine({ ...newMedicine, brand: e.target.value })}
                              className={inputCls} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label required>SKU / Barcode</Label>
                            <input type="text" placeholder="SKU-001" value={newMedicine.sku}
                              onChange={e => setNewMedicine({ ...newMedicine, sku: e.target.value })}
                              className={inputCls} required />
                          </div>
                          <div>
                            <Label>Medicine Code</Label>
                            <input type="text" placeholder="MED-001" value={newMedicine.medicineCode}
                              onChange={e => setNewMedicine({ ...newMedicine, medicineCode: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label required>Medicine Type</Label>
                            <select value={newMedicine.medicineType}
                              onChange={e => setNewMedicine({ ...newMedicine, medicineType: e.target.value })}
                              className={selectCls}>
                              {resolvedTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Unit of Measure</Label>
                            <input type="text" placeholder="Box / Strip / Bottle" value={newMedicine.unit}
                              onChange={e => setNewMedicine({ ...newMedicine, unit: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label>Rx Required</Label>
                            <select value={newMedicine.rxRequired ? 'yes' : 'no'}
                              onChange={e => setNewMedicine({ ...newMedicine, rxRequired: e.target.value === 'yes' })}
                              className={selectCls}>
                              <option value="no">No Prescription Needed</option>
                              <option value="yes">Doctor Prescription (Rx)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ── Section: Classification & Mapping ── */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification & Mapping</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label required>Category</Label>
                            <select value={newMedicine.category}
                              onChange={e => handleCategorySelectChange(e.target.value)}
                              className={selectCls}>
                              <option value="">{hasMedicineMetadata ? 'Select category' : 'Loading...'}</option>
                              {medicineCategories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                              <option value="ADD_NEW_CATEGORY">➕ Add New Category...</option>
                            </select>
                          </div>
                          <div>
                            <Label>Manufacturer</Label>
                            <select value={newMedicine.manufacturer}
                              onChange={e => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                              className={selectCls}>
                              <option value="">Select manufacturer</option>
                              {manufacturers.map(mfr => (
                                <option key={mfr.id} value={mfr.name}>{mfr.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Medicine Status</Label>
                            <select value={newMedicine.statusName}
                              onChange={e => setNewMedicine({ ...newMedicine, statusName: e.target.value })}
                              className={selectCls}>
                              {resolvedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Supplier / Distributor</Label>
                            <select value={newMedicine.supplierId}
                              onChange={e => setNewMedicine({ ...newMedicine, supplierId: e.target.value })}
                              className={selectCls}>
                              <option value="">Select supplier</option>
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ── Section: Pricing ── */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label required>MRP (₹)</Label>
                            <input type="number" step="0.01" placeholder="0.00" value={newMedicine.mrp}
                              onChange={e => setNewMedicine({ ...newMedicine, mrp: e.target.value })}
                              className={inputCls} required />
                          </div>
                          <div>
                            <Label>Purchase (₹)</Label>
                            <input type="number" step="0.01" placeholder="0.00" value={newMedicine.purchasePrice}
                              onChange={e => setNewMedicine({ ...newMedicine, purchasePrice: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label>Selling (₹)</Label>
                            <input type="number" step="0.01" placeholder="0.00" value={newMedicine.sellingPrice}
                              onChange={e => setNewMedicine({ ...newMedicine, sellingPrice: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label>Per Piece (₹)</Label>
                            <input type="number" step="0.01" placeholder="0.00" value={newMedicine.price}
                              onChange={e => setNewMedicine({ ...newMedicine, price: e.target.value })}
                              className={inputCls} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>GST Rate</Label>
                            <select value={newMedicine.gstRate}
                              onChange={e => setNewMedicine({ ...newMedicine, gstRate: e.target.value })}
                              className={selectCls}>
                              <option value="0">0% (Exempt)</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ── Section: Stock Levels ── */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock Levels</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label required>Stock Qty</Label>
                            <input type="number" placeholder="0" value={newMedicine.stock}
                              onChange={e => setNewMedicine({ ...newMedicine, stock: e.target.value })}
                              className={inputCls} required />
                          </div>
                          <div>
                            <Label>Minimum Stock</Label>
                            <input type="number" placeholder="10" value={newMedicine.minStock}
                              onChange={e => setNewMedicine({ ...newMedicine, minStock: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label>Lowest Stock</Label>
                            <input type="number" placeholder="5" value={newMedicine.lowestStockLevel}
                              onChange={e => setNewMedicine({ ...newMedicine, lowestStockLevel: e.target.value })}
                              className={inputCls} />
                          </div>
                        </div>
                      </div>

                      {/* ── Section: Storage & Location ── */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage & Location</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Rack Allocation</Label>
                            <input type="text" placeholder="e.g. A1, B3" value={newMedicine.rack}
                              onChange={e => setNewMedicine({ ...newMedicine, rack: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <Label>Warehouse</Label>
                            <select value={newMedicine.warehouse}
                              onChange={e => setNewMedicine({ ...newMedicine, warehouse: e.target.value })}
                              className={selectCls}>
                              <option value="Central Warehouse A">Central Warehouse A</option>
                              <option value="Secondary Warehouse B">Secondary Warehouse B</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-200 transition w-full">
                              <input
                                type="checkbox"
                                checked={newMedicine.coldStorageRequired}
                                onChange={e => setNewMedicine({ ...newMedicine, coldStorageRequired: e.target.checked })}
                                className="rounded accent-blue-600 h-4 w-4 cursor-pointer"
                              />
                              <Snowflake size={13} className="text-blue-500" />
                              Cold Storage
                            </label>
                          </div>
                        </div>

                        {newMedicine.coldStorageRequired && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Storage Temperature</Label>
                              <select value={newMedicine.storageTemp}
                                onChange={e => setNewMedicine({ ...newMedicine, storageTemp: e.target.value, tempRequirement: 'Cold' })}
                                className={selectCls}>
                                {STORAGE_TEMPS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        {!newMedicine.coldStorageRequired && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Storage Type</Label>
                              <select value={newMedicine.tempRequirement}
                                onChange={e => setNewMedicine({ ...newMedicine, tempRequirement: e.target.value })}
                                className={selectCls}>
                                <option value="Normal">Room Temperature</option>
                                <option value="Cool">Cool Storage (8–15°C)</option>
                                <option value="Dry">Dry Storage</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={saving}
                        className={`w-full py-3.5 text-white rounded-xl text-sm font-bold transition shadow-lg cursor-pointer ${
                          saving ? 'opacity-60 cursor-not-allowed' :
                          formMode === 'edit' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {saving ? '⏳ Saving...' : formMode === 'edit' ? '💾 Update Medicine' : '+ Save to Catalog'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: CATEGORY MANAGEMENT                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          {/* Preset chips */}
          <div className="unique-card p-5 text-left space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Tag size={13} className="text-blue-600" /> Quick-Add Preset Categories
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">Click a chip to pre-fill the form below, then save it to your database.</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map(p => {
                const exists = cats.some(c => c.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <button
                    key={p.name}
                    onClick={() => fillPreset(p)}
                    disabled={exists}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      exists
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                    title={exists ? 'Already in database' : p.desc}
                  >
                    {exists && '✓ '}{p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category List */}
            <div className="unique-card p-5 lg:col-span-2 text-left space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Tag size={13} className="text-blue-600" />
                Medicine Categories ({cats.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-2.5">#</th>
                      <th className="py-2.5">Category Name</th>
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cats.map((cat, idx) => (
                      <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="py-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-3">
                          {editingCategory?.id === cat.id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full p-1.5 bg-white border border-blue-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                              autoFocus
                            />
                          ) : (
                            <span className="font-bold text-slate-800">{cat.name}</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500 max-w-[200px]">
                          {editingCategory?.id === cat.id ? (
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              placeholder="Description (optional)"
                              className="w-full p-1.5 bg-white border border-blue-300 rounded-lg text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-[11px]">{cat.description || '—'}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            cat.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {cat.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {editingCategory?.id === cat.id ? (
                              <>
                                <button
                                  onClick={handleUpdateCategory}
                                  disabled={editSaving}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                                  title="Save"
                                >
                                  {editSaving ? '...' : <CheckCircle2 size={12} />}
                                </button>
                                <button
                                  onClick={handleCancelCategoryEdit}
                                  className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEditCategory(cat)}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {cats.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 text-xs font-semibold">
                          No categories yet. Add one using the form or quick-add chips above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Category Form */}
            <div className="unique-form-panel p-5 text-left space-y-4">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Plus size={14} className="text-blue-600" /> Add New Category
              </h4>
              <form onSubmit={handleAddCategory} className="space-y-3">
                <div>
                  <Label required>Category Name</Label>
                  <input
                    type="text"
                    placeholder="e.g. Antifungal"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    placeholder="Brief description of medicines in this category..."
                    value={newCategory.description}
                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                    className={inputCls + ' h-20 resize-none'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-60"
                >
                  {catSaving ? '⏳ Adding...' : '+ Add Category to Database'}
                </button>
              </form>

              {/* Quick reference */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Example Categories</p>
                <div className="space-y-1.5">
                  {PRESET_CATEGORIES.slice(0, 6).map(p => (
                    <div key={p.name} className="text-[10px] text-slate-500">
                      <span className="font-bold text-slate-700">{p.name}</span> — {p.desc}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: MANUFACTURERS                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'manufacturers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="unique-card p-5 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={13} className="text-blue-600" /> Manufacturers ({mfrs.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Company Name</th>
                    <th className="py-2.5">Country</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Phone</th>
                    <th className="py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mfrs.map(mfr => (
                    <tr key={mfr.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 font-bold text-slate-800">{mfr.name}</td>
                      <td className="py-3 text-slate-500">{mfr.country || '—'}</td>
                      <td className="py-3 text-slate-500">{mfr.contactEmail || '—'}</td>
                      <td className="py-3 text-slate-500">{mfr.phone || '—'}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteManufacturer(mfr.id)}
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mfrs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No manufacturers added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Manufacturer Form */}
          <div className="unique-form-panel p-5 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Plus size={14} className="text-blue-600" /> Add Manufacturer
            </h4>
            <form onSubmit={handleAddManufacturer} className="space-y-3">
              <div>
                <Label required>Company Name</Label>
                <input type="text" placeholder="e.g. Cipla Ltd" value={newManufacturer.name}
                  onChange={e => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
                  className={inputCls} required />
              </div>
              <div>
                <Label>Country</Label>
                <input type="text" placeholder="e.g. India" value={newManufacturer.country}
                  onChange={e => setNewManufacturer({ ...newManufacturer, country: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <Label>Contact Email</Label>
                <input type="email" placeholder="orders@company.com" value={newManufacturer.contactEmail}
                  onChange={e => setNewManufacturer({ ...newManufacturer, contactEmail: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <Label>Phone</Label>
                <input type="text" placeholder="+91 22 xxxx xxxx" value={newManufacturer.phone}
                  onChange={e => setNewManufacturer({ ...newManufacturer, phone: e.target.value })}
                  className={inputCls} />
              </div>
              <button type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">
                + Add Manufacturer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
