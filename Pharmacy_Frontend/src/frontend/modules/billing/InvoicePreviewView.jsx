import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Printer, Download, MessageSquare, FileText, CheckCircle, Plus, Repeat } from 'lucide-react';

// ─── Pharmacy Config — update with real details ───────────────────────────────
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
const fmt   = (v) => Number(v || 0).toFixed(2);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

// ─── A4 Invoice — clean real Indian pharmacy bill ────────────────────────────
function A4Invoice({ bill, payCash, payUPI, payCard }) {
  const subtotal   = Number(bill.subtotal || 0) > 0
    ? Number(bill.subtotal)
    : Number(bill.grandTotal || 0) - Number(bill.gstTax || 0);
  const discount   = (bill.items || []).reduce(
    (s, i) => s + ((Number(i.price) * Number(i.qty)) - Number(i.total)), 0
  );
  const gst        = Number(bill.gstTax || 0);
  const grandTotal = Number(bill.grandTotal || 0);
  const paid       = Number(bill.paidAmount || 0);
  const change     = Math.max(0, paid - grandTotal);
  const balance    = Math.max(0, grandTotal - paid);

  // row style helpers
  const row = (label, value, bold = false, borderTop = false) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: borderTop ? '7px 0 3px' : '3px 0',
      borderTop: borderTop ? '1px solid #ddd' : 'none',
      fontSize: bold ? '13px' : '11px',
      fontWeight: bold ? '900' : '400',
    }}>
      <span>{label}</span>
      <span style={{ fontWeight: bold ? '900' : '600' }}>{value}</span>
    </div>
  );

  return (
    <div
      id="invoice-a4"
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        background: '#fff',
        color: '#000',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '10mm 14mm',
        boxSizing: 'border-box',
        fontSize: '11px',
        lineHeight: '1.6',
      }}
    >
      {/* ── Main content area pushes footer to bottom ── */}
      <div style={{ flex: 1 }}>
      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>
        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>{PHARMACY.name}</div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>{PHARMACY.address}</div>
        <div style={{ fontSize: '10px' }}>Ph: {PHARMACY.phone}</div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          <strong>GSTIN:</strong> {PHARMACY.gst} &nbsp;&nbsp;
          <strong>Drug Lic No:</strong> {PHARMACY.drugLicense}
        </div>
      </div>

      {/* ── BILL DETAILS ROW ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '8px' }}>
        {/* Left: Customer */}
        <div>
          <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '2px' }}>Customer</div>
          <div style={{ fontSize: '13px', fontWeight: '900' }}>{bill.patientName || 'Walk-in'}</div>
          {bill.mobileNumber && (
            <div style={{ fontSize: '10px' }}>Mob: {bill.mobileNumber}</div>
          )}
        </div>
        {/* Right: Invoice info */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>TAX INVOICE</div>
          <div style={{ fontSize: '13px', fontWeight: '900', marginTop: '1px' }}>{bill.id}</div>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            Date: {fmtDate(bill.createdAt)} &nbsp; Time: {fmtTime(bill.createdAt)}
          </div>
          <div style={{ fontSize: '10px' }}>
            Payment: <strong>{bill.paymentMethod || 'Cash'}</strong>
            &nbsp;|&nbsp;
            <strong style={{ textTransform: 'uppercase' }}>{bill.paymentStatus || 'PAID'}</strong>
          </div>
        </div>
      </div>

      {/* ── MEDICINE TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#000', color: '#fff' }}>
            <th style={{ padding: '6px 8px', textAlign: 'left',   fontWeight: '900', width: '24px' }}>#</th>
            <th style={{ padding: '6px 8px', textAlign: 'left',   fontWeight: '900' }}>Medicine Name</th>
            <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '900', width: '40px' }}>Qty</th>
            <th style={{ padding: '6px 8px', textAlign: 'right',  fontWeight: '900', width: '70px' }}>MRP / Unit</th>
            <th style={{ padding: '6px 8px', textAlign: 'right',  fontWeight: '900', width: '80px' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, idx) => (
            <tr
              key={idx}
              style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
            >
              <td style={{ padding: '5px 8px', color: '#999', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ padding: '5px 8px', fontWeight: '700' }}>
                {item.name}
                {Number(item.discount || 0) > 0 && (
                  <span style={{ fontSize: '9px', color: '#555', fontWeight: '400', marginLeft: '6px' }}>
                    (Disc {item.discount}%)
                  </span>
                )}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: '900' }}>{item.qty}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{fmt(item.price)}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '900' }}>₹{fmt(item.total)}</td>
            </tr>
          ))}
          {(!bill.items || bill.items.length === 0) && (
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>No items</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── TOTALS — single right-aligned box ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
        <div style={{ width: '240px', border: '1.5px solid #000', padding: '10px 12px' }}>
          {row('Sub Total', `₹${fmt(subtotal)}`)}
          {discount > 0 && row('Discount', `- ₹${fmt(discount)}`)}
          {row('GST', `₹${fmt(gst)}`)}
          {row('GRAND TOTAL', `₹${fmt(grandTotal)}`, true, true)}
          {/* Payment line(s) */}
          <div style={{ borderTop: '1px solid #ddd', marginTop: '5px', paddingTop: '5px' }}>
            {bill.paymentMethod?.includes('Cash') && row('Cash Paid', `₹${fmt(payCash || paid)}`)}
            {bill.paymentMethod?.includes('UPI')  && row('UPI Paid',  `₹${fmt(payUPI)}`)}
            {bill.paymentMethod?.includes('Card') && row('Card Paid', `₹${fmt(payCard)}`)}
            {change  > 0 && row('Change Returned', `₹${fmt(change)}`)}
            {balance > 0 && row('Balance Due',     `₹${fmt(balance)}`)}
          </div>
        </div>
      </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: '1.5px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '12px', marginBottom: '2px' }}>Thank You! Visit Again.</div>
          <div style={{ fontSize: '9px', color: '#666' }}>
            Medicines once sold cannot be returned without a valid reason.
          </div>
          <div style={{ fontSize: '9px', color: '#666' }}>
            This is a computer-generated bill. No signature required.
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          <div style={{ marginBottom: '28px' }}></div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '3px', width: '110px' }}>
            Authorized Signatory
          </div>
          <div style={{ fontWeight: '700' }}>{PHARMACY.name}</div>
        </div>
      </div>

    </div>
  );
}

