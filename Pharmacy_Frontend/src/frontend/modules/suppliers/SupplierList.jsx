import React, { useState, useMemo } from 'react';
import { Plus, Eye, Edit3, Trash2, Star, ToggleLeft, ToggleRight, Filter, X, Pill, Tag, Calendar, DollarSign, RotateCcw } from 'lucide-react';
import DataTable from './components/DataTable';
import ExportButton from './components/ExportButton';
import ConfirmDialog from './components/ConfirmDialog';
import LoadingSkeleton from './components/LoadingSkeleton';
import { useDB } from '../../db/DBContext';
import { SupplierModel } from './SupplierModel';

export default function SupplierList({ controller, onAdd, onEdit, onView, addToast }) {
  const {
    suppliers, loading, deleteSupplier, toggleSupplierStatus, toggleSupplierPreferred,
    exportCSV, purchaseTerms, brandMappings, medicinesList, categories
  } = controller;

  const { supplierMappings } = useDB();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // ── Advanced Filters state ───────────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [medFilter, setMedFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minCredit, setMinCredit] = useState('');
  const [maxCredit, setMaxCredit] = useState('');

  // ── Reset handler ────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setMedFilter('');
    setCatFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setMinCredit('');
    setMaxCredit('');
  };

  // ── Filter logic ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = suppliers;

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') result = result.filter(s => s.isActive);
      else if (statusFilter === 'Inactive') result = result.filter(s => !s.isActive);
      else if (statusFilter === 'Preferred') result = result.filter(s => s.isPreferred);
      else if (statusFilter === 'Blacklisted') result = result.filter(s => s.status === 'Blacklisted');
    }

    // Medicine filter
    if (medFilter) {
      result = result.filter(s => {
        const hasTerm = purchaseTerms.some(t => t.supplierId === s.id && t.medicineId === medFilter);
        if (hasTerm) return true;
        const hasBrand = brandMappings.some(b => b.supplierId === s.id && b.medicineId === medFilter);
        if (hasBrand) return true;
        const hasMapping = supplierMappings.some(m => m.supplierId === s.id && m.medicineId === medFilter);
        if (hasMapping) return true;
        const hasMaster = medicinesList.some(m => m.id === medFilter && m.supplierId === s.id);
        if (hasMaster) return true;
        return false;
      });
    }

    // Category filter
    if (catFilter) {
      result = result.filter(s => {
        return categories.some(c => c.supplierId === s.id && c.categoryName.toLowerCase() === catFilter.toLowerCase());
      });
    }

    // Type filter
    if (typeFilter) {
      result = result.filter(s => {
        const supplierMappingIds = new Set(
          (controller.medicineMappings || [])
            .filter(m => m.supplierId === s.id)
            .map(m => m.medicineId)
        );
        return medicinesList.some(med => 
          supplierMappingIds.has(med.id) && 
          (med.medicineType === typeFilter || med.typeId === typeFilter || (med.medicineType && typeof med.medicineType === 'object' && med.medicineType.id === typeFilter))
        );
      });
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(s => new Date(s.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(s => new Date(s.createdAt) <= end);
    }

    // Credit limit / price filter
    if (minCredit) {
      result = result.filter(s => parseFloat(s.creditLimit || 0) >= parseFloat(minCredit));
    }
    if (maxCredit) {
      result = result.filter(s => parseFloat(s.creditLimit || 0) <= parseFloat(maxCredit));
    }

    return result;
  }, [
    suppliers, statusFilter, medFilter, catFilter, typeFilter, startDate, endDate, minCredit, maxCredit,
    purchaseTerms, brandMappings, supplierMappings, medicinesList, categories, controller.medicineMappings
  ]);

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

  const { medicineTypes } = useDB();

  if (loading) return <LoadingSkeleton rows={8} cols={7} />;

  const hasActiveFilters = medFilter || catFilter || typeFilter || startDate || endDate || minCredit || maxCredit;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 text-left">Supplier Master</h2>
          <p className="text-xs text-slate-400 text-left">{filtered.length} suppliers found</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            {['All', 'Active', 'Inactive', 'Preferred', 'Blacklisted'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${statusFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition cursor-pointer ${
              showAdvanced || hasActiveFilters
                ? 'border-blue-200 bg-blue-50 text-blue-700 font-extrabold shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={13} /> Filters
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-blue-600" />}
          </button>

          <ExportButton onExportCSV={() => exportCSV()} />

          <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer">
            <Plus size={14} /> Add Supplier
          </button>
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {showAdvanced && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in-down">
          {/* Medicine Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Pill size={10} className="text-slate-400" /> Filter by Medicine
            </label>
            <select
              value={medFilter}
              onChange={e => setMedFilter(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">All Medicines</option>
              {medicinesList.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag size={10} className="text-slate-400" /> Filter by Category
            </label>
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => c.name || c.categoryName || c).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Medicine Type Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Pill size={10} className="text-slate-400" /> Filter by Medicine Type
            </label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">All Types</option>
              {medicineTypes.map(t => (
                <option key={t.id || t.name} value={t.id || t.name}>{t.name || t}</option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar size={10} className="text-slate-400" /> Registration Date Range
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="From"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="To"
              />
            </div>
          </div>

          {/* Price/Credit limit filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <DollarSign size={10} className="text-slate-400" /> Credit Limit Range
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={minCredit}
                onChange={e => setMinCredit(e.target.value)}
                placeholder="Min Limit"
                className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="number"
                value={maxCredit}
                onChange={e => setMaxCredit(e.target.value)}
                placeholder="Max Limit"
                className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer font-bold"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      <DataTable columns={columns} data={filtered} searchPlaceholder="Search by name, code, GST, contact..." onRowClick={onView} pageSize={12} />

      <ConfirmDialog isOpen={!!confirmDelete} title="Delete Supplier" message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
