import React, { useState } from 'react';
import { FileText, Plus, Save, X, Trash2, Edit3 } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import DataTable from './components/DataTable';

export default function PurchaseTerms({ controller, addToast }) {
  const { suppliers, purchaseTerms, createPurchaseTerm, updatePurchaseTerm, deletePurchaseTerm, medicinesList } = controller;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ supplierId: '', medicineId: '', purchasePrice: '', gstPercent: '', discount: '', scheme: '', moq: '1', creditDays: '30' });

  const columns = [
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'medicine', header: 'Medicine', accessor: 'medicineName', render: (row) => <span className="font-semibold text-blue-600">{row.medicineName || 'General'}</span> },
    { key: 'price', header: 'Purchase Price', accessor: 'purchasePrice', align: 'right', render: (row) => <span className="font-mono font-bold text-slate-700">₹{parseFloat(row.purchasePrice).toFixed(2)}</span> },
    { key: 'discount', header: 'Discount', accessor: 'discount', align: 'right', render: (row) => <span className="font-mono text-emerald-600">{row.discount}%</span> },
    { key: 'moq', header: 'MOQ', accessor: 'moq', align: 'right', render: (row) => <span className="font-mono text-slate-600">{row.moq}</span> },
    { key: 'credit', header: 'Credit Days', accessor: 'creditDays', align: 'right', render: (row) => <span className="font-mono text-slate-600">{row.creditDays}</span> },
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: 'Actions', align: 'right', sortable: false, render: (row) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => { setForm(row); setEditingId(row.id); setShowForm(true); }} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition cursor-pointer" title="Edit">
          <Edit3 size={13} />
        </button>
        <button onClick={() => setConfirmDelete(row)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Deactivate">
          <Trash2 size={13} />
        </button>
      </div>
    )}
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (!form.purchasePrice) return addToast('Enter purchase price', 'error');

    const selectedMed = form.medicineId ? medicinesList.find(m => m.id === form.medicineId) : null;
    const payload = { ...form, medicineName: selectedMed ? selectedMed.name : null };

    try {
      if (editingId) {
        await updatePurchaseTerm(editingId, payload);
        addToast('Purchase term updated', 'success');
      } else {
        await createPurchaseTerm(payload);
        addToast('Purchase term created', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ supplierId: '', medicineId: '', purchasePrice: '', gstPercent: '', discount: '', scheme: '', moq: '1', creditDays: '30' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save purchase term', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePurchaseTerm(confirmDelete.id);
      addToast('Term deactivated', 'success');
    } catch (err) {
      addToast('Failed to deactivate term', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <FileText size={16} className="text-orange-600" />
            </div>
            Purchase Terms
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage agreed pricing, discounts, and credit terms per supplier</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ supplierId: '', medicineId: '', purchasePrice: '', gstPercent: '', discount: '', scheme: '', moq: '1', creditDays: '30' }); }} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow shadow-orange-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Term</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">{editingId ? 'Edit Term' : 'New Purchase Term'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Medicine (Optional)</label>
              <select value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">General Term (All Medicines)</option>
                {medicinesList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Purchase Price (₹) *</label>
              <input required type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GST %</label>
              <input type="number" step="0.01" value={form.gstPercent} onChange={(e) => setForm({ ...form, gstPercent: e.target.value })} placeholder="12" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Discount %</label>
              <input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="10" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">MOQ</label>
              <input type="number" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} placeholder="1" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Credit Days</label>
              <input type="number" value={form.creditDays} onChange={(e) => setForm({ ...form, creditDays: e.target.value })} placeholder="30" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scheme / Offer Details</label>
              <input type="text" value={form.scheme} onChange={(e) => setForm({ ...form, scheme: e.target.value })} placeholder="e.g. 10+1 free" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full flex justify-center items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> Save Term
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={purchaseTerms} searchPlaceholder="Search terms..." />

      <ConfirmDialog isOpen={!!confirmDelete} title="Deactivate Term" message={`Are you sure you want to deactivate this purchase term?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} confirmLabel="Deactivate" />
    </div>
  );
}
