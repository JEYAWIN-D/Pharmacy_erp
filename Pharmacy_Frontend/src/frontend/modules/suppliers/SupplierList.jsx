import React, { useState, useMemo } from 'react';
import { Plus, Eye, Edit3, Trash2, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import DataTable from './components/DataTable';
import ExportButton from './components/ExportButton';
import ConfirmDialog from './components/ConfirmDialog';
import LoadingSkeleton from './components/LoadingSkeleton';

export default function SupplierList({ controller, onAdd, onEdit, onView, addToast }) {
  const { suppliers, loading, deleteSupplier, toggleSupplierStatus, toggleSupplierPreferred, exportCSV } = controller;
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return suppliers;
    if (statusFilter === 'Active') return suppliers.filter(s => s.isActive);
    if (statusFilter === 'Inactive') return suppliers.filter(s => !s.isActive);
    if (statusFilter === 'Preferred') return suppliers.filter(s => s.isPreferred);
    if (statusFilter === 'Blacklisted') return suppliers.filter(s => s.status === 'Blacklisted');
    return suppliers;
  }, [suppliers, statusFilter]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSupplier(confirmDelete.id);
      addToast('Supplier deleted successfully', 'success');
    } catch (err) {
      addToast('Failed to delete supplier', 'error');
    }
    setConfirmDelete(null);
  };

  const handleToggleStatus = async (supplier) => {
    try {
      await toggleSupplierStatus(supplier.id, !supplier.isActive);
      addToast(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleTogglePreferred = async (supplier) => {
    try {
      await toggleSupplierPreferred(supplier.id, !supplier.isPreferred);
      addToast(`Supplier ${supplier.isPreferred ? 'removed from' : 'added to'} preferred`, 'success');
    } catch (err) {
      addToast('Failed to update', 'error');
    }
  };

  const columns = [
    { key: 'code', header: 'Code', accessor: 'code', width: '90px', render: (row) => (
      <span className="font-mono text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">{row.code}</span>
    )},
    { key: 'name', header: 'Supplier Name', accessor: 'name', render: (row) => (
      <div>
        <span className="font-bold text-slate-800 text-xs">{row.name}</span>
        {row.isPreferred && <Star size={10} className="inline ml-1 text-amber-500 fill-amber-500" />}
        <span className="block text-[10px] text-slate-400">{row.supplierType || 'Distributor'}</span>
      </div>
    )},
    { key: 'contact', header: 'Contact', accessor: 'contactPerson', render: (row) => (
      <div className="text-xs">
        <span className="font-semibold text-slate-700">{row.contactPerson || 'N/A'}</span>
        <span className="block text-[10px] text-slate-400 font-mono">{row.phone || 'N/A'}</span>
      </div>
    )},
    { key: 'gst', header: 'GST', accessor: 'gstNumber', render: (row) => (
      <span className="text-[10px] font-mono text-slate-600">{row.gstNumber || '—'}</span>
    )},
    { key: 'city', header: 'City', accessor: 'addressCity', render: (row) => (
      <span className="text-xs text-slate-600">{row.addressCity || '—'}, {row.addressState || ''}</span>
    )},
    { key: 'credit', header: 'Credit Limit', accessor: 'creditLimit', align: 'right', render: (row) => (
      <span className="text-xs font-mono font-bold text-slate-700">₹{parseFloat(row.creditLimit || 0).toLocaleString()}</span>
    )},
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
        row.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
      }`}>
        {row.status || (row.isActive ? 'Active' : 'Inactive')}
      </span>
    )},
    { key: 'actions', header: 'Actions', sortable: false, width: '160px', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); onView(row); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition cursor-pointer" title="View">
          <Eye size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition cursor-pointer" title="Edit">
          <Edit3 size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleTogglePreferred(row); }} className={`p-1.5 rounded-lg transition cursor-pointer ${row.isPreferred ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:bg-slate-50'}`} title="Toggle Preferred">
          <Star size={13} className={row.isPreferred ? 'fill-amber-500' : ''} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }} className="p-1.5 hover:bg-slate-50 rounded-lg transition cursor-pointer" title="Toggle Status">
          {row.isActive ? <ToggleRight size={15} className="text-emerald-500" /> : <ToggleLeft size={15} className="text-slate-400" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    )}
  ];

  if (loading) return <LoadingSkeleton rows={8} cols={7} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Supplier Master</h2>
          <p className="text-xs text-slate-400">{filtered.length} suppliers found</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            {['All', 'Active', 'Inactive', 'Preferred', 'Blacklisted'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${statusFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                {f}
              </button>
            ))}
          </div>
          <ExportButton onExportCSV={() => exportCSV()} />
          <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer">
            <Plus size={14} /> Add Supplier
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} searchPlaceholder="Search by name, code, GST, contact..." onRowClick={onView} pageSize={12} />

      <ConfirmDialog isOpen={!!confirmDelete} title="Delete Supplier" message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
