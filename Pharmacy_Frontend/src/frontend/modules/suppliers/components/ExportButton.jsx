import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

export default function ExportButton({ onExportPDF, onExportExcel, onExportCSV }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase transition cursor-pointer"
      >
        <Download size={12} /> Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 min-w-[140px] animate-fade-in-up">
          {onExportPDF && (
            <button onClick={() => { onExportPDF(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              <FileText size={12} className="text-rose-500" /> PDF
            </button>
          )}
          {onExportExcel && (
            <button onClick={() => { onExportExcel(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              <FileSpreadsheet size={12} className="text-emerald-500" /> Excel
            </button>
          )}
          {onExportCSV && (
            <button onClick={() => { onExportCSV(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              <FileSpreadsheet size={12} className="text-blue-500" /> CSV
            </button>
          )}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
