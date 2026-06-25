import React, { useState } from 'react';
import { Database, RefreshCw, BadgePercent, Truck, History } from 'lucide-react';
import { useReturnsController } from './useReturnsController';

export default function ReturnsView({ role, setSchemaModalTable }) {
  const [activeTab, setActiveTab] = useState('patient');

  const {
    medicines, suppliers,
    returnBillId, setReturnBillId,
    returnMedId, setReturnMedId,
    returnQty, setReturnQty,
    refundAmount, handleProcessReturn,
    patientReturns, supplierReturns,
    supReturnSupplierId, setSupReturnSupplierId,
    supReturnMedId, setSupReturnMedId,
    supReturnQty, setSupReturnQty,
    supReturnReason, setSupReturnReason,
    handleProcessSupplierReturn
  } = useReturnsController(role);

  const tabs = [
    { id: 'patient', label: 'Patient Returns', icon: <RefreshCw size={13} /> },
    { id: 'supplier', label: 'Supplier Returns', icon: <Truck size={13} /> },
    { id: 'history', label: 'Return History', icon: <History size={13} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Returns Management
            <button onClick={() => setSchemaModalTable('medicine_return')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer" title="View Schema">
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Process patient refunds and supplier return credit notes</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: PATIENT RETURNS ────────────────────────────────────────── */}
      {activeTab === 'patient' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card lg:col-span-2 p-6 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw size={15} className="text-blue-600" /> Patient Return Records
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Return ID</th>
                    <th className="py-2.5">Bill Ref</th>
                    <th className="py-2.5">Medicine</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Refund</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {patientReturns.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-slate-500 text-[10px]">{r.id}</td>
                      <td className="py-3 font-mono font-bold text-slate-600">{r.billId}</td>
                      <td className="py-3 font-bold text-slate-700">{r.medicineName}</td>
                      <td className="py-3 text-center font-black text-slate-800">{r.returnQty}</td>
                      <td className="py-3 text-right font-black text-red-500">₹{r.refundAmount?.toFixed(2)}</td>
                      <td className="py-3 text-slate-400 text-[10px]">{r.date}</td>
                    </tr>
                  ))}
                  {patientReturns.length === 0 && <tr><td colSpan="6" className="py-6 text-center text-slate-400">No patient returns recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BadgePercent size={15} className="text-blue-600" /> Process Patient Return
            </h4>
            <form onSubmit={handleProcessReturn} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Original Bill Number *</label>
                <input type="text" placeholder="e.g. BILL-10029" value={returnBillId}
                  onChange={(e) => setReturnBillId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine Returned</label>
                  <select value={returnMedId} onChange={(e) => setReturnMedId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pieces Returned *</label>
                  <input type="number" placeholder="e.g. 5" value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold space-y-1.5">
                <div className="flex justify-between">
                  <span>Medicine Price:</span>
                  <span className="text-slate-800">₹ {((medicines.find(m => m.id === parseInt(returnMedId))?.price || 0) * parseInt(returnQty || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-red-500">
                  <span>Penalty (12%):</span>
                  <span>− ₹ {(((medicines.find(m => m.id === parseInt(returnMedId))?.price || 0) * parseInt(returnQty || 0)) * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-800 pt-1 border-t border-slate-200/50">
                  <span>Refund to Give:</span>
                  <span className="text-blue-600 font-bold">₹ {refundAmount.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">Save Return & Issue Refund</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 2: SUPPLIER RETURNS ───────────────────────────────────────── */}
      {activeTab === 'supplier' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card lg:col-span-2 p-6 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck size={14} className="text-amber-600" /> Supplier Return Register
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Return ID</th>
                    <th className="py-2.5">Supplier</th>
                    <th className="py-2.5">Medicine</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5">Reason</th>
                    <th className="py-2.5 text-right">Credit</th>
                    <th className="py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierReturns.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-slate-500 text-[10px]">{r.id}</td>
                      <td className="py-3 font-bold text-slate-700">{r.supplierName}</td>
                      <td className="py-3 font-bold text-slate-600">{r.medicineName}</td>
                      <td className="py-3 text-center font-black text-slate-800">{r.returnQty}</td>
                      <td className="py-3 text-slate-500 text-[10px]">{r.reason}</td>
                      <td className="py-3 text-right font-black text-emerald-600">₹{r.creditAmount?.toFixed(2)}</td>
                      <td className="py-3 text-center"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50">{r.status}</span></td>
                    </tr>
                  ))}
                  {supplierReturns.length === 0 && <tr><td colSpan="7" className="py-6 text-center text-slate-400">No supplier returns recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck size={15} className="text-amber-600" /> Return to Supplier
            </h4>
            <form onSubmit={handleProcessSupplierReturn} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier *</label>
                <select value={supReturnSupplierId} onChange={(e) => setSupReturnSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine to Return *</label>
                <select value={supReturnMedId} onChange={(e) => setSupReturnMedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty to Return *</label>
                  <input type="number" placeholder="50" value={supReturnQty}
                    onChange={(e) => setSupReturnQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Credit (85%)</label>
                  <div className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700">
                    ₹ {((medicines.find(m => m.id === parseInt(supReturnMedId))?.price || 0) * parseInt(supReturnQty || 0) * 0.85).toFixed(2)}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Return Reason *</label>
                <input type="text" placeholder="e.g. Near expiry batch, damaged packaging..." value={supReturnReason}
                  onChange={(e) => setSupReturnReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">Submit Supplier Return</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: RETURN HISTORY ────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="unique-card p-6 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-blue-600" /> Complete Return History
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Reference</th>
                  <th className="py-2.5">Medicine</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {patientReturns.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-mono text-slate-400 text-[10px]">{r.id}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/50">Patient</span></td>
                    <td className="py-3 font-mono text-slate-600">{r.billId}</td>
                    <td className="py-3 font-bold text-slate-700">{r.medicineName}</td>
                    <td className="py-3 text-center font-black text-slate-800">{r.returnQty}</td>
                    <td className="py-3 text-right font-black text-red-500">₹{r.refundAmount?.toFixed(2)}</td>
                    <td className="py-3 text-slate-400 text-[10px]">{r.date}</td>
                  </tr>
                ))}
                {supplierReturns.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-mono text-slate-400 text-[10px]">{r.id}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50">Supplier</span></td>
                    <td className="py-3 font-bold text-slate-600">{r.supplierName}</td>
                    <td className="py-3 font-bold text-slate-700">{r.medicineName}</td>
                    <td className="py-3 text-center font-black text-slate-800">{r.returnQty}</td>
                    <td className="py-3 text-right font-black text-emerald-600">₹{r.creditAmount?.toFixed(2)}</td>
                    <td className="py-3 text-slate-400 text-[10px]">{r.date}</td>
                  </tr>
                ))}
                {patientReturns.length === 0 && supplierReturns.length === 0 && (
                  <tr><td colSpan="7" className="py-6 text-center text-slate-400">No returns recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
