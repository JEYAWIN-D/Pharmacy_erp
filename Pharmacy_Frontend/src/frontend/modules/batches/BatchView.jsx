import React from 'react';
import { Database, Layers, Plus } from 'lucide-react';
import { useBatchController } from './useBatchController';

export default function BatchView({ setSchemaModalTable }) {
  const {
    batches,
    medicines,
    batchMedicineId,
    setBatchMedicineId,
    batchNumber,
    setBatchNumber,
    expiryDate,
    setExpiryDate,
    batchStock,
    setBatchStock,
    handleAddBatch,
    recallBatch
  } = useBatchController();

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Batch Numbers & Expiry Dates
            <button 
              onClick={() => setSchemaModalTable('medicine_batch')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Table Columns Schema"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Check box batch numbers, manufacture lots, and expiration dates to make sure medicines are safe.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch list */}
        <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers size={15} className="text-blue-600" />
            Medicine Batch Table
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Medicine Name</th>
                  <th className="py-2.5">Box Batch Number</th>
                  <th className="py-2.5 text-center">Expiration Date</th>
                  <th className="py-2.5 text-center">Pcs Available in Box</th>
                  <th className="py-2.5 text-center">Box Status</th>
                  <th className="py-2.5 text-center">Recall Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const med = medicines.find(m => m.id === b.medicineId);
                  return (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-700">{med?.name || 'Unknown'}</td>
                      <td className="py-3 font-mono font-bold text-slate-600">{b.batchNumber}</td>
                      <td className="py-3 text-center text-slate-500 font-semibold">{b.expiryDate}</td>
                      <td className="py-3 text-center font-bold text-slate-700">{b.stock} pcs</td>
                      <td className="py-3 text-center">
                        {b.status === 'Expired' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-red-700 bg-red-50 border border-red-200/50">Expired (Discard)</span>
                        ) : b.status === 'Blocked' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50">Stopped (Do Not Sell)</span>
                        ) : b.status === 'Recalled' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-red-700 bg-red-100 border border-red-200/50 animate-pulse">RECALLED</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/50">Good to Use</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {b.status === 'Active' ? (
                          <button
                            onClick={() => recallBatch(b.id)}
                            className="px-2 py-0.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            Recall Lot
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Batch Form */}
        <div className="unique-form-panel p-6 text-left space-y-4">
          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Plus size={15} className="text-blue-600" />
            Register New Box Batch
          </h4>
          <form onSubmit={handleAddBatch} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Choose Medicine</label>
              <select
                value={batchMedicineId}
                onChange={(e) => setBatchMedicineId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer"
                required
              >
                <option value="">-- Choose Medicine --</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Box Batch Number</label>
              <input
                type="text"
                placeholder="e.g. B-LIP-22"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Box Quantity (Pcs)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={batchStock}
                  onChange={(e) => setBatchStock(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center"
            >
              Save Box Batch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
