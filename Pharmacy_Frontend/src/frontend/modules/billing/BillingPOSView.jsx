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
    updateCartItemDiscount, updateCartItemUnit, SELLING_UNITS,
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
              {/* Date Filter */}
              <input
                type="date"
                value={salesDateFilter}
                onChange={e => setSalesDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400 text-slate-600"
              />
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
                <div className="flex-1 flex gap-2">
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
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex gap-6 text-sm">
              <div className="font-bold text-slate-500">Total Bills: <span className="text-slate-800 font-black">{salesHistory.length}</span></div>
              <div className="font-bold text-slate-500">Total Revenue: <span className="text-emerald-600 font-black">₹{salesHistory.reduce((s, b) => s + Number(b.grandTotal || 0), 0).toFixed(2)}</span></div>
              <div className="font-bold text-slate-500">Paid: <span className="text-emerald-600 font-black">{salesHistory.filter(b => b.paymentStatus === 'Paid').length}</span></div>
              <div className="font-bold text-slate-500">Pending: <span className="text-amber-600 font-black">{salesHistory.filter(b => b.paymentStatus !== 'Paid').length}</span></div>
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
                  <thead className="bg-slate-800 text-white sticky top-0">
                    <tr>
                      <th className="p-2.5 font-black text-center rounded-tl-none w-8">#</th>
                      <th className="p-2.5 font-black">Medicine</th>
                      <th className="p-2.5 font-black text-center">Batch / Exp</th>
                      <th className="p-2.5 font-black text-center">Rack</th>
                      <th className="p-2.5 font-black text-center">Unit</th>
                      <th className="p-2.5 font-black text-center">Qty</th>
                      <th className="p-2.5 font-black text-right">Rate</th>
                      <th className="p-2.5 font-black text-center">Disc%</th>
                      <th className="p-2.5 font-black text-right">Amount</th>
                      <th className="p-2.5 rounded-tr-none"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billingCart.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => { setSelectedCartIndex(idx); setIsEditingQty(false); }}
                        className={`transition cursor-pointer ${idx === selectedCartIndex ? 'bg-blue-100/60 ring-inset ring-2 ring-blue-500' : (idx % 2 === 0 ? 'hover:bg-blue-50/30' : 'bg-slate-50/50 hover:bg-blue-50/30')}`}
                      >
                        {/* S.No */}
                        <td className="p-2.5 text-center">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 font-black text-[10px] rounded-full flex items-center justify-center mx-auto">{idx + 1}</span>
                        </td>
                        {/* Medicine Name */}
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            {item.generic}
                          </div>
                        </td>
                        {/* Batch / Expiry */}
                        <td className="p-2.5 text-center">
                          <div className="font-mono text-[10px] font-bold text-slate-600">{item.batchNumber}</div>
                          <div className="text-[9px] font-bold text-slate-400 flex items-center justify-center gap-1">
                            {new Date(item.expiryDate).toLocaleDateString('en-GB', {month:'short', year:'numeric'})}
                            {item.expiryDate && (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) <= 60 && (
                              <AlertTriangle size={10} className="text-amber-500" title="Expiring within 60 days" />
                            )}
                          </div>
                        </td>
                        {/* Rack */}
                        <td className="p-2.5 text-center">
                          <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-black text-[10px]">{item.rack || 'A-01'}</span>
                        </td>
                        {/* Selling Unit Dropdown */}
                        <td className="p-2.5 text-center">
                          <select
                            value={item.sellingUnit || 'Tablet'}
                            onChange={e => updateCartItemUnit(idx, e.target.value)}
                            className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-blue-400 cursor-pointer"
                          >
                            {SELLING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        {/* Qty */}
                        <td className="p-2.5 text-center">
                          {isEditingQty && idx === selectedCartIndex ? (
                            <input 
                              type="number"
                              min="1"
                              autoFocus
                              value={editQtyValue}
                              onChange={(e) => setEditQtyValue(e.target.value)}
                              onBlur={() => {
                                updateCartItemQtyExact(idx, editQtyValue);
                                setIsEditingQty(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  updateCartItemQtyExact(idx, editQtyValue);
                                  setIsEditingQty(false);
                                  if (barcodeInputRef.current) barcodeInputRef.current.focus();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setIsEditingQty(false);
                                  if (barcodeInputRef.current) barcodeInputRef.current.focus();
                                }
                              }}
                              className="w-16 text-center font-black text-sm bg-white border-2 border-blue-500 rounded focus:outline-none hide-arrows py-1 shadow-sm"
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); updateCartQty(idx, -1); }} className="p-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-600 transition"><Minus size={12}/></button>
                              <span 
                                onClick={(e) => { e.stopPropagation(); setSelectedCartIndex(idx); setIsEditingQty(true); setEditQtyValue(item.qty.toString()); }}
                                className="w-10 text-center font-black text-sm cursor-text hover:bg-slate-200 rounded py-0.5 transition"
                              >
                                {item.qty}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); updateCartQty(idx, 1); }} className="p-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 rounded text-slate-600 transition"><Plus size={12}/></button>
                            </div>
                          )}
                        </td>
                        {/* MRP Rate */}
                        <td className="p-2.5 text-right font-bold text-slate-600">₹{item.price.toFixed(2)}</td>
                        {/* Discount Input */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center gap-0.5 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount || 0}
                              onChange={e => updateCartItemDiscount(idx, e.target.value)}
                              className="w-12 text-center text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:border-blue-400 focus:bg-blue-50"
                            />
                            <span className="text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </td>
                        {/* Amount */}
                        <td className="p-2.5 text-right">
                          <div className="font-black text-slate-800">{item.discount > 0 && <span className="line-through text-slate-300 text-[10px] mr-1">₹{(item.price * item.qty).toFixed(2)}</span>}₹{item.total.toFixed(2)}</div>
                        </td>
                        {/* Delete */}
                        <td className="p-2.5 text-right">
                          <button onClick={() => removeFromCart(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {billingCart.length === 0 && (
                      <tr>
                        <td colSpan="10" className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="p-3 bg-slate-100 rounded-full"><Search size={24} className="text-slate-300" /></div>
                            <span className="font-bold text-sm">Scan a barcode or type a medicine name to start billing</span>
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
                <div className="flex justify-between text-amber-600"><span>Discount</span><span>- ₹{billingCart.reduce((s, i) => s + ((i.price * i.qty) - i.total), 0).toFixed(2)}</span></div>
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
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-emerald-500" /> Checkout
              <span className="ml-2 bg-blue-100 text-blue-700 text-sm font-black px-2 py-0.5 rounded-full">₹{getFinalTotal().toFixed(2)}</span>
            </h2>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Cash Amount</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" autoFocus value={payCash} onChange={e => setPayCash(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">UPI Amount</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={payUPI} onChange={e => setPayUPI(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Card Amount</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={payCard} onChange={e => setPayCard(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold">Sub Total</span><span className="font-black">₹{getSubtotal().toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold">Discount</span><span className="font-black text-amber-600">- ₹{billingCart.reduce((s, i) => s + ((i.price * i.qty) - i.total), 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold">GST Tax</span><span className="font-black">₹{getTaxAmount().toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm border-t pt-2 mt-2"><span className="text-blue-600 font-bold">Final Amount</span><span className="font-black text-blue-600">₹{getFinalTotal().toFixed(2)}</span></div>
                </div>
                <div className="space-y-2 border-l pl-6">
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold">Total Paid</span><span className="font-black">₹{(Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0)).toFixed(2)}</span></div>
                  
                  {((Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0)) - getFinalTotal()) >= 0 ? (
                    <div className="flex justify-between text-sm border-t pt-2 mt-2"><span className="text-emerald-600 font-bold">Change Return</span><span className="font-black text-emerald-600 text-lg">₹{Math.max(0, (Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0)) - getFinalTotal()).toFixed(2)}</span></div>
                  ) : (
                    <div className="flex justify-between text-sm border-t pt-2 mt-2"><span className="text-rose-600 font-bold">Balance Due</span><span className="font-black text-rose-600 text-lg">₹{Math.max(0, getFinalTotal() - (Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0))).toFixed(2)}</span></div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setCheckoutModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel (ESC)</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg flex items-center gap-2">
                  <CheckCircle size={18} /> Complete Sale (ENTER)
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
