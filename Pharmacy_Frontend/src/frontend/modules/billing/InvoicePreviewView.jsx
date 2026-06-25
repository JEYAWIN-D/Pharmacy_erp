import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Printer, Download, MessageSquare, Phone, FileText,
  CheckCircle, Plus, X, Repeat
} from 'lucide-react';

// ─── Pharmacy Store Config (update with real values) ─────────────────────────
const PHARMACY = {
  name: 'LifeCare Pharmacy',
  tagline: 'Your Trusted Health Partner',
  address: '12, Gandhi Nagar, Main Road, Chennai - 600 001',
  phone: '+91 98765 43210',
  email: 'lifecare@pharmacy.com',
  gst: '33ABCDE1234F1Z5',
  drugLicense: 'DL/TN/MH/2024/001',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => Number(v || 0).toFixed(2);
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatExpiry = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

function printCountLabel(n) {
  if (!n || n === 0) return null;
  return `Printed ${n} ${n === 1 ? 'Time' : 'Times'}`;
}

// ─── A4 Invoice Layout ────────────────────────────────────────────────────────
function A4Invoice({ bill, payCash, payUPI, payCard }) {
  // Use subtotal from DB if available, otherwise compute from grandTotal - gstTax
  const subtotal = Number(bill.subtotal || 0) > 0 
    ? Number(bill.subtotal || 0) 
    : Number(bill.grandTotal || 0) - Number(bill.gstTax || 0);
  const roundOff = Number(bill.roundOff || 0);
  const change = Math.max(0, Number(bill.paidAmount || 0) - Number(bill.grandTotal || 0));
  const balance = Math.max(0, Number(bill.grandTotal || 0) - Number(bill.paidAmount || 0));

  return (
    <div id="invoice-a4" className="bg-white w-full max-w-4xl mx-auto font-sans text-slate-800 text-sm print:shadow-none shadow-xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{PHARMACY.name}</h1>
              <p className="text-blue-200 text-xs font-medium">{PHARMACY.tagline}</p>
            </div>
          </div>
          <div className="text-blue-100 text-xs space-y-0.5 mt-3">
            <p>📍 {PHARMACY.address}</p>
            <p>📞 {PHARMACY.phone} | ✉ {PHARMACY.email}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-white/10 border border-white/20 rounded-xl p-4">
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">TAX INVOICE</p>
            <p className="text-2xl font-black mt-1">{bill.id}</p>
            <p className="text-blue-200 text-xs mt-2">GST: {PHARMACY.gst}</p>
            <p className="text-blue-200 text-xs">DL: {PHARMACY.drugLicense}</p>
          </div>
        </div>
      </div>

      {/* Bill Info Row */}
      <div className="grid grid-cols-4 gap-px bg-slate-100 border-b border-slate-200">
        {[
          { label: 'Bill Date', value: formatDate(bill.createdAt) },
          { label: 'Bill Time', value: formatTime(bill.createdAt) },
          { label: 'Payment', value: bill.paymentMethod || 'Cash' },
          { label: 'Cashier', value: bill.createdBy || 'Operator' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white p-4 text-center">
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{label}</div>
            <div className="font-bold text-slate-700 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Customer Section */}
      <div className="p-6 bg-blue-50/50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Bill To</p>
          <p className="text-lg font-black text-slate-800">{bill.patientName || 'Walk-in Customer'}</p>
          {bill.mobileNumber && <p className="text-slate-500 text-sm font-medium">📞 {bill.mobileNumber}</p>}
          {bill.doctorName && <p className="text-slate-500 text-xs font-medium mt-0.5">Dr. {bill.doctorName}</p>}
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
            bill.paymentStatus === 'Paid'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}>
            {bill.paymentStatus}
          </span>
          {printCountLabel(bill.printCount) && (
            <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center justify-end gap-1">
              <Repeat size={10} /> {printCountLabel(bill.printCount)}
            </p>
          )}
        </div>
      </div>

      {/* Medicine Table */}
      <div className="p-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="p-3 text-left font-black rounded-tl-lg">#</th>
              <th className="p-3 text-left font-black">Medicine Name</th>
              <th className="p-3 text-center font-black">Batch</th>
              <th className="p-3 text-center font-black">Expiry</th>
              <th className="p-3 text-center font-black">Rack</th>
              <th className="p-3 text-center font-black">Unit</th>
              <th className="p-3 text-center font-black">Qty</th>
              <th className="p-3 text-right font-black">MRP</th>
              <th className="p-3 text-right font-black">Disc%</th>
              <th className="p-3 text-right font-black">GST%</th>
              <th className="p-3 text-right font-black rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(bill.items || []).map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                <td className="p-3">
                  <div className="font-bold text-slate-800">{item.name}</div>
                </td>
                <td className="p-3 text-center font-mono font-bold text-slate-600">{item.batchNumber || 'N/A'}</td>
                <td className="p-3 text-center font-bold text-slate-600">{formatExpiry(item.expiryDate)}</td>
                <td className="p-3 text-center">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">{item.rack || 'A1'}</span>
                </td>
                <td className="p-3 text-center font-bold text-slate-600">{item.sellingUnit || 'Tablet'}</td>
                <td className="p-3 text-center font-black text-slate-800">{item.qty}</td>
                <td className="p-3 text-right font-bold text-slate-600">₹{fmt(item.price)}</td>
                <td className="p-3 text-right font-bold text-slate-500">{item.discount || 0}%</td>
                <td className="p-3 text-right font-bold text-slate-500">{item.gstRate || 0}%</td>
                <td className="p-3 text-right font-black text-slate-800">₹{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary + Payment Split */}
      <div className="grid grid-cols-2 gap-6 px-6 pb-6">
        {/* Payment Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Payment Details</h4>
          {Number(payCash || bill.paidAmount || 0) > 0 && bill.paymentMethod?.includes('Cash') && (
            <div className="flex justify-between text-sm"><span className="font-medium text-slate-500">💵 Cash Paid</span><span className="font-bold">₹{fmt(payCash || bill.paidAmount)}</span></div>
          )}
          {bill.paymentMethod?.includes('UPI') && (
            <div className="flex justify-between text-sm"><span className="font-medium text-slate-500">📱 UPI Paid</span><span className="font-bold">₹{fmt(payUPI)}</span></div>
          )}
          {bill.paymentMethod?.includes('Card') && (
            <div className="flex justify-between text-sm"><span className="font-medium text-slate-500">💳 Card Paid</span><span className="font-bold">₹{fmt(payCard)}</span></div>
          )}
          {change > 0 && (
            <div className="flex justify-between text-sm border-t pt-2"><span className="font-bold text-emerald-600">Change Return</span><span className="font-black text-emerald-600">₹{fmt(change)}</span></div>
          )}
          {balance > 0 && (
            <div className="flex justify-between text-sm border-t pt-2"><span className="font-bold text-rose-600">Balance Due</span><span className="font-black text-rose-600">₹{fmt(balance)}</span></div>
          )}
        </div>

        {/* Bill Summary */}
        <div className="space-y-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Bill Summary</h4>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Sub Total</span><span className="font-bold">₹{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span className="font-bold text-amber-600">- ₹{fmt(bill.discount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">GST Tax</span><span className="font-bold">₹{fmt(bill.gstTax)}</span></div>
          </div>
          <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
            <span className="font-black text-blue-100 text-xs uppercase tracking-widest">Grand Total</span>
            <span className="text-2xl font-black">₹{fmt(bill.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 text-white px-8 py-5 flex justify-between items-center text-xs">
        <div>
          <p className="font-black text-base">Thank You! Visit Again 🙏</p>
          <p className="text-slate-400 mt-0.5">Medicines once sold cannot be returned without a valid prescription or reason.</p>
        </div>
        <div className="text-right text-slate-400">
          <p>Authorized Signatory</p>
          <div className="border-t border-slate-600 mt-4 pt-1 w-32 text-center">{PHARMACY.name}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Thermal Receipt Layout ───────────────────────────────────────────────────
function ThermalReceipt({ bill }) {
  const subtotal = Number(bill.grandTotal || 0) - Number(bill.gstTax || 0);
  const change = Math.max(0, Number(bill.paidAmount || 0) - Number(bill.grandTotal || 0));
  return (
    <div id="invoice-thermal" style={{ fontFamily: 'monospace', width: '302px', fontSize: '11px', color: '#000', padding: '8px', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: 1 }}>--- {PHARMACY.name.toUpperCase()} ---</div>
        <div style={{ fontSize: '9px' }}>{PHARMACY.address}</div>
        <div style={{ fontSize: '9px' }}>Ph: {PHARMACY.phone}</div>
        <div style={{ fontSize: '9px' }}>GST: {PHARMACY.gst} | DL: {PHARMACY.drugLicense}</div>
      </div>
      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill No:</span><span style={{ fontWeight: 700 }}>{bill.id}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date:</span><span>{formatDate(bill.createdAt)} {formatTime(bill.createdAt)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Customer:</span><span>{bill.patientName || 'Walk-in'}</span></div>
        {bill.mobileNumber && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mobile:</span><span>{bill.mobileNumber}</span></div>}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th style={{ textAlign: 'left', fontWeight: 700 }}>Medicine</th>
            <th style={{ textAlign: 'center', fontWeight: 700 }}>Qty</th>
            <th style={{ textAlign: 'right', fontWeight: 700 }}>Rate</th>
            <th style={{ textAlign: 'right', fontWeight: 700 }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
              <td style={{ padding: '2px 0' }}>{item.name}<br /><span style={{ fontSize: '9px' }}>Batch: {item.batchNumber || 'N/A'} | Exp: {formatExpiry(item.expiryDate)}</span></td>
              <td style={{ textAlign: 'center' }}>{item.qty}</td>
              <td style={{ textAlign: 'right' }}>₹{fmt(item.price)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{fmt(Number(bill.subtotal || 0) > 0 ? bill.subtotal : (Number(bill.grandTotal||0) - Number(bill.gstTax||0)))}</span></div>
        {Number(bill.discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>- ₹{fmt(bill.discount)}</span></div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST</span><span>₹{fmt(bill.gstTax)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '13px', borderTop: '1px dashed #000', paddingTop: '3px', marginTop: '3px' }}>
          <span>TOTAL</span><span>₹{fmt(bill.grandTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid ({bill.paymentMethod})</span><span>₹{fmt(bill.paidAmount)}</span></div>
        {change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Change</span><span>₹{fmt(change)}</span></div>}
      </div>
      <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '6px', fontSize: '10px' }}>
        <div style={{ fontWeight: 700 }}>THANK YOU! VISIT AGAIN</div>
        <div>Medicines once sold cannot be returned</div>
        <div>without valid reason.</div>
      </div>
    </div>
  );
}

// ─── Invoice Preview View (Main Component) ────────────────────────────────────
export default function InvoicePreviewView({ bill, payCash, payUPI, payCard, onNewBill, onPrint }) {
  const [printFormat, setPrintFormat] = useState('A4');
  const [localPrintCount, setLocalPrintCount] = useState(bill?.printCount || 0);
  const printRef = useRef(null);

  const handlePrint = useCallback(() => {
    if (!bill) return;
    const newCount = localPrintCount + 1;
    setLocalPrintCount(newCount);
    if (onPrint) onPrint(bill.id);

    if (printFormat === 'Thermal') {
      const thermalEl = document.getElementById('invoice-thermal');
      if (!thermalEl) return;
      const win = window.open('', '_blank', 'width=380,height=700');
      if (!win) { alert('Allow pop-ups to print the thermal receipt.'); return; }
      win.document.write(`
        <html><head><title>Thermal - ${bill.id}</title>
        <style>body{margin:0;padding:0;background:#fff;} @media print{body{margin:0;}}</style>
        </head><body>
        ${thermalEl.outerHTML}
        <script>window.onload=()=>{window.print();window.close();}<\/script>
        </body></html>
      `);
      win.document.close();
    } else {
      // A4 — use @media print CSS to hide UI, show only invoice
      window.print();
    }
  }, [bill, printFormat, localPrintCount, onPrint]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F8' || (e.ctrlKey && e.key === 'p') || e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'F5' || e.key === 'Escape') {
        e.preventDefault();
        onNewBill();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrint, onNewBill]);

  if (!bill) return null;

  return (
    <>
      {/* ── Global Print CSS ── hides everything except invoice on Ctrl+P */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-a4, #invoice-a4 * { visibility: visible !important; }
          #invoice-a4 { position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* ── Action Bar ── */}
        <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Invoice Ready — {bill.id}</h2>
              <p className="text-xs text-slate-400 font-medium">
                {bill.patientName || 'Walk-in'} &bull; ₹{fmt(bill.grandTotal)} &bull; {bill.paymentStatus}
                {localPrintCount > 0 && (
                  <span className="ml-2 bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                    <Repeat size={8} className="inline mr-0.5" />
                    {printCountLabel(localPrintCount)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              {['A4', 'Thermal'].map(f => (
                <button
                  key={f}
                  onClick={() => setPrintFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                    printFormat === f
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f === 'A4' ? '📄 A4' : '🧾 80mm'}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg transition"
            >
              <Printer size={16} /> Print Invoice
              <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded font-black">F8</span>
            </button>

            <button
              onClick={async () => {
                try {
                  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  const token = localStorage.getItem('pharmacy_token');
                  const res = await fetch(`${apiBase}/billing/bills/${bill.id}/pdf`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  
                  if (!res.ok) {
                    const text = await res.text();
                    console.error("PDF generation failed:", text);
                    let errMessage = 'Failed to generate PDF.';
                    try {
                      const json = JSON.parse(text);
                      if (json.message) errMessage += ` Backend says: ${json.message}`;
                    } catch (e) {
                      errMessage += ` Status: ${res.status}`;
                    }
                    throw new Error(errMessage);
                  }
                  
                  const blob = await res.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `Invoice_${bill.id}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                } catch (err) {
                  alert(err.message);
                }
              }}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
              title="Download as PDF"
            >
              <Download size={16} /> PDF
            </button>

            <button
              onClick={() => {
                const subject = encodeURIComponent(`Invoice ${bill.id} from ${PHARMACY.name}`);
                const body = encodeURIComponent(`Hi ${bill.patientName || 'Customer'},\n\nPlease find the details of your recent purchase.\nBill No: ${bill.id}\nAmount: ₹${Number(bill.grandTotal || 0).toFixed(2)}\n\nThank you for shopping with us!\n${PHARMACY.name}`);
                window.open(`mailto:${bill.mobileNumber ? bill.mobileNumber + '@sms.com' : ''}?subject=${subject}&body=${body}`, '_blank');
              }}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
              title="Send via Email"
            >
              <FileText size={16} /> Email
            </button>

            <button
              onClick={() => {
                const text = encodeURIComponent(`Hi ${bill.patientName || 'Customer'},\n\nYour bill ${bill.id} for ₹${Number(bill.grandTotal || 0).toFixed(2)} from ${PHARMACY.name} is ready.\nThank you!`);
                const phone = bill.mobileNumber ? `91${bill.mobileNumber}` : '';
                window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
              }}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
              title="Send via WhatsApp"
            >
              <MessageSquare size={16} /> WhatsApp
            </button>

            <button
              onClick={onNewBill}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl font-black text-sm transition"
            >
              <Plus size={16} /> New Bill
              <span className="bg-slate-300 text-[9px] px-1.5 py-0.5 rounded font-black">F5</span>
            </button>
          </div>
        </div>

        {/* ── Keyboard Shortcuts Help Bar ── */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center gap-6 text-[10px] text-blue-600 font-bold print:hidden">
          <span>⌨️ Keyboard Shortcuts:</span>
          <span className="bg-white border border-blue-200 px-2 py-0.5 rounded">F8</span> Print
          <span className="bg-white border border-blue-200 px-2 py-0.5 rounded">Ctrl+P</span> Print
          <span className="bg-white border border-blue-200 px-2 py-0.5 rounded">F5</span> New Bill
          <span className="bg-white border border-blue-200 px-2 py-0.5 rounded">ESC</span> New Bill
        </div>

        {/* ── Invoice Content ── */}
        <div ref={printRef} className="flex-1 p-6 overflow-y-auto">
          {printFormat === 'A4' ? (
            <A4Invoice bill={{ ...bill, printCount: localPrintCount }} payCash={payCash} payUPI={payUPI} payCard={payCard} />
          ) : (
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-dashed border-slate-200">
                <div className="text-center text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">80mm Thermal Preview</div>
                <ThermalReceipt bill={{ ...bill, printCount: localPrintCount }} />
              </div>
            </div>
          )}
        </div>

        {/* Hidden thermal element always in DOM for printing */}
        <div className="hidden print:hidden" aria-hidden>
          <ThermalReceipt bill={{ ...bill, printCount: localPrintCount }} />
        </div>
      </div>
    </>
  );
}
