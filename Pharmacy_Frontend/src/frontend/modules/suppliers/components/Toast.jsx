import React from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-rose-500" />,
    info: <Info size={16} className="text-blue-500" />,
    warning: <AlertCircle size={16} className="text-amber-500" />
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-rose-200 bg-rose-50',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-amber-200 bg-amber-50'
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg ${borders[toast.type] || borders.info} animate-fade-in-up`}>
          {icons[toast.type] || icons.info}
          <span className="text-xs font-semibold text-slate-700 flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-white/50 rounded cursor-pointer">
            <X size={12} className="text-slate-400" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
