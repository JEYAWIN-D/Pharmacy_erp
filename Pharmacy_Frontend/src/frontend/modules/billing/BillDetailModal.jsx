import React, { useState } from 'react';
import { Package, Calendar, CreditCard, FileText, X } from 'lucide-react';

const fmt = (v) => Number(v || 0).toFixed(2);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const fmtExpiry = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

// ─── Medicine Detail Modal ────────────────────────────────────────────────────
export function MedicineDetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Medicine Details</p>
              <h2 className="text-xl font-black">{item.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Batch Number', value: item.batchNumber || 'N/A', icon: Package },
              { label: 'Expiry Date', value: fmtExpiry(item.expiryDate), icon: Calendar },
              { label: 'Quantity Sold', value: `${item.qty} ${item.sellingUnit || 'Tablet'}(s)`, icon: Package },
              { label: 'Unit Price (MRP)', value: `₹${fmt(item.price)}`, icon: CreditCard },
              { label: 'Discount', value: `${item.discount || 0}%`, icon: FileText },
              { label: 'GST Rate', value: `${item.gstRate || 0}%`, icon: FileText },
              { label: 'Item Total', value: `₹${fmt(item.total)}`, icon: CreditCard },
              { label: 'Rack Location', value: item.rack || 'N/A', icon: Package },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  <Icon size={10} /> {label}
                </div>
                <div className="font-black text-slate-800 text-sm">{value}</div>
              </div>
            ))}
          </div>
          {item.medicine?.manufacturer?.name && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="text-[9px] font-black uppercase text-emerald-600 tracking-wider mb-1">Manufacturer</div>
              <div className="font-black text-slate-800">{item.medicine.manufacturer.name}</div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bill Detail Modal ────────────────────────────────────────────────────────
export default function BillDetailModal({ bill, onClose, role }) {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  if (!bill) return null;

  const totalDiscount = (bill.items || []).reduce((s, i) => s + ((i.price * i.qty) - i.total), 0);

  return (
    <>
      {selectedMedicine && (
        <MedicineDetailModal item={selectedMedicine} onClose={() => setSelectedMedicine(null)} />
      )}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 flex justify-between items-start flex-shrink-0">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Bill Details</p>
              <h2 className="text-2xl font-black">{bill.id}</h2>
              <p className="text-slate-300 text-sm mt-1">{fmtDate(bill.createdAt)} at {fmtTime(bill.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                bill.paymentStatus === 'Paid'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {bill.paymentStatus}
              </span>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Bill Info Row */}
          <div className="grid grid-cols-4 gap-px bg-slate-100 border-b border-slate-200 flex-shrink-0">
            {[
              { label: 'Patient', value: bill.patientName || 'Walk-in' },
              { label: 'Mobile', value: bill.mobileNumber || '—' },
              { label: 'Payment', value: bill.paymentMethod || 'Cash' },
              { label: 'Billed By', value: bill.createdBy || 'Operator' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white p-4 text-center">
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{label}</div>
                <div className="font-bold text-slate-800 mt-0.5 text-sm">{value}</div>
              </div>
            ))}
          </div>

          {/* Medicine Table */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Medicine List — Click any row for details</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800 text-white text-xs">
                  <th className="p-3 text-left font-black rounded-tl-lg">#</th>
                  <th className="p-3 text-left font-black">Medicine Name</th>
                  <th className="p-3 text-center font-black">Batch</th>
                  <th className="p-3 text-center font-black">Expiry</th>
                  <th className="p-3 text-center font-black">Unit</th>
                  <th className="p-3 text-center font-black">Qty</th>
                  <th className="p-3 text-right font-black">MRP</th>
                  <th className="p-3 text-right font-black">Disc%</th>
                  <th className="p-3 text-right font-black rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(bill.items || []).map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedMedicine(item)}
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{item.name}</div>
                    </td>
                    <td className="p-3 text-center font-mono text-xs font-bold text-slate-600">{item.batchNumber || 'N/A'}</td>
                    <td className="p-3 text-center text-xs font-bold text-slate-600">{fmtExpiry(item.expiryDate)}</td>
                    <td className="p-3 text-center text-xs text-slate-500">{item.sellingUnit || 'Tablet'}</td>
                    <td className="p-3 text-center font-black text-slate-800">{item.qty}</td>
                    <td className="p-3 text-right font-bold text-slate-600">₹{fmt(item.price)}</td>
                    <td className="p-3 text-right text-slate-500">{item.discount || 0}%</td>
                    <td className="p-3 text-right font-black text-slate-800">₹{fmt(item.total)}</td>
                  </tr>
                ))}
                {(!bill.items || bill.items.length === 0) && (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-bold">No medicine items found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 mt-2 font-bold text-center">💡 Click on any medicine row to view full details</p>
          </div>

          {/* Bill Summary Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex-shrink-0">
            <div className="flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Sub Total</span><span className="font-black">₹{fmt(bill.subtotal || (Number(bill.grandTotal||0) - Number(bill.gstTax||0)))}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between"><span className="text-amber-600 font-bold">Discount</span><span className="font-black text-amber-600">- ₹{fmt(totalDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500 font-bold">GST Tax</span><span className="font-black">₹{fmt(bill.gstTax)}</span></div>
                {Number(bill.roundOff || 0) !== 0 && (
                  <div className="flex justify-between"><span className="text-violet-600 font-bold">Round Off</span><span className="font-black text-violet-600">{Number(bill.roundOff) > 0 ? '+' : ''}₹{fmt(bill.roundOff)}</span></div>
                )}
                <div className="flex justify-between border-t pt-2"><span className="text-blue-700 font-black">Grand Total</span><span className="font-black text-blue-700 text-lg">₹{fmt(bill.grandTotal)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-emerald-600 font-bold">Paid Amount</span><span className="font-black text-emerald-600">₹{fmt(bill.paidAmount)}</span></div>
                {Number(bill.balanceAmount || 0) > 0 && (
                  <div className="flex justify-between text-xs"><span className="text-rose-600 font-bold">Balance Due</span><span className="font-black text-rose-600">₹{fmt(bill.balanceAmount)}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
