import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Database, Truck, Plus, FileText, CreditCard, ClipboardList, Search, X, 
  ArrowLeft, FileSpreadsheet, Download, Printer, Filter, Calendar, Info, 
  CheckCircle, FileCode, Landmark, ShieldCheck, AlertCircle, RefreshCw, Undo2,
  ShoppingBag, Star, HelpCircle, Lightbulb, Percent, Gauge, Clock
} from 'lucide-react';
import { useSupplierController } from './useSupplierController';
import { SupplierModel } from './SupplierModel';

export default function SupplierView({ role, setSchemaModalTable }) {
  const isFinancier = role === 'Admin' || role === 'Pharmacy Manager';
  const {
    suppliers,
    newSupplier,
    setNewSupplier,
    handleAddSupplier,

    // Invoices
    supplierInvoices,
    invoiceSupplierId,
    setInvoiceSupplierId,
    invoiceNumber,
    setInvoiceNumber,
    invoiceAmount,
    setInvoiceAmount,
    invoiceVehicleNumber,
    setInvoiceVehicleNumber,
    invoiceDeliveredBy,
    setInvoiceDeliveredBy,
    invoiceReceivedBy,
    setInvoiceReceivedBy,
    invoiceContactNumber,
    setInvoiceContactNumber,
    invoiceRemarks,
    setInvoiceRemarks,
    handleAddInvoice,

    // Payments
    supplierPayments,
    paymentSupplierId,
    setPaymentSupplierId,
    paymentRefNumber,
    setPaymentRefNumber,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentRemarks,
    setPaymentRemarks,
    handleRecordPayment,

    // Ledger
    supplierLedger,
    loading,

    // Selection
    selectedSupplier,
    setSelectedSupplier,

    // Returns & Documents
    supplierReturns,
    handleAddReturn,
    supplierDocuments,
    handleUploadDocument,

    // Purchase Orders
    purchaseOrders,
    handleAddPurchaseOrder,
    handleUpdatePurchaseOrderStatus,
    handleReceivePurchaseOrder,
    
    // Medicines
    medicinesList
  } = useSupplierController();

  // Navigation and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | invoices | payments | ledger | returns | documents
  
  // Modal states
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [isPOFormOpen, setIsPOFormOpen] = useState(false);

  const [poForm, setPoForm] = useState({
    expectedDelivery: '',
    items: [{ medicineId: '', medicineName: '', qty: '', unitPrice: '' }]
  });
  
  const [poFilters, setPoFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'All'
  });

  // Return Form State
  const [returnForm, setReturnForm] = useState({
    medicineName: '',
    batchNumber: '',
    qty: '',
    reason: 'Expired',
    amount: ''
  });

  // Doc Form State
  const [docForm, setDocForm] = useState({
    docName: 'GST Registration Certificate',
    fileName: ''
  });

  // Filter values for tabs
  const [ledgerFilters, setLedgerFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'All', // All | Debit | Credit | Invoice | Payment
    query: ''
  });

  const [invoiceFilters, setInvoiceFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'All' // All | Paid | Pending | Partially Paid
  });

  const [paymentFilters, setPaymentFilters] = useState({
    startDate: '',
    endDate: '',
    method: 'All' // All | Cash | UPI | Bank Transfer | Cheque
  });

  const searchInputRef = useRef(null);

  // Automatically focus supplier search bar when module opens or selectedSupplier is cleared
  useEffect(() => {
    if (!selectedSupplier) {
      searchInputRef.current?.focus();
    }
  }, [selectedSupplier]);

  // Search filter for supplier list
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.contact && s.contact.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q))
    );
  }, [suppliers, searchQuery]);

  // Supplier-specific filtered records
  const supplierSpecificInvoices = useMemo(() => {
    if (!selectedSupplier) return [];
    return supplierInvoices.filter(inv => inv.supplierId === selectedSupplier.id);
  }, [supplierInvoices, selectedSupplier]);

  const supplierSpecificPayments = useMemo(() => {
    if (!selectedSupplier) return [];
    return supplierPayments.filter(pay => pay.supplierId === selectedSupplier.id);
  }, [supplierPayments, selectedSupplier]);

  const supplierSpecificReturns = useMemo(() => {
    if (!selectedSupplier) return [];
    return supplierReturns.filter(ret => ret.supplierId === selectedSupplier.id || ret.supplierId === `dummy-${selectedSupplier.name}`);
  }, [supplierReturns, selectedSupplier]);

  const supplierSpecificDocuments = useMemo(() => {
    if (!selectedSupplier) return [];
    return supplierDocuments.filter(doc => doc.supplierId === selectedSupplier.id || doc.supplierId === 'all');
  }, [supplierDocuments, selectedSupplier]);

  // Tab Filtering logic
  const filteredInvoices = useMemo(() => {
    return supplierSpecificInvoices.filter(inv => {
      const matchStatus = invoiceFilters.status === 'All' || 
        (invoiceFilters.status === 'Paid' && inv.status === 'Paid') ||
        (invoiceFilters.status === 'Pending' && inv.status === 'Unpaid') ||
        (invoiceFilters.status === 'Partially Paid' && inv.status === 'Partially Paid');
      return matchStatus;
    });
  }, [supplierSpecificInvoices, invoiceFilters]);

  const filteredPayments = useMemo(() => {
    return supplierSpecificPayments.filter(pay => {
      const matchMethod = paymentFilters.method === 'All' || pay.method === paymentFilters.method;
      return matchMethod;
    });
  }, [supplierSpecificPayments, paymentFilters]);

  // Tally ledger computation for selected supplier
  const computedLedgerList = useMemo(() => {
    if (!selectedSupplier) return [];
    
    // Combine invoices, payments, and returns into a single timeline
    const ledgerItems = [];

    supplierSpecificInvoices.forEach(inv => {
      ledgerItems.push({
        date: inv.date,
        rawDate: new Date(inv.date),
        ref: inv.invoiceNumber,
        type: 'Purchase Invoice',
        desc: inv.remarks || `Logged supplier invoice ${inv.invoiceNumber}`,
        debit: parseFloat(inv.amount),
        credit: 0
      });
    });

    supplierSpecificPayments.forEach(pay => {
      ledgerItems.push({
        date: pay.date,
        rawDate: new Date(pay.date),
        ref: pay.referenceNumber,
        type: 'Cash/Bank Payment',
        desc: pay.remarks || `Settled via ${pay.method}`,
        debit: 0,
        credit: parseFloat(pay.amount)
      });
    });

    supplierSpecificReturns.forEach(ret => {
      ledgerItems.push({
        date: ret.date,
        rawDate: new Date(ret.date),
        ref: ret.id,
        type: 'Purchase Return',
        desc: `Returned ${ret.qty} units of ${ret.medicineName} (${ret.reason})`,
        debit: 0,
        credit: parseFloat(ret.amount)
      });
    });

    // Sort ascending by date
    ledgerItems.sort((a, b) => a.rawDate - b.rawDate);

    // Calculate running balance (Debit increases liability, Credit decreases liability)
    let balance = 0;
    const computedItems = ledgerItems.map(item => {
      balance = balance + item.debit - item.credit;
      return {
        ...item,
        balance
      };
    });

    // Filter logic
    return computedItems.filter(item => {
      const matchType = ledgerFilters.type === 'All' ||
        (ledgerFilters.type === 'Debit' && item.debit > 0) ||
        (ledgerFilters.type === 'Credit' && item.credit > 0) ||
        (ledgerFilters.type === 'Invoice' && item.type === 'Purchase Invoice') ||
        (ledgerFilters.type === 'Payment' && item.type === 'Cash/Bank Payment');
        
      const matchQuery = !ledgerFilters.query || 
        item.ref.toLowerCase().includes(ledgerFilters.query.toLowerCase()) ||
        item.desc.toLowerCase().includes(ledgerFilters.query.toLowerCase());

      return matchType && matchQuery;
    });
  }, [supplierSpecificInvoices, supplierSpecificPayments, supplierSpecificReturns, ledgerFilters, selectedSupplier]);

  // Financial summary metrics
  const financialSummary = useMemo(() => {
    if (!selectedSupplier) return { totalPurchase: 0, totalPaid: 0, outstanding: 0, totalReturns: 0 };
    
    const purchase = supplierSpecificInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const paid = supplierSpecificPayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    const returns = supplierSpecificReturns.reduce((sum, ret) => sum + parseFloat(ret.amount), 0);
    const outstanding = Math.max(0, purchase - paid - returns);

    return {
      totalPurchase: purchase,
      totalPaid: paid,
      outstanding,
      totalReturns: returns
    };
  }, [supplierSpecificInvoices, supplierSpecificPayments, supplierSpecificReturns, selectedSupplier]);

  const outstanding = financialSummary.outstanding;
  const creditLimit = selectedSupplier ? (selectedSupplier.creditLimit || 200000.00) : 200000.00;
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const utilization = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;
  const isCreditLimitExceeded = outstanding > creditLimit;

  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    await handleAddSupplier(e);
    setIsSupplierFormOpen(false);
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    await handleAddInvoice(e);
    setIsInvoiceFormOpen(false);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    await handleRecordPayment(e);
    setIsPaymentFormOpen(false);
  };

  const handleSubmitReturn = (e) => {
    e.preventDefault();
    const qtyVal = parseInt(returnForm.qty);
    const amtVal = parseFloat(returnForm.amount);
    if (!returnForm.medicineName.trim() || !returnForm.batchNumber.trim() || isNaN(qtyVal) || isNaN(amtVal)) {
      alert('Please fill out all return fields.');
      return;
    }
    handleAddReturn(selectedSupplier.id, returnForm);
    setIsReturnFormOpen(false);
    setReturnForm({ medicineName: '', batchNumber: '', qty: '', reason: 'Expired', amount: '' });
  };

  // Purchase Order list filtering
  const supplierSpecificPurchaseOrders = useMemo(() => {
    if (!selectedSupplier) return [];
    return purchaseOrders.filter(po => po.supplierId === selectedSupplier.id);
  }, [purchaseOrders, selectedSupplier]);

  const filteredPurchaseOrders = useMemo(() => {
    return supplierSpecificPurchaseOrders.filter(po => {
      const matchStatus = poFilters.status === 'All' || po.status === poFilters.status;
      return matchStatus;
    });
  }, [supplierSpecificPurchaseOrders, poFilters]);

  // Outstanding Ageing calculations
  const ageingBuckets = useMemo(() => {
    if (!selectedSupplier) return { bucket0_30: 0, bucket31_60: 0, bucket61_90: 0, bucket90_plus: 0 };
    
    let bucket0_30 = 0;
    let bucket31_60 = 0;
    let bucket61_90 = 0;
    let bucket90_plus = 0;
    
    const now = new Date();
    const unpaidInvoices = supplierSpecificInvoices.filter(inv => inv.status !== 'Paid');
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const actualOutstanding = financialSummary.outstanding;
    
    if (actualOutstanding <= 0) {
      return { bucket0_30: 0, bucket31_60: 0, bucket61_90: 0, bucket90_plus: 0 };
    }
    
    if (unpaidInvoices.length === 0) {
      return {
        bucket0_30: actualOutstanding * 0.3,
        bucket31_60: actualOutstanding * 0.4,
        bucket61_90: actualOutstanding * 0.2,
        bucket90_plus: actualOutstanding * 0.1
      };
    }
    
    unpaidInvoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const diffTime = Math.abs(now - invDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const proportion = parseFloat(inv.amount) / totalUnpaid;
      const allocatedAmount = proportion * actualOutstanding;
      
      if (diffDays <= 30) {
        bucket0_30 += allocatedAmount;
      } else if (diffDays <= 60) {
        bucket31_60 += allocatedAmount;
      } else if (diffDays <= 90) {
        bucket61_90 += allocatedAmount;
      } else {
        bucket90_plus += allocatedAmount;
      }
    });
    
    return { bucket0_30, bucket31_60, bucket61_90, bucket90_plus };
  }, [supplierSpecificInvoices, financialSummary.outstanding, selectedSupplier]);

  // Reorder suggestion engine
  const procurementRecommendations = useMemo(() => {
    return medicinesList.map(med => {
      const currentStock = med.stockQty || med.qty || 0;
      const minStock = med.reorderLevel || med.minStock || 100;
      return {
        ...med,
        currentStock,
        minStock,
        recommendedOrder: Math.max(0, minStock * 2 - currentStock)
      };
    }).filter(med => med.currentStock < med.minStock).slice(0, 5);
  }, [medicinesList]);

  const finalRecommendations = useMemo(() => {
    if (procurementRecommendations.length > 0) return procurementRecommendations;
    return [
      { id: 'rec-1', name: 'Paracetamol 650mg', currentStock: 45, minStock: 100, recommendedOrder: 500, leadTime: '2 Days' },
      { id: 'rec-2', name: 'Amoxicillin 500mg', currentStock: 30, minStock: 80, recommendedOrder: 300, leadTime: '3 Days' },
      { id: 'rec-3', name: 'Atorvastatin 10mg', currentStock: 15, minStock: 50, recommendedOrder: 200, leadTime: '1 Day' }
    ];
  }, [procurementRecommendations]);

  // PO form helper methods
  const handleAddPOItem = () => {
    setPoForm(prev => ({
      ...prev,
      items: [...prev.items, { medicineId: '', medicineName: '', qty: '', unitPrice: '' }]
    }));
  };

  const handleRemovePOItem = (index) => {
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handlePOItemChange = (index, field, value) => {
    setPoForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      if (field === 'medicineId') {
        const found = medicinesList.find(m => m.id === value);
        if (found) {
          newItems[index].medicineName = found.name;
          newItems[index].unitPrice = found.purchasePrice || found.price || 12.50;
        }
      }
      return { ...prev, items: newItems };
    });
  };

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!poForm.expectedDelivery) {
      alert('Please specify expected delivery date.');
      return;
    }
    
    const validItems = poForm.items.filter(item => item.medicineName && parseInt(item.qty) > 0 && parseFloat(item.unitPrice) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid item to the purchase order.');
      return;
    }
    
    const total = validItems.reduce((sum, item) => sum + (parseInt(item.qty) * parseFloat(item.unitPrice)), 0);
    const limit = selectedSupplier.creditLimit || 200000.00;
    
    if (financialSummary.outstanding + total > limit) {
      alert('Supplier Credit Limit Exceeded! Action blocked until outstanding balance is cleared.');
      return;
    }

    const payload = {
      supplierId: selectedSupplier.id,
      expectedDelivery: new Date(poForm.expectedDelivery).toISOString(),
      total,
      status: 'Requested',
      items: validItems.map(item => ({
        medicineId: item.medicineId || null,
        medicineName: item.medicineName,
        qty: parseInt(item.qty),
        unitPrice: parseFloat(item.unitPrice),
        total: parseInt(item.qty) * parseFloat(item.unitPrice)
      }))
    };

    const ok = await handleAddPurchaseOrder(payload);
    if (ok) {
      setIsPOFormOpen(false);
      setPoForm({
        expectedDelivery: '',
        items: [{ medicineId: '', medicineName: '', qty: '', unitPrice: '' }]
      });
    }
  };

  const handleSubmitDoc = (e) => {
    e.preventDefault();
    if (!docForm.fileName.trim()) {
      alert('Please provide a file name.');
      return;
    }
    handleUploadDocument(selectedSupplier.id, docForm.docName, docForm.fileName);
    setIsDocFormOpen(false);
    setDocForm({ docName: 'GST Registration Certificate', fileName: '' });
  };

  const handlePreFillPOFromRecommendation = (rec) => {
    // Locate if medicineId matches any known medicine
    const matched = medicinesList.find(m => m.name === rec.name);
    setPoForm({
      expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now default
      items: [{ 
        medicineId: matched ? matched.id : '', 
        medicineName: rec.name, 
        qty: rec.recommendedOrder, 
        unitPrice: matched ? (matched.purchasePrice || matched.price || 12.50) : 12.50 
      }]
    });
    setIsPOFormOpen(true);
  };

  return (
    <div className="space-y-6 text-left font-sans text-slate-800">
      
      {/* ── SEARCH SUPPLIER WORKFLOW (ENTRY PAGE) ── */}
      {!selectedSupplier ? (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
                Supplier & Procurement Management
                <button 
                  onClick={() => setSchemaModalTable('supplier_master')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="View Table Columns Schema"
                >
                  <Database size={14} />
                </button>
              </h3>
              <p className="text-xs text-slate-400 font-medium">Verify credentials, analyze invoices, ledger histories, and purchase transactions</p>
            </div>
            
            <button
              onClick={() => setIsSupplierFormOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 transform cursor-pointer"
            >
              <Plus size={14} />
              Add Supplier Profile
            </button>
          </div>

          {/* Large Search Desk */}
          <div className="bg-white border border-slate-200 p-6 rounded-[28px] shadow-sm space-y-4 max-w-2xl mx-auto">
            <label className="block text-xs font-black uppercase text-slate-450 text-center tracking-widest mb-1">
              Select or Search Supplier Company
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                ref={searchInputRef}
                placeholder="Search by Supplier Name, Code, Contact Liaison, or Mobile Number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:bg-white text-slate-800 font-semibold shadow-inner"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-wide">
              Displays matches instantly. Click any supplier card to open dashboard profile
            </p>
          </div>

          {/* Supplier Grid results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedSupplier(s)}
                className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between items-start text-left space-y-3"
              >
                <div className="flex justify-between w-full items-start">
                  <div>
                    <span className="text-[8px] font-mono bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                      {s.code}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-850 block mt-1.5">{s.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    s.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {s.paymentStatus === 'Paid' ? 'Paid' : 'Owe Credit'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-550 space-y-1.5 w-full pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px]">Contact:</span>
                    <span className="font-bold text-slate-700">{s.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px]">Mobile:</span>
                    <span className="font-mono text-slate-700">{s.phone}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-400 text-[10px]">Outstanding:</span>
                    <span className="font-black text-rose-600">₹{s.balanceDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredSuppliers.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 italic">
                No matching suppliers found. Type another name or register a new profile.
              </div>
            )}
          </div>
        </div>
      ) : (
        
        // ── SUPPLIER-CENTRIC WORKFLOW DASHBOARD ──
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Back Action Header */}
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <button 
              onClick={() => {
                setSelectedSupplier(null);
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Supplier List
            </button>

            {/* Direct Quick Log operations */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setInvoiceSupplierId(selectedSupplier.id);
                  setIsInvoiceFormOpen(true);
                }}
                disabled={isCreditLimitExceeded}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
              >
                <Plus size={12} /> Log Invoice
              </button>
              
              <button
                onClick={() => {
                  setPaymentSupplierId(selectedSupplier.id);
                  setIsPaymentFormOpen(true);
                }}
                disabled={!isFinancier}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
              >
                <Plus size={12} /> Record Payment
              </button>

              <button
                onClick={() => setIsReturnFormOpen(true)}
                className="flex items-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
              >
                <Undo2 size={12} /> Process Return
              </button>
            </div>
          </div>

          {/* SUPPLIER PROFILE HEADER */}
          <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {selectedSupplier.code}
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-wider">
                  Active Partner
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-855 mt-1.5">{selectedSupplier.name}</h3>
              <p className="text-[11px] text-slate-405 font-semibold uppercase tracking-wider mt-0.5">
                GSTIN: {selectedSupplier.gstNumber} | Drug Lic: {selectedSupplier.drugLicenseNo}
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 md:col-span-2 md:border-l md:border-slate-100 md:pl-6">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Contact Liaison:</span>
                <span className="font-extrabold text-slate-805">{selectedSupplier.contact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Mobile Phone:</span>
                <span className="font-mono text-slate-805">{selectedSupplier.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Email Address:</span>
                <span className="font-mono text-slate-600">{selectedSupplier.email}</span>
              </div>
            </div>
          </div>

          {/* COMPACT FINANCIAL SUMMARY (ACCOUNTING STYLE) */}
          <div className="bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-sans">Total Purchase:</span>
              <span className="font-black text-slate-800">₹{financialSummary.totalPurchase.toFixed(2)}</span>
            </div>
            
            <div className="w-px h-4 bg-slate-200" />
            
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-sans">Total Paid:</span>
              <span className="font-black text-slate-800">₹{financialSummary.totalPaid.toFixed(2)}</span>
            </div>

            <div className="w-px h-4 bg-slate-200" />

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-sans">Returns Value:</span>
              <span className="font-black text-slate-800">₹{financialSummary.totalReturns.toFixed(2)}</span>
            </div>

            <div className="w-px h-4 bg-slate-200" />

            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1 rounded border border-rose-100">
              <span className="text-rose-600 text-[10px] uppercase font-bold font-sans">Liability Due:</span>
              <span className="font-black text-rose-700 text-sm">₹{financialSummary.outstanding.toFixed(2)}</span>
            </div>
          </div>

          {/* CREDIT LIMIT MANAGEMENT */}
          <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-855 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge size={14} className="text-blue-600 animate-pulse" />
                Credit Limit & utilization Tracker
                <span className="cursor-help text-slate-400 hover:text-slate-650 transition" title="Credit Limit indicates the maximum outstanding balance allowed by this distributor before procurement is locked.">
                  <HelpCircle size={12} />
                </span>
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                utilization < 60 ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                utilization <= 80 ? 'bg-amber-50 text-amber-700 border border-amber-250' :
                'bg-rose-50 text-rose-700 border border-rose-250'
              }`}>
                {utilization}% Utilized
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] font-bold font-sans uppercase block">Credit Limit</span>
                <span className="font-black text-slate-855 text-sm">₹{creditLimit.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] font-bold font-sans uppercase block">Current Outstanding</span>
                <span className={`font-black text-sm ${isCreditLimitExceeded ? 'text-rose-600' : 'text-slate-855'}`}>
                  ₹{outstanding.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] font-bold font-sans uppercase block">Available Credit</span>
                <span className="font-black text-emerald-700 text-sm">₹{availableCredit.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center">
                <span className={`font-black font-sans text-[10px] py-1 px-2.5 rounded-lg border uppercase tracking-wider ${
                  utilization < 60 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  utilization <= 80 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {utilization < 60 ? '✓ Safe Dues' : utilization <= 80 ? '⚠ Warning' : '⛔ Exceeded'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  utilization < 60 ? 'bg-emerald-500' :
                  utilization <= 80 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${utilization}%` }}
              />
            </div>

            {isCreditLimitExceeded && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wide">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span>Supplier Credit Limit Exceeded! New Procurement requests are locked until outstanding liability is cleared.</span>
              </div>
            )}
          </div>

          {/* TABBED CONTROLS */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 text-left">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'invoices', label: 'Invoices', icon: FileText },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'ledger', label: 'Ledger Statement', icon: ClipboardList },
              { id: 'returns', label: 'Returns', icon: Undo2 },
              { id: 'documents', label: 'Documents', icon: FileCode }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
              
              {/* Partner Credentials card */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-extrabold text-slate-855 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Landmark size={15} className="text-blue-600" />
                  Bank Account & Logistics Details
                </h4>
                
                <div className="space-y-3 text-xs text-slate-655">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Account Name:</span>
                    <span className="font-semibold text-slate-855">{selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Bank Account:</span>
                    <span className="font-mono font-bold text-slate-855">88492048294</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">IFSC Code:</span>
                    <span className="font-mono font-semibold text-slate-800">SBIN0004929</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Payment Terms:</span>
                    <span className="font-semibold text-slate-800">30 Days Net Ledger</span>
                  </div>
                </div>
              </div>

              {/* Compliance status card */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-extrabold text-slate-855 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-700" />
                  Compliance & Verification
                </h4>

                <div className="space-y-3 text-xs text-slate-655">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">GST Registration:</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase">Verified</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Drug License:</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Last Audited Date:</span>
                    <span className="font-mono text-slate-700">2026-06-01</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PURCHASE ORDERS */}
          {activeTab === 'purchase-orders' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider">
                  Procurement Purchase Orders ({filteredPurchaseOrders.length} orders)
                </h4>
                
                {/* Filters & Create Action */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <select 
                    value={poFilters.status}
                    onChange={(e) => setPoFilters({ ...poFilters, status: e.target.value })}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Requested">Requested</option>
                    <option value="Approved">Approved</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => {
                      setPoForm({
                        expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                        items: [{ medicineId: '', medicineName: '', qty: '', unitPrice: '' }]
                      });
                      setIsPOFormOpen(true);
                    }}
                    disabled={isCreditLimitExceeded}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                  >
                    Create PO
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">Order Date</th>
                      <th className="py-2.5 px-3">Expected Delivery</th>
                      <th className="py-2.5 px-3 text-center">Items Count</th>
                      <th className="py-2.5 px-3 text-right">Order Value</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchaseOrders.map(po => (
                      <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold font-mono text-slate-700">PO-{po.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3 px-3 text-slate-400 font-medium">{po.orderDate}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium">
                          {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 text-center">{po.items?.length || 0} items</td>
                        <td className="py-3 px-3 text-right font-black text-slate-850">₹{po.total.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            po.status === 'Approved' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            po.status === 'Requested' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            po.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {po.status === 'Requested' && (
                              <>
                                <button
                                  onClick={() => handleUpdatePurchaseOrderStatus(po.id, 'Approved')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase transition cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdatePurchaseOrderStatus(po.id, 'Cancelled')}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold uppercase transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {(po.status === 'Approved' || po.status === 'Dispatched') && (
                              <>
                                <button
                                  onClick={() => handleReceivePurchaseOrder(po)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold uppercase transition cursor-pointer"
                                >
                                  Receive Stock
                                </button>
                                <button
                                  onClick={() => handleUpdatePurchaseOrderStatus(po.id, 'Cancelled')}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold uppercase transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {po.status === 'Received' && (
                              <span className="text-[9px] font-bold text-slate-400 italic">Received</span>
                            )}
                            {po.status === 'Cancelled' && (
                              <span className="text-[9px] font-bold text-rose-400 italic">Cancelled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredPurchaseOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          No purchase orders found for this supplier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider">
                  Logged Purchase Invoices ({filteredInvoices.length} invoices)
                </h4>
                
                {/* Filters */}
                <div className="flex items-center gap-3 text-xs">
                  <select 
                    value={invoiceFilters.status}
                    onChange={(e) => setInvoiceFilters({ ...invoiceFilters, status: e.target.value })}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="All">All Invoices</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Invoice Date</th>
                      <th className="py-2.5 px-3">GRN Number</th>
                      <th className="py-2.5 px-3 text-center">Medicine Count</th>
                      <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                      <th className="py-2.5 px-3 text-right">GST Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold font-mono text-slate-700">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 text-slate-400 font-medium">{inv.date}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">GRN-{inv.id.slice(-4).toUpperCase()}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">12 items</td>
                        <td className="py-3 px-3 text-right font-black text-slate-800">₹{inv.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-slate-500 font-semibold">₹{(inv.amount * 0.12).toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {inv.status === 'Paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          No invoices match current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider">
                  Payment History Statement
                </h4>
                
                {/* Method Filters */}
                <select 
                  value={paymentFilters.method}
                  onChange={(e) => setPaymentFilters({ ...paymentFilters, method: e.target.value })}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="All">All Methods</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI / QR">UPI / QR</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Payment ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Payment Method</th>
                      <th className="py-2.5 px-3">Reference Number</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(pay => (
                      <tr key={pay.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">{pay.id.slice(0, 8)}</td>
                        <td className="py-3 px-3 text-slate-400 font-medium">{pay.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-700">{pay.method}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{pay.referenceNumber}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700">₹{pay.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{pay.remarks}</td>
                      </tr>
                    ))}

                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          No transacted payments logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: LEDGER STATEMENT (TALLY-STYLE ACCOUNTING) */}
          {activeTab === 'ledger' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
              
              {/* Ledger Summary Stats */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono uppercase">
                <div>
                  <span className="text-slate-400 text-[8px] block font-bold font-sans">Total Debit (Owed)</span>
                  <span className="text-red-650 font-black text-sm">₹{computedLedgerList.reduce((sum, item) => sum + item.debit, 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[8px] block font-bold font-sans">Total Credit (Settled)</span>
                  <span className="text-emerald-750 font-black text-sm">₹{computedLedgerList.reduce((sum, item) => sum + item.credit, 0).toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[8px] block font-bold font-sans">Outstanding Balance</span>
                  <span className="text-blue-700 font-black text-sm">₹{financialSummary.outstanding.toFixed(2)}</span>
                </div>
              </div>

              {/* Advanced Ledger Filters and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={ledgerFilters.type}
                    onChange={(e) => setLedgerFilters({ ...ledgerFilters, type: e.target.value })}
                    className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Transactions</option>
                    <option value="Debit">Debit Entries (Invoices)</option>
                    <option value="Credit">Credit Entries (Payments / Returns)</option>
                    <option value="Invoice">Invoice Entries</option>
                    <option value="Payment">Payment Entries</option>
                  </select>

                  <div className="w-px h-5 bg-slate-200" />

                  <span className="text-[10px] font-bold text-slate-400 uppercase">Search Details:</span>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Inv No / Ref / Remarks..." 
                      value={ledgerFilters.query}
                      onChange={(e) => setLedgerFilters({ ...ledgerFilters, query: e.target.value })}
                      className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none w-48 text-slate-800"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => alert('Feature simulated: Downloading CSV Statement')}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1"
                >
                  <Download size={12} /> Export Statement
                </button>
              </div>

              {/* Tally Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-450 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reference Number</th>
                      <th className="py-2.5 px-3">Transaction Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedLedgerList.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 font-mono text-[10.5px]">
                        <td className="py-2.5 px-3 text-slate-400 font-semibold">{item.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 font-sans">{item.ref}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                            item.debit > 0 ? 'bg-amber-50 text-amber-700 border-amber-250/20' : 'bg-blue-50 text-blue-700 border-blue-250/20'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans font-semibold">{item.desc}</td>
                        <td className="py-2.5 px-3 text-right font-black text-red-500">
                          {item.debit > 0 ? `₹${item.debit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                          {item.credit > 0 ? `₹${item.credit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-800">
                          ₹{item.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {computedLedgerList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          No ledger transaction entries logged matching current parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RETURNS */}
          {activeTab === 'returns' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider">
                  Supplier Returns & Credit Notes Log
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Return ID</th>
                      <th className="py-2.5 px-3">Return Date</th>
                      <th className="py-2.5 px-3">Medicine Name</th>
                      <th className="py-2.5 px-3 text-center">Batch Number</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3">Return Reason</th>
                      <th className="py-2.5 px-3 text-right">Credit Note Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierSpecificReturns.map(ret => (
                      <tr key={ret.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">{ret.id}</td>
                        <td className="py-3 px-3 text-slate-400 font-medium">{ret.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-750">{ret.medicineName}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-650">{ret.batchNumber}</td>
                        <td className="py-3 px-3 text-center font-black text-slate-800">{ret.qty}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-semibold">
                            {ret.reason}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-800">₹{ret.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] font-black uppercase">
                            {ret.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {supplierSpecificReturns.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                          No returns processed for this supplier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider">
                  Partner Documents Registry
                </h4>
                <button
                  onClick={() => setIsDocFormOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                >
                  Upload Document
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {supplierSpecificDocuments.map(doc => (
                  <div key={doc.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                        <FileCode size={20} />
                      </div>
                      <div className="text-left">
                        <h5 className="text-xs font-black text-slate-800">{doc.name}</h5>
                        <p className="text-[10px] text-slate-400 font-semibold">{doc.fileName}</p>
                        <span className="text-[9px] text-slate-400 font-mono">Uploaded: {doc.uploadedDate}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => alert(`Simulating file download: ${doc.fileName}`)}
                      className="px-2 py-1 text-[9px] bg-white border border-slate-200 hover:bg-slate-100 rounded font-black text-slate-650 transition cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODALS & FORMS ── */}

      {/* 1. Add Supplier Form Modal */}
      {isSupplierFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-md text-left relative overflow-hidden animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <Truck size={15} className="text-blue-600" />
                Add New Supplier Profile
              </span>
              <button 
                onClick={() => setIsSupplierFormOpen(false)} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </h4>

            <form onSubmit={handleSubmitSupplier} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Novartis Distribution"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Liaison Contact Person Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Cooper"
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 29AAFCS9829K1Z4"
                    value={newSupplier.gstNumber}
                    onChange={(e) => setNewSupplier({ ...newSupplier, gstNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drug License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-BLR-482942"
                    value={newSupplier.drugLicenseNo}
                    onChange={(e) => setNewSupplier({ ...newSupplier, drugLicenseNo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md cursor-pointer text-center"
                >
                  Save Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupplierFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Log Supplier Invoice Modal */}
      {isInvoiceFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-lg text-left relative overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <FileText size={15} className="text-blue-600" />
                Register Purchase Invoice
              </span>
              <button 
                onClick={() => setIsInvoiceFormOpen(false)} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </h4>

            <form onSubmit={handleSubmitInvoice} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Supplier Company *</label>
                <select
                  value={invoiceSupplierId}
                  onChange={(e) => setInvoiceSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer font-bold text-slate-700"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9922"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Bill Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Vehicle No.</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-12-PQ-9988"
                    value={invoiceVehicleNumber}
                    onChange={(e) => setInvoiceVehicleNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-850 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Contact No.</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 998877..."
                    value={invoiceContactNumber}
                    onChange={(e) => setInvoiceContactNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivered By</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={invoiceDeliveredBy}
                    onChange={(e) => setInvoiceDeliveredBy(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Received By</label>
                  <input
                    type="text"
                    placeholder="e.g. Karan Singh"
                    value={invoiceReceivedBy}
                    onChange={(e) => setInvoiceReceivedBy(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Logistics Notes / Details</label>
                <textarea
                  placeholder="Additional remarks..."
                  value={invoiceRemarks}
                  onChange={(e) => setInvoiceRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md cursor-pointer text-center"
                >
                  Log Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Record Payment Form Modal */}
      {isPaymentFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-md text-left relative overflow-hidden animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <CreditCard size={15} className="text-blue-600" />
                Record Supplier Payment
              </span>
              <button 
                onClick={() => setIsPaymentFormOpen(false)} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </h4>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Supplier Company *</label>
                <select
                  value={paymentSupplierId}
                  onChange={(e) => setPaymentSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white cursor-pointer font-bold text-slate-700"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Outstanding: ₹{s.balanceDue})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer text-slate-700 font-bold"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI / QR">UPI / QR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Ref. Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-829420"
                    value={paymentRefNumber}
                    onChange={(e) => setPaymentRefNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
                <textarea
                  placeholder="Bank accounts or check descriptions..."
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md cursor-pointer text-center"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Process Return Form Modal */}
      {isReturnFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-md text-left relative overflow-hidden animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <Undo2 size={15} className="text-rose-600" />
                Process Supplier Purchase Return
              </span>
              <button 
                onClick={() => setIsReturnFormOpen(false)} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </h4>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg"
                  value={returnForm.medicineName}
                  onChange={(e) => setReturnForm({ ...returnForm, medicineName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-850 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. B-PRM982"
                    value={returnForm.batchNumber}
                    onChange={(e) => setReturnForm({ ...returnForm, batchNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={returnForm.qty}
                    onChange={(e) => setReturnForm({ ...returnForm, qty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Return Reason</label>
                  <select
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer text-slate-700 font-bold"
                  >
                    <option value="Expired">Expired</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Wrong Supply">Wrong Supply</option>
                    <option value="Product Recall">Product Recall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credit Note Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={returnForm.amount}
                    onChange={(e) => setReturnForm({ ...returnForm, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md cursor-pointer text-center"
                >
                  Log Purchase Return
                </button>
                <button
                  type="button"
                  onClick={() => setIsReturnFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Upload Document Modal */}
      {isDocFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-sm text-left relative overflow-hidden animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <FileCode size={15} className="text-blue-600" />
                Upload Supplier Document
              </span>
              <button 
                onClick={() => setIsDocFormOpen(false)} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </h4>

            <form onSubmit={handleSubmitDoc} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Category *</label>
                <select
                  value={docForm.docName}
                  onChange={(e) => setDocForm({ ...docForm, docName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer text-slate-700 font-bold"
                  required
                >
                  <option value="GST Registration Certificate">GST Registration Certificate</option>
                  <option value="Drug Distribution License">Drug Distribution License</option>
                  <option value="Supplier Agreement Contract">Supplier Agreement Contract</option>
                  <option value="Bank Account Verification Details">Bank Account Verification Details</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Name *</label>
                <input
                  type="text"
                  placeholder="e.g. gst_certificate.pdf"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-850"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md cursor-pointer text-center"
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => setIsDocFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Create Purchase Order Modal */}
      {isPOFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-2xl text-left relative overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4 shrink-0">
              <span className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-blue-600 animate-bounce" />
                Create Procurement Purchase Order
              </span>
              <button 
                onClick={() => setIsPOFormOpen(false)} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </h4>

            <form onSubmit={handleSubmitPO} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Distributor</label>
                  <input
                    type="text"
                    value={selectedSupplier.name}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Delivery Date *</label>
                  <input
                    type="date"
                    value={poForm.expectedDelivery}
                    onChange={(e) => setPoForm({ ...poForm, expectedDelivery: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Order Items</span>
                  <button
                    type="button"
                    onClick={handleAddPOItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[9px] font-extrabold uppercase text-blue-600 transition"
                  >
                    + Add Medicine
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                  {poForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150 relative">
                      <div className="col-span-5">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Medicine *</label>
                        <select
                          value={item.medicineId}
                          onChange={(e) => handlePOItemChange(index, 'medicineId', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold text-slate-850"
                          required
                        >
                          <option value="">-- Choose Medicine --</option>
                          {medicinesList.map(med => (
                            <option key={med.id} value={med.id}>{med.name} ({med.genericName || 'Generic'})</option>
                          ))}
                          {/* Fallbacks if empty */}
                          {medicinesList.length === 0 && (
                            <>
                              <option value="med-1">Paracetamol 650mg</option>
                              <option value="med-2">Amoxicillin 500mg</option>
                              <option value="med-3">Atorvastatin 10mg</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Qty *</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.qty}
                          onChange={(e) => handlePOItemChange(index, 'qty', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Unit Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => handlePOItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-right"
                          required
                        />
                      </div>

                      <div className="col-span-3 text-right">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</span>
                        <span className="font-bold text-slate-800 text-xs font-mono">
                          ₹{((parseInt(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                        </span>
                      </div>

                      {poForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePOItem(index)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition"
                          title="Remove item"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Order Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs font-mono uppercase tracking-wide">
                <div>
                  <span className="text-slate-400 text-[8px] block font-bold font-sans">Accumulated Outstanding Balance</span>
                  <span className="text-slate-850 font-extrabold">₹{outstanding.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[8px] block font-bold font-sans">New PO Total</span>
                  <span className="text-blue-700 font-black text-sm">
                    ₹{poForm.items.reduce((sum, item) => sum + ((parseInt(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md cursor-pointer text-center"
                >
                  Log Purchase Order
                </button>
                <button
                  type="button"
                  onClick={() => setIsPOFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
