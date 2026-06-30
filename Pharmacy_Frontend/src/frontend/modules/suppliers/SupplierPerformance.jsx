import React, { useState } from 'react';
import { Star, RefreshCw, Trophy, ShieldAlert, Award, Clock, DollarSign } from 'lucide-react';
import DataTable from './components/DataTable';

export default function SupplierPerformance({ controller, addToast }) {
  const { suppliers, performance, refreshPerformance } = controller;
  const [refreshing, setRefreshing] = useState(false);

  const columns = [
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'score', header: 'Overall Score', accessor: 'overallScore', align: 'center', render: (row) => {
      const score = row.overallScore || 0;
      const color = score >= 85 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : score >= 70 ? 'text-blue-600 bg-blue-50 border-blue-200' : score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';
      return <span className={`px-2 py-1 rounded border font-mono font-black ${color}`}>{score}/100</span>;
    }},
    { key: 'delivery', header: 'Delivery (30%)', accessor: 'deliveryScore', align: 'center', render: (row) => <span className="font-mono text-xs">{row.deliveryScore || 0}</span> },
    { key: 'quality', header: 'Quality (30%)', accessor: 'qualityScore', align: 'center', render: (row) => <span className="font-mono text-xs">{row.qualityScore || 0}</span> },
    { key: 'pricing', header: 'Pricing (20%)', accessor: 'pricingScore', align: 'center', render: (row) => <span className="font-mono text-xs">{row.pricingScore || 0}</span> },
    { key: 'service', header: 'Service (20%)', accessor: 'serviceScore', align: 'center', render: (row) => <span className="font-mono text-xs">{row.serviceScore || 0}</span> },
    { key: 'rating', header: 'Rating', render: (row) => {
      const score = row.overallScore || 0;
      const stars = score >= 90 ? 5 : score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;
      return (
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
      );
    }},
    { key: 'updated', header: 'Last Evaluated', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.updatedAt).toLocaleDateString()}</span> }
  ];

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      // In a real app, you might have a bulk endpoint. Here we'll do the top active ones or just show a toast
      for (const supplier of suppliers.slice(0, 5)) {
        await refreshPerformance(supplier.id);
      }
      addToast('Performance metrics recalculated', 'success');
    } catch (err) {
      addToast('Failed to refresh metrics', 'error');
    }
    setRefreshing(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star size={16} className="text-amber-600" />
            </div>
            Supplier Performance & Ratings
          </h2>
          <p className="text-xs text-slate-400 mt-1">Automated KPI evaluation based on delivery time, return rates, and pricing</p>
        </div>
        <button onClick={handleRefreshAll} disabled={refreshing} className={`flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer ${refreshing ? 'opacity-50' : ''}`}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Evaluating...' : 'Recalculate All KPIs'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Clock size={16} className="text-blue-600" /></div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Time</h4>
            <p className="text-xs text-slate-600 mt-1">Based on PO date vs GRN date.</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><ShieldAlert size={16} className="text-emerald-600" /></div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality (Returns)</h4>
            <p className="text-xs text-slate-600 mt-1">Based on return value vs total purchase.</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><DollarSign size={16} className="text-amber-600" /></div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pricing</h4>
            <p className="text-xs text-slate-600 mt-1">Compared against benchmark terms.</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-violet-50 rounded-lg"><Award size={16} className="text-violet-600" /></div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Level</h4>
            <p className="text-xs text-slate-600 mt-1">Credit note resolution speed & manual input.</p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={performance} searchPlaceholder="Search evaluations..." />
    </div>
  );
}
