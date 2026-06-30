import React, { useState, useMemo } from 'react';
import { ClipboardList, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DataTable from './components/DataTable';

export default function SupplierLedgerView({ controller }) {
  const { ledger, suppliers } = controller;
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const filteredLedger = useMemo(() => {
    let data = selectedSupplier ? ledger.filter(l => l.supplierId === selectedSupplier) : ledger;
    // Sort oldest first to calculate running balance
    data = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningBalance = 0;
    const withBalance = data.map(entry => {
      // Logic: Invoices increase payable (balance), Payments/Returns decrease payable
      const isCredit = ['Payment', 'Return', 'CreditNote'].includes(entry.type);
      const amount = parseFloat(entry.amount);
      if (isCredit) runningBalance -= amount;
      else runningBalance += amount;
      
      return { ...entry, runningBalance };
    });
    
    // Reverse to show newest first
    return withBalance.reverse();
  }, [ledger, selectedSupplier]);

  const columns = [
    { key: 'date', header: 'Date', accessor: 'date', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.date).toLocaleDateString()}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'type', header: 'Tx Type', render: (row) => {
      const isCredit = ['Payment', 'Return', 'CreditNote'].includes(row.type);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase ${isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {isCredit ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
          {row.type}
        </span>
      );
    }},
    { key: 'remarks', header: 'Particulars / Remarks', accessor: 'remarks', render: (row) => <span className="text-xs text-slate-600">{row.remarks}</span> },
    { key: 'amount', header: 'Amount', accessor: 'amount', align: 'right', render: (row) => {
      const isCredit = ['Payment', 'Return', 'CreditNote'].includes(row.type);
      return <span className={`font-mono font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>{isCredit ? '-' : '+'}₹{parseFloat(row.amount).toFixed(2)}</span>;
    }},
    { key: 'balance', header: 'Running Balance', accessor: 'runningBalance', align: 'right', render: (row) => (
      <span className={`font-mono font-bold ${row.runningBalance > 0 ? 'text-rose-600' : row.runningBalance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
        ₹{Math.abs(row.runningBalance).toFixed(2)} {row.runningBalance > 0 ? 'Cr' : row.runningBalance < 0 ? 'Dr' : ''}
      </span>
    )}
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <ClipboardList size={16} className="text-slate-600" />
            </div>
            Supplier Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">Complete statement of account (Invoices, Payments, Returns, Credit Notes)</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Supplier for Statement</label>
          <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full md:w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
            <option value="">All Suppliers (Combined Ledger)</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {selectedSupplier && filteredLedger.length > 0 && (
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Outstanding</span>
            <span className="text-xl font-black text-rose-600 font-mono">₹{Math.abs(filteredLedger[0].runningBalance).toFixed(2)} Cr</span>
          </div>
        )}
      </div>

      <DataTable columns={columns} data={filteredLedger} searchPlaceholder="Search transactions..." pageSize={15} />
    </div>
  );
}
