import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />,
  error:   <XCircle    size={16} className="text-rose-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />,
  info:    <Info       size={16} className="text-blue-500 shrink-0 mt-0.5" />,
  confirm: <AlertCircle size={16} className="text-violet-500 shrink-0 mt-0.5" />,
};

const BAR_COLORS = {
  success: 'border-l-emerald-500',
  error:   'border-l-rose-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
  confirm: 'border-l-violet-500',
};

/**
 * Renders the in-app toast stack.
 *
 * Props:
 *   toasts        – array from useToast()
 *   dismiss       – (id) => void
 *   resolveConfirm – (id, bool) => void
 */
export default function ToastContainer({ toasts, dismiss, resolveConfirm }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '18px',
        right: '18px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}
      aria-live="polite"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{ pointerEvents: 'all' }}
          className={`
            bg-white rounded-xl shadow-xl border border-slate-100 border-l-4
            ${BAR_COLORS[t.type] || 'border-l-slate-400'}
            px-4 py-3 flex flex-col gap-2
            animate-in slide-in-from-right-4 fade-in duration-200
          `}
        >
          {/* Header row */}
          <div className="flex items-start gap-3">
            {ICONS[t.type]}
            <p className="text-sm text-slate-700 font-medium leading-snug flex-1">
              {t.message}
            </p>
            {t.type !== 'confirm' && (
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Close"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Confirm action buttons */}
          {t.type === 'confirm' && (
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => resolveConfirm(t.id, false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => resolveConfirm(t.id, true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
