import React from 'react';

export default function StatCard({ icon: Icon, label, value, subValue, color = 'blue', trend, onClick }) {
  const colorMap = {
    blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    emerald: { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    amber: { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    rose: { bg: 'from-rose-500 to-rose-600', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    violet: { bg: 'from-violet-500 to-violet-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
    teal: { bg: 'from-teal-500 to-teal-600', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
    indigo: { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    cyan: { bg: 'from-cyan-500 to-cyan-600', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
    orange: { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    pink: { bg: 'from-pink-500 to-pink-600', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
    slate: { bg: 'from-slate-500 to-slate-600', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' },
    lime: { bg: 'from-lime-500 to-lime-600', light: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-100' }
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white border ${c.border} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''} group`}
    >
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon size={18} className="text-white" />}
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-black ${c.text} mt-0.5 leading-tight`}>{value}</p>
        {subValue && <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{subValue}</p>}
      </div>
    </div>
  );
}
