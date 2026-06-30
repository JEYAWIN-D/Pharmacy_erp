import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, message, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        {Icon ? <Icon size={28} className="text-slate-300" /> : <Inbox size={28} className="text-slate-300" />}
      </div>
      <h4 className="text-sm font-extrabold text-slate-500">{title || 'No Data Found'}</h4>
      <p className="text-xs text-slate-400 max-w-sm">{message || 'There are no records to display at this time.'}</p>
      {action && onAction && (
        <button onClick={onAction} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
          {action}
        </button>
      )}
    </div>
  );
}
