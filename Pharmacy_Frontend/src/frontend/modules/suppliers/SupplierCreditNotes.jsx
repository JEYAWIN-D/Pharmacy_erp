import React, { useState } from 'react';
import { Receipt, Plus, Save, X, Info } from 'lucide-react';
import DataTable from './components/DataTable';

export default function SupplierCreditNotes({ controller, addToast }) {
  const { suppliers, creditNotes, createCreditNote } = controller;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: '', amount: '', reason: 'Adjustment', originalInvoiceId: '', remarks: '' });

  const columns = [
    { key: 'date', header: 'Date', accessor: 'issueDate', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.issueDate).toLocaleDateString()}</span> },
    { key: 'cnNum', header: 'CN No', accessor: 'creditNoteNumber', render: (row) => <span className="font-mono font-bold text-slate-700">{row.creditNoteNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'amount', header: 'Credit Amount', accessor: 'amount', align: 'right', render: (row) => <span className="font-mono font-bold text-blue-600">₹{parseFloat(row.amount).toFixed(2)}</span> },
    { key: 'reason', header: 'Reason', accessor: 'reason', render: (row) => <span className="text-[10px] font-semibold text-slate-600">{row.reason}</span> },
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.isUtilized ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {row.isUtilized ? 'Utilized' : 'Available'}
      </span>
    )}
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (!form.amount || parseFloat(form.amount) <= 0) return addToast('Enter a valid amount', 'error');

    try {
      await createCreditNote(form);
      addToast('Credit note issued successfully', 'success');
      setShowForm(false);
      setForm({ supplierId: '', amount: '', reason: 'Adjustment', originalInvoiceId: '', remarks: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to issue credit note', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Receipt size={16} className="text-blue-600" />
            </div>
            Credit Notes
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage supplier credit notes (discounts, adjustments, return credits)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Manual Credit Note</>}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl flex items-start gap-3 text-xs">
        <Info size={16} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block mb-0.5">Automated CN Generation</span>
          Credit notes for Returns are automatically generated when a Return is approved. Use this form only for manual adjustments, bulk discounts, or rate differences.
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Issue Manual Credit Note</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹) *</label>
              <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason</label>
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {['Adjustment', 'Rate Difference', 'Scheme/Discount', 'Damage Rebate', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <button type="submit" className="w-full flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> Issue Credit Note
              </button>
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
              <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Specific details..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={creditNotes} searchPlaceholder="Search credit notes..." />
    </div>
  );
}
