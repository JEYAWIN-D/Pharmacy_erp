import React, { useState } from 'react';
import { BarChart3, Download, FileText, Calendar, Filter } from 'lucide-react';

export default function SupplierReports({ controller, addToast }) {
  const { exportCSV } = controller;
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('payable');

  const reportTypes = [
    { id: 'payable', title: 'Accounts Payable', desc: 'Outstanding balances and aging summary across all suppliers.' },
    { id: 'purchase', title: 'Purchase Summary', desc: 'Total GRN value and invoice count over the selected period.' },
    { id: 'return', title: 'Returns & Credit Notes', desc: 'Detailed log of debit notes, returns, and issued credit notes.' },
    { id: 'performance', title: 'Performance Matrix', desc: 'KPI export including delivery, quality, and pricing scores.' }
  ];

  const handleExport = async () => {
    try {
      addToast('Preparing report export...', 'info');
      await exportCSV({ type: reportType, ...dateRange });
    } catch (err) {
      addToast('Export failed', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BarChart3 size={16} className="text-indigo-600" />
            </div>
            Supplier Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">Generate and export comprehensive analytics and financial reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reportTypes.map(rt => (
              <div 
                key={rt.id} 
                onClick={() => setReportType(rt.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  reportType === rt.id ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10' : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className={reportType === rt.id ? 'text-indigo-600' : 'text-slate-400'} />
                  <h3 className={`text-sm font-bold ${reportType === rt.id ? 'text-indigo-800' : 'text-slate-700'}`}>{rt.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{rt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 h-fit">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
            <Filter size={14} className="text-slate-400" /> Export Filters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> Start Date</label>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> End Date</label>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleExport} className="w-full flex justify-center items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/25 cursor-pointer">
              <Download size={14} /> Export {reportTypes.find(r => r.id === reportType)?.title} (.CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
