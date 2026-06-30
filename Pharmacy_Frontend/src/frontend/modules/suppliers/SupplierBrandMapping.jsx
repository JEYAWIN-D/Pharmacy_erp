import React, { useState } from 'react';
import { Link2, Plus, Save, X, Trash2, Search } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import DataTable from './components/DataTable';

export default function SupplierBrandMapping({ controller, addToast }) {
  const { suppliers, brandMappings, createBrandMapping, deleteBrandMapping, manufacturers } = controller;
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ supplierId: '', brandName: '', manufacturer: '' });

  const columns = [
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'brand', header: 'Brand Name', accessor: 'brandName', render: (row) => <span className="font-semibold text-blue-600">{row.brandName}</span> },
    { key: 'manufacturer', header: 'Manufacturer / Origin', accessor: 'manufacturer', render: (row) => <span className="text-slate-600">{row.manufacturer || '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: 'Actions', align: 'right', sortable: false, render: (row) => (
      <button onClick={() => setConfirmDelete(row)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Remove Mapping">
        <Trash2 size={13} />
      </button>
    )}
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (!form.brandName) return addToast('Enter a brand name', 'error');

    try {
      await createBrandMapping(form);
      addToast('Brand mapped successfully', 'success');
      setShowForm(false);
      setForm({ supplierId: '', brandName: '', manufacturer: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to map brand', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBrandMapping(confirmDelete.id);
      addToast('Brand mapping removed', 'success');
    } catch (err) {
      addToast('Failed to remove mapping', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Link2 size={16} className="text-indigo-600" />
            </div>
            Brand Mapping
          </h2>
          <p className="text-xs text-slate-400 mt-1">Map specific medicine brands to their authorized suppliers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow shadow-indigo-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Map New Brand</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">New Brand Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Brand Name *</label>
              <input required type="text" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} placeholder="e.g. Cipla, Sun Pharma" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Manufacturer (Optional)</label>
              <input type="text" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Original manufacturer" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <button type="submit" className="w-full flex justify-center items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> Save Mapping
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={brandMappings} searchPlaceholder="Search brands, suppliers..." />

      <ConfirmDialog isOpen={!!confirmDelete} title="Remove Brand Mapping" message={`Are you sure you want to remove the mapping for ${confirmDelete?.brandName}?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
