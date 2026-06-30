import React, { useState } from 'react';
import { CreditCard, Plus, Save, X, Trash2, Edit3 } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import DataTable from './components/DataTable';
import { SupplierModel } from './SupplierModel';

export default function SupplierPayments({ controller, addToast }) {
  const { suppliers, payments, createPayment, updatePayment, deletePayment, invoices } = controller;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ supplierId: '', amount: '', method: 'Bank Transfer', referenceNumber: '', remarks: '' });

  const columns = [
    { key: 'date', header: 'Date', accessor: 'date', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.date).toLocaleDateString()}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'amount', header: 'Amount Paid', accessor: 'amount', align: 'right', render: (row) => <span className="font-mono font-bold text-emerald-600">₹{parseFloat(row.amount).toFixed(2)}</span> },
    { key: 'method', header: 'Payment Mode', accessor: 'method', render: (row) => <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700">{row.method}</span> },
    { key: 'ref', header: 'Reference', accessor: 'referenceNumber', render: (row) => <span className="font-mono text-xs text-slate-600">{row.referenceNumber || '—'}</span> },
    { key: 'remarks', header: 'Remarks', accessor: 'remarks', render: (row) => <span className="text-xs text-slate-500">{row.remarks}</span> },
    { key: 'actions', header: 'Actions', align: 'right', sortable: false, render: (row) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => { setForm(row); setEditingId(row.id); setShowForm(true); }} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition cursor-pointer" title="Edit">
          <Edit3 size={13} />
        </button>
        <button onClick={() => setConfirmDelete(row)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    )}
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (!form.amount || parseFloat(form.amount) <= 0) return addToast('Enter a valid amount', 'error');

    try {
      if (editingId) {
        await updatePayment(editingId, form);
        addToast('Payment updated', 'success');
      } else {
        await createPayment(form);
        addToast('Payment recorded successfully', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ supplierId: '', amount: '', method: 'Bank Transfer', referenceNumber: '', remarks: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save payment', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment(confirmDelete.id);
      addToast('Payment deleted', 'success');
    } catch (err) {
      addToast('Failed to delete payment', 'error');
    }
    setConfirmDelete(null);
  };

  // Suggest outstanding amount if supplier is selected
  const suggestedAmount = form.supplierId ? (() => {
    const sInv = invoices.filter(i => i.supplierId === form.supplierId);
    const sPay = payments.filter(p => p.supplierId === form.supplierId && p.id !== editingId);
    const totalPurchase = sInv.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPaid = sPay.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    return Math.max(0, totalPurchase - totalPaid);
  })() : null;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CreditCard size={16} className="text-emerald-600" />
            </div>
            Supplier Payments
          </h2>
          <p className="text-xs text-slate-400 mt-1">Record and track outgoing payments to suppliers</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ supplierId: '', amount: '', method: 'Bank Transfer', referenceNumber: '', remarks: '' }); }} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow shadow-emerald-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Record Payment</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">{editingId ? 'Edit Payment' : 'Record New Payment'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {suggestedAmount !== null && !editingId && (
                <span className="block text-[10px] text-rose-500 font-bold mt-1 text-right">Outstanding: ₹{suggestedAmount.toFixed(2)}</span>
              )}
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Paid (₹) *</label>
              <div className="relative">
                <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
                {suggestedAmount > 0 && !editingId && (
                  <button type="button" onClick={() => setForm(p => ({ ...p, amount: suggestedAmount.toFixed(2) }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-600 hover:text-blue-700">MAX</button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {SupplierModel.paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reference Number (Txn ID/Cheque No)</label>
              <input type="text" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} placeholder="e.g. UTR123456789" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks / Notes</label>
              <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Payment for specific invoice..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button type="submit" className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> {editingId ? 'Update Payment' : 'Record Payment'}
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={payments} searchPlaceholder="Search payments, reference..." />

      <ConfirmDialog isOpen={!!confirmDelete} title="Delete Payment" message={`Are you sure you want to delete this payment of ₹${confirmDelete?.amount}? This will affect the supplier ledger.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
