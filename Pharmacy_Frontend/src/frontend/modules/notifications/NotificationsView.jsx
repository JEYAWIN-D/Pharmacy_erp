import React from 'react';
import { Database, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useDB } from '../../db/DBContext';

export default function NotificationsView({ setSchemaModalTable }) {
  const { notifications, setNotifications } = useDB();

  const handleResolveAlert = (id) => {
    setNotifications(notifications.map(not => 
      not.id === id ? { ...not, resolved: true } : not
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Urgent Message Inbox
            <button 
              onClick={() => setSchemaModalTable('pharmacy_notification')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Database Table Info"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Check alerts about low stock, expired boxes, freezer issues, and shelf space.</p>
        </div>
      </div>

      <div className="unique-card p-6 text-left space-y-4">
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              n.resolved 
                ? 'bg-slate-50 border-slate-100 text-slate-400' 
                : n.type === 'danger' 
                  ? 'bg-red-50/60 border-red-200 text-red-800' 
                  : n.type === 'warning' 
                    ? 'bg-amber-50/60 border-amber-200 text-amber-800' 
                    : 'bg-blue-50/60 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                {n.resolved ? (
                  <CheckCircle size={16} className="text-slate-400 shrink-0" />
                ) : n.type === 'danger' ? (
                  <ShieldAlert size={16} className="text-red-600 shrink-0" />
                ) : n.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-blue-600 shrink-0" />
                )}
                <div className="text-xs text-left">
                  <p className={`font-semibold ${n.resolved ? 'line-through opacity-60' : ''}`}>{n.message}</p>
                  <span className="text-[9px] block mt-0.5 opacity-80">{n.time}</span>
                </div>
              </div>
              
              {!n.resolved && (
                <button
                  onClick={() => handleResolveAlert(n.id)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm cursor-pointer hover:text-slate-700 transition"
                >
                  I Have Fixed This
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              No alerts inside your inbox right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
