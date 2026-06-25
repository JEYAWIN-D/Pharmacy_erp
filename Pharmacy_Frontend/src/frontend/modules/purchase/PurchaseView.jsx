import React, { useState } from 'react';
import { Database, FileText, Plus, PackageCheck, RotateCcw, ClipboardList } from 'lucide-react';
import { usePurchaseController } from './usePurchaseController';
import { usePurchaseRequestController } from './usePurchaseRequestController';
import { useGRNController } from './useGRNController';

export default function PurchaseView({ role, setSchemaModalTable }) {
  const [activeTab, setActiveTab] = useState('pr');

  const {
    purchaseOrders, suppliers, medicines,
    poSupplier, setPoSupplier, poMedicine, setPoMedicine,
    poQty, setPoQty, poPrice, setPoPrice,
    handleCreatePO, approvePO, receivePO,
    returnSupplier, setReturnSupplier, returnMedId, setReturnMedId,
    returnQty, setReturnQty, returnReason, setReturnReason, handleSupplierReturn
  } = usePurchaseController(role);

  const {
    purchaseRequests, newPR, setNewPR,
    handleCreateRequest, handleApprovePR, handleRejectPR
  } = usePurchaseRequestController(role);

  const {
    goodsReceipts, pendingGRNOrders, selectedPOId, grnItems, receivedBy, setReceivedBy,
    loadPOItems, updateGrnItem, handleSubmitGRN
  } = useGRNController();

  const tabs = [
    { id: 'pr', label: 'Purchase Requests', icon: <ClipboardList size={13} /> },
    { id: 'po', label: 'Purchase Orders', icon: <FileText size={13} /> },
    { id: 'grn', label: 'GRN', icon: <PackageCheck size={13} /> },
    { id: 'return', label: 'Supplier Return', icon: <RotateCcw size={13} /> }
  ];

  const statusColor = (status) => {
    if (status === 'Approved') return 'text-blue-700 bg-blue-50 border-blue-200/50';
    if (status === 'Rejected') return 'text-red-700 bg-red-50 border-red-200/50';
    if (status === 'Pending') return 'text-amber-700 bg-amber-50 border-amber-200/50 animate-pulse';
    return 'text-slate-600 bg-slate-50 border-slate-200/50';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Purchase Management
            <button onClick={() => setSchemaModalTable('purchase_request')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer" title="View Schema">
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Purchase Requests → PO → GRN → Supplier Returns</p>
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

      {/* ── TAB 1: PURCHASE REQUESTS ─────────────────────────────────────── */}
      {activeTab === 'pr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={14} className="text-blue-600" /> Purchase Request Register
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">PR ID</th>
                    <th className="py-2.5">Medicine</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-center">Priority</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.map(pr => (
                    <tr key={pr.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-600 font-mono font-bold text-[10px]">{pr.id}</td>
                      <td className="py-3 font-bold text-slate-700">{pr.medicineName}</td>
                      <td className="py-3 text-center font-black text-slate-800">{pr.requestedQty}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${pr.priority === 'High' ? 'text-red-700 bg-red-50 border-red-200/50' : pr.priority === 'Medium' ? 'text-amber-700 bg-amber-50 border-amber-200/50' : 'text-slate-600 bg-slate-50 border-slate-200/50'}`}>{pr.priority}</span>
                      </td>
                      <td className="py-3 text-slate-500 font-semibold">{pr.requestDate}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor(pr.status)}`}>{pr.status}</span>
                      </td>
                      <td className="py-3 text-center">
                        {pr.status === 'Pending' && (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleApprovePR(pr.id)} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">Approve</button>
                            <button onClick={() => handleRejectPR(pr.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold transition cursor-pointer">Reject</button>
                          </div>
                        )}
                        {pr.status !== 'Pending' && <span className="text-[10px] text-slate-400 font-semibold">{pr.status === 'Approved' ? '✓ PO Created' : '✗ Rejected'}</span>}
                      </td>
                    </tr>
                  ))}
                  {purchaseRequests.length === 0 && <tr><td colSpan="7" className="py-6 text-center text-slate-400">No purchase requests found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Plus size={15} className="text-blue-600" /> Raise New PR
            </h4>
            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine *</label>
                <select value={newPR.medicineId} onChange={(e) => setNewPR({ ...newPR, medicineId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.medicineName || m.name} (Stock: {m.stockQuantity ?? m.stock ?? 0})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty Needed *</label>
                  <input type="number" placeholder="e.g. 100" value={newPR.requestedQty}
                    onChange={(e) => setNewPR({ ...newPR, requestedQty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority *</label>
                  <select value={newPR.priority} onChange={(e) => setNewPR({ ...newPR, priority: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                    <option value="High">High (Urgent)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
                <input type="text" placeholder="Reason for request..." value={newPR.remarks}
                  onChange={(e) => setNewPR({ ...newPR, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">Submit Purchase Request</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 2: PURCHASE ORDERS ───────────────────────────────────────── */}
      {activeTab === 'po' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-blue-600" /> Purchase Orders Register
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">PO ID</th>
                    <th className="py-2.5">Supplier</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5 text-right">Total</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map(po => (
                    <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-600 font-mono font-bold">{po.id}</td>
                      <td className="py-3 font-bold text-slate-700">{po.supplier}</td>
                      <td className="py-3 text-slate-500">{po.date}</td>
                      <td className="py-3 text-right font-black text-slate-800">₹ {po.total.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${po.status === 'Goods Received' ? 'text-blue-700 bg-blue-50 border-blue-200/50' : po.status === 'Approved' ? 'text-blue-700 bg-blue-50 border-blue-200/50' : 'text-amber-700 bg-amber-50 border-amber-200/50 animate-pulse'}`}>{po.status}</span>
                      </td>
                      <td className="py-3 text-center">
                        {po.status === 'Pending Approval' && <button onClick={() => approvePO(po.id)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">Approve</button>}
                        {po.status === 'Approved' && <button onClick={() => setActiveTab('grn')} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">Create GRN →</button>}
                        {po.status === 'Goods Received' && <span className="text-[10px] text-slate-400 font-semibold">✓ Completed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Plus size={15} className="text-blue-600" /> Create Purchase Order
            </h4>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</label>
                <select value={poSupplier} onChange={(e) => setPoSupplier(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine</label>
                <select value={poMedicine} onChange={(e) => setPoMedicine(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.medicineName || m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty</label>
                  <input type="number" placeholder="100" value={poQty} onChange={(e) => setPoQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Price (₹)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={poPrice} onChange={(e) => setPoPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">Send Purchase Order</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: GRN ──────────────────────────────────────────────────── */}
      {activeTab === 'grn' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck size={14} className="text-blue-600" /> Goods Receipt History
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">GRN ID</th>
                    <th className="py-2.5">PO Ref</th>
                    <th className="py-2.5">Supplier</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5 text-center">Items</th>
                    <th className="py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goodsReceipts.map(grn => (
                    <tr key={grn.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-600 font-mono font-bold">{grn.id}</td>
                      <td className="py-3 text-slate-500 font-mono">{grn.poId}</td>
                      <td className="py-3 font-bold text-slate-700">{grn.supplierName}</td>
                      <td className="py-3 text-slate-500">{grn.receivedDate}</td>
                      <td className="py-3 text-center font-black text-slate-800">{grn.items?.length || 0}</td>
                      <td className="py-3 text-center"><span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/50">{grn.status}</span></td>
                    </tr>
                  ))}
                  {goodsReceipts.length === 0 && <tr><td colSpan="6" className="py-6 text-center text-slate-400">No GRNs recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck size={15} className="text-emerald-600" /> Record GRN
            </h4>
            <form onSubmit={handleSubmitGRN} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Approved PO *</label>
                <select value={selectedPOId} onChange={(e) => loadPOItems(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  <option value="">— Select PO —</option>
                  {pendingGRNOrders.map(po => <option key={po.id} value={po.id}>{po.id} — {po.supplier}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Received By</label>
                <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              {grnItems.length > 0 && (
                <div className="space-y-3">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Items to Receive:</span>
                  {grnItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                      <span className="block text-[10px] font-extrabold text-blue-800">{item.medicineName}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Batch No *</label>
                          <input type="text" placeholder="B-XXX-001" value={item.batchNumber}
                            onChange={(e) => updateGrnItem(idx, 'batchNumber', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Received Qty *</label>
                          <input type="number" value={item.receivedQty}
                            onChange={(e) => updateGrnItem(idx, 'receivedQty', parseInt(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Expiry Date *</label>
                        <input type="date" value={item.expiryDate}
                          onChange={(e) => updateGrnItem(idx, 'expiryDate', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none" required />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pendingGRNOrders.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No approved POs pending GRN.</p>}
              <button type="submit" disabled={!selectedPOId || grnItems.length === 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">
                Submit GRN & Update Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 4: SUPPLIER RETURN ──────────────────────────────────────── */}
      {activeTab === 'return' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw size={14} className="text-amber-600" /> Supplier Return History
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Supplier</th>
                    <th className="py-2.5">Medicine</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan="4" className="py-6 text-center text-slate-400">Use the form to log supplier returns</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="unique-form-panel p-6 text-left space-y-4 border-l-amber-500">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw size={15} className="text-amber-600" /> Return to Supplier
            </h4>
            <form onSubmit={handleSupplierReturn} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</label>
                <select value={returnSupplier} onChange={(e) => setReturnSupplier(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine</label>
                <select value={returnMedId} onChange={(e) => setReturnMedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.medicineName || m.name} (Available: {m.stockQuantity ?? m.stock ?? 0} pcs)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty to Return</label>
                  <input type="number" placeholder="50" value={returnQty} onChange={(e) => setReturnQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Return Reason</label>
                  <input type="text" placeholder="e.g. Near expiry..." value={returnReason} onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" required />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">Confirm Supplier Return</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
