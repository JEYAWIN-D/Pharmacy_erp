import React, { useMemo } from 'react';
import { ArrowLeft, Phone, Mail, Globe, MapPin, Shield, FileText, CreditCard, Gauge, HelpCircle, AlertCircle } from 'lucide-react';
import StatCard from './components/StatCard';

export default function SupplierDetails({ supplier, controller, addToast, onBack }) {
  const { invoices, payments, returns, creditNotes, ledger } = controller;

  const financial = useMemo(() => {
    const sInv = invoices.filter(i => i.supplierId === supplier.id);
    const sPay = payments.filter(p => p.supplierId === supplier.id);
    const sRet = returns.filter(r => r.supplierId === supplier.id);
    const totalPurchase = sInv.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPaid = sPay.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalReturns = sRet.reduce((s, r) => s + parseFloat(r.creditAmount || r.returnValue || 0), 0);
    const outstanding = Math.max(0, totalPurchase - totalPaid - totalReturns);
    const creditLimit = parseFloat(supplier.creditLimit || 200000);
    const utilization = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;
    return { totalPurchase, totalPaid, totalReturns, outstanding, creditLimit, utilization, invoiceCount: sInv.length, paymentCount: sPay.length };
  }, [supplier, invoices, payments, returns]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer">
        <ArrowLeft size={14} /> Back to Supplier List
      </button>

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">{supplier.code}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${supplier.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                {supplier.status || (supplier.isActive ? 'Active' : 'Inactive')}
              </span>
              {supplier.isPreferred && <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">★ Preferred</span>}
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">{supplier.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{supplier.supplierType || 'Distributor'}</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /><span className="font-semibold text-slate-700">{supplier.phone || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /><span className="font-semibold text-slate-600">{supplier.email || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><Globe size={12} className="text-slate-400" /><span className="font-semibold text-slate-600">{supplier.website || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" /><span className="font-semibold text-slate-600">{[supplier.addressCity, supplier.addressState].filter(Boolean).join(', ') || 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Shield size={14} className="text-blue-600" /> Compliance & Licenses</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div><span className="text-[10px] text-slate-400 font-bold block">GSTIN</span><span className="font-mono font-bold text-slate-700">{supplier.gstNumber || '—'}</span></div>
          <div><span className="text-[10px] text-slate-400 font-bold block">PAN</span><span className="font-mono font-bold text-slate-700">{supplier.panNumber || '—'}</span></div>
          <div><span className="text-[10px] text-slate-400 font-bold block">Drug License</span><span className="font-mono font-bold text-slate-700">{supplier.drugLicenseNo || '—'}</span></div>
          <div><span className="text-[10px] text-slate-400 font-bold block">FSSAI</span><span className="font-mono font-bold text-slate-700">{supplier.fssaiNumber || '—'}</span></div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Total Purchase" value={`₹${financial.totalPurchase.toFixed(0)}`} color="blue" subValue={`${financial.invoiceCount} invoices`} />
        <StatCard icon={CreditCard} label="Total Paid" value={`₹${financial.totalPaid.toFixed(0)}`} color="emerald" subValue={`${financial.paymentCount} payments`} />
        <StatCard icon={AlertCircle} label="Outstanding" value={`₹${financial.outstanding.toFixed(0)}`} color="rose" />
        <StatCard icon={Gauge} label="Credit Used" value={`${financial.utilization}%`} color={financial.utilization < 60 ? 'emerald' : financial.utilization < 80 ? 'amber' : 'rose'} subValue={`of ₹${financial.creditLimit.toLocaleString()}`} />
      </div>

      {/* Credit Utilization Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5"><Gauge size={14} className="text-blue-600" /> Credit Utilization</h3>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${financial.utilization < 60 ? 'bg-emerald-50 text-emerald-700' : financial.utilization < 80 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
            {financial.utilization}% Used
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${financial.utilization < 60 ? 'bg-emerald-500' : financial.utilization < 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${financial.utilization}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div><span className="text-[9px] text-slate-400 font-sans font-bold block">Credit Limit</span>₹{financial.creditLimit.toLocaleString()}</div>
          <div><span className="text-[9px] text-slate-400 font-sans font-bold block">Outstanding</span>₹{financial.outstanding.toFixed(0)}</div>
          <div><span className="text-[9px] text-slate-400 font-sans font-bold block">Available</span><span className="text-emerald-600">₹{Math.max(0, financial.creditLimit - financial.outstanding).toFixed(0)}</span></div>
        </div>
        {financial.utilization > 80 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold">
            <AlertCircle size={14} /> Credit limit nearing capacity. New procurement may be restricted.
          </div>
        )}
      </div>
    </div>
  );
}