// ─── Thermal Receipt — 80mm, no batch/expiry ─────────────────────────────────
function ThermalReceipt({ bill }) {
  const subtotal   = Number(bill.subtotal || 0) > 0 ? Number(bill.subtotal) : Number(bill.grandTotal || 0) - Number(bill.gstTax || 0);
  const discount   = (bill.items || []).reduce((s, i) => s + ((Number(i.price) * Number(i.qty)) - Number(i.total)), 0);
  const change     = Math.max(0, Number(bill.paidAmount || 0) - Number(bill.grandTotal || 0));
  const balance    = Math.max(0, Number(bill.grandTotal || 0) - Number(bill.paidAmount || 0));
  const s = { fontFamily: 'monospace', width: '302px', fontSize: '11px', color: '#000', padding: '8px 10px', background: '#fff' };

  return (
    <div id="invoice-thermal" style={s}>
      {/* Store header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px' }}>{PHARMACY.name.toUpperCase()}</div>
        <div style={{ fontSize: '9px', marginTop: '2px' }}>{PHARMACY.address}</div>
        <div style={{ fontSize: '9px' }}>Ph: {PHARMACY.phone}</div>
        <div style={{ fontSize: '9px' }}>GST: {PHARMACY.gst}</div>
        <div style={{ fontSize: '9px' }}>DL: {PHARMACY.drugLicense}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill No :</span><span style={{ fontWeight: '700' }}>{bill.id}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date    :</span><span>{fmtDate(bill.createdAt)} {fmtTime(bill.createdAt)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Customer:</span><span>{bill.patientName || 'Walk-in'}</span></div>
        {bill.mobileNumber && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mobile  :</span><span>{bill.mobileNumber}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment :</span><span style={{ fontWeight: '700' }}>{bill.paymentMethod || 'Cash'}</span></div>
      </div>

      {/* Items — no batch/expiry shown to customer */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th style={{ textAlign: 'left', fontWeight: '700', paddingBottom: '3px' }}>Medicine</th>
            <th style={{ textAlign: 'center', fontWeight: '700', width: '28px' }}>Qty</th>
            <th style={{ textAlign: 'right',  fontWeight: '700', width: '52px' }}>Rate</th>
            <th style={{ textAlign: 'right',  fontWeight: '700', width: '52px' }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
              <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                <div>{item.name}</div>
                {item.discount > 0 && <div style={{ fontSize: '9px', color: '#555' }}>Disc: {item.discount}% | GST: {item.gstRate || 0}%</div>}
              </td>
              <td style={{ textAlign: 'center', verticalAlign: 'top', padding: '3px 0' }}>{item.qty}</td>
              <td style={{ textAlign: 'right',  verticalAlign: 'top', padding: '3px 0' }}>₹{fmt(item.price)}</td>
              <td style={{ textAlign: 'right',  verticalAlign: 'top', padding: '3px 0', fontWeight: '700' }}>₹{fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginBottom: '6px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Subtotal</span><span>₹{fmt(subtotal)}</span></div>
        {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Discount</span><span>- ₹{fmt(discount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>GST</span><span>₹{fmt(bill.gstTax)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
          <span>TOTAL</span><span>₹{fmt(bill.grandTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}><span>Paid ({bill.paymentMethod})</span><span style={{ fontWeight: '700' }}>₹{fmt(bill.paidAmount)}</span></div>
        {change  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}><span>Change</span><span>₹{fmt(change)}</span></div>}
        {balance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}><span>Balance Due</span><span>₹{fmt(balance)}</span></div>}
      </div>

      <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '6px', fontSize: '10px' }}>
        <div style={{ fontWeight: '900', marginBottom: '2px' }}>THANK YOU! VISIT AGAIN</div>
        <div>Medicines once sold cannot be returned</div>
        <div>without a valid reason.</div>
      </div>
    </div>
  );
}

// ─── Main Invoice Preview ─────────────────────────────────────────────────────
export default function InvoicePreviewView({ bill, payCash, payUPI, payCard, onNewBill, onPrint }) {
  const [printFormat, setPrintFormat]       = useState('A4');
  const [localPrintCount, setLocalPrintCount] = useState(bill?.printCount || 0);
  const [pdfLoading, setPdfLoading]         = useState(false);

  // ── Print: opens browser print dialog showing only the invoice ───────────
  const handlePrint = useCallback(() => {
    if (!bill) return;
    setLocalPrintCount(c => c + 1);
    if (onPrint) onPrint(bill.id);

    if (printFormat === 'Thermal') {
      const el = document.getElementById('invoice-thermal');
      if (!el) return;
      const win = window.open('', '_blank', 'width=400,height=700');
      if (!win) { alert('Allow pop-ups to print.'); return; }
      win.document.write(`
        <html><head><title>${bill.id}</title>
        <style>
          body { margin:0; padding:0; background:#fff; }
          @page { size: 80mm auto; margin: 0; }
          @media print { body { margin: 0; } }
        </style></head>
        <body>${el.outerHTML}
        <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>
        </body></html>
      `);
      win.document.close();
    } else {
      window.print();
    }
  }, [bill, printFormat, onPrint]);

  // ── PDF: captures the rendered invoice div as PDF via print dialog ────────
  // No backend call — what you see is what you download
  const handleDownloadPDF = useCallback(() => {
    if (!bill || pdfLoading) return;
    setPdfLoading(true);

    const invoiceEl = document.getElementById(
      printFormat === 'Thermal' ? 'invoice-thermal' : 'invoice-a4'
    );
    if (!invoiceEl) { setPdfLoading(false); return; }

    // Open a clean window with just the invoice, trigger print-to-PDF
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Please allow pop-ups to download PDF.');
      setPdfLoading(false);
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map(ss => {
        try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); }
        catch { return ''; }
      })
      .join('\n');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice_${bill.id}</title>
        <style>
          ${styles}
          body { margin: 0; padding: 0; background: #fff; }
          @page { size: A4; margin: 0; }
          @media print {
            body { margin: 0; }
            button, .print\\:hidden { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${invoiceEl.outerHTML}
        <script>
          window.onload = function() {
            document.title = 'Invoice_${bill.id}';
            window.print();
            setTimeout(() => window.close(), 1000);
          };
        <\/script>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => setPdfLoading(false), 1500);
  }, [bill, printFormat, pdfLoading]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F8' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault(); handlePrint();
      } else if (e.key === 'F5' || e.key === 'Escape') {
        e.preventDefault(); onNewBill();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrint, onNewBill]);

  if (!bill) return null;

  const billForRender = { ...bill, printCount: localPrintCount };

  return (
    <>
      {/* Print CSS — hides everything except invoice */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-a4, #invoice-a4 * { visibility: visible !important; }
          #invoice-a4 {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 flex flex-col">

        {/* ── Action Bar ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden sticky top-0 z-20 shadow-sm">

          {/* Left: bill info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <CheckCircle className="text-emerald-600" size={22} />
            </div>
            <div>
              <div className="font-black text-slate-800 text-base">{bill.id}</div>
              <div className="text-xs text-slate-400 font-medium">
                {bill.patientName || 'Walk-in'} &bull; ₹{fmt(bill.grandTotal)} &bull; {bill.paymentStatus}
                {localPrintCount > 0 && (
                  <span className="ml-2 bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                    <Repeat size={8} className="inline mr-0.5" />
                    Printed {localPrintCount}x
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">

            {/* Format toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mr-1">
              {[['A4','📄 A4'], ['Thermal','🧾 80mm']].map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setPrintFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    printFormat === f ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >{label}</button>
              ))}
            </div>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
            >
              <Printer size={15} /> Print
              <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded">F8</span>
            </button>

            {/* PDF Download — captures screen, no backend */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
              title="Download what you see as PDF"
            >
              <Download size={15} />
              {pdfLoading ? 'Preparing…' : 'PDF'}
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `Hi ${bill.patientName || 'Customer'},\nYour bill ${bill.id} for ₹${fmt(bill.grandTotal)} from ${PHARMACY.name} is ready.\nThank you!`
                );
                const phone = bill.mobileNumber ? `91${bill.mobileNumber}` : '';
                window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
              }}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
            >
              <MessageSquare size={15} /> WhatsApp
            </button>

            {/* Email */}
            <button
              onClick={() => {
                const sub  = encodeURIComponent(`Invoice ${bill.id} — ${PHARMACY.name}`);
                const body = encodeURIComponent(`Hi ${bill.patientName || 'Customer'},\n\nBill No: ${bill.id}\nAmount: ₹${fmt(bill.grandTotal)}\n\nThank you!\n${PHARMACY.name}`);
                window.open(`mailto:?subject=${sub}&body=${body}`, '_blank');
              }}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-black text-sm transition"
            >
              <FileText size={15} /> Email
            </button>

            {/* New Bill */}
            <button
              onClick={onNewBill}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-black text-sm transition"
            >
              <Plus size={15} /> New Bill
              <span className="bg-slate-300 text-[9px] px-1.5 py-0.5 rounded">F5</span>
            </button>
          </div>
        </div>

        {/* ── Shortcut hint ── */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-1.5 flex items-center gap-5 text-[10px] text-slate-500 font-bold print:hidden">
          <span>Shortcuts:</span>
          <span><kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[9px]">F8</kbd> Print</span>
          <span><kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[9px]">Ctrl+P</kbd> Print</span>
          <span><kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[9px]">F5 / ESC</kbd> New Bill</span>
        </div>

        {/* ── Invoice content ── */}
        <div className="flex-1 p-8 overflow-y-auto flex justify-center">
          {printFormat === 'A4' ? (
            <div className="shadow-2xl border border-slate-200">
              <A4Invoice bill={billForRender} payCash={payCash} payUPI={payUPI} payCard={payCard} />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-dashed border-slate-200 inline-block">
                <div className="text-center text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest">
                  80mm Thermal Preview
                </div>
                <ThermalReceipt bill={billForRender} />
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
