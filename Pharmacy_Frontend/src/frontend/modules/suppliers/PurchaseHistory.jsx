import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import DataTable from './components/DataTable';

export default function PurchaseHistory({ controller }) {
  const { invoices, purchaseOrders, suppliers } = controller;
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [viewMode, setViewMode] = useState('invoices'); // 'invoices' or 'pos'

  const filteredInvoices = useMemo(() => {
    return selectedSupplier ? invoices.filter(i => i.supplierId === selectedSupplier) : invoices;
  }, [invoices, selectedSupplier]);

  const filteredPOs = useMemo(() => {
    return selectedSupplier ? purchaseOrders.filter(p => p.supplierId === selectedSupplier) : purchaseOrders;
  }, [purchaseOrders, selectedSupplier]);

  const invColumns = [
    { key: 'date', header: 'Date', accessor: 'date', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.date).toLocaleDateString()}</span> },
    { key: 'invNum', header: 'Invoice No', accessor: 'invoiceNumber', render: (row) => <span className="font-mono font-bold text-slate-700">{row.invoiceNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'amount', header: 'Amount', accessor: 'amount', align: 'right', render: (row) => <span className="font-mono font-bold text-slate-700">₹{parseFloat(row.amount).toFixed(2)}</span> },
    { key: 'status', header: 'Status', render: (row) => {
      const colors = {
        'Paid': 'bg-emerald-50 text-emerald-700',
        'Unpaid': 'bg-rose-50 text-rose-700',
        'Partially Paid': 'bg-amber-50 text-amber-700'
      };
      const color = colors[row.status] || 'bg-slate-50 text-slate-700';
      return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color}`}>{row.status}</span>;
    }}
  ];

  const poColumns = [
    { key: 'date', header: 'Date', accessor: 'orderDate', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.orderDate || row.createdAt).toLocaleDateString()}</span> },
    { key: 'poNum', header: 'PO No', accessor: 'id', render: (row) => <span className="font-mono font-bold text-slate-700">PO-{row.id.toString().slice(-6).toUpperCase()}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'total', header: 'Total Value', accessor: 'total', align: 'right', render: (row) => <span className="font-mono font-bold text-slate-700">₹{parseFloat(row.total || 0).toFixed(2)}</span> },
    { key: 'status', header: 'Status', render: (row) => {
      const colors = {
        'Completed': 'bg-emerald-50 text-emerald-700',
        'Pending': 'bg-amber-50 text-amber-700',
        'Draft': 'bg-slate-100 text-slate-500',
        'Cancelled': 'bg-rose-50 text-rose-700'
      };
      const color = colors[row.status] || 'bg-slate-50 text-slate-700';
      return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color}`}>{row.status || 'Draft'}</span>;
    }}
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-pink-50 flex items-center justify-center">
              <ShoppingBag size={16} className="text-pink-600" />
            </div>
            Purchase History
          </h2>
          <p className="text-xs text-slate-400 mt-1">View Purchase Orders (PO) and Goods Receipt Invoices (GRN)</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('invoices')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'invoices' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Invoices (GRN)</button>
          <button onClick={() => setViewMode('pos')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'pos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Purchase Orders</button>
        </div>
        
        <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {viewMode === 'invoices' ? (
        <DataTable columns={invColumns} data={filteredInvoices} searchPlaceholder="Search invoices..." />
      ) : (
        <DataTable columns={poColumns} data={filteredPOs} searchPlaceholder="Search POs..." />
      )}
    </div>
  );
}
