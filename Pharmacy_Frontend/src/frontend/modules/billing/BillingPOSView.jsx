import React from 'react';
import { useBillingController } from './useBillingController';
import ToastContainer from './ToastContainer';
import InvoicePreviewView from './InvoicePreviewView';
import ReturnBillView from './ReturnBillView';
import BillDetailModal from './BillDetailModal';
import { billingAPI } from '../../db/api';
import { 
  Search, Plus, Minus, Trash2, Clock, CheckCircle, Smartphone, User, 
  CreditCard, Printer, CornerDownLeft, Upload, AlertTriangle, IndianRupee,
  CheckSquare, Square, X
} from 'lucide-react';

export default function BillingPOSView({ role }) {
  const {
    viewState, setViewState,
    mobileNumber, setMobileNumber,
    customerName, setCustomerName,
    customerHistory, outstandingBalance,
    billingCart,
    barcodeInput, setBarcodeInput, handleBarcodeScan,
    searchResults, selectedSearchIndex, barcodeInputRef, addMedicineToCart,
    updateCartQty, removeFromCart, updateCartItemQtyExact,
    updateCartItemDiscount, applyGlobalDiscount, saveDefaultDiscount, updateCartItemUnit, SELLING_UNITS,
    getSubtotal, getTaxAmount, getGrandTotal, getRoundOff, getFinalTotal,
    holdCurrentBill, resumeBill, cancelQueueBill,
    checkoutModal, setCheckoutModal,
    payCash, setPayCash, payUPI, setPayUPI, payCard, setPayCard,
    handleCheckoutSubmit, triggerPrintWindow, printBillObj,
    invoiceData, paymentSnapshot, handleNewBillAfterInvoice,
    currentTime, dailyDiscountRate,
    salesHistory, setSalesHistory, setInvoiceData,
    savedQueue, toasts, dismiss, resolveConfirm,
    prescriptionBase64, setPrescriptionBase64,
    selectedCartIndex, setSelectedCartIndex,
    isEditingQty, setIsEditingQty,
    editQtyValue, setEditQtyValue
  } = useBillingController(role);

  const liveDate = currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const liveTime = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const [salesSearch, setSalesSearch] = React.useState('');
  const [salesDateFilter, setSalesDateFilter] = React.useState('');
  const [summaryRange, setSummaryRange] = React.useState('24h');
  const [viewBill, setViewBill] = React.useState(null);
  const [selected, setSelected] = React.useState(new Set());

  const handleFetchFullBill = async (billId, actionType) => {
    try {
      const res = await billingAPI.getBill(billId);
      if (res && res.data) {
        if (actionType === 'view') {
          setViewBill(res.data);
        } else if (actionType === 'invoice-preview' || actionType === 'return-bill') {
          setInvoiceData(res.data);
          setViewState(actionType);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch full bill details');
    }
  };

  const toggleAll = () => {
    if (selected.size === salesHistory.length && salesHistory.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(salesHistory.map(b => b.id)));
    }
  };

  const toggleOne = (id, e) => {
    e.stopPropagation();
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected bill(s)? This action cannot be undone.`)) return;
    try {
      const res = await billingAPI.bulkDeleteBills(Array.from(selected));
      if (res && res.success) {
        setSalesHistory(salesHistory.filter(b => !selected.has(b.id)));
        setSelected(new Set());
      } else {
        alert('Delete failed: ' + (res?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        setViewState('new-bill');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setViewState('queue');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewState]);

  const getSummaryBills = () => {
    if (summaryRange === 'all') return salesHistory;
    const cutoff = new Date();
    if (summaryRange === '24h') cutoff.setHours(cutoff.getHours() - 24);
    else if (summaryRange === '1w') cutoff.setDate(cutoff.getDate() - 7);
    else if (summaryRange === '1m') cutoff.setMonth(cutoff.getMonth() - 1);
    
    return salesHistory.filter(b => new Date(b.createdAt) >= cutoff);
  };
  const summaryBills = getSummaryBills();
  const totalRev = summaryBills.reduce((s, b) => s + Number(b.grandTotal || 0), 0);
  const upiRev = summaryBills
    .filter(b => (b.paymentMethod || '').toLowerCase().includes('upi'))
    .reduce((s, b) => s + Number(b.grandTotal || 0), 0);
  const cashRev = summaryBills
    .filter(b => (b.paymentMethod || '').toLowerCase().includes('cash'))
    .reduce((s, b) => s + Number(b.grandTotal || 0), 0);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col font-sans text-slate-800 bg-slate-100 overflow-hidden relative">
      <ToastContainer toasts={toasts} dismiss={dismiss} resolveConfirm={resolveConfirm} />

      {viewBill && <BillDetailModal bill={viewBill} onClose={() => setViewBill(null)} role={role} />}

      {/* -- INVOICE PREVIEW (full-page takeover) -- */}
      {viewState === 'invoice-preview' && invoiceData && (
        <div className="absolute inset-0 z-50 overflow-auto">
          <InvoicePreviewView
            bill={invoiceData}
            payCash={paymentSnapshot.cash}
            payUPI={paymentSnapshot.upi}
            payCard={paymentSnapshot.card}
            onNewBill={handleNewBillAfterInvoice}
            onPrint={triggerPrintWindow}
          />
        </div>
      )}

      {/* -- TOP NAV BAR (hidden during invoice preview) -- */}
      {viewState !== 'invoice-preview' && (
        <div className="bg-white p-3 shadow-sm border-b border-slate-200 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-blue-800">Pharmacy POS V2</h1>
            {/* Live Date & Time */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">📅</span>
              <span className="font-bold text-slate-700 text-xs">{liveDate}</span>
              <span className="text-slate-300">|</span>
              <span className="font-black text-blue-600 text-sm tabular-nums">{liveTime}</span>
            </div>
            {/* Daily Discount Badge */}
            {dailyDiscountRate > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                <span className="text-emerald-600 font-black text-sm">🏷️ Today's Offer:</span>
                <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{dailyDiscountRate}% OFF</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewState('new-bill')} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewState === 'new-bill' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>New Bill (F5)</button>
            <button onClick={() => setViewState('queue')} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewState === 'queue' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Queue (F3)</button>
            <button onClick={() => setViewState('paid-bills')} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewState === 'paid-bills' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Completed Sales</button>
          </div>
        </div>
      )}

      {/* -- QUEUE PANEL VIEW -- */}
      {viewState === 'queue' && (
        <div className="absolute inset-0 bg-white z-20 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Clock className="text-amber-500" /> Queue Bills (Press F3 to return)
            </h2>
            <button onClick={() => setViewState('new-bill')} className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg uppercase text-xs">Back to POS (F3)</button>
          </div>
          <div className="grid gap-4">
            {savedQueue.map(q => (
              <div key={q.queueId} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-lg">{q.queueId} - {q.customerName}</h3>
                  <p className="text-sm text-slate-500">{(q.items || []).length} Items • ₹{Number(q.draftTotalAmount || 0).toFixed(2)} • Created: {q.createdTime}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resumeBill(q.queueId)} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                    <Clock size={16} /> Resume (Enter)
                  </button>
                  <button onClick={() => cancelQueueBill(q.queueId)} className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-lg font-bold text-sm">
                    <Trash2 size={16} /> Cancel
                  </button>
                </div>
              </div>
            ))}
            {savedQueue.length === 0 && <div className="text-center text-slate-400 py-12 font-bold text-lg">No bills currently in queue</div>}
          </div>
        </div>
      )}

      {/* -- COMPLETED SALES VIEW -- */}
      {viewState === 'paid-bills' && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col" style={{ top: '57px' }}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-emerald-500" /> Completed Sales
              <span className="ml-2 bg-emerald-100 text-emerald-700 text-sm font-black px-2 py-0.5 rounded-full">{salesHistory.length}</span>
            </h2>
            <div className="flex items-center gap-3">
              {/* Date Filters */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200">
                <button 
                  onClick={() => {
                    const today = new Date();
                    const offset = today.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
                    setSalesDateFilter(localISOTime);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${salesDateFilter === (new Date(new Date() - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Today
                </button>
                <button 
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const offset = yesterday.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(yesterday - offset)).toISOString().split('T')[0];
                    setSalesDateFilter(localISOTime);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${salesDateFilter === (new Date(new Date(Date.now() - 86400000) - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Yesterday
                </button>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    id="custom-date-picker"
                    value={salesDateFilter}
                    onChange={e => setSalesDateFilter(e.target.value)}
                    className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                  />
                  <button 
                    onClick={() => document.getElementById('custom-date-picker').showPicker()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${(![(new Date(new Date() - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0], (new Date(new Date(Date.now() - 86400000) - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]].includes(salesDateFilter) && salesDateFilter) ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    Custom {(![(new Date(new Date() - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0], (new Date(new Date(Date.now() - 86400000) - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]].includes(salesDateFilter) && salesDateFilter) && `(${salesDateFilter})`}
                  </button>
                </div>
                {salesDateFilter && (
                  <button 
                    onClick={() => setSalesDateFilter('')}
                    className="px-2 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition"
                    title="Clear Filter"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bill, customer, mobile..."
                  value={salesSearch}
                  onChange={e => setSalesSearch(e.target.value)}
                  className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400 w-64"
                />
              </div>
              <button onClick={() => setViewState('new-bill')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">
                ← Back to POS
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {selected.size > 0 && (
              <div className="bg-blue-600 text-white rounded-2xl mb-4 p-4 flex items-center gap-4 shadow-lg">
                <span className="font-black text-sm">{selected.size} bill(s) selected</span>
                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      if(window.confirm(`Print ${selected.size} selected invoices?`)) {
                        Array.from(selected).forEach(id => {
                           handleFetchFullBill(id, 'invoice-preview');
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-sm transition"
                  >
                    <Printer size={14} /> Print Selected
                  </button>
                  {(role === 'Admin' || role === 'System Admin') && (
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-sm transition"
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
            {salesHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="p-4 bg-slate-100 rounded-full mb-3"><CheckCircle size={32} className="text-slate-300" /></div>
                <p className="font-bold text-lg">No completed sales yet</p>
                <p className="text-sm mt-1">Bills will appear here after checkout</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-800 text-white sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-10">
                      <button onClick={toggleAll} className="flex items-center justify-center">
                        {selected.size === salesHistory.length && salesHistory.length > 0
                          ? <CheckSquare size={16} className="text-blue-300" />
                          : <Square size={16} className="text-slate-400" />
                        }
                      </button>
                    </th>
                    <th className="p-3 text-left font-black">Bill No</th>
                    <th className="p-3 text-left font-black">Customer</th>
                    <th className="p-3 text-left font-black">Mobile</th>
                    <th className="p-3 text-center font-black">Items</th>
                    <th className="p-3 text-center font-black">Payment</th>
                    <th className="p-3 text-center font-black">Status</th>
                    <th className="p-3 text-right font-black">Amount</th>
                    <th className="p-3 text-center font-black">Date & Time</th>
                    <th className="p-3 text-center font-black">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesHistory
                    .filter(bill => {
                      if (salesDateFilter) {
                        const bDate = bill.createdAt ? new Date(bill.createdAt).toISOString().split('T')[0] : '';
                        if (bDate !== salesDateFilter) return false;
                      }
                      if (!salesSearch) return true;
                      const q = salesSearch.toLowerCase();
                      const billDateStr = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase() : '';
                      return (
                        (bill.id || '').toLowerCase().includes(q) ||
                        (bill.patientName || '').toLowerCase().includes(q) ||
                        (bill.mobileNumber || '').includes(q) ||
                        billDateStr.includes(q)
                      );
                    })
                    .map((bill, idx) => {
                      const billDate = bill.createdAt ? new Date(bill.createdAt) : null;
                      const isSelected = selected.has(bill.id);
                      return (
                        <tr 
                          key={bill.id || idx} 
                          onClick={() => handleFetchFullBill(bill.id, 'view')}
                          className={`cursor-pointer hover:bg-blue-50 transition ${isSelected ? 'bg-blue-50' : idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}
                        >
                          <td className="p-3 text-center">
                            <button onClick={(e) => toggleOne(bill.id, e)} className="flex items-center justify-center">
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
                            <div className="font-bold text-slate-800">{bill.patientName || 'Walk-in'}</div>
                          </td>
                          <td className="p-3 text-slate-500 font-medium">{bill.mobileNumber || '—'}</td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-700 font-black text-xs px-2 py-0.5 rounded-full">
                              {bill._count?.items ?? (bill.items || []).length} item{(bill._count?.items ?? (bill.items || []).length) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold text-xs px-2 py-0.5 rounded-full">
                              {bill.paymentMethod || 'Cash'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-black text-xs px-2 py-0.5 rounded-full border ${
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
                          <td className="p-3 text-center text-xs text-slate-500 font-medium">
                            {billDate ? (
                              <div>
                                <div className="font-bold">{billDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div className="text-slate-400">{billDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFetchFullBill(bill.id, 'invoice-preview'); }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition"
                                title="View / Reprint Invoice"
                              >
                                <Printer size={14} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFetchFullBill(bill.id, 'return-bill'); }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition"
                                title="Process Return / Refund"
                              >
                                <CornerDownLeft size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            )}
          </div>

          {/* Footer summary */}
          {salesHistory.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex gap-6 text-sm items-center">
              <div className="font-bold text-slate-500 flex items-center gap-2 border-r pr-6 border-slate-300">
                Show Sales:
                <select 
                  value={summaryRange} 
                  onChange={e => setSummaryRange(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400 font-bold"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="1w">Last 1 Week</option>
                  <option value="1m">Last 1 Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div className="font-bold text-slate-500">Total Bills: <span className="text-slate-800 font-black">{summaryBills.length}</span></div>
              <div className="font-bold text-slate-500">Total Revenue: <span className="text-emerald-600 font-black">₹{totalRev.toFixed(2)}</span></div>
              <div className="font-bold text-slate-500">Cash: <span className="text-blue-600 font-black">₹{cashRev.toFixed(2)}</span></div>
              <div className="font-bold text-slate-500">UPI: <span className="text-purple-600 font-black">₹{upiRev.toFixed(2)}</span></div>
            </div>
          )}
        </div>
      )}

      {/* -- POS VIEW -- */}
      {viewState === 'new-bill' && (
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: POS Workflow */}
          <div className="flex-1 flex flex-col p-4 space-y-4">
            
            {/* Top Customer Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex gap-6 items-start">
              <div className="w-1/3 space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    className="flex-1 font-mono font-bold text-lg bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="flex-1 font-bold text-lg bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition"
                  />
                </div>
              </div>
              <div className="flex-1 px-4 border-l border-r border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recent Purchases</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {customerHistory.length > 0 ? (
                      customerHistory[0].items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">{item.name}</span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No recent history</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Outstanding Balance</h4>
                  <span className={`text-xl font-black ${outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{outstandingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="w-48 flex flex-col gap-2">
                <button onClick={holdCurrentBill} className="flex items-center justify-between bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-3 py-2 rounded-xl font-black text-xs uppercase transition">
                  Hold Bill <span className="bg-amber-300 px-1.5 py-0.5 rounded text-[9px]">F4</span>
                </button>
                <button onClick={() => setViewState('queue')} className="flex items-center justify-between bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 px-3 py-2 rounded-xl font-black text-xs uppercase transition relative">
                  Queue <span className="bg-blue-300 px-1.5 py-0.5 rounded text-[9px]">F3</span>
                  {savedQueue.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[9px]">{savedQueue.length}</span>}
                </button>
              </div>
            </div>

            {/* Barcode Search Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative">
              <form onSubmit={handleBarcodeScan} className="flex items-center gap-3">
                <Search className="text-slate-400 ml-2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan Barcode or Type Medicine Name / SKU (Auto-focused)"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  className="flex-1 font-mono font-bold text-xl bg-slate-50 border-2 border-transparent border-b-blue-500 px-4 py-2 focus:outline-none focus:bg-blue-50 transition"
                  autoFocus
                />
              </form>

              {/* Search Results Overlay */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-b-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((m, idx) => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        addMedicineToCart(m, true);
                        setBarcodeInput('');
                        // searchResults are automatically cleared when barcodeInput becomes empty
                      }}
                      className={`px-4 py-3 border-b flex justify-between items-center cursor-pointer hover:bg-slate-50 ${idx === selectedSearchIndex ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{m.generic} | SKU: {m.sku} | Stock: {m.stock}</div>
                      </div>
                      <div className="font-black">₹{m.price.toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="px-4 py-1 text-[9px] text-center text-slate-400 font-bold bg-slate-50">Use ARROW keys to navigate, ENTER to select</div>
                </div>
              )}
            </div>

            {/* Cart Table */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-white border-b-2 border-slate-200 text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-3 font-black text-center w-10">#</th>
                      <th className="p-3 font-black">ITEM DETAILS</th>
                      <th className="p-3 font-black text-center">UNIT</th>
                      <th className="p-3 font-black text-center">QTY</th>
                      <th className="p-3 font-black text-right">RATE</th>
                      <th className="p-3 font-black text-center">DISC%</th>
                      <th className="p-3 font-black text-right">TOTAL</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {billingCart.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => { setSelectedCartIndex(idx); setIsEditingQty(false); }}
                        className={`transition cursor-pointer group ${idx === selectedCartIndex ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-3 text-center">
                          <span className="text-slate-400 font-bold text-xs">{idx + 1}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">Rack: {item.rack || 'A1'}</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">Batch: {item.batchNumber || 'N/A'}</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', {month:'short', year:'numeric'}) : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={item.sellingUnit || 'Tablet'}
                            onChange={e => updateCartItemUnit(idx, e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 cursor-pointer hover:bg-slate-50"
                          >
                            {SELLING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          {isEditingQty && idx === selectedCartIndex ? (
                            <input 
                              type="number"
                              min="1"
                              autoFocus
                              value={editQtyValue}
                              onChange={(e) => setEditQtyValue(e.target.value)}
                              onBlur={() => { updateCartItemQtyExact(idx, editQtyValue); setIsEditingQty(false); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  e.preventDefault();
                                  updateCartItemQtyExact(idx, editQtyValue);
                                  setIsEditingQty(false);
                                  if (barcodeInputRef.current) barcodeInputRef.current.focus();
                                }
                              }}
                              className="w-16 text-center font-bold text-sm bg-white border-2 border-blue-500 rounded focus:outline-none hide-arrows py-1 shadow-sm"
                            />
                          ) : (
                            <div className="inline-flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                              <button onClick={(e) => { e.stopPropagation(); updateCartQty(idx, -1); }} className="p-1 hover:bg-white hover:shadow-sm hover:text-rose-600 rounded-md text-slate-500 transition"><Minus size={14}/></button>
                              <span 
                                onClick={(e) => { e.stopPropagation(); setSelectedCartIndex(idx); setIsEditingQty(true); setEditQtyValue(item.qty.toString()); }}
                                className="w-8 text-center font-bold text-slate-800 text-sm cursor-text hover:bg-white rounded-md py-0.5 transition"
                              >
                                {item.qty}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); updateCartQty(idx, 1); }} className="p-1 hover:bg-white hover:shadow-sm hover:text-emerald-600 rounded-md text-slate-500 transition"><Plus size={14}/></button>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-600">₹{item.price.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount || 0}
                              onChange={e => updateCartItemDiscount(idx, e.target.value)}
                              className="w-8 text-center text-xs font-bold bg-transparent focus:outline-none text-slate-700"
                            />
                            <span className="text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-black text-slate-800 text-sm">
                            {item.discount > 0 && <span className="line-through text-slate-400 text-[10px] font-medium mr-1.5 opacity-70">₹{(item.price * item.qty).toFixed(2)}</span>}
                            ₹{item.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={(e) => { e.stopPropagation(); removeFromCart(idx); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {billingCart.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={28} className="text-slate-300" /></div>
                            <h3 className="font-bold text-lg text-slate-600">Cart is empty</h3>
                            <p className="text-sm mt-1">Scan a barcode or type a medicine name to start billing</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Bill Summary */}
          <div className="w-80 bg-white border-l border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 flex-1 space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest border-b pb-2">Bill Summary</h3>
              
              <div className="space-y-3 font-bold text-sm text-slate-600">
                <div className="flex justify-between"><span>Items</span><span>{billingCart.length}</span></div>
                <div className="flex justify-between"><span>Quantity</span><span>{billingCart.reduce((s, i) => s + i.qty, 0)}</span></div>
                <div className="flex justify-between"><span>Sub Total</span><span>₹{getSubtotal().toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-amber-600">
                  <div className="flex items-center gap-2">
                    <span>Discount</span>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center border border-amber-200 rounded px-1.5 py-0.5 bg-amber-50">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={dailyDiscountRate} 
                          onChange={(e) => applyGlobalDiscount(e.target.value)}
                          className="w-8 text-right bg-transparent outline-none text-amber-700 font-bold"
                        />
                        <span className="text-[10px]">%</span>
                      </div>
                      <button 
                        onClick={() => saveDefaultDiscount(dailyDiscountRate)}
                        className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-1 rounded font-bold transition whitespace-nowrap"
                        title="Save as Global Default"
                      >
                        Set Default
                      </button>
                    </div>
                  </div>
                  <span>- ₹{billingCart.reduce((s, i) => s + ((i.price * i.qty) - i.total), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between"><span>GST Tax</span><span>₹{getTaxAmount().toFixed(2)}</span></div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-1">Final Amount</span>
                <span className="text-4xl font-black text-blue-600">₹{getFinalTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
              <button 
                onClick={() => { if(billingCart.length > 0) setCheckoutModal(true); }}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-lg transition ${billingCart.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Checkout <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">F6</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- CHECKOUT OVERLAY -- */}
      {checkoutModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up flex flex-col max-h-full">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Complete Payment</h2>
                  <p className="text-xs text-slate-500 font-medium">Select payment method and confirm amount</p>
                </div>
              </div>
              <button onClick={() => setCheckoutModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCheckoutSubmit} className="flex flex-col md:flex-row overflow-y-auto">
              
              {/* Payment Inputs Area */}
              <div className="flex-1 p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Payment Methods</h3>
                  <div className="space-y-4">
                    
                    {/* Cash */}
                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all bg-white">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-lg">💵</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cash Amount</label>
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input type="number" autoFocus value={payCash} onChange={e => setPayCash(e.target.value)} className="w-full pl-4 pr-0 py-1 bg-transparent font-black text-xl focus:outline-none text-slate-800" placeholder="0.00" />
                        </div>
                      </div>
                    </div>

                    {/* UPI */}
                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all bg-white">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-lg">📱</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">UPI Amount</label>
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input type="number" value={payUPI} onChange={e => setPayUPI(e.target.value)} className="w-full pl-4 pr-0 py-1 bg-transparent font-black text-xl focus:outline-none text-slate-800" placeholder="0.00" />
                        </div>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all bg-white">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-lg">💳</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Card Amount</label>
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input type="number" value={payCard} onChange={e => setPayCard(e.target.value)} className="w-full pl-4 pr-0 py-1 bg-transparent font-black text-xl focus:outline-none text-slate-800" placeholder="0.00" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Order Summary Area */}
              <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-6 flex flex-col">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Order Summary</h3>
                
                <div className="space-y-3 font-medium text-slate-600 text-sm mb-6 flex-1">
                  <div className="flex justify-between"><span className="text-slate-500">Sub Total</span><span className="font-bold">₹{getSubtotal().toFixed(2)}</span></div>
                  <div className="flex justify-between items-center text-amber-600">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600/70">Discount</span>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center border border-amber-200 rounded px-1.5 py-0.5 bg-white">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={dailyDiscountRate} 
                            onChange={(e) => applyGlobalDiscount(e.target.value)}
                            className="w-8 text-right bg-transparent outline-none text-amber-700 font-bold"
                          />
                          <span className="text-[10px]">%</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold">- ₹{billingCart.reduce((s, i) => s + ((i.price * i.qty) - i.total), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">GST Tax</span><span className="font-bold">₹{getTaxAmount().toFixed(2)}</span></div>
                  
                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Final Amount</span>
                    <span className="text-xl font-black text-blue-600">₹{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Total Paid</span>
                    <span className="font-black text-slate-800 text-lg">₹{(Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0)).toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3">
                    {((Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0)) - getFinalTotal()) >= 0 ? (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-600 text-xs uppercase tracking-wider">Change Return</span>
                        <span className="font-black text-emerald-600 text-xl">₹{Math.max(0, (Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0)) - getFinalTotal()).toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-rose-500 text-xs uppercase tracking-wider">Balance Due</span>
                        <span className="font-black text-rose-600 text-xl">₹{Math.max(0, getFinalTotal() - (Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0))).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                  Complete Sale <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">ENTER</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -- RETURN BILL VIEW -- */}
      {viewState === 'return-bill' && invoiceData && (
        <ReturnBillView 
          invoiceData={invoiceData} 
          onBack={() => setViewState('paid-bills')} 
        />
      )}
    </div>
  );
}
