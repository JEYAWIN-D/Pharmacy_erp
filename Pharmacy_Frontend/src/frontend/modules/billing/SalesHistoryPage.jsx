import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, Download, Printer, Trash2, CheckSquare, Square,
  ChevronLeft, ChevronRight, Eye, X, Calendar, CreditCard,
  User, Phone, Package, AlertCircle, FileText, RefreshCw
} from 'lucide-react';
import { salesHistoryAPI, billingAPI } from '../../db/api';
import BillDetailModal from './BillDetailModal';


const fmt = (v) => Number(v || 0).toFixed(2);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const fmtExpiry = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};



// ─── Main Sales History Page ──────────────────────────────────────────────────
export default function SalesHistoryPage({ role }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Modals
  const [viewBill, setViewBill] = useState(null);

  // Debounce timer
  const searchTimer = useRef(null);

  const fetchBills = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        pageSize: 20,
        ...(filters.search && { search: filters.search }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
      };
      const res = await salesHistoryAPI.getHistory(params);
      if (res && res.success) {
        setBills(res.data || []);
        setPagination(res.pagination || { page, pageSize: 20, total: 0, totalPages: 1 });
        setSelected(new Set());
      } else {
        setError('Failed to load sales history');
      }
    } catch (err) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills(1, { search, fromDate, toDate, paymentMethod });
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchBills(1, { search: value, fromDate, toDate, paymentMethod });
    }, 400);
  };

  const applyFilters = () => {
    fetchBills(1, { search, fromDate, toDate, paymentMethod });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearch(''); setFromDate(''); setToDate(''); setPaymentMethod('');
    fetchBills(1, {});
    setShowFilters(false);
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchBills(page, { search, fromDate, toDate, paymentMethod });
  };

  // Selection logic
  const toggleAll = () => {
    if (selected.size === bills.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bills.map(b => b.id)));
    }
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // Bulk export as CSV
  const exportCSV = (billsList) => {
    const rows = [
      ['Bill No', 'Patient', 'Mobile', 'Date', 'Payment', 'Status', 'Grand Total', 'Paid'],
      ...billsList.map(b => [
        b.id, b.patientName || 'Walk-in', b.mobileNumber || '',
        fmtDate(b.createdAt), b.paymentMethod || 'Cash',
        b.paymentStatus || '', Number(b.grandTotal || 0).toFixed(2),
        Number(b.paidAmount || 0).toFixed(2)
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk print selected
  const printSelected = () => {
    const selectedBills = bills.filter(b => selected.has(b.id));
    if (selectedBills.length === 0) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Allow pop-ups to print.'); return; }
    const rows = selectedBills.map(b => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${b.id}</td>
        <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${b.patientName || 'Walk-in'}</td>
        <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${b.mobileNumber || '—'}</td>
        <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${fmtDate(b.createdAt)}</td>
        <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${b.paymentMethod || 'Cash'}</td>
        <td style="padding:8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:900;">₹${Number(b.grandTotal||0).toFixed(2)}</td>
      </tr>
    `).join('');
    win.document.write(`<html><head><title>Sales Summary</title><style>body{font-family:sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th{background:#1e293b;color:#fff;padding:10px;text-align:left}@media print{body{margin:0}}</style></head><body><h2>Sales History Report — ${new Date().toLocaleDateString('en-IN')}</h2><table><thead><tr><th>Bill No</th><th>Patient</th><th>Mobile</th><th>Date</th><th>Payment</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  };

  // Bulk delete (admin only)
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected bill(s)? This action cannot be undone.`)) return;
    try {
      const res = await billingAPI.bulkDeleteBills(Array.from(selected));
      if (res && res.success) {
        fetchBills(pagination.page, { search, fromDate, toDate, paymentMethod });
      } else {
        alert('Delete failed: ' + (res?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const activeFiltersCount = [fromDate, toDate, paymentMethod].filter(Boolean).length;

  return (
    <>
      {viewBill && <BillDetailModal bill={viewBill} onClose={() => setViewBill(null)} role={role} />}

      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sales History</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {pagination.total} total bills • Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchBills(pagination.page, { search, fromDate, toDate, paymentMethod })}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => exportCSV(bills)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Bill No, Patient Name, Mobile, or Medicine..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition border ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Filter size={14} /> Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {(search || activeFiltersCount > 0) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-sm transition"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash+UPI">Cash + UPI</option>
                  <option value="Cash+Card">Cash + Card</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={clearFilters} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm">Reset</button>
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selected.size > 0 && (
          <div className="bg-blue-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg">
            <span className="font-black text-sm">{selected.size} bill(s) selected</span>
            <div className="flex-1 flex gap-2">
              <button
                onClick={printSelected}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition"
              >
                <Printer size={14} /> Print Selected
              </button>
              <button
                onClick={() => exportCSV(bills.filter(b => selected.has(b.id)))}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition"
              >
                <Download size={14} /> Export Selected
              </button>
              {(role === 'Admin' || role === 'System Admin') && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-sm transition ml-auto"
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              )}
            </div>
            <button
              onClick={() => setSelected(new Set())}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading sales history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-rose-500">
                <AlertCircle size={36} />
                <p className="font-bold text-sm">{error}</p>
                <button
                  onClick={() => fetchBills(1, {})}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold text-xs transition"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="p-4 bg-slate-100 rounded-full mb-3"><Search size={32} className="text-slate-300" /></div>
              <p className="font-bold text-lg">No sales records found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-800 text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-10">
                        <button onClick={toggleAll} className="flex items-center justify-center">
                          {selected.size === bills.length
                            ? <CheckSquare size={16} className="text-blue-300" />
                            : <Square size={16} className="text-slate-400" />
                          }
                        </button>
                      </th>
                      <th className="p-3 text-left font-black text-xs">Bill No</th>
                      <th className="p-3 text-left font-black text-xs">Patient Name</th>
                      <th className="p-3 text-left font-black text-xs">Mobile</th>
                      <th className="p-3 text-center font-black text-xs">Date & Time</th>
                      <th className="p-3 text-center font-black text-xs">Items</th>
                      <th className="p-3 text-center font-black text-xs">Payment</th>
                      <th className="p-3 text-center font-black text-xs">Status</th>
                      <th className="p-3 text-right font-black text-xs">Amount</th>
                      <th className="p-3 text-center font-black text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((bill, idx) => {
                      const billDate = bill.createdAt ? new Date(bill.createdAt) : null;
                      const isSelected = selected.has(bill.id);
                      return (
                        <tr
                          key={bill.id}
                          className={`transition ${isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/50`}
                        >
                          <td className="p-3 text-center">
                            <button onClick={() => toggleOne(bill.id)} className="flex items-center justify-center">
                              {isSelected
                                ? <CheckSquare size={16} className="text-blue-600" />
                                : <Square size={16} className="text-slate-300" />
                              }
                            </button>
                          </td>
                          <td className="p-3">
                            <span className="font-black text-blue-700 font-mono text-xs">{bill.id}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="font-bold text-slate-800">{bill.patientName || 'Walk-in'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {bill.mobileNumber ? (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Phone size={11} className="flex-shrink-0" />
                                <span className="font-medium text-xs">{bill.mobileNumber}</span>
                              </div>
                            ) : <span className="text-slate-300 font-medium text-xs">—</span>}
                          </td>
                          <td className="p-3 text-center">
                            {billDate ? (
                              <div>
                                <div className="font-bold text-slate-700 text-xs">{fmtDate(bill.createdAt)}</div>
                                <div className="text-slate-400 text-[10px]">{fmtTime(bill.createdAt)}</div>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                              {bill._count?.items ?? (bill.items || []).length} item{(bill._count?.items ?? 0) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px] px-2 py-0.5 rounded-full">
                              {bill.paymentMethod || 'Cash'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-black text-[10px] px-2 py-0.5 rounded-full border ${
                              bill.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {bill.paymentStatus || 'Paid'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-black text-slate-800">₹{Number(bill.grandTotal || 0).toFixed(2)}</span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setViewBill(bill)}
                              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl transition"
                              title="View Bill Details"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Summary */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
                <div className="flex gap-6 text-sm">
                  <div className="font-bold text-slate-500">Total Bills: <span className="text-slate-800 font-black">{pagination.total}</span></div>
                  <div className="font-bold text-slate-500">Revenue: <span className="text-emerald-600 font-black">₹{bills.reduce((s, b) => s + Number(b.grandTotal || 0), 0).toFixed(2)}</span></div>
                  <div className="font-bold text-slate-500">Paid: <span className="text-emerald-600 font-black">{bills.filter(b => b.paymentStatus === 'Paid').length}</span></div>
                  <div className="font-bold text-slate-500">Pending: <span className="text-amber-600 font-black">{bills.filter(b => b.paymentStatus !== 'Paid').length}</span></div>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = Math.max(1, pagination.page - 2) + i;
                      if (page > pagination.totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            page === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
