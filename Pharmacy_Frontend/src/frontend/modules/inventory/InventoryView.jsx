import React from 'react';
import { Database, RefreshCw, Edit3 } from 'lucide-react';
import { useInventoryController } from './useInventoryController';

export default function InventoryView({ role, setSchemaModalTable }) {
  const {
    medicines,
    adjMedId,
    setAdjMedId,
    adjQty,
    setAdjQty,
    adjType,
    setAdjType,
    adjRemarks,
    setAdjRemarks,
    handleStockAdjustment,
    inventoryLogs
  } = useInventoryController(role);

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Change Stock Count Manually
            <button 
              onClick={() => setSchemaModalTable('inventory_stock')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Table Columns Schema"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Correct shelf stock numbers if there are damages, count errors, or manual shelf losses easily.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List with Reserved count */}
        <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <RefreshCw size={15} className="text-blue-600" />
            Current Available vs Reserved Stock Levels
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Medicine Name</th>
                  <th className="py-2.5 text-center">Stock We Can Sell</th>
                  <th className="py-2.5 text-center">Reserved for Customers</th>
                  <th className="py-2.5 text-center font-bold">Total Boxes Count</th>
                  <th className="py-2.5 text-center">Shelf Status</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(med => {
                  const reserved = med.stock > 10 ? 3 : 0; // Simulated reservations
                  const isLow = med.stock <= med.minStock;
                  return (
                    <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-700">{med.name}</td>
                      <td className="py-3 text-center text-slate-600 font-semibold">{med.stock - reserved} pcs</td>
                      <td className="py-3 text-center text-slate-400">{reserved} pcs</td>
                      <td className="py-3 text-center font-black text-slate-800">{med.stock} pcs</td>
                      <td className="py-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold text-amber-700 bg-amber-50">Running Out!</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold text-blue-700 bg-blue-50">Safe to Sell</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Correction adjustments */}
        <div className="unique-form-panel p-6 text-left space-y-4">
          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Edit3 size={15} className="text-blue-600" />
            Log Stock Box Correction
          </h4>
          <form onSubmit={handleStockAdjustment} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Choose Medicine</label>
              <select
                value={adjMedId}
                onChange={(e) => setAdjMedId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.name} (Shelves: {m.stock} pcs)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Add or Remove Stock?</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer"
                >
                  <option value="In">Add Stock (Boxes Received)</option>
                  <option value="Out">Remove Stock (Boxes Damaged)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Number of Boxes</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Explain Reason (Why are we changing this?)</label>
              <textarea
                rows="2"
                placeholder="e.g. 2 boxes damaged by water leak..."
                value={adjRemarks}
                onChange={(e) => setAdjRemarks(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center"
            >
              Save Stock Box Correction
            </button>
          </form>
        </div>
      </div>

      {/* Stock Movement Transaction logs */}
      <div className="unique-card p-6 text-left space-y-4">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Database size={15} className="text-blue-600" />
          Stock In / Out Movement History Ledger
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5">Trx ID</th>
                <th className="py-2.5">Date & Time</th>
                <th className="py-2.5">Medicine Name</th>
                <th className="py-2.5 text-center">Movement Type</th>
                <th className="py-2.5 text-center">Quantity</th>
                <th className="py-2.5">Operator (User)</th>
                <th className="py-2.5">Remarks / Reason</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLogs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 font-mono font-bold text-slate-600">{log.id}</td>
                  <td className="py-3 text-slate-400 font-mono text-[10px]">{log.date}</td>
                  <td className="py-3 font-bold text-slate-700">{log.medicineName}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.type === 'Stock In' ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                    }`}>{log.type}</span>
                  </td>
                  <td className="py-3 text-center font-bold text-slate-800">{Math.abs(log.qty)} pcs</td>
                  <td className="py-3 text-slate-500 font-semibold">{log.user}</td>
                  <td className="py-3 text-slate-500">{log.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
