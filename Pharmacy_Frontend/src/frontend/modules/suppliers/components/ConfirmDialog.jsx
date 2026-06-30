import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', confirmColor = 'rose' }) {
  if (!isOpen) return null;
  const colorMap = {
    rose: 'bg-rose-600 hover:bg-rose-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    amber: 'bg-amber-600 hover:bg-amber-700'
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">{title || 'Confirm Action'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{message || 'Are you sure you want to proceed?'}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-xs font-bold text-white ${colorMap[confirmColor] || colorMap.rose} rounded-xl transition shadow cursor-pointer`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
