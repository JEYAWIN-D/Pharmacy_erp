import React from 'react';
import { Database, ShieldCheck, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDispenseController } from './useDispenseController';

export default function DispenseView({
  role,
  fefoMedId,
  setFefoMedId,
  fefoPrescriptionId,
  setFefoPrescriptionId,
  setSchemaModalTable
}) {
  const {
    medicines,
    batches,
    fefoSelectedBatch,
    setFefoSelectedBatch,
    fefoDispenseQty,
    setFefoDispenseQty,
    getFefoBatches,
    handleFefoDispenseSubmit,
    showSubstitution,
    substitutes,
    handleSelectSubstitute
  } = useDispenseController(
    role,
    fefoMedId,
    setFefoMedId,
    fefoPrescriptionId,
    setFefoPrescriptionId
  );

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Sell Earliest Expiry First (FEFO)
            <button 
              onClick={() => setSchemaModalTable('medicine_dispensing')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Database Table Info"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Sell medicine boxes that expire soonest first so they don't go bad.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FEFO Batch lot recommendations list */}
        <div className="unique-card lg:col-span-2 p-6 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={15} className="text-blue-600" />
            Check Boxes for Selected Medicine (Shortest Expiry First)
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {getFefoBatches(fefoMedId).map((batch, index) => {
              const isFefoTarget = index === 0;
              return (
                <div key={batch.id} className={`p-4 border rounded-2xl text-left space-y-2 transition-all ${
                  isFefoTarget 
                    ? 'border-blue-500 bg-blue-50/30 shadow-sm' 
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-700 text-xs">Box ID: {batch.batchNumber}</span>
                    {isFefoTarget && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-blue-700 bg-blue-100 animate-pulse flex items-center gap-0.5 select-none">
                        ★ Sell This Box First
                      </span>
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="text-slate-500">Expiry Date: <span className="font-bold text-slate-700">{batch.expiryDate}</span></div>
                    <div className="text-slate-500">Stock in This Box: <span className="font-bold text-slate-700">{batch.stock} pcs</span></div>
                  </div>
                </div>
              );
            })}
            {getFefoBatches(fefoMedId).length === 0 && (
              <div className="col-span-2 space-y-3">
                <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                  ⚠️ No active stock for this medicine.
                </div>
                {showSubstitution && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                      <AlertTriangle size={14} /> Medicine Substitution Suggestions
                    </div>
                    <p className="text-[10px] text-amber-700 font-semibold">Same generic name — medicines with stock available:</p>
                    {substitutes.map(sub => (
                      <div key={sub.id} className="p-3 bg-white border border-amber-100 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{sub.name}</span>
                          <span className="text-[9px] text-slate-400">{sub.generic} — Stock: {sub.stock} pcs</span>
                        </div>
                        <button onClick={() => handleSelectSubstitute(sub.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
                          Use as Substitute
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dispensing Post Form */}
        <div className="unique-form-panel p-6 text-left space-y-4">
          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={15} className="text-blue-600" />
            Sell From Box
          </h4>
          <form onSubmit={handleFefoDispenseSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Medicine to Sell</label>
              <select
                value={fefoMedId}
                onChange={(e) => setFefoMedId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Medicine Box (Batch)</label>
              <select
                value={fefoSelectedBatch}
                onChange={(e) => setFefoSelectedBatch(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer"
              >
                {batches.filter(b => b.medicineId === parseInt(fefoMedId) && b.status === 'Active').map(b => (
                  <option key={b.id} value={b.id}>{b.batchNumber} (Available: {b.stock} pcs)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor Slip Ref (if any)</label>
                <input
                  type="text"
                  placeholder="e.g. RX-9844"
                  value={fefoPrescriptionId}
                  onChange={(e) => setFefoPrescriptionId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">No. of Pieces to Sell</label>
                <input
                  type="number"
                  placeholder="0"
                  value={fefoDispenseQty}
                  onChange={(e) => setFefoDispenseQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center"
            >
              Finish Sale and Update Stock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
