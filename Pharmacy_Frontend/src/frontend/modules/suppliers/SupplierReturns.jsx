import React, { useState } from 'react';
import { Undo2, Plus, Save, X, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import DataTable from './components/DataTable';
import { SupplierModel } from './SupplierModel';

export default function SupplierReturns({ controller, addToast }) {
  const { suppliers, returns, createReturn, updateReturn, deleteReturn, medicinesList } = controller;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ supplierId: '', grnId: '', reason: 'Near Expiry', remarks: '', items: [] });
  const [itemForm, setItemForm] = useState({ medicineId: '', batchNumber: '', qty: '', unitPrice: '' });

  const columns = [
    { key: 'date', header: 'Date', accessor: 'createdAt', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'returnNum', header: 'Return No', accessor: 'returnNumber', render: (row) => <span className="font-mono font-bold text-slate-700">{row.returnNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name || row.supplierName}</span> },
    { key: 'items', header: 'Items', render: (row) => <span className="font-mono text-slate-600">{row.items?.length || 0} items</span> },
    { key: 'value', header: 'Return Value', accessor: 'returnValue', align: 'right', render: (row) => <span className="font-mono font-bold text-rose-600">₹{parseFloat(row.returnValue || row.creditAmount || 0).toFixed(2)}</span> },
    { key: 'reason', header: 'Reason', accessor: 'reason', render: (row) => <span className="text-[10px] text-slate-500">{row.reason}</span> },
    { key: 'status', header: 'Status', render: (row) => {
      const colors = {
        'Pending': 'bg-amber-50 text-amber-700',
        'Approved': 'bg-emerald-50 text-emerald-700',
        'Rejected': 'bg-rose-50 text-rose-700',
        'Credit Note Issued': 'bg-blue-50 text-blue-700'
      };
      const color = colors[row.status] || 'bg-slate-50 text-slate-700';
      return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color}`}>{row.status}</span>;
    }},
    { key: 'actions', header: 'Actions', align: 'right', sortable: false, render: (row) => (
      <div className="flex justify-end gap-1">
        {row.status === 'Pending' && (
          <button onClick={() => handleApprove(row)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-[9px] font-bold transition cursor-pointer">
            Approve
          </button>
        )}
        <button onClick={() => setConfirmDelete(row)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    )}
  ];

  const handleAddItem = () => {
    if (!itemForm.medicineId || !itemForm.qty) return addToast('Select medicine and quantity', 'error');
    const selectedMed = medicinesList.find(m => m.id === itemForm.medicineId);
    
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        batchNumber: itemForm.batchNumber,
        qty: parseInt(itemForm.qty),
        unitPrice: parseFloat(itemForm.unitPrice || 0)
      }]
    }));
    setItemForm({ medicineId: '', batchNumber: '', qty: '', unitPrice: '' });
  };

  const handleRemoveItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (form.items.length === 0) return addToast('Add at least one item to return', 'error');

    const returnValue = form.items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const selectedSupplier = suppliers.find(s => s.id === form.supplierId);

    const payload = {
      ...form,
      supplierName: selectedSupplier.name,
      returnValue,
      creditAmount: returnValue
    };

    try {
      if (editingId) {
        await updateReturn(editingId, payload);
        addToast('Return updated', 'success');
      } else {
        await createReturn(payload);
        addToast('Return request created successfully', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ supplierId: '', grnId: '', reason: 'Near Expiry', remarks: '', items: [] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save return', 'error');
    }
  };

  const handleApprove = async (row) => {
    if (window.confirm('Approve this return? This will automatically generate a Credit Note and adjust the supplier ledger.')) {
      try {
        await updateReturn(row.id, { status: 'Approved' });
        addToast('Return approved and Credit Note generated', 'success');
      } catch (err) {
        addToast('Failed to approve return', 'error');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReturn(confirmDelete.id);
      addToast('Return deleted', 'success');
    } catch (err) {
      addToast('Failed to delete return', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Undo2 size={16} className="text-violet-600" />
            </div>
            Purchase Returns
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage return of goods to suppliers (Purchase Returns / Debit Notes)</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ supplierId: '', grnId: '', reason: 'Near Expiry', remarks: '', items: [] }); }} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow shadow-violet-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Create Return</>}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-xl flex items-start gap-3 text-xs">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block mb-0.5">Automated Workflow</span>
          When a return is marked as <strong>Approved</strong>, the system will automatically generate a Credit Note and adjust the supplier's running ledger balance.
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">{editingId ? 'Edit Return' : 'New Return Request'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Return Reason *</label>
              <select required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {SupplierModel.returnReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Against GRN (Optional)</label>
              <input type="text" value={form.grnId} onChange={(e) => setForm({ ...form, grnId: e.target.value })} placeholder="GRN Number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Return Items</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="md:col-span-2">
                <select value={itemForm.medicineId} onChange={(e) => setItemForm({ ...itemForm, medicineId: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="">Select Medicine</option>
                  {medicinesList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <input type="text" value={itemForm.batchNumber} onChange={(e) => setItemForm({ ...itemForm, batchNumber: e.target.value })} placeholder="Batch No" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono" />
              </div>
              <div>
                <input type="number" value={itemForm.qty} onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} placeholder="Qty" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="flex gap-2">
                <input type="number" step="0.01" value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} placeholder="Unit Price" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                <button type="button" onClick={handleAddItem} className="px-3 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 cursor-pointer">Add</button>
              </div>
            </div>

            {form.items.length > 0 && (
              <table className="w-full text-left text-xs mb-4 border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-2 px-3 font-semibold text-slate-600">Item</th>
                    <th className="py-2 px-3 font-semibold text-slate-600">Batch</th>
                    <th className="py-2 px-3 font-semibold text-slate-600 text-right">Qty</th>
                    <th className="py-2 px-3 font-semibold text-slate-600 text-right">Price</th>
                    <th className="py-2 px-3 font-semibold text-slate-600 text-right">Total</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="py-2 px-3 font-bold text-slate-700">{item.medicineName}</td>
                      <td className="py-2 px-3 font-mono">{item.batchNumber || '—'}</td>
                      <td className="py-2 px-3 text-right">{item.qty}</td>
                      <td className="py-2 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">₹{(item.qty * item.unitPrice).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><X size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={4} className="py-2 px-3 text-right font-bold text-slate-700 uppercase tracking-wider text-[10px]">Total Return Value</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-rose-600 text-sm">₹{form.items.reduce((s, i) => s + (i.qty * i.unitPrice), 0).toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}

            <div className="flex justify-between items-end">
              <div className="w-1/2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <button type="submit" className="flex items-center gap-1.5 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> Submit Return
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={returns} searchPlaceholder="Search returns..." />

      <ConfirmDialog isOpen={!!confirmDelete} title="Delete Return" message="Are you sure you want to delete this return? If already approved, ledger might need manual adjustment." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
