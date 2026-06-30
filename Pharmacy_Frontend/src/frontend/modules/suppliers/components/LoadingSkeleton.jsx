import React from 'react';

export default function LoadingSkeleton({ rows = 5, cols = 4, type = 'table' }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-slate-50 p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-2.5 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 flex gap-4 border-t border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-2 bg-slate-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
