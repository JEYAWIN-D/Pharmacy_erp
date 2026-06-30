import React from 'react';
import { DollarSign, History } from 'lucide-react';
import DataTable from './components/DataTable';

export default function SupplierPriceList({ controller }) {
  const { priceHistory } = controller;

  const columns = [
    { key: 'date', header: 'Date', accessor: 'createdAt', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'medicine', header: 'Medicine', accessor: 'medicineName', render: (row) => <span className="font-semibold text-blue-600">{row.medicineName || 'General'}</span> },
    { key: 'price', header: 'Price', accessor: 'purchasePrice', align: 'right', render: (row) => <span className="font-mono font-bold text-slate-700">₹{parseFloat(row.purchasePrice).toFixed(2)}</span> },
    { key: 'discount', header: 'Discount', accessor: 'discount', align: 'right', render: (row) => <span className="font-mono text-emerald-600">{row.discount}%</span> },
    { key: 'scheme', header: 'Scheme', accessor: 'scheme', render: (row) => <span className="text-[10px] text-slate-500">{row.scheme || '—'}</span> },
    { key: 'reason', header: 'Change Reason', accessor: 'changeReason', render: (row) => <span className="text-[10px] text-slate-500">{row.changeReason}</span> },
    { key: 'changedBy', header: 'Changed By', accessor: 'changedBy', render: (row) => <span className="text-[10px] text-slate-500">{row.changedBy}</span> }
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <DollarSign size={16} className="text-teal-600" />
            </div>
            Price List & History
          </h2>
          <p className="text-xs text-slate-400 mt-1">Immutable log of all supplier price changes</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl flex items-start gap-3 text-xs">
        <History size={16} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block mb-0.5">Immutable Price History</span>
          Records in this table cannot be edited or deleted. It serves as an audit trail for all procurement pricing changes over time.
        </div>
      </div>

      <DataTable columns={columns} data={priceHistory} searchPlaceholder="Search price history..." pageSize={15} />
    </div>
  );
}
