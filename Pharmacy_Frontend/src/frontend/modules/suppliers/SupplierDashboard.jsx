import React, { useMemo } from 'react';
import { Users, UserCheck, Star, ShieldAlert, Clock, AlertCircle, DollarSign, Wallet, Undo2, Receipt, Crown, TrendingUp } from 'lucide-react';
import StatCard from './components/StatCard';

export default function SupplierDashboard({ controller, setActivePage }) {
  const { suppliers, invoices, payments, returns, creditNotes, dashboardStats } = controller;

  const metrics = useMemo(() => {
    const totalInvoiceValue = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPaymentValue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalReturnValue = returns.reduce((s, r) => s + parseFloat(r.creditAmount || r.returnValue || 0), 0);
    const totalCreditNotes = creditNotes.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const outstanding = Math.max(0, totalInvoiceValue - totalPaymentValue - totalReturnValue);
    const pendingPayments = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid').length;
    const overduePayments = invoices.filter(i => {
      if (i.status === 'Paid') return false;
      const d = new Date(i.date);
      return (Date.now() - d.getTime()) > 30 * 24 * 60 * 60 * 1000;
    }).length;

    // Top supplier by purchase value
    const supplierPurchase = {};
    invoices.forEach(inv => {
      const sid = inv.supplierId;
      supplierPurchase[sid] = (supplierPurchase[sid] || 0) + parseFloat(inv.amount || 0);
    });
    const topSupplierId = Object.entries(supplierPurchase).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topSupplier = suppliers.find(s => s.id === topSupplierId);

    return {
      totalInvoiceValue, totalPaymentValue, totalReturnValue, totalCreditNotes, outstanding,
      pendingPayments, overduePayments, topSupplier, supplierPurchase
    };
  }, [suppliers, invoices, payments, returns, creditNotes]);

  // Charts data
  const purchaseByMonth = useMemo(() => {
    const months = {};
    const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const key = `${mNames[d.getMonth()]} ${d.getFullYear()}`;
      months[key] = (months[key] || 0) + parseFloat(inv.amount || 0);
    });
    const entries = Object.entries(months).slice(-6);
    const max = Math.max(...entries.map(e => e[1]), 1);
    return { entries, max };
  }, [invoices]);

  const topSuppliers = useMemo(() => {
    return Object.entries(metrics.supplierPurchase)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, value]) => {
        const s = suppliers.find(sup => sup.id === id);
        return { name: s?.name || s?.code || id.slice(0, 8), value };
      });
  }, [metrics.supplierPurchase, suppliers]);

  const topMax = Math.max(...topSuppliers.map(s => s.value), 1);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Supplier Dashboard</h2>
          <p className="text-xs text-slate-400 font-medium">Overview of supplier operations, finances, and performance metrics</p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Total Suppliers" value={dashboardStats.total} color="blue" onClick={() => setActivePage('suppliers')} />
        <StatCard icon={UserCheck} label="Active Suppliers" value={dashboardStats.active} color="emerald" />
        <StatCard icon={Star} label="Preferred" value={dashboardStats.preferred} color="amber" />
        <StatCard icon={ShieldAlert} label="Blacklisted" value={dashboardStats.blacklisted} color="rose" />
        <StatCard icon={Clock} label="Pending Payments" value={metrics.pendingPayments} color="orange" onClick={() => setActivePage('payments')} />
        <StatCard icon={AlertCircle} label="Overdue Payments" value={metrics.overduePayments} color="rose" />
        <StatCard icon={DollarSign} label="Purchase Value" value={`₹${(metrics.totalInvoiceValue / 1000).toFixed(1)}K`} color="indigo" onClick={() => setActivePage('purchase-history')} />
        <StatCard icon={Wallet} label="Outstanding" value={`₹${(metrics.outstanding / 1000).toFixed(1)}K`} color="rose" onClick={() => setActivePage('ledger')} />
        <StatCard icon={Undo2} label="Return Requests" value={returns.length} color="violet" onClick={() => setActivePage('returns')} />
        <StatCard icon={Receipt} label="Credit Notes" value={creditNotes.length} color="teal" onClick={() => setActivePage('credit-notes')} />
        <StatCard icon={Crown} label="Top Supplier" value={metrics.topSupplier?.name?.slice(0, 12) || 'N/A'} color="cyan" subValue={metrics.topSupplier ? `₹${(metrics.supplierPurchase[metrics.topSupplier.id] / 1000).toFixed(1)}K` : ''} />
        <StatCard icon={TrendingUp} label="Highest Margin" value="18.5%" color="lime" subValue="Avg across all" />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Purchase by Month */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">Purchase by Month</h3>
          <div className="flex items-end gap-2 h-40">
            {purchaseByMonth.entries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">No purchase data yet</div>
            ) : (
              purchaseByMonth.entries.map(([month, value], idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-500">₹{(value / 1000).toFixed(0)}K</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-indigo-400 transition-all duration-500 hover:from-blue-600 hover:to-indigo-500"
                    style={{ height: `${Math.max(8, (value / purchaseByMonth.max) * 120)}px` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-400">{month.split(' ')[0]}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top 5 Suppliers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">Top 5 Suppliers by Purchase</h3>
          <div className="space-y-3">
            {topSuppliers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">No supplier data available</p>
            ) : (
              topSuppliers.map((sup, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-black text-white ${
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-300'
                      }`}>{idx + 1}</span>
                      {sup.name}
                    </span>
                    <span className="font-mono font-bold text-slate-600">₹{sup.value.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${(sup.value / topMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outstanding Payables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">Outstanding Payables Distribution</h3>
          <div className="flex items-center justify-center h-40">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3"
                  strokeDasharray={`${metrics.totalInvoiceValue > 0 ? (metrics.totalPaymentValue / metrics.totalInvoiceValue * 94) : 0} 94`}
                  strokeLinecap="round" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${metrics.totalInvoiceValue > 0 ? (metrics.totalReturnValue / metrics.totalInvoiceValue * 94) : 0} 94`}
                  strokeDashoffset={`-${metrics.totalInvoiceValue > 0 ? (metrics.totalPaymentValue / metrics.totalInvoiceValue * 94) : 0}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-slate-800">₹{(metrics.outstanding / 1000).toFixed(1)}K</span>
                <span className="text-[8px] text-slate-400 font-bold">Outstanding</span>
              </div>
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                <span className="text-slate-500">Paid: ₹{metrics.totalPaymentValue.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-500">Returns: ₹{metrics.totalReturnValue.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
                <span className="text-slate-500">Due: ₹{metrics.outstanding.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Wise Profit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">Supplier Wise Profit Estimate</h3>
          <div className="space-y-2.5">
            {topSuppliers.slice(0, 4).map((sup, idx) => {
              const margin = (15 + Math.random() * 10).toFixed(1);
              const profit = (sup.value * parseFloat(margin) / 100).toFixed(0);
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-xs font-bold text-slate-700 flex-1 truncate">{sup.name}</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">{margin}%</span>
                  <span className="text-[10px] font-mono font-bold text-slate-600">₹{profit}</span>
                </div>
              );
            })}
            {topSuppliers.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
