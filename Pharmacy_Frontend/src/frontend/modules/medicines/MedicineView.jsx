import React, { useState } from 'react';
import { Database, Search, Plus, Pencil, Trash2, Tag, Building2, X, AlertTriangle } from 'lucide-react';
import { useMedicineController } from './useMedicineController';
import { useMedicineCategoryController } from './useMedicineCategoryController';
import { useManufacturerController } from './useManufacturerController';

export default function MedicineView({ role, setSchemaModalTable, setAppTab }) {
  const [activeTab, setActiveTab] = useState('medicines');

  const {
    searchQuery, setSearchQuery, categoryFilter, setCategoryFilter,
    newMedicine, setNewMedicine, formMode, editingMedicine,
    handleAddMedicine, handleEditMedicine, handleUpdateMedicine,
    handleCancelEdit, handleDeleteMedicine,
    filteredMedicines, uniqueCategories, medicineCategories, manufacturers,
    hasMedicineMetadata
  } = useMedicineController(role);

  const {
    medicineCategories: cats, newCategory, setNewCategory,
    handleAddCategory, handleDeleteCategory
  } = useMedicineCategoryController();

  const {
    manufacturers: mfrs, newManufacturer, setNewManufacturer,
    handleAddManufacturer, handleDeleteManufacturer
  } = useManufacturerController();

  const tabs = [
    { id: 'medicines', label: 'Medicines', icon: <Database size={13} /> },
    { id: 'categories', label: 'Categories', icon: <Tag size={13} /> },
    { id: 'manufacturers', label: 'Manufacturers', icon: <Building2 size={13} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Medicine Master
            <button onClick={() => setSchemaModalTable('medicine_master')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer" title="View Table Schema">
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Manage medicine catalog, categories, and manufacturers</p>
        </div>
        {/* Module Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: MEDICINES ─────────────────────────────────────────────── */}
      {activeTab === 'medicines' && (
        <div>
          {/* Search & Filter row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by name, generic, SKU..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52" />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs p-2 focus:outline-none cursor-pointer">
              <option value="All">All Categories</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Medicine List */}
            <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-2.5">Name / Generic</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Manufacturer</th>
                      <th className="py-2.5 text-center">GST</th>
                      <th className="py-2.5 text-right">Price</th>
                      <th className="py-2.5 text-center">Stock</th>
                      <th className="py-2.5 text-center">Rack</th>
                      <th className="py-2.5 text-center">Rx</th>
                      <th className="py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map(med => (
                      <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 text-left">
                          <span className="font-extrabold text-slate-800 block">{med.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold italic">{med.generic}</span>
                        </td>
                        <td className="py-3 text-slate-500 font-semibold">{med.category}</td>
                        <td className="py-3 text-slate-400 text-[10px]">{med.manufacturer}</td>
                        <td className="py-3 text-center text-slate-500 font-bold">{med.gstRate}%</td>
                        <td className="py-3 text-right font-bold text-blue-600">₹{med.price.toFixed(2)}</td>
                        <td className="py-3 text-center">
                          <span className={`font-black text-xs ${med.stock === 0 ? 'text-red-600' : med.stock <= med.minStock ? 'text-amber-600' : 'text-slate-800'}`}>{med.stock}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-bold text-[10px]">{med.rack}</span>
                        </td>
                        <td className="py-3 text-center">
                          {med.rxRequired
                            ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-red-700 bg-red-50 border border-red-200/50">Yes</span>
                            : <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200/50">No</span>}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {med.stock <= med.minStock && (
                              <button onClick={() => setAppTab && setAppTab('purchase-management')}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer" title="Low Stock! View in Allocation Page">
                                <AlertTriangle size={12} />
                              </button>
                            )}
                            <button onClick={() => handleEditMedicine(med)}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer" title="Edit">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDeleteMedicine(med.id)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredMedicines.length === 0 && (
                      <tr><td colSpan="9" className="py-6 text-center text-slate-400 font-semibold">No medicines matched the search terms.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add / Edit Form */}
            <div className="unique-form-panel p-6 text-left space-y-4">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {formMode === 'edit' ? <Pencil size={15} className="text-amber-600" /> : <Plus size={15} className="text-blue-600" />}
                  {formMode === 'edit' ? 'Edit Medicine' : 'Register New Medicine'}
                </span>
                {formMode === 'edit' && (
                  <button onClick={handleCancelEdit} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer" title="Cancel Edit"><X size={13} /></button>
                )}
              </h4>
              <form onSubmit={formMode === 'edit' ? handleUpdateMedicine : handleAddMedicine} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine Name *</label>
                  <input type="text" placeholder="e.g. Calpol 650mg" value={newMedicine.name}
                    onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Generic Name</label>
                    <input type="text" placeholder="e.g. Paracetamol" value={newMedicine.generic}
                      onChange={(e) => setNewMedicine({ ...newMedicine, generic: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand Label</label>
                    <input type="text" placeholder="e.g. GSK" value={newMedicine.brand}
                      onChange={(e) => setNewMedicine({ ...newMedicine, brand: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU / Barcode *</label>
                    <input type="text" placeholder="e.g. SKU-CAL-001" value={newMedicine.sku}
                      onChange={(e) => setNewMedicine({ ...newMedicine, sku: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category *</label>
                    <select value={newMedicine.category}
                      onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer">
                      <option value="" disabled>{hasMedicineMetadata ? 'Select a category' : 'Loading categories...'}</option>
                      {medicineCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Manufacturer</label>
                  <select value={newMedicine.manufacturer}
                    onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer">
                    <option value="" disabled>{hasMedicineMetadata ? 'Select a manufacturer' : 'Loading manufacturers...'}</option>
                    {manufacturers.map(mfr => <option key={mfr.id} value={mfr.name}>{mfr.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹) *</label>
                    <input type="number" step="0.01" placeholder="0.00" value={newMedicine.price}
                      onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Qty *</label>
                    <input type="number" placeholder="0" value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Stock (Alert)</label>
                    <input type="number" placeholder="10" value={newMedicine.minStock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, minStock: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rack Location</label>
                    <input type="text" placeholder="e.g. A1" value={newMedicine.rack}
                      onChange={(e) => setNewMedicine({ ...newMedicine, rack: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Storage Temp</label>
                    <select value={newMedicine.tempRequirement}
                      onChange={(e) => setNewMedicine({ ...newMedicine, tempRequirement: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer">
                      <option value="Normal">Normal (Room Temp)</option>
                      <option value="Cold">Cold (2–8°C Fridge)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST Rate</label>
                    <select value={newMedicine.gstRate}
                      onChange={(e) => setNewMedicine({ ...newMedicine, gstRate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer">
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none pt-1">
                  <input type="checkbox" checked={newMedicine.rxRequired}
                    onChange={(e) => setNewMedicine({ ...newMedicine, rxRequired: e.target.checked })}
                    className="rounded accent-blue-600 h-4 w-4 cursor-pointer" />
                  Requires Doctor Prescription (Rx)
                </label>
                <button type="submit"
                  className={`w-full py-3 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center ${formMode === 'edit' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {formMode === 'edit' ? '💾 Save Changes' : '+ Save Medicine to Catalog'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CATEGORIES ────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} className="text-blue-600" /> Medicine Categories ({cats.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">#</th>
                    <th className="py-2.5">Category Name</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cats.map((cat, idx) => (
                    <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 font-bold text-slate-800">{cat.name}</td>
                      <td className="py-3 text-slate-500">{cat.description || '—'}</td>
                      <td className="py-3 text-center">
                        <button onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Plus size={15} className="text-blue-600" /> Add Category
            </h4>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name *</label>
                <input type="text" placeholder="e.g. Antifungal" value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea placeholder="Brief description of medicines in this category..." value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white h-20 resize-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">+ Add Category</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: MANUFACTURERS ─────────────────────────────────────────── */}
      {activeTab === 'manufacturers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={14} className="text-blue-600" /> Manufacturers ({mfrs.length})
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
                    <tr key={mfr.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-800">{mfr.name}</td>
                      <td className="py-3 text-slate-500">{mfr.country}</td>
                      <td className="py-3 text-slate-500">{mfr.contactEmail}</td>
                      <td className="py-3 text-slate-500">{mfr.phone}</td>
                      <td className="py-3 text-center">
                        <button onClick={() => handleDeleteManufacturer(mfr.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Plus size={15} className="text-blue-600" /> Add Manufacturer
            </h4>
            <form onSubmit={handleAddManufacturer} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name *</label>
                <input type="text" placeholder="e.g. Cipla Ltd" value={newManufacturer.name}
                  onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country</label>
                <input type="text" placeholder="e.g. India" value={newManufacturer.country}
                  onChange={(e) => setNewManufacturer({ ...newManufacturer, country: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Email</label>
                <input type="email" placeholder="orders@company.com" value={newManufacturer.contactEmail}
                  onChange={(e) => setNewManufacturer({ ...newManufacturer, contactEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                <input type="text" placeholder="+91 22 xxxx xxxx" value={newManufacturer.phone}
                  onChange={(e) => setNewManufacturer({ ...newManufacturer, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">+ Add Manufacturer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
