import React, { useState } from 'react';
import { Database, ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useExpiryController } from './useExpiryController';

export default function ExpiryView({ setSchemaModalTable }) {
  const { batches, medicines, handleSupplierReturnExpired } = useExpiryController();
  const [tierFilter, setTierFilter] = useState('all');

  const today = new Date();

  const enrichedBatches = batches.map(b => {
    const med = medicines.find(m => m.id === b.medicineId);
    const expDate = new Date(b.expiryDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let tier = 'safe';
    if (diffDays <= 0) tier = 'expired';
    else if (diffDays <= 30) tier = 'critical';
    else if (diffDays <= 60) tier = 'warning';
    else if (diffDays <= 90) tier = 'caution';
    return { ...b, medName: med?.name || 'Unknown', diffDays, tier };
  });

  const counts = {
    expired: enrichedBatches.filter(b => b.tier === 'expired').length,
    critical: enrichedBatches.filter(b => b.tier === 'critical').length,
    warning: enrichedBatches.filter(b => b.tier === 'warning').length,
    caution: enrichedBatches.filter(b => b.tier === 'caution').length,
    safe: enrichedBatches.filter(b => b.tier === 'safe').length
  };

  const filtered = tierFilter === 'all' ? enrichedBatches : enrichedBatches.filter(b => b.tier === tierFilter);

  const tierLabel = {
    expired: { label: 'EXPIRED', cls: 'bg-red-50 text-red-700 border-red-200/50' },
    critical: { label: '≤ 30 days', cls: 'bg-red-50 text-red-700 border-red-200/50' },
    warning: { label: '31–60 days', cls: 'bg-amber-50 text-amber-700 border-amber-200/50' },
    caution: { label: '61–90 days', cls: 'bg-orange-50 text-orange-700 border-orange-200/50' },
    safe: { label: '> 90 days', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' }
  };

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Medicines Expiring Soon
            <button onClick={() => setSchemaModalTable('medicine_expiry_alert')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer" title="View DB Schema">
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">90 / 60 / 30 day tiered expiry tracking with write-off actions</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'expired', label: 'Expired', icon: <ShieldAlert size={16} />, color: 'bg-red-500', textColor: 'text-white' },
          { key: 'critical', label: '≤ 30 Days', icon: <AlertTriangle size={16} />, color: 'bg-red-100', textColor: 'text-red-700' },
          { key: 'warning', label: '31–60 Days', icon: <AlertTriangle size={16} />, color: 'bg-amber-100', textColor: 'text-amber-700' },
          { key: 'caution', label: '61–90 Days', icon: <Info size={16} />, color: 'bg-orange-100', textColor: 'text-orange-700' },
          { key: 'safe', label: '> 90 Days', icon: <CheckCircle size={16} />, color: 'bg-emerald-100', textColor: 'text-emerald-700' }
        ].map(kpi => (
          <button key={kpi.key} onClick={() => setTierFilter(tierFilter === kpi.key ? 'all' : kpi.key)}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer text-left ${kpi.color} ${tierFilter === kpi.key ? 'border-blue-400 shadow-md scale-105' : 'border-transparent'}`}>
            <div className={`flex items-center gap-1.5 ${kpi.textColor} font-bold text-xs mb-1`}>
              {kpi.icon} {kpi.label}
            </div>
            <div className={`text-2xl font-black ${kpi.textColor}`}>{counts[kpi.key]}</div>
            <div className={`text-[10px] font-semibold ${kpi.textColor} opacity-80`}>batches</div>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500">Filter:</span>
        {['all', 'expired', 'critical', 'warning', 'caution', 'safe'].map(f => (
          <button key={f} onClick={() => setTierFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${tierFilter === f ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f === 'all' ? '🗂 All Batches' : f === 'expired' ? '⛔ Expired' : f === 'critical' ? '🔴 Critical' : f === 'warning' ? '🟡 Warning' : f === 'caution' ? '🟠 Caution' : '✅ Safe'}
          </button>
        ))}
      </div>

      <div className="unique-card p-6 text-left space-y-4">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert size={15} className="text-blue-600" /> Batch Expiry Register
          <span className="ml-auto text-[10px] text-slate-400 font-semibold normal-case">Showing {filtered.length} of {enrichedBatches.length} batches</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5">Medicine Name</th>
                <th className="py-2.5 text-center">Batch ID</th>
                <th className="py-2.5 text-center">Expiry Date</th>
                <th className="py-2.5 text-center">Days Left</th>
                <th className="py-2.5 text-center">Stock Left</th>
                <th className="py-2.5 text-center">Tier</th>
                <th className="py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3.5 font-bold text-slate-700">{b.medName}</td>
                  <td className="py-3.5 text-center font-mono font-bold text-slate-600">{b.batchNumber}</td>
                  <td className="py-3.5 text-center text-slate-500 font-semibold">{b.expiryDate}</td>
                  <td className="py-3.5 text-center font-black text-slate-800">
                    {b.diffDays <= 0 ? <span className="text-red-600">EXPIRED</span> : `${b.diffDays} days`}
                  </td>
                  <td className="py-3.5 text-center font-bold text-slate-700">{b.stock} pcs</td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${tierLabel[b.tier]?.cls}`}>
                      {tierLabel[b.tier]?.label}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    {b.diffDays <= 0 ? (
                      <button onClick={() => handleSupplierReturnExpired(b.id)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
                        Write-off
                      </button>
                    ) : b.diffDays <= 30 ? (
                      <button onClick={() => handleSupplierReturnExpired(b.id)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
                        Return to Supplier
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">Safe to Sell</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="py-6 text-center text-slate-400 font-semibold">No batches match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
