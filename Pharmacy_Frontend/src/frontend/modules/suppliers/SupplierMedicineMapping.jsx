import React, { useState } from 'react';
import { Package, Plus, Save, X, Trash2 } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import DataTable from './components/DataTable';

export default function SupplierMedicineMapping({ controller, addToast }) {
  const { suppliers, brandMappings, createBrandMapping, deleteBrandMapping, medicinesList } = controller;
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ supplierId: '', medicineId: '', brandName: '', medicineName: '' });

  const medMappings = brandMappings.filter(m => m.medicineId);

  const columns = [
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'medicine', header: 'Medicine Name', accessor: 'medicineName', render: (row) => <span className="font-semibold text-blue-600">{row.medicineName}</span> },
    { key: 'brand', header: 'Brand', accessor: 'brandName', render: (row) => <span className="text-slate-600">{row.brandName || '—'}</span> },
    { key: 'actions', header: 'Actions', align: 'right', sortable: false, render: (row) => (
      <button onClick={() => setConfirmDelete(row)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Remove Mapping">
        <Trash2 size={13} />
      </button>
    )}
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (!form.medicineId) return addToast('Select a medicine', 'error');

    const selectedMed = medicinesList.find(m => m.id === form.medicineId);
    
    try {
      await createBrandMapping({
        supplierId: form.supplierId,
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        brandName: selectedMed.brand || form.brandName || 'Generic',
        genericName: selectedMed.generic,
        manufacturer: selectedMed.manufacturer
      });
      addToast('Medicine mapped successfully', 'success');
      setShowForm(false);
      setForm({ supplierId: '', medicineId: '', brandName: '', medicineName: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to map medicine', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBrandMapping(confirmDelete.id);
      addToast('Mapping removed', 'success');
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
            <div className="h-8 w-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Package size={16} className="text-violet-600" />
            </div>
            Medicine Mapping
          </h2>
          <p className="text-xs text-slate-400 mt-1">Directly map specific medicines to suppliers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow shadow-violet-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Map Medicine</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">New Medicine Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Medicine *</label>
              <select required value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Medicine</option>
                {medicinesList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <button type="submit" className="w-full flex justify-center items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> Save Mapping
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={medMappings} searchPlaceholder="Search medicines, suppliers..." />

      <ConfirmDialog isOpen={!!confirmDelete} title="Remove Mapping" message={`Are you sure you want to remove the mapping for ${confirmDelete?.medicineName}?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
