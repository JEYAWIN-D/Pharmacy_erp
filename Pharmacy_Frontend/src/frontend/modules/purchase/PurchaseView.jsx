import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

import { 
  Database, FileText, Plus, PackageCheck, ClipboardList,
  CheckCircle, AlertTriangle, TrendingUp, Truck, Layers,
  Search, X, Calendar, User, Building, ShieldAlert,
  ArrowRight, Check, Play, Edit3, Trash, Info, RefreshCw, Edit, ChevronRight
} from 'lucide-react';
import { usePurchaseController } from './usePurchaseController';
import { usePurchaseRequestController } from './usePurchaseRequestController';
import { useGRNController } from './useGRNController';
import { purchaseAPI } from '../../db/api.js';
import { useToast } from '../billing/useToast';
import ToastContainer from '../billing/ToastContainer';

// Helper: extract supplier name safely
const getSupplierName = (sup) => {
  if (!sup) return 'Unknown Supplier';
  if (typeof sup === 'object') return sup.name || 'Unknown Supplier';
  return sup;
};

const getPOStatusDisplay = (status) => {
  if (status === 'PO_GENERATED' || status === 'Draft') return 'Pending';
  if (status === 'PO_CONFIRMED' || status === 'Sent') return 'Confirmed';
  if (status === 'PARTIALLY_RECEIVED' || status === 'Partially Received') return 'Partially Received';
  if (status === 'COMPLETED' || status === 'Completed' || status === 'Closed') return 'Completed';
  if (status === 'CANCELLED' || status === 'Cancelled' || status === 'Rejected') return 'Cancelled';
  return status;
};

// Searchable Dropdown / Combobox Component (Keyboard Navigable)
function SearchableDropdown({ options, value, onChange, placeholder, inputClass, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const selectedOpt = options.find(opt => String(opt.id) === String(value) || String(opt.name) === String(value));
    if (selectedOpt) {
      setSearchTerm(selectedOpt.name || selectedOpt.id);
    } else {
      setSearchTerm(value || '');
    }
  }, [value, options]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        const selectedOpt = options.find(opt => String(opt.id) === String(value) || String(opt.name) === String(value));
        if (selectedOpt) {
          setSearchTerm(selectedOpt.name || selectedOpt.id);
        } else {
          setSearchTerm(value || '');
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return options.filter(opt => {
      const name = String(opt.name || opt.id || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, options]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (filteredOptions.length > 0) {
        setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (isOpen && filteredOptions.length > 0) {
        setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        e.preventDefault();
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const selected = filteredOptions[highlightedIndex];
        onChange(selected.id);
        setSearchTerm(selected.name || selected.id);
        setIsOpen(false);
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className || ''}`}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(e.target.value.trim() !== '');
          setHighlightedIndex(-1);
          if (e.target.value === '') {
            onChange('');
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        placeholder={placeholder}
        className={inputClass || "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-705 focus:ring-2 focus:ring-blue-500 focus:outline-none"}
      />
      {isOpen && searchTerm.trim() !== '' && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={opt.id || opt.name}
                onClick={() => {
                  onChange(opt.id);
                  setSearchTerm(opt.name || opt.id);
                  setIsOpen(false);
                }}
                className={`p-2.5 text-xs font-bold cursor-pointer transition-colors border-b border-slate-50 last:border-b-0 ${
                  highlightedIndex === idx ? 'bg-blue-100 text-blue-800' : 'text-slate-750 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {opt.name || opt.id} {opt.stock !== undefined ? `(Stock: ${opt.stock})` : ''}
              </div>
            ))
          ) : (
            <div className="p-2.5 text-xs text-slate-400 italic font-medium">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PurchaseView({ role, setSchemaModalTable }) {
  // Date range filter state for dashboard and procurement history
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const startDateRef = React.useRef(null);
  const endDateRef = React.useRef(null);

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  // Parse typed DD/MM/YYYY to YYYY-MM-DD
  const parseTypedDate = (str) => {
    if (!str) return '';
    const parts = str.replace(/\//g, '-').split('-');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d && m && y && y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  };
  const handlePrintPO = (po) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Popup blocker blocked invoice print. Please allow popups.');
      return;
    }
    const itemsHtml = po.items.map(it => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${it.medicineName || 'Unknown'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${it.qty}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(it.unitPrice).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${it.tax || 0}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${Number(it.total).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order ${po.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: #1e3a8a; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
            .header-info { display: flex; justify-content: space-between; margin-top: 15px; margin-bottom: 15px; font-size: 14px; }
            .totals { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>PURCHASE ORDER</h2>
          <div style="font-size: 12px; color: #666;">PO Reference: ${po.id}</div>
          <hr />
          <div class="header-info">
            <div>
              <strong>Supplier:</strong> ${getSupplierName(po.supplier)}<br/>
              <strong>Date:</strong> ${new Date(po.createdAt).toLocaleDateString('en-IN')}<br/>
              <strong>Expected Delivery:</strong> ${po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN') : 'N/A'}
            </div>
            <div>
              <strong>Payment Terms:</strong> ${po.paymentTerms || 'Net 30'}<br/>
              <strong>Status:</strong> ${po.status}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th style="text-align: center;">Qty Ordered</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Tax Rate</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">Grand Total: ₹${Number(po.total).toFixed(2)}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getMedicineProcurementStatus = (medicineId) => {
    const activePOForGRN = purchaseOrders.find(po => 
      ['Delivered', 'Partially Received'].includes(po.status) &&
      po.items?.some(it => it.medicineId === medicineId)
    );
    if (activePOForGRN) {
      return { stage: 'GRN Pending', actionText: 'Create/View GRN', tab: 'grn', subView: 'create', id: activePOForGRN.id };
    }

    const activeShipment = shipments.find(sh =>
      sh.status !== 'Delivered' &&
      sh.items?.some(it => it.medicineId === medicineId)
    );
    if (activeShipment) {
      return { stage: 'Shipment Started', actionText: 'Track Shipment', tab: 'shipments', subView: 'list', id: activeShipment.id };
    }

    const activePOShipped = purchaseOrders.find(po =>
      ['Shipped', 'In Transit'].includes(po.status) &&
      po.items?.some(it => it.medicineId === medicineId)
    );
    if (activePOShipped) {
      return { stage: 'Shipment Started', actionText: 'Track Shipment', tab: 'shipments', subView: 'list', id: activePOShipped.id };
    }

    const activePO = purchaseOrders.find(po =>
      ['Draft', 'Sent', 'Accepted'].includes(po.status) &&
      po.items?.some(it => it.medicineId === medicineId)
    );
    if (activePO) {
      return { stage: 'Purchase Order Created', actionText: 'View Purchase Order', tab: 'po', subView: 'details', id: activePO.id };
    }

    const activePR = purchaseRequests.find(pr =>
      ['Pending', 'Approved', 'Partially Approved'].includes(pr.status) &&
      pr.items?.some(it => it.medicineId === medicineId)
    );
    if (activePR) {
      return { stage: 'Purchase Request Created', actionText: 'View Purchase Request', tab: 'pr', subView: 'details', id: activePR.id };
    }

    const completedPO = completedPOs.find(po =>
      po.items?.some(it => it.medicineId === medicineId)
    );
    if (completedPO) {
      return { stage: 'Completed', actionText: 'View Procurement History', tab: 'completed', subView: 'list', id: completedPO.id };
    }

    return { stage: 'Low Stock', actionText: 'Create Purchase Request', tab: 'pr', subView: 'create', id: null };
  };

  const getPOTraceTimeline = (po) => {
    const timeline = [];
    
    timeline.push({ name: 'PO Created', done: true, date: new Date(po.createdAt).toLocaleDateString('en-IN') });

    const isConfirmed = ['PO_CONFIRMED', 'Sent', 'Accepted', 'Shipped', 'In Transit', 'Delivered', 'Partially Received', 'Completed', 'COMPLETED'].includes(po.status);
    timeline.push({ name: 'PO Confirmed', done: isConfirmed, date: isConfirmed ? 'Yes' : 'Pending' });

    const hasGRN = (po.grns && po.grns.length > 0) || ['Partially Received', 'Completed', 'COMPLETED', 'PARTIALLY_RECEIVED'].includes(po.status);
    timeline.push({ name: 'GRN Recorded', done: hasGRN, date: hasGRN ? 'Yes' : 'Pending' });

    const isCompleted = po.status === 'Completed' || po.status === 'Closed' || po.status === 'COMPLETED';
    timeline.push({ name: 'Completed', done: isCompleted, date: isCompleted ? new Date(po.updatedAt).toLocaleDateString('en-IN') : 'Pending' });

    return timeline;
  };

  // Load controllers
  const {
    purchaseOrders,
    setPurchaseOrders,
    suppliers,
    medicines,
    poSupplier, setPoSupplier,
    poDeliveryDate, setPoDeliveryDate,
    poPaymentTerms, setPoPaymentTerms,
    poCommunicationMethod, setPoCommunicationMethod,
    sendPO,
    supplierAcceptPO,
    supplierRejectPO,
    closePO,
    handleCreatePO,
    poMode, setPoMode,
    linkedPRId, setLinkedPRId,
    prApprovedItems, setPrApprovedItems,
    handleCreatePOFromPR,
    shipments,
    completedPOs,
    completedGRNs,
    loadingHistory,
    handleCreateShipment,
    handleUpdateShipmentStatus,
    refreshHistory
  } = usePurchaseController(role);

  const {
    purchaseRequests,
    newPR, setNewPR,
    addPRItem,
    removePRItem,
    updatePRItem,
    handleCreateRequest,
    handleAutoCreatePR,
    handleApprovePR,
    handleRejectPR
  } = usePurchaseRequestController(role);

  const {
    goodsReceipts,
    pendingGRNOrders,
    selectedPOId, setSelectedPOId,
    selectedShipmentId, setSelectedShipmentId,
    grnItems, setGrnItems,
    receivedBy, setReceivedBy,
    invoiceNumber, setInvoiceNumber,
    invoiceError, setInvoiceError,
    loadPOItems,
    loadDraftGRN,
    editingDraftId, setEditingDraftId,
    updateGrnItem,
    handleSubmitGRN
  } = useGRNController();

  // Navigation states for the 13 required pages
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, pr, po, shipments, grn, completed
  const [currentSubView, setCurrentSubView] = useState('list'); // list, create, details
  
  // Selection states
  const [selectedPRId, setSelectedPRId] = useState(null);
  const [selectedPOIdState, setSelectedPOIdState] = useState(null);
  const [selectedGRNIdState, setSelectedGRNIdState] = useState(null);
  const [selectedShipmentIdState, setSelectedShipmentIdState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [directMedicineId, setDirectMedicineId] = useState('');
  const [directQty, setDirectQty] = useState('50');
  const [directPrice, setDirectPrice] = useState('15.00');
  const [directTax, setDirectTax] = useState('12');
  const [poListTab, setPoListTab] = useState('Pending');
  const [grnListTab, setGrnListTab] = useState('Completed');

  const handleSelectDirectMedicine = (medId) => {
    setDirectMedicineId(medId);
    const med = medicines.find(m => m.id === medId);
    if (med) {
      if (med.pricePerPiece !== undefined) {
        setDirectPrice(Number(med.pricePerPiece).toFixed(2));
      } else {
        setDirectPrice('15.00');
      }
      if (med.taxPercentage !== undefined) {
        setDirectTax(String(med.taxPercentage));
      } else {
        setDirectTax('12');
      }
      if (med.supplier) {
        setPoSupplier(med.supplier.name);
      }
    }
  };

  // Toast hook & Low-Stock dashboard states
  const { toasts, toast, confirm, dismiss, resolveConfirm } = useToast();
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  
  // Comprehensive Advanced Filters State
  const [filters, setFilters] = useState({
    dashboard: { dateFrom: '', dateTo: '', supplier: '', medicine: '', unit: '', status: 'Pending' },
    po: { dateFrom: '', dateTo: '', supplier: '', medicine: '', priceMin: '', priceMax: '', unit: '', status: '', poId: '' },
    grn: { dateFrom: '', dateTo: '', supplier: '', medicine: '', invoice: '', poId: '', status: '', unit: '' },
    history: { dateFrom: '', dateTo: '', supplier: '', medicine: '', priceMin: '', priceMax: '', unit: '', poId: '', grnId: '', invoice: '', status: '' }
  });
  
  const updateFilter = (tab, field, value) => {
    setFilters(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  const clearFilters = (tab) => {
    setFilters(prev => ({
      ...prev,
      [tab]: {
        dateFrom: '', dateTo: '', supplier: '', medicine: '', unit: '', status: tab === 'dashboard' ? 'Pending' : '', 
        priceMin: '', priceMax: '', poId: '', grnId: '', invoice: ''
      }
    }));
  };

  const fetchLowStock = useCallback(async () => {
    setLoadingLowStock(true);
    try {
      const res = await purchaseAPI.getLowStock();
      if (res && res.success) {
        setLowStockItems(res.data);
      }
    } catch (err) {
      console.error('Error fetching low stock:', err);
      toast.error('Failed to load low-stock medicines: ' + err.message);
    } finally {
      setLoadingLowStock(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock, purchaseOrders]);

  // Invoice Debounce Validation
  useEffect(() => {
    if (!invoiceNumber || !selectedPOId) {
      setInvoiceError('');
      return;
    }
    const timer = setTimeout(async () => {
      const po = pendingGRNOrders.find(p => p.id === selectedPOId);
      const supplierId = po?.supplierId || po?.supplier?.id || (editingDraftId ? pendingGRNOrders.find(p => p.id === selectedPOId)?.supplierId : null);
      if (!supplierId) return;
      
      try {
        const res = await purchaseAPI.validateInvoiceNumber(supplierId, invoiceNumber, editingDraftId || '');
        if (res && res.exists) {
          setInvoiceError('This invoice number already exists for this supplier.');
        } else {
          setInvoiceError('');
        }
      } catch(err) {
        // Validation failed, ignore for now
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [invoiceNumber, selectedPOId, pendingGRNOrders, setInvoiceError]);

  // Keyboard-first navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (!activeEl) return;

      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT';

      // Enter key triggers click on focused elements
      if (e.key === 'Enter') {
        if (activeEl.classList.contains('kb-focusable')) {
          if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
            e.preventDefault();
            activeEl.click();
          }
        }
        return;
      }

      // Arrow keys navigation
      const focusables = Array.from(document.querySelectorAll('.kb-focusable'));
      if (focusables.length === 0) return;

      const currentIndex = focusables.indexOf(activeEl);

      if (e.key === 'ArrowDown') {
        // Move to the next data-kb-row element
        e.preventDefault();
        let targetIndex = currentIndex + 1;
        while (targetIndex < focusables.length) {
          const el = focusables[targetIndex];
          if (el.hasAttribute('data-kb-row')) {
            el.focus();
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            break;
          }
          targetIndex++;
        }
      } else if (e.key === 'ArrowUp') {
        // Move to the previous data-kb-row element
        e.preventDefault();
        let targetIndex = currentIndex - 1;
        while (targetIndex >= 0) {
          const el = focusables[targetIndex];
          if (el.hasAttribute('data-kb-row')) {
            el.focus();
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            break;
          }
          targetIndex--;
        }
      } else if (e.key === 'ArrowRight') {
        // Move to the next focusable column/button
        if (isInput && activeEl.type !== 'button' && activeEl.type !== 'submit' && activeEl.type !== 'checkbox' && activeEl.type !== 'radio') {
          return; // Let standard cursor movement work in text boxes
        }
        e.preventDefault();
        const nextEl = focusables[currentIndex + 1];
        if (nextEl) {
          nextEl.focus();
          nextEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowLeft') {
        // Move to the previous focusable column/button
        if (isInput && activeEl.type !== 'button' && activeEl.type !== 'submit' && activeEl.type !== 'checkbox' && activeEl.type !== 'radio') {
          return;
        }
        e.preventDefault();
        const prevEl = focusables[currentIndex - 1];
        if (prevEl) {
          prevEl.focus();
          prevEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus helper to prevent focus loss on tab or view changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl = document.activeElement;
      if (!activeEl || activeEl === document.body) {
        const first = document.querySelector('.kb-focusable');
        if (first) {
          first.focus();
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentTab, currentSubView, lowStockItems.length, purchaseOrders.length, goodsReceipts.length]);

  const handleCreatePOFromLowStock = async (item) => {
    const ok = await confirm(`Are you sure you want to create a Purchase Order for ${item.medicineName} with Suggested Qty: ${item.suggestedQuantity}?`);
    if (!ok) return;

    try {
      setIsSaving(true);
      const payload = {
        medicineId: item.id,
        qty: item.suggestedQuantity
      };
      const res = await purchaseAPI.createPOFromLowStock(payload);
      if (res && res.success) {
        toast.success(`Purchase Order ${res.data.id} created successfully.`);
        if (refreshHistory) await refreshHistory();
        fetchLowStock();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create PO: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewPO = (poId) => {
    setSelectedPOIdState(poId);
    resetNavigation('po', 'details');
  };

  const handleConfirmPO = async (poId) => {
    const ok = await confirm(`Are you sure you want to confirm Purchase Order ${poId}?`);
    if (!ok) return;

    try {
      setIsSaving(true);
      const poToConfirm = purchaseOrders.find(p => p.id === poId);
      if (poToConfirm) {
        // Validate items
        const invalidItem = poToConfirm.items.find(it => it.qty === '' || parseInt(it.qty) <= 0 || isNaN(parseInt(it.qty)));
        if (invalidItem) {
          toast.error(`Quantity for ${invalidItem.medicineName} cannot be empty or zero.`);
          setIsSaving(false);
          return;
        }

        // Save items quantity updates to the backend first
        await purchaseAPI.updatePO(poId, {
          items: poToConfirm.items.map(it => ({
            medicineId: it.medicineId,
            qty: it.qty,
            unitPrice: it.unitPrice,
            tax: it.tax
          }))
        });
      }
      const res = await purchaseAPI.confirmPO(poId);
      if (res && res.success) {
        toast.success(`Purchase Order ${poId} confirmed and sent successfully.`);
        setPurchaseOrders(prev => prev.map(p => p.id === poId ? res.data : p));
        if (refreshHistory) await refreshHistory();
        fetchLowStock();
        setCurrentSubView('list');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to confirm Purchase Order: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPO = async (poId) => {
    const ok = await confirm(`Are you sure you want to cancel Purchase Order ${poId}? This action cannot be undone.`);
    if (!ok) return;

    try {
      setIsSaving(true);
      const res = await purchaseAPI.cancelPO(poId);
      if (res && res.success) {
        toast.success(`Purchase Order ${poId} cancelled.`);
        setPurchaseOrders(prev => prev.map(p => p.id === poId ? res.data : p));
        if (refreshHistory) await refreshHistory();
        fetchLowStock();
        setCurrentSubView('list');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel Purchase Order: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPOItemQty = (poId, medicineId, newQty) => {
    let qtyVal = newQty;
    if (newQty !== '') {
      qtyVal = parseInt(newQty);
      if (isNaN(qtyVal) || qtyVal < 0) return;
    }
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const updatedItems = po.items.map(it => {
          if (it.medicineId === medicineId) {
            const unitPriceVal = Number(it.unitPrice || 0);
            const taxRateVal = Number(it.tax || 0);
            const effectiveQty = qtyVal === '' ? 0 : qtyVal;
            const total = effectiveQty * unitPriceVal * (1 + (taxRateVal / 100));
            return { ...it, qty: qtyVal, total };
          }
          return it;
        });
        const newTotal = updatedItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
        return { ...po, items: updatedItems, total: newTotal };
      }
      return po;
    }));
  };

  const handleEditPOItemPrice = (poId, medicineId, newPrice) => {
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || priceVal < 0) return;
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const updatedItems = po.items.map(it => {
          if (it.medicineId === medicineId) {
            const qtyVal = parseInt(it.qty || 0);
            const taxRateVal = Number(it.tax || 0);
            const total = qtyVal * priceVal * (1 + (taxRateVal / 100));
            return { ...it, unitPrice: priceVal, total };
          }
          return it;
        });
        const newTotal = updatedItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
        return { ...po, items: updatedItems, total: newTotal };
      }
      return po;
    }));
  };

  const handleIncreaseQty = (poId, medicineId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    const item = po.items.find(it => it.medicineId === medicineId);
    if (!item) return;
    const currentQty = item.qty === '' ? 0 : parseInt(item.qty) || 0;
    handleEditPOItemQty(poId, medicineId, currentQty + 1);
  };

  const handleDecreaseQty = (poId, medicineId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    const item = po.items.find(it => it.medicineId === medicineId);
    if (!item) return;
    const currentQty = item.qty === '' ? 0 : parseInt(item.qty) || 0;
    if (currentQty <= 1) return;
    handleEditPOItemQty(poId, medicineId, currentQty - 1);
  };

  const handleRemovePOItem = (poId, medicineId) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const updatedItems = po.items.filter(it => it.medicineId !== medicineId);
        const newTotal = updatedItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
        return { ...po, items: updatedItems, total: newTotal };
      }
      return po;
    }));
  };

  const handleAddPOMedicine = (poId, medId) => {
    if (!medId) return;
    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        if (po.items?.some(it => it.medicineId === medId)) {
          toast.error('This medicine is already in the Purchase Order.');
          return po;
        }

        const qtyVal = 50;
        const priceVal = Number(med.pricePerPiece) || 15.00;
        const taxVal = Number(med.taxPercentage) || 0;
        const itemTotal = qtyVal * priceVal * (1 + (taxVal / 100));

        const newItem = {
          medicineId: medId,
          medicineName: med.name || med.medicineName,
          qty: qtyVal,
          unitPrice: priceVal,
          tax: taxVal,
          total: itemTotal,
          receivedQty: 0,
          damagedQty: 0,
          cancelledQty: 0,
          status: 'Pending'
        };

        const updatedItems = [...(po.items || []), newItem];
        const newTotal = updatedItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
        return { ...po, items: updatedItems, total: newTotal };
      }
      return po;
    }));
  };

  // Searches, filters, and paginations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Local Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    poId: '',
    trackingId: '',
    invoiceNumber: '',
    items: []
  });

  // Local PR item approval choices
  const [prItemApprovals, setPrItemApprovals] = useState({}); // { itemId: 'Approved' | 'Rejected' }



  const handleGRNSubmitLocal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const success = await handleSubmitGRN(false, toast, confirm);
    if (success) {
      if (fetchLowStock) fetchLowStock();
      resetNavigation('grn', 'list');
    }
  };

  const handleGRNDraftSubmitLocal = async () => {
    const success = await handleSubmitGRN(true, toast, confirm);
    if (success) {
      if (fetchLowStock) fetchLowStock();
      resetNavigation('grn', 'list');
    }
  };

  // Reset pagination on filter or view change
  const resetNavigation = (tab, subView = 'list') => {
    setCurrentTab(tab);
    setCurrentSubView(subView);
    setSearchQuery('');
    setStatusFilter('All');
    setCurrentPage(1);
    setEditingDraftId(null);
  };

  // Safe selection lookups with fallback checks to prevent white screen crashes
  const selectedPR = useMemo(() => {
    return purchaseRequests.find(p => p.id === selectedPRId) || null;
  }, [purchaseRequests, selectedPRId]);

  const selectedPO = useMemo(() => {
    return purchaseOrders.find(p => p.id === selectedPOIdState) || 
           completedPOs.find(p => p.id === selectedPOIdState) || null;
  }, [purchaseOrders, completedPOs, selectedPOIdState]);

  const selectedGRN = useMemo(() => {
    return goodsReceipts.find(g => g.id === selectedGRNIdState) || 
           completedGRNs.find(g => g.id === selectedGRNIdState) || null;
  }, [goodsReceipts, completedGRNs, selectedGRNIdState]);

  const selectedShipment = useMemo(() => {
    return shipments.find(s => s.id === selectedShipmentIdState) || null;
  }, [shipments, selectedShipmentIdState]);

  const [prItemRemarks, setPrItemRemarks] = useState({});

  // Auto-prefill item approval choices when selected PR changes
  React.useEffect(() => {
    if (selectedPR && selectedPR.items) {
      const decisions = {};
      selectedPR.items.forEach(it => {
        decisions[it.id] = it.status || 'Pending';
      });
      setPrItemApprovals(decisions);
    } else {
      setPrItemApprovals({});
    }
  }, [selectedPR]);

  // Alert & dashboard stats
  const pendingRequestsCount = purchaseRequests.filter(r => r.status === 'Pending').length;
  const approvedRequestsCount = purchaseRequests.filter(r => r.status === 'Approved' || r.status === 'Partially Approved').length;
  const inProgressOrdersCount = purchaseOrders.filter(p => ['Sent', 'Accepted', 'Shipped', 'In Transit', 'Delivered'].includes(p.status)).length;
  const pendingShipmentsCount = shipments.filter(s => s.status !== 'Delivered').length;
  const pendingPOCount = purchaseOrders.filter(p => !['COMPLETED', 'Completed', 'Closed', 'CANCELLED', 'Cancelled', 'Rejected'].includes(p.status)).length;
  const totalPendingGRNCount = pendingGRNOrders.length + goodsReceipts.filter(g => g.status === 'Draft' || g.savedAsDraft).length;
  const partiallyReceivedCount = purchaseOrders.filter(p => p.status === 'Partially Received').length;
  const completedPOCount = completedPOs.length;

  // Filter low stock medicines from master inventory list (read-only alerts)
  const lowStockAlerts = useMemo(() => {
    return medicines
      .filter(m => Number(m.stock ?? 0) <= Number(m.minStock ?? 10))
      .map(m => ({
        id: `LSA-${m.id.slice(-4).toUpperCase()}`,
        medicineId: m.id,
        medicineName: m.name || m.medicineName,
        currentStock: Number(m.stock ?? 0),
        reorderLevel: Number(m.minStock ?? 10),
        alertDate: new Date().toLocaleDateString('en-IN')
      }));
  }, [medicines]);

  const filteredLowStockItems = useMemo(() => {
    return lowStockItems.filter(item => {
      const { dateFrom, dateTo, supplier, medicine, unit, status } = filters.dashboard;
      
      // Status Filter
      const targetStatus = status === 'Pending' ? 'Pending Approval' : status === 'PO Generated' ? 'PO Generated' : status;
      if (targetStatus && item.status !== targetStatus && targetStatus !== 'All') return false;
      
      // Date Filter (Last Ordered Date)
      if (dateFrom && item.lastOrderedDate) {
        if (new Date(item.lastOrderedDate) < new Date(dateFrom)) return false;
      }
      if (dateTo && item.lastOrderedDate) {
        if (new Date(item.lastOrderedDate) > new Date(dateTo)) return false;
      }
      
      // Supplier Filter
      if (supplier && item.defaultSupplierName && !item.defaultSupplierName.toLowerCase().includes(supplier.toLowerCase())) return false;
      
      // Medicine Filter
      if (medicine && !item.medicineName.toLowerCase().includes(medicine.toLowerCase())) return false;
      
      // Unit Filter (if applicable)
      if (unit && item.unit && !item.unit.toLowerCase().includes(unit.toLowerCase())) return false;

      return true;
    });
  }, [lowStockItems, filters.dashboard]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const { dateFrom, dateTo, supplier, medicine, unit, priceMin, priceMax, status, poId } = filters.po;
      
      // Legacy Tab Status mapping combined with Advanced Status filter
      let currentStatusTab = poListTab; 
      if (status) currentStatusTab = status; // If advanced status is picked, it overrides tab

      const poStatus = po.status;
      if (currentStatusTab === 'Pending' && !['PO_GENERATED', 'Draft', 'Pending Approval', 'Pending'].includes(poStatus)) return false;
      if (currentStatusTab === 'Partially Received' && !['PARTIALLY_RECEIVED', 'Partially Received', 'Shipped', 'In Transit', 'PO_CONFIRMED', 'Sent', 'Accepted'].includes(poStatus)) return false;
      if (currentStatusTab === 'Completed' && !['COMPLETED', 'Completed', 'Closed'].includes(poStatus)) return false;
      if (currentStatusTab === 'Cancelled' && !['CANCELLED', 'Cancelled', 'Rejected'].includes(poStatus)) return false;

      // PO ID Filter
      if (poId && !po.id.toLowerCase().includes(poId.toLowerCase())) return false;

      // Supplier Filter
      if (supplier && !getSupplierName(po.supplier).toLowerCase().includes(supplier.toLowerCase())) return false;

      // Date Range Filter
      if (dateFrom && new Date(po.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(po.createdAt) > new Date(dateTo)) return false;

      // Price Range Filter
      const poTotal = Number(po.total) || 0;
      if (priceMin && poTotal < Number(priceMin)) return false;
      if (priceMax && poTotal > Number(priceMax)) return false;

      // Medicine Filter
      if (medicine && !po.items?.some(it => (it.medicineName || '').toLowerCase().includes(medicine.toLowerCase()))) return false;

      // Unit Filter
      if (unit && !po.items?.some(it => (it.unit || '').toLowerCase().includes(unit.toLowerCase()))) return false;

      return true;
    });
  }, [purchaseOrders, poListTab, filters.po]);

  const filteredGoodsReceipts = useMemo(() => {
    return goodsReceipts.filter(grn => {
      const { dateFrom, dateTo, supplier, medicine, invoice, poId, status, unit } = filters.grn;
      
      const resolvedSupplier = grn.supplierName || grn.purchaseOrder?.supplier || grn.supplierId;
      
      // Legacy Tab Filter
      if (grnListTab === 'Draft' && grn.savedAsDraft !== true && grn.status !== 'Draft') return false;
      if (grnListTab === 'Completed' && (grn.savedAsDraft === true || grn.status === 'Draft')) return false;

      // Status Filter
      if (status && grn.status !== status) return false;

      // Date Range Filter
      if (dateFrom && new Date(grn.receivedDate) < new Date(dateFrom)) return false;
      if (dateTo && new Date(grn.receivedDate) > new Date(dateTo)) return false;

      // Supplier Filter
      if (supplier && !getSupplierName(resolvedSupplier).toLowerCase().includes(supplier.toLowerCase())) return false;

      // Invoice Filter
      if (invoice && !(grn.invoiceNumber || '').toLowerCase().includes(invoice.toLowerCase())) return false;

      // PO ID Filter
      if (poId && !(grn.poId || '').toLowerCase().includes(poId.toLowerCase())) return false;

      // Medicine & Unit Filter
      if (medicine || unit) {
        let hasMatch = false;
        if (grn.items && grn.items.length > 0) {
          hasMatch = grn.items.some(it => {
            const medMatch = !medicine || (it.medicineName || '').toLowerCase().includes(medicine.toLowerCase());
            const unitMatch = !unit || (it.unit || '').toLowerCase().includes(unit.toLowerCase());
            return medMatch && unitMatch;
          });
        }
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [goodsReceipts, grnListTab, filters.grn]);

  // Color helper for statuses
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
      case 'Verified & Approved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-250';
      case 'Completed':
        return 'text-emerald-800 bg-emerald-100 border-emerald-300';
      case 'Rejected':
      case 'Cancelled':
      case 'Damaged':
        return 'text-rose-700 bg-rose-50 border-rose-250';
      case 'Pending':
      case 'Draft':
      case 'Submitted':
        return 'text-amber-700 bg-amber-50 border-amber-250';
      case 'Partially Approved':
      case 'Partially Received':
        return 'text-indigo-700 bg-indigo-50 border-indigo-250';
      case 'Sent':
      case 'Supplier Accepted':
      case 'Packed':
      case 'Shipped':
      case 'In Transit':
      case 'Delivered':
        return 'text-blue-700 bg-blue-50 border-blue-250';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // PO Items status actions (item-level receiving status update)
  const handleUpdatePOItemStatus = async (poId, medicineId, action) => {
    if (!window.confirm(`Are you sure you want to mark this item as ${action}?`)) return;
    try {
      const po = purchaseOrders.find(p => p.id === poId);
      if (!po) return;

      const updatedItems = po.items.map(item => {
        if (item.medicineId === medicineId) {
          const qty = item.qty;
          let rec = item.receivedQty || 0;
          let dmg = item.damagedQty || 0;
          let can = item.cancelledQty || 0;
          let status = item.status;

          if (action === 'Received') {
            rec = qty;
            status = 'Received';
          } else if (action === 'Cancelled') {
            can = qty - rec;
            status = 'Cancelled';
          } else if (action === 'Damaged') {
            dmg = qty - rec;
            status = 'Damaged';
          }

          return { ...item, receivedQty: rec, damagedQty: dmg, cancelledQty: can, status };
        }
        return item;
      });

      // Calculate new PO progress and status
      const totalOrdered = updatedItems.reduce((sum, it) => sum + it.qty, 0);
      const totalReceived = updatedItems.reduce((sum, it) => sum + it.receivedQty, 0);
      const totalCancelled = updatedItems.reduce((sum, it) => sum + it.cancelledQty, 0);
      
      let newPOStatus = po.status;
      if (totalReceived + totalCancelled >= totalOrdered) {
        newPOStatus = 'Completed';
      } else if (totalReceived > 0) {
        newPOStatus = 'Partially Received';
      }

      const response = await purchaseAPI.updatePO(poId, {
        status: newPOStatus,
        items: updatedItems.map(it => ({
          medicineId: it.medicineId,
          qty: it.qty,
          receivedQty: it.receivedQty,
          damagedQty: it.damagedQty,
          cancelledQty: it.cancelledQty,
          status: it.status,
          unitPrice: Number(it.unitPrice)
        }))
      });

      if (response && response.success) {
        setPurchaseOrders(prev => prev.map(p => p.id === poId ? response.data : p));
        alert(`Item status updated to ${action}. PO status is: ${newPOStatus}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating item level status: ' + err.message);
    }
  };

  // Timeline Step Helper
  const timelineSteps = ['Draft', 'Sent', 'Supplier Accepted', 'Packed', 'Shipped', 'In Transit', 'Delivered', 'Completed'];

  return (
    <ErrorBoundary>
      <div className="space-y-6 text-left font-sans">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
              Procurement & Orders Dashboard Desk
              <button onClick={() => setSchemaModalTable('purchase_request')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer" title="View Database Tables Schema">
                <Database size={14} />
              </button>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Lifecycle tracking: alerts → purchase request → approval → PO → shipping → receiving → completed ledger</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { refreshHistory(); alert('Data re-fetched from database.'); }} className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold" title="Sync database data">
              <RefreshCw size={13} /> Sync
            </button>
          </div>
        </div>

        {/* 13 MODULE PAGE TAB-NAVIGATION */}
        {(() => {
          const enablePRWorkflow = false;
          const enableShipmentTracking = false;
          return (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-150 p-1.5 rounded-2xl w-full">
              <button onClick={() => resetNavigation('dashboard')} tabIndex={0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${currentTab === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <TrendingUp size={13} /> Dashboard
              </button>
              {enablePRWorkflow && (
                <button onClick={() => resetNavigation('pr')} tabIndex={0}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${currentTab === 'pr' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <ClipboardList size={13} /> Purchase Requests ({pendingRequestsCount})
                </button>
              )}
              <button onClick={() => resetNavigation('po')} tabIndex={0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${currentTab === 'po' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <FileText size={13} /> Purchase Orders ({inProgressOrdersCount})
              </button>
              {enableShipmentTracking && (
                <button onClick={() => resetNavigation('shipments')} tabIndex={0}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${currentTab === 'shipments' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Truck size={13} /> Shipment Track ({pendingShipmentsCount})
                </button>
              )}
              <button onClick={() => resetNavigation('grn')} tabIndex={0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${currentTab === 'grn' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <PackageCheck size={13} /> GRN Receivables ({totalPendingGRNCount})
              </button>
              <button onClick={() => resetNavigation('completed')} tabIndex={0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${currentTab === 'completed' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <CheckCircle size={13} /> Procurement History
              </button>
            </div>
          );
        })()}

        {/* ─── TAB 1: PROCUREMENT DASHBOARD ─── */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* PROCUREMENT SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Low Stock Pending → Dashboard Pending filter */}
              <div
                onClick={() => updateFilter('dashboard', 'status', 'Pending')}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && updateFilter('dashboard', 'status', 'Pending')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm cursor-pointer hover:border-rose-300 hover:shadow-md transition-all group kb-focusable focus:ring-2 focus:ring-rose-400 focus:outline-none"
              >
                <span className="text-slate-400 text-[10px] font-black uppercase">Low Stock Pending</span>
                <span className="text-2xl font-black text-rose-600 block pt-1">
                  {lowStockItems.filter(item => item.status === 'Pending Approval').length}
                </span>
                <span className="text-[9px] font-bold text-slate-300 group-hover:text-rose-400 uppercase mt-2 flex items-center gap-1 transition-colors">
                  View Details <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Purchase Orders → PO tab */}
              <div
                onClick={() => resetNavigation('po')}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && resetNavigation('po')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group kb-focusable focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <span className="text-slate-400 text-[10px] font-black uppercase">Purchase Orders</span>
                <span className="text-2xl font-black text-blue-600 block pt-1">
                  {pendingPOCount}
                </span>
                <span className="text-[9px] font-bold text-slate-300 group-hover:text-blue-400 uppercase mt-2 flex items-center gap-1 transition-colors">
                  View Details <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* GRN Receivables → GRN tab */}
              <div
                onClick={() => resetNavigation('grn')}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && resetNavigation('grn')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group kb-focusable focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <span className="text-slate-400 text-[10px] font-black uppercase">GRN Receivables</span>
                <span className="text-2xl font-black text-amber-600 block pt-1">
                  {totalPendingGRNCount}
                </span>
                <span className="text-[9px] font-bold text-slate-300 group-hover:text-amber-400 uppercase mt-2 flex items-center gap-1 transition-colors">
                  View Details <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Procurement History → Completed tab */}
              <div
                onClick={() => resetNavigation('completed')}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && resetNavigation('completed')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group kb-focusable focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <span className="text-slate-400 text-[10px] font-black uppercase">Procurement History</span>
                <span className="text-2xl font-black text-emerald-600 block pt-1">
                  {completedPOs.length}
                </span>
                <span className="text-[9px] font-bold text-slate-300 group-hover:text-emerald-400 uppercase mt-2 flex items-center gap-1 transition-colors">
                  View Details <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>

            {/* DASHBOARD TAB FILTERS */}
            <div className="flex items-center justify-between border-b border-slate-200 gap-4">
              {/* Status Tabs - Left Side */}
              <div className="flex items-center gap-1">
                {['Pending', 'PO Generated', 'Completed'].map(filterTab => {
                  const targetStatus = filterTab === 'Pending' ? 'Pending Approval' : filterTab === 'PO Generated' ? 'PO Generated' : 'Completed';
                  const count = lowStockItems.filter(item => item.status === targetStatus).length;
                  const isActive = filters.dashboard.status === filterTab || (filterTab === 'Pending' && filters.dashboard.status === 'Pending');
                  return (
                    <button
                      key={filterTab}
                      onClick={() => updateFilter('dashboard', 'status', filterTab)}
                      tabIndex={0}
                      className={`pb-3 px-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        isActive ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {filterTab} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Date Range Filter - Right Side */}
              <div className="flex items-center gap-2 pb-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  {/* Start Date: type or pick */}
                  <div className="flex items-center gap-1 relative">
                    <input
                      type="text"
                      value={formatDateDisplay(filterStartDate)}
                      onChange={(e) => {
                        const parsed = parseTypedDate(e.target.value);
                        if (parsed) setFilterStartDate(parsed);
                        else if (e.target.value === '') setFilterStartDate('');
                      }}
                      placeholder="DD/MM/YYYY"
                      tabIndex={0}
                      className="kb-focusable bg-transparent text-xs font-semibold text-slate-600 border-none outline-none focus:ring-0 w-[88px] placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => startDateRef.current?.showPicker?.()}
                      tabIndex={0}
                      title="Pick from calendar"
                      className="text-slate-400 hover:text-blue-500 transition-colors kb-focusable focus:outline-none focus:text-blue-500 cursor-pointer"
                    >
                      <Calendar size={13} />
                    </button>
                    <input
                      ref={startDateRef}
                      type="date"
                      value={filterStartDate || ''}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="absolute opacity-0 w-0 h-0 pointer-events-none"
                      tabIndex={-1}
                    />
                  </div>

                  <span className="text-[10px] font-bold text-slate-300 uppercase">to</span>

                  {/* End Date: type or pick */}
                  <div className="flex items-center gap-1 relative">
                    <input
                      type="text"
                      value={formatDateDisplay(filterEndDate)}
                      onChange={(e) => {
                        const parsed = parseTypedDate(e.target.value);
                        if (parsed) setFilterEndDate(parsed);
                        else if (e.target.value === '') setFilterEndDate('');
                      }}
                      placeholder="DD/MM/YYYY"
                      tabIndex={0}
                      className="kb-focusable bg-transparent text-xs font-semibold text-slate-600 border-none outline-none focus:ring-0 w-[88px] placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => endDateRef.current?.showPicker?.()}
                      tabIndex={0}
                      title="Pick from calendar"
                      className="text-slate-400 hover:text-blue-500 transition-colors kb-focusable focus:outline-none focus:text-blue-500 cursor-pointer"
                    >
                      <Calendar size={13} />
                    </button>
                    <input
                      ref={endDateRef}
                      type="date"
                      value={filterEndDate || ''}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="absolute opacity-0 w-0 h-0 pointer-events-none"
                      tabIndex={-1}
                    />
                  </div>
                </div>

                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                    tabIndex={0}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all kb-focusable focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* LOW STOCK ALERTS LIST */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-500 animate-bounce" /> Low Stock Medicines List
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {loadingLowStock ? 'Loading...' : `${lowStockItems.length} Total`}
                </span>
              </div>

              {/* DASHBOARD ADVANCED FILTERS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="Search Medicine..." value={filters.dashboard.medicine} onChange={e => updateFilter('dashboard', 'medicine', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="Search Supplier..." value={filters.dashboard.supplier} onChange={e => updateFilter('dashboard', 'supplier', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="w-32">
                  <select value={filters.dashboard.status} onChange={e => updateFilter('dashboard', 'status', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="All">All Status</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="PO Generated">PO Generated</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="w-28">
                  <select value={filters.dashboard.unit} onChange={e => updateFilter('dashboard', 'unit', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">All Units</option>
                    <option value="Box">Box</option>
                    <option value="Strip">Strip</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <input type="date" value={filters.dashboard.dateFrom} onChange={e => updateFilter('dashboard', 'dateFrom', e.target.value)} className="text-[10px] bg-transparent outline-none" title="From Date" />
                  <span className="text-[9px] text-slate-300">to</span>
                  <input type="date" value={filters.dashboard.dateTo} onChange={e => updateFilter('dashboard', 'dateTo', e.target.value)} className="text-[10px] bg-transparent outline-none" title="To Date" />
                </div>
                <button onClick={() => clearFilters('dashboard')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Clear Filters">
                  <X size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Medicine Name</th>
                      <th className="py-2.5 px-3">Medicine Code</th>
                      <th className="py-2.5 px-3 text-center">Current Stock</th>
                      <th className="py-2.5 px-3 text-center">Reorder Level</th>
                      <th className="py-2.5 px-3 text-center">Suggested Order Qty</th>
                      <th className="py-2.5 px-3">Default Supplier</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Last Ordered Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLowStockItems.map(item => {
                        return (
                          <tr key={item.id} tabIndex={0} data-kb-row className="border-b border-slate-100 hover:bg-slate-50/50 kb-focusable focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-300 focus:outline-none">
                            <td className="py-3.5 px-3 font-bold text-slate-805">{item.medicineName}</td>
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-500">{item.medicineCode}</td>
                            <td className="py-3.5 px-3 text-center font-black text-rose-600">{item.stockQuantity} units</td>
                            <td className="py-3.5 px-3 text-center font-bold text-slate-500">{item.reorderLevel} units</td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-700">{item.suggestedQuantity} units</td>
                            <td className="py-3.5 px-3 font-semibold text-slate-650">{item.defaultSupplierName}</td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                item.status === 'Pending Approval' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                                item.status === 'PO Generated' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                'text-emerald-700 bg-emerald-50 border-emerald-200'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-medium text-slate-400">
                              {item.lastOrderedDate ? new Date(item.lastOrderedDate).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {item.status === 'Pending Approval' ? (
                                <button
                                  onClick={() => handleCreatePOFromLowStock(item)}
                                  disabled={isSaving}
                                  tabIndex={0}
                                  data-kb-col
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase transition cursor-pointer disabled:opacity-50 kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  Approve & Create PO
                                </button>
                              ) : item.status === 'PO Generated' ? (
                                <button
                                  onClick={() => handleViewPO(item.poId)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  View PO
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Completed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {filteredLowStockItems.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400 italic">No items found in this section.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: PURCHASE REQUESTS ─── */}
        {currentTab === 'pr' && (
          <div className="space-y-6 animate-fade-in">
            {/* SUB-VIEW: LIST VIEW */}
            {currentSubView === 'list' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList size={14} className="text-blue-600" /> Purchase Request Register
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                      <input
                        type="text"
                        placeholder="Search PR ID or requester..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button onClick={() => setCurrentSubView('create')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer shadow-sm">
                      <Plus size={14} /> New Purchase Request
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                        <th className="py-2.5 px-3">PR ID</th>
                        <th className="py-2.5 px-3">PR Date</th>
                        <th className="py-2.5 px-3">Requested By</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3 text-center">Items Count</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseRequests
                        .filter(pr => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return pr.id.toLowerCase().includes(q) || (pr.requestedBy && pr.requestedBy.toLowerCase().includes(q));
                        })
                        .map(pr => (
                        <tr key={pr.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-[10px] text-slate-700">{pr.id}</td>
                          <td className="py-3 px-3 text-slate-500 font-semibold">{pr.requestDate}</td>
                          <td className="py-3 px-3 font-bold text-slate-700">{pr.requestedBy || 'Staff'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${pr.priority === 'High' ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>{pr.priority}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">{pr.items?.length || 0}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black border ${getStatusBadgeClass(pr.status)}`}>{pr.status}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedPRId(pr.id);
                                // Prefill item approval checks with current database values
                                const decisions = {};
                                pr.items.forEach(it => { decisions[it.id] = it.status || 'Pending'; });
                                setPrItemApprovals(decisions);
                                setCurrentSubView('details');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-700 transition cursor-pointer"
                            >
                              Details & Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW: CREATE VIEW */}
            {currentSubView === 'create' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-blue-650" /> Raise Purchase Request
                  </h4>
                  <button onClick={() => setCurrentSubView('list')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested By</label>
                      <input type="text" value={role || 'Staff Pharmacist'} disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                      <select value={newPR.priority} onChange={(e) => setNewPR({ ...newPR, priority: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
                        <option value="High">High (Urgent)</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Overall Reason</label>
                      <input type="text" placeholder="e.g. Monthly stock replenishment..." value={newPR.remarks} onChange={(e) => setNewPR({ ...newPR, remarks: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medicines Table List</label>
                    {newPR.items.map((item, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-2 items-center bg-slate-50 border border-slate-150 p-3 rounded-xl">
                        <div className="w-full md:flex-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Medicine *</label>
                          <SearchableDropdown
                            options={medicines.map(m => ({ id: m.id, name: `${m.name || m.medicineName} (Stock: ${m.stock})` }))}
                            value={item.medicineId}
                            onChange={(val) => updatePRItem(index, 'medicineId', val)}
                            placeholder="Type to search medicine..."
                            inputClass="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Quantity *</label>
                          <input type="number" placeholder="Count" min="1" value={item.requestedQty} onChange={(e) => updatePRItem(index, 'requestedQty', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" required />
                        </div>
                        <div className="w-full md:w-28">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Unit</label>
                          <select value={item.unit} onChange={(e) => updatePRItem(index, 'unit', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold cursor-pointer">
                            <option value="Boxes">Boxes</option>
                            <option value="Strips">Strips</option>
                            <option value="Bottles">Bottles</option>
                            <option value="Vials">Vials</option>
                          </select>
                        </div>
                        <div className="w-full md:flex-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Item Remarks</label>
                          <input type="text" placeholder="Remarks..." value={item.remarks} onChange={(e) => updatePRItem(index, 'remarks', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" />
                        </div>
                        <div className="pt-4">
                          {newPR.items.length > 1 && (
                            <button type="button" onClick={() => removePRItem(index)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition">
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={addPRItem} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer">
                      <Plus size={12} /> Add Medicine
                    </button>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => {
                      alert('Draft saved locally.');
                      setCurrentSubView('list');
                    }} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase cursor-pointer">Save Draft</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer">Submit PR</button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB-VIEW: DETAILS / APPROVAL VIEW */}
            {currentSubView === 'details' && selectedPR && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Purchase Request Details: {selectedPR.id}</h4>
                  <button onClick={() => setCurrentSubView('list')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Request Date</span><span className="font-bold">{selectedPR.requestDate}</span></div>
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Requested By</span><span className="font-bold">{selectedPR.requestedBy || 'Staff'}</span></div>
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Overall Status</span><span className={`px-2 py-0.5 rounded-full font-black text-[9px] border ${getStatusBadgeClass(selectedPR.status)}`}>{selectedPR.status}</span></div>
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Notes</span><span className="font-bold text-slate-600">{selectedPR.remarks || 'None'}</span></div>
                </div>

                <div className="space-y-3">
                  <span className="block text-[10px] font-black uppercase text-slate-500 border-b border-slate-100 pb-1">Items Approval Decisions</span>
                  <div className="space-y-2">
                    {selectedPR.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-150 rounded-xl hover:bg-slate-50/50">
                        <div className="text-xs">
                          <span className="font-bold text-slate-800">{item.medicineName}</span>
                          <span className="text-slate-400 block text-[10px]">Requested: {item.requestedQty} {item.unit} | Status: <b className={item.status === 'Approved' ? 'text-emerald-600' : item.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'}>{item.status}</b></span>
                        </div>

                        {item.status === 'Pending' ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setPrItemApprovals({ ...prItemApprovals, [item.id]: 'Approved' });
                                setPrItemRemarks({ ...prItemRemarks, [item.id]: '' });
                              }}
                              className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border transition ${prItemApprovals[item.id] === 'Approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = window.prompt(`Enter rejection reason for ${item.medicineName || 'item'}:`);
                                if (reason === null) return;
                                setPrItemApprovals({ ...prItemApprovals, [item.id]: 'Rejected' });
                                setPrItemRemarks({ ...prItemRemarks, [item.id]: reason || 'Rejected by manager' });
                              }}
                              className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border transition ${prItemApprovals[item.id] === 'Rejected' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusBadgeClass(item.status)}`}>{item.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPR.items.some(item => item.status === 'Pending') && (
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => {
                        const reason = window.prompt("Enter rejection reason for entire PR:");
                        if (reason === null) return;
                        handleRejectPR(selectedPR.id, reason);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                    >
                      Reject Entire PR
                    </button>
                    <button
                      onClick={async () => {
                        const payload = Object.keys(prItemApprovals)
                          .filter(itemId => {
                            const originalItem = selectedPR.items.find(i => String(i.id) === String(itemId));
                            return originalItem && originalItem.status === 'Pending';
                          })
                          .map(itemId => ({
                            itemId,
                            status: prItemApprovals[itemId],
                            remarks: prItemRemarks[itemId] || ''
                          }))
                          .filter(p => p.status === 'Approved' || p.status === 'Rejected');
                        
                        if (payload.length === 0) {
                          alert('Please select approval or rejection for at least one pending item.');
                          return;
                        }
                        const updatedPR = await handleApprovePR(selectedPR.id, payload);
                        if (updatedPR) {
                          const approvedItems = updatedPR.items.filter(i => i.status === 'Approved');
                          if (approvedItems.length > 0) {
                            setPoMode('PR');
                            setLinkedPRId(updatedPR.id);
                            setPrApprovedItems(approvedItems);
                            resetNavigation('po', 'create');
                          } else {
                            resetNavigation('pr', 'list');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                    >
                      Submit Decisions
                    </button>
                  </div>
                )}

                {(selectedPR.status === 'Approved' || selectedPR.status === 'Partially Approved') && (
                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <button
                      onClick={() => {
                        setPoMode('PR');
                        setLinkedPRId(selectedPR.id);
                        setPrApprovedItems(selectedPR.items.filter(i => i.status === 'Approved'));
                        resetNavigation('po', 'create');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                    >
                      Generate Purchase Order →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PURCHASE ORDERS ─── */}
        {currentTab === 'po' && (
          <div className="space-y-6 animate-fade-in">
            {/* SUB-VIEW: LIST VIEW */}
            {currentSubView === 'list' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" /> Purchase Orders Registry
                  </h4>
                  <button onClick={() => setCurrentSubView('create')} tabIndex={0} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer shadow-sm kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <Plus size={14} /> Create Purchase Order
                  </button>
                </div>

                {/* Search and Tabs row */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-105">
                  <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    {['Pending', 'Partially Received', 'Completed', 'Cancelled'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { setPoListTab(tab); updateFilter('po', 'status', ''); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
                          poListTab === tab && !filters.po.status
                            ? 'bg-blue-600 text-white shadow-sm font-black' 
                            : 'bg-white hover:bg-slate-150 text-slate-650 border border-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* PO ADVANCED FILTERS */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="text" placeholder="PO ID..." value={filters.po.poId} onChange={e => updateFilter('po', 'poId', e.target.value)} className="w-24 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Supplier..." value={filters.po.supplier} onChange={e => updateFilter('po', 'supplier', e.target.value)} className="w-28 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Medicine..." value={filters.po.medicine} onChange={e => updateFilter('po', 'medicine', e.target.value)} className="w-28 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                      <span className="text-[10px] text-slate-400 pl-1">₹</span>
                      <input type="number" placeholder="Min" value={filters.po.priceMin} onChange={e => updateFilter('po', 'priceMin', e.target.value)} className="w-12 p-1 text-[10px] bg-transparent outline-none" />
                      <span className="text-[10px] text-slate-300">-</span>
                      <input type="number" placeholder="Max" value={filters.po.priceMax} onChange={e => updateFilter('po', 'priceMax', e.target.value)} className="w-12 p-1 text-[10px] bg-transparent outline-none" />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                      <input type="date" value={filters.po.dateFrom} onChange={e => updateFilter('po', 'dateFrom', e.target.value)} className="w-20 p-1 text-[10px] bg-transparent outline-none" title="From Date" />
                      <span className="text-[10px] text-slate-300">-</span>
                      <input type="date" value={filters.po.dateTo} onChange={e => updateFilter('po', 'dateTo', e.target.value)} className="w-20 p-1 text-[10px] bg-transparent outline-none" title="To Date" />
                    </div>
                    <button onClick={() => clearFilters('po')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors" title="Clear Filters">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPurchaseOrders.map(po => {
                    const statusDisplay = getPOStatusDisplay(po.status);
                    const totalItems = po.items?.length || 0;
                    const dateStr = new Date(po.createdAt).toLocaleDateString('en-IN');
                    const timeStr = new Date(po.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={po.id} tabIndex={0} data-kb-row className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 kb-focusable focus:ring-2 focus:ring-blue-400 focus:bg-slate-50/50 focus:outline-none">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-black text-xs text-blue-700">{po.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusBadgeClass(po.status)}`}>
                              {statusDisplay}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Date:</span>
                              <span className="font-bold text-slate-700">{dateStr}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Time:</span>
                              <span className="font-bold text-slate-700">{timeStr}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Supplier Name:</span>
                              <span className="font-bold text-slate-805">{getSupplierName(po.supplier)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Total Items:</span>
                              <span className="font-bold text-slate-805">{totalItems} ({po.items?.reduce((sum, it) => sum + it.qty, 0) || 0} units)</span>
                            </div>
                            <div className="flex justify-between text-slate-400 border-t border-slate-100 pt-1.5 mt-1.5">
                              <span>Grand Total:</span>
                              <span className="font-black text-slate-850">₹{Number(po.total).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 pt-3">
                          <button
                            onClick={() => {
                              setSelectedPOIdState(po.id);
                              setCurrentSubView('details');
                            }}
                            tabIndex={0}
                            data-kb-col
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-700 transition cursor-pointer text-center kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            View
                          </button>
                          {!['COMPLETED', 'Completed', 'Closed', 'CANCELLED', 'Cancelled', 'Rejected'].includes(po.status) && (
                            <button
                              onClick={() => {
                                setSelectedPOIdState(po.id);
                                setCurrentSubView('details');
                              }}
                              tabIndex={0}
                              data-kb-col
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer text-center kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                              Take Action
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredPurchaseOrders.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 italic">No Purchase Orders found in this tab.</div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW: CREATE VIEW */}
            {currentSubView === 'create' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Create Purchase Order</h4>
                  <button onClick={() => {
                    setPoMode('Direct');
                    setLinkedPRId('');
                    setPrApprovedItems([]);
                    setCurrentSubView('list');
                  }} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (poMode === 'PR') {
                    await handleCreatePOFromPR(linkedPRId, prApprovedItems, poSupplier, poDeliveryDate, poPaymentTerms, poCommunicationMethod);
                  } else {
                    const qty = parseInt(directQty);
                    const price = parseFloat(directPrice);
                    const tax = parseFloat(directTax) || 0;
                    const medId = directMedicineId;
                    
                    if (!medId) { alert('Please select medicine.'); return; }
                    if (qty <= 0) { alert('Ordered quantity must be greater than zero.'); return; }
                    
                    const med = medicines.find(m => m.id === medId);
                    await handleCreatePO({
                      items: [{
                        medicineId: medId,
                        medicineName: med ? med.name : 'Unknown',
                        qty,
                        unitPrice: price,
                        tax
                      }]
                    });
                    setDirectMedicineId(''); // Reset state
                  }
                  setCurrentSubView('list');
                }} className="space-y-4">
                  
                  {poMode === 'PR' ? (
                    <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-xs text-slate-700">
                      Linking Approved PR ID: <span className="font-mono font-bold text-blue-700">{linkedPRId}</span>
                      <div className="mt-2 text-[10px] text-slate-450 uppercase font-black tracking-wider">Eligible approved medicines list:</div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200 mt-1 max-h-32 overflow-y-auto space-y-1">
                        {prApprovedItems.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[10px]">
                            <span>{it.medicineName}</span>
                            <span className="font-black text-slate-800">{it.requestedQty || it.qty} {it.unit || 'Boxes'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-xs font-medium text-slate-700">
                      Creating **Direct PO** (without PR link).
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Supplier *</label>
                      <SearchableDropdown
                        options={suppliers.map(s => ({ id: s.name, name: s.name }))}
                        value={poSupplier}
                        onChange={(val) => setPoSupplier(val)}
                        placeholder="Type to search supplier..."
                        inputClass="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-705 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Delivery Date</label>
                      <input type="date" value={poDeliveryDate} onChange={(e) => setPoDeliveryDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Terms</label>
                      <select value={poPaymentTerms} onChange={(e) => setPoPaymentTerms(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-700">
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Advance Payment">Advance Payment</option>
                        <option value="Partial Payment">Partial Payment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Communication Method</label>
                      <select value={poCommunicationMethod} onChange={(e) => setPoCommunicationMethod(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-700">
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="Supplier Portal">Supplier Portal</option>
                      </select>
                    </div>
                  </div>

                  {poMode !== 'PR' && (
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                      <span className="block text-[10px] font-black uppercase text-slate-500">Medicine Item details</span>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Medicine *</label>
                          <SearchableDropdown
                            options={medicines.map(m => ({ id: m.id, name: `${m.medicineName || m.name} (${m.skuCode || m.id})` }))}
                            value={directMedicineId}
                            onChange={(val) => handleSelectDirectMedicine(val)}
                            placeholder="Type to search medicine..."
                            inputClass="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Ordered Qty *</label>
                          <input type="number" name="directQty" value={directQty} onChange={(e) => setDirectQty(e.target.value)} min="1" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" required />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Est. Unit Price (₹) *</label>
                          <input type="number" step="0.01" name="directPrice" value={directPrice} onChange={(e) => setDirectPrice(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" required />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Tax Percentage (%)</label>
                          <input type="number" name="directTax" value={directTax} onChange={(e) => setDirectTax(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => {
                      alert('Draft saved locally.');
                      setCurrentSubView('list');
                    }} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase cursor-pointer">Save Draft</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer">Send/Create PO</button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB-VIEW: DETAILS & INTERACTIVE LIFECYCLE TIMELINE */}
            {currentSubView === 'details' && selectedPO && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Purchase Order File: {selectedPO.id}</h4>
                  <button onClick={() => setCurrentSubView('list')} tabIndex={0} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <X size={15} />
                  </button>
                </div>

                {/* Supplier Information Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Supplier Name</span>
                    <span className="font-extrabold text-slate-800 text-sm">{getSupplierName(selectedPO.supplier)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Expected Delivery Date</span>
                    <span className="font-bold text-slate-700">{selectedPO.expectedDelivery ? new Date(selectedPO.expectedDelivery).toLocaleDateString('en-IN') : 'N/A'}</span>
                  </div>
                </div>

                {/* GRAPHICAL TIMELINE COMPONENT */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Workflow State</span>
                      <span className="font-bold text-slate-800">{getPOStatusDisplay(selectedPO.status)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Progress Percent</span>
                      <span className="font-extrabold text-blue-700">
                        {(() => {
                          const totalOrd = selectedPO.items?.reduce((s, it) => s + it.qty, 0) || 0;
                          const totalRec = selectedPO.items?.reduce((s, it) => s + it.receivedQty, 0) || 0;
                          const percent = totalOrd > 0 ? Math.round((totalRec / totalOrd) * 100) : 0;
                          return `${percent}% Completed`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="relative flex justify-between items-center w-full py-4 text-xs font-bold text-slate-400 max-w-4xl mx-auto overflow-x-auto">
                    <div className="absolute left-0 right-0 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 -z-10" />
                    {getPOTraceTimeline(selectedPO).map((step, idx) => {
                      const isDone = step.done;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 shrink-0 px-2 bg-slate-50">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                            isDone ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider ${isDone ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>{step.name}</span>
                          {step.date && <span className="text-[8px] text-slate-400 block font-normal">{step.date}</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions for workflow status changes */}
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-3 gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Workflow Control Center:</span>
                    <div className="flex gap-2">
                      {(selectedPO.status === 'PO_GENERATED' || selectedPO.status === 'Draft') && (
                        <>
                          <button
                            onClick={() => handleConfirmPO(selectedPO.id)}
                            disabled={isSaving}
                            tabIndex={0}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            Verify & Generate PO
                          </button>
                          <button
                            onClick={() => handleCancelPO(selectedPO.id)}
                            disabled={isSaving}
                            tabIndex={0}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                      {(selectedPO.status === 'PO_CONFIRMED' || selectedPO.status === 'Sent' || selectedPO.status === 'Accepted' || selectedPO.status === 'PARTIALLY_RECEIVED' || selectedPO.status === 'Partially Received') && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPOId(selectedPO.id);
                              loadPOItems(selectedPO.id);
                              resetNavigation('grn', 'create');
                            }}
                            tabIndex={0}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer flex items-center gap-1 kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <PackageCheck size={12} /> Record GRN
                          </button>
                          <button
                            onClick={() => handleCancelPO(selectedPO.id)}
                            disabled={isSaving}
                            tabIndex={0}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                      {(selectedPO.status === 'COMPLETED' || selectedPO.status === 'Completed' || selectedPO.status === 'Closed') && (
                        <span className="text-emerald-700 font-bold text-xs">This Purchase Order is Completed.</span>
                      )}
                      {selectedPO.status === 'CANCELLED' && (
                        <span className="text-rose-700 font-bold text-xs">This Purchase Order has been Cancelled.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Additional Medicine to PO */}
                {(selectedPO.status === 'PO_GENERATED' || selectedPO.status === 'Draft') && (
                  <div className="bg-slate-50/50 p-3.5 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <span className="block text-[10px] font-black uppercase text-slate-500 font-bold">Add Additional Medicine to PO</span>
                      <SearchableDropdown
                        options={medicines.map(m => ({
                          id: m.id,
                          name: `${m.name || m.medicineName} (${m.skuCode || m.id})`,
                          stock: m.stock,
                          supplier: m.supplier?.name || ''
                        }))}
                        value=""
                        onChange={(val) => {
                          if (val) {
                            handleAddPOMedicine(selectedPO.id, val);
                          }
                        }}
                        placeholder="Type to search medicine by name or code..."
                        inputClass="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-text kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                  </div>
                )}

                {/* MEDICINES LIST TABLE WITH ITEM-LEVEL QUANTITY ACTIONS */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-black uppercase text-slate-500 border-b border-slate-100 pb-1">Ordered Medicines & Item-Level Receipt status</span>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                          <th className="py-2 px-3">Medicine Name</th>
                          <th className="py-2 px-3 text-center">Ordered Qty</th>
                          <th className="py-2 px-3 text-center">Unit</th>
                          <th className="py-2 px-3 text-right">Unit Price (₹)</th>
                          <th className="py-2 px-3 text-right">Total Price (₹)</th>
                          {(selectedPO.status === 'PO_GENERATED' || selectedPO.status === 'Draft') && <th className="py-2 px-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPO.items?.map((item, idx) => {
                          const isPendingPO = selectedPO.status === 'PO_GENERATED' || selectedPO.status === 'Draft';
                          return (
                            <tr key={idx} tabIndex={0} data-kb-row className="border-b border-slate-100 hover:bg-slate-50/50 kb-focusable focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-300 focus:outline-none">
                              <td className="py-3 px-3 font-bold text-slate-800">{item.medicineName || `Med #${item.medicineId}`}</td>
                              <td className="py-3 px-3 text-center">
                                {isPendingPO ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleDecreaseQty(selectedPO.id, item.medicineId)}
                                      tabIndex={0}
                                      data-kb-col
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.qty}
                                      onChange={(e) => handleEditPOItemQty(selectedPO.id, item.medicineId, e.target.value)}
                                      tabIndex={0}
                                      data-kb-col
                                      className="w-14 p-1 text-center font-bold border border-slate-200 rounded text-xs bg-white kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => handleIncreaseQty(selectedPO.id, item.medicineId)}
                                      tabIndex={0}
                                      data-kb-col
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <span className="font-mono font-bold">{item.qty}</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center text-slate-500 font-semibold">Boxes</td>
                              <td className="py-3 px-3 text-right font-mono">
                                {isPendingPO ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => handleEditPOItemPrice(selectedPO.id, item.medicineId, e.target.value)}
                                    tabIndex={0}
                                    data-kb-col
                                    className="w-20 p-1 text-right font-bold border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  />
                                ) : (
                                  `₹${Number(item.unitPrice).toFixed(2)}`
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">₹{Number(item.total).toFixed(2)}</td>
                              {isPendingPO && (
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => handleRemovePOItem(selectedPO.id, item.medicineId)}
                                    tabIndex={0}
                                    data-kb-col
                                    className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[9px] font-bold cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end text-xs font-black text-slate-800 border-t border-slate-100 pt-3">
                    <span>Grand Total: ₹{Number(selectedPO.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Remarks Input */}
                {(selectedPO.status === 'PO_GENERATED' || selectedPO.status === 'Draft') && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purchase Order Remarks</label>
                    <textarea
                      defaultValue={selectedPO.communicationMethod || ''}
                      onChange={(e) => {
                        selectedPO.communicationMethod = e.target.value;
                      }}
                      placeholder="Enter special instructions or remarks..."
                      tabIndex={0}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows="2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: SHIPMENT TRACKING ─── */}
        {currentTab === 'shipments' && (
          <div className="space-y-6 animate-fade-in">
            {/* SUB-VIEW: LIST VIEW */}
            {currentSubView === 'list' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Truck size={14} className="text-blue-600" /> Active Shipments Registry
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                        <th className="py-2.5 px-3">Shipment ID</th>
                        <th className="py-2.5 px-3">PO Reference</th>
                        <th className="py-2.5 px-3">Tracking ID</th>
                        <th className="py-2.5 px-3">Dispatch Date</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map(sh => (
                        <tr key={sh.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-[10px] text-slate-700">{sh.id}</td>
                          <td className="py-3 px-3 font-mono text-slate-450">{sh.poId}</td>
                          <td className="py-3 px-3 text-slate-550 font-bold">{sh.trackingId || 'N/A'}</td>
                          <td className="py-3 px-3 text-slate-450">{sh.dispatchDate ? new Date(sh.dispatchDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusBadgeClass(sh.status)}`}>{sh.status}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedShipmentIdState(sh.id);
                                setCurrentSubView('details');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-700 transition cursor-pointer"
                            >
                              View / Track
                            </button>
                          </td>
                        </tr>
                      ))}
                      {shipments.length === 0 && <tr><td colSpan="6" className="py-6 text-center text-slate-400 italic">No active shipments. Mark PO dispatch to create shipments.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW: SHIPMENT DETAILS / TIMELINE VIEW */}
            {currentSubView === 'details' && selectedShipment && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Shipment Status & Chronology: {selectedShipment.id}</h4>
                  <button onClick={() => setCurrentSubView('list')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">PO reference</span><span className="font-bold font-mono">{selectedShipment.poId}</span></div>
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Tracking reference</span><span className="font-bold">{selectedShipment.trackingId || 'N/A'}</span></div>
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Invoice Number</span><span className="font-bold text-slate-700">{selectedShipment.invoiceNumber || 'N/A'}</span></div>
                  <div><span className="text-slate-400 block font-bold uppercase text-[9px]">Dispatch Date</span><span className="font-bold">{selectedShipment.dispatchDate ? new Date(selectedShipment.dispatchDate).toLocaleDateString('en-IN') : 'N/A'}</span></div>
                </div>

                {/* TRACKING TIMELINE */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Status</span>
                      <span className="font-bold text-slate-800">{selectedShipment.status}</span>
                    </div>
                    {selectedShipment.status !== 'Delivered' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Change Status:</span>
                        <select
                          value={selectedShipment.status}
                          onChange={(e) => handleUpdateShipmentStatus(selectedShipment.id, e.target.value)}
                          className="p-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          <option value="Supplier Accepted">Supplier Accepted</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const statuses = ['Supplier Accepted', 'Packed', 'Shipped', 'In Transit', 'Delivered'];
                    const currentIdx = statuses.indexOf(selectedShipment.status);
                    return (
                      <div className="relative flex justify-between items-center w-full py-4 text-xs font-bold text-slate-400 max-w-2xl mx-auto">
                        <div className="absolute left-0 right-0 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 -z-10" />
                        {statuses.map((st, sidx) => {
                          const isDone = sidx <= currentIdx;
                          return (
                            <div key={sidx} className="flex flex-col items-center gap-1 bg-slate-50 px-2 text-center shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border transition-all ${
                                isDone ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'
                              }`}>
                                {isDone ? '✓' : sidx + 1}
                              </div>
                              <span className={`text-[8px] uppercase tracking-wider ${isDone ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>{st}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  <span className="block text-[10px] font-black uppercase text-slate-500 border-b border-slate-100 pb-1">Shipped Items Ledger</span>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[10px]">
                    {selectedShipment.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-200/50 pb-1.5">
                        <span>{it.medicine?.name || it.medicine?.medicineName || 'Medicine'}</span>
                        <span className="font-black text-slate-800">{it.qty} Units</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedShipment.status === 'Delivered' && (
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => {
                        setSelectedPOId(selectedShipment.poId);
                        loadPOItems(selectedShipment.poId, selectedShipment.id);
                        resetNavigation('grn', 'create');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                    >
                      Record GRN for Shipment →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW: CREATE SHIPMENT FORM */}
            {currentSubView === 'create' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Log Dispatch Shipment</h4>
                  <button onClick={() => setCurrentSubView('list')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await handleCreateShipment(shipmentForm.poId, shipmentForm.trackingId, shipmentForm.invoiceNumber, shipmentForm.items);
                  setCurrentSubView('list');
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PO Reference *</label>
                      <input type="text" value={shipmentForm.poId} disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 font-mono" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tracking ID / Courier Ref *</label>
                      <input type="text" value={shipmentForm.trackingId} onChange={(e) => setShipmentForm({ ...shipmentForm, trackingId: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Invoice Ref *</label>
                      <input type="text" value={shipmentForm.invoiceNumber} onChange={(e) => setShipmentForm({ ...shipmentForm, invoiceNumber: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase text-slate-500">Shipped Quantities:</span>
                    {shipmentForm.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{medicines.find(m => m.id === it.medicineId)?.name || 'Medicine'}</span>
                        <input type="number" value={it.qty} onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setShipmentForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].qty = val;
                            return { ...prev, items: newItems };
                          });
                        }} className="p-2 w-28 bg-white border border-slate-200 rounded-lg text-xs" required />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                    <button type="button" onClick={() => setCurrentSubView('list')} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase shadow-sm cursor-pointer">Log Shipment</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: GOODS RECEIPT NOTE (GRN) ─── */}
        {currentTab === 'grn' && (
          <div className="space-y-6 animate-fade-in">
            {/* SUB-VIEW: LIST VIEW */}
            {currentSubView === 'list' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <PackageCheck size={14} className="text-blue-600" /> Goods Receipt Note (GRN) Registry
                  </h4>
                  <button onClick={() => {
                    setSelectedPOId('');
                    setSelectedShipmentId('');
                    setInvoiceNumber('');
                    setGrnItems([]);
                    setCurrentSubView('create');
                  }} tabIndex={0} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-605 hover:bg-emerald-700 text-white bg-emerald-600 rounded-xl text-xs font-black uppercase transition cursor-pointer shadow-sm kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <Plus size={14} /> Record Goods Receipt (GRN)
                          </button>
                </div>

                {/* Search and Tabs row for GRN */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-105">
                  <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    {['Draft', 'Completed'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setGrnListTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
                          grnListTab === tab 
                            ? 'bg-amber-500 text-white shadow-sm font-black' 
                            : 'bg-white hover:bg-slate-150 text-slate-650 border border-slate-200'
                        }`}
                      >
                        {tab} GRNs
                      </button>
                    ))}
                  </div>

                  {/* GRN ADVANCED FILTERS */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="text" placeholder="PO ID..." value={filters.grn.poId} onChange={e => updateFilter('grn', 'poId', e.target.value)} className="w-20 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Invoice..." value={filters.grn.invoice} onChange={e => updateFilter('grn', 'invoice', e.target.value)} className="w-20 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Supplier..." value={filters.grn.supplier} onChange={e => updateFilter('grn', 'supplier', e.target.value)} className="w-24 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Medicine..." value={filters.grn.medicine} onChange={e => updateFilter('grn', 'medicine', e.target.value)} className="w-24 p-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                      <input type="date" value={filters.grn.dateFrom} onChange={e => updateFilter('grn', 'dateFrom', e.target.value)} className="w-20 p-1 text-[10px] bg-transparent outline-none" title="From Date" />
                      <span className="text-[10px] text-slate-300">-</span>
                      <input type="date" value={filters.grn.dateTo} onChange={e => updateFilter('grn', 'dateTo', e.target.value)} className="w-20 p-1 text-[10px] bg-transparent outline-none" title="To Date" />
                    </div>
                    
                    <button onClick={() => clearFilters('grn')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors" title="Clear Filters">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                        <th className="py-2.5 px-3">GRN ID</th>
                        <th className="py-2.5 px-3">PO Reference</th>
                        <th className="py-2.5 px-3">Supplier Name</th>
                        <th className="py-2.5 px-3">Received Date</th>
                        <th className="py-2.5 px-3 text-center">Items Received</th>
                        <th className="py-2.5 px-3 text-center">Verification Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGoodsReceipts.map(grn => (
                        <tr key={grn.id} tabIndex={0} data-kb-row className="border-b border-slate-100 hover:bg-slate-50/50 kb-focusable focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-300 focus:outline-none">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{grn.id}</td>
                          <td className="py-3 px-3 font-mono text-slate-450">{grn.poId}</td>
                          <td className="py-3 px-3 font-bold text-slate-700">{getSupplierName(grn.purchaseOrder?.supplier || purchaseOrders.find(p => p.id === grn.poId)?.supplier || grn.supplierName || grn.supplierId)}</td>
                          <td className="py-3 px-3 text-slate-450">{new Date(grn.receivedDate).toLocaleDateString('en-IN')}</td>
                          <td className="py-3 px-3 text-center font-bold">{grn.items?.length || 0}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">{grn.status}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {grn.status === 'Draft' ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    loadDraftGRN(grn);
                                    setCurrentSubView('create');
                                  }}
                                  tabIndex={0}
                                  data-kb-col
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedGRNIdState(grn.id);
                                    setCurrentSubView('details');
                                  }}
                                  tabIndex={0}
                                  data-kb-col
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedGRNIdState(grn.id);
                                  setCurrentSubView('details');
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                <ChevronRight size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredGoodsReceipts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 italic">No GRN records found in this tab.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW: CREATE GRN RECEIVING Verification Form */}
            {currentSubView === 'create' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Record Goods Receipt Note</h4>
                  <button onClick={() => setCurrentSubView('list')} tabIndex={0} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleGRNSubmitLocal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Purchase Order *</label>
                      <SearchableDropdown
                        options={pendingGRNOrders.map(po => ({ id: po.id, name: `${po.id} — ${getSupplierName(po.supplier)}` }))}
                        value={selectedPOId}
                        onChange={(val) => loadPOItems(val)}
                        placeholder="Type to search PO ID..."
                        inputClass="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-705 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Invoice reference *</label>
                      <input type="text" placeholder="e.g. INV-2021" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                        tabIndex={0}
                        className={`w-full p-2.5 bg-slate-50 border ${invoiceError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl text-xs font-bold kb-focusable focus:ring-2 focus:outline-none`} required />
                      {invoiceError && <span className="text-[9px] font-bold text-rose-600 block mt-1">{invoiceError}</span>}
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Received By</label>
                      <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
                        tabIndex={0}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                  </div>

                  {grnItems.length > 0 && (
                    <div className="space-y-4">
                      <span className="block text-[10px] font-black uppercase text-slate-500 border-b border-slate-100 pb-1">Quality Inspection Items Checklist:</span>
                      
                      {grnItems.map((item, idx) => {
                        const remaining = item.orderedQty - item.alreadyReceived - item.alreadyCancelled;
                        const rx = parseInt(item.receivedQty) || 0; // Current Raw Received Quantity input
                        const dmg = parseInt(item.damagedQty) || 0;  // Damaged Quantity input
                        const cancelled = parseInt(item.cancelledQty) || 0; // Cancelled Quantity input
                        const pending = Math.max(0, remaining - rx - cancelled); // Pending Quantity auto-calculated
                        const accepted = Math.max(0, rx - dmg);                    // Accepted Quantity auto-calculated

                        return (
                          <div key={idx} tabIndex={0} data-kb-row className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3 kb-focusable focus:ring-2 focus:ring-blue-400 focus:bg-slate-50/50 focus:outline-none">
                            <div className="flex flex-wrap justify-between items-center text-xs gap-2">
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-blue-800">{item.medicineName}</span>
                                {item.itemStatus && item.itemStatus !== 'Pending' && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                    item.itemStatus === 'Completed' || item.itemStatus === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                                    item.itemStatus === 'Partially Received' ? 'bg-blue-100 text-blue-800' :
                                    item.itemStatus === 'Damaged' ? 'bg-rose-100 text-rose-800' :
                                    item.itemStatus === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {item.itemStatus}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Ordered: {item.orderedQty}</span>
                                <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">Rec. Previously: {item.alreadyReceived}</span>
                                {item.alreadyCancelled > 0 && <span className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-800">Cancelled Previously: {item.alreadyCancelled}</span>}
                                <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-black">Accepted this GRN: {accepted}</span>
                                <span className={`${pending > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-450'} px-1.5 py-0.5 rounded`}>Pending Qty: {pending}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Batch Number *</label>
                                <input type="text" value={item.batchNumber || ''} onChange={(e) => updateGrnItem(idx, 'batchNumber', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Current Received Qty *</label>
                                <input type="number" value={item.receivedQty} onChange={(e) => updateGrnItem(idx, 'receivedQty', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Damaged Qty</label>
                                <input type="number" value={item.damagedQty} onChange={(e) => updateGrnItem(idx, 'damagedQty', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Cancelled Qty</label>
                                <input type="number" value={item.cancelledQty} onChange={(e) => updateGrnItem(idx, 'cancelledQty', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Mfg Date *</label>
                                <input type="date" value={item.mfgDate || ''} onChange={(e) => updateGrnItem(idx, 'mfgDate', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Expiry Date *</label>
                                <input type="date" value={item.expiryDate || ''} onChange={(e) => updateGrnItem(idx, 'expiryDate', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Remarks / Details</label>
                                <input type="text" placeholder="Remarks..." value={item.remarks || ''} onChange={(e) => updateGrnItem(idx, 'remarks', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                              </div>
                            </div>

                            {cancelled > 0 && (
                              <div className="text-xs space-y-1">
                                <label className="block text-[8px] font-bold text-rose-600 uppercase">Reason for Cancellation *</label>
                                <textarea
                                  placeholder="Provide short explanation why this quantity is cancelled..."
                                  value={item.cancelReason || ''}
                                  onChange={(e) => updateGrnItem(idx, 'cancelReason', e.target.value)}
                                  tabIndex={0}
                                  data-kb-col
                                  rows={1}
                                  className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                  required
                                />
                              </div>
                            )}

                            <div className="flex gap-2 justify-end pt-1 border-t border-slate-100/50 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (rx <= 0) { toast.error("Please enter a valid Received Qty first."); return; }
                                  if (rx + cancelled > remaining) { toast.error("Total quantity exceeds remaining ordered quantity."); return; }
                                  updateGrnItem(idx, 'itemStatus', pending === 0 ? 'Received' : 'Partially Received');
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                Mark Received
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (dmg <= 0) { toast.error("Please enter a Damaged Qty."); return; }
                                  if (!item.remarks || !item.remarks.trim()) { toast.error("Please provide a damage reason in Remarks."); return; }
                                  updateGrnItem(idx, 'itemStatus', 'Damaged');
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[9px] font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                Mark Damaged
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (cancelled <= 0) { toast.error("Please enter a Cancelled Qty."); return; }
                                  if (!item.cancelReason || !item.cancelReason.trim()) { toast.error("Please provide a reason for cancellation."); return; }
                                  updateGrnItem(idx, 'itemStatus', 'Cancelled');
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-200 rounded text-[9px] font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                Mark Cancelled
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateGrnItem(idx, 'receivedQty', 0);
                                  updateGrnItem(idx, 'damagedQty', 0);
                                  updateGrnItem(idx, 'cancelledQty', 0);
                                  updateGrnItem(idx, 'cancelReason', '');
                                  updateGrnItem(idx, 'remarks', '');
                                  updateGrnItem(idx, 'itemStatus', 'Pending');
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded text-[9px] font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                Reset Qty
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => resetNavigation('grn', 'list')} tabIndex={0} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">Cancel</button>
                    <button type="button" onClick={handleGRNDraftSubmitLocal} tabIndex={0} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">Save Draft</button>
                    <button type="submit" disabled={!selectedPOId || grnItems.length === 0}
                      tabIndex={0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase shadow-sm cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      Confirm GRN & Auto Allocate
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB-VIEW: GRN DETAILS VIEW */}
            {currentSubView === 'details' && selectedGRN && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">GRN Details File: {selectedGRN.id}</h4>
                  <button onClick={() => setCurrentSubView('list')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PO Reference</label>
                    <div className="font-mono text-sm font-bold text-slate-700">{selectedGRN.poId}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Name</label>
                    <div className="text-sm font-bold text-slate-700">{getSupplierName(selectedGRN.purchaseOrder?.supplier || purchaseOrders.find(p => p.id === selectedGRN.poId)?.supplier)}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Number</label>
                    <div className="font-mono text-sm font-bold text-slate-700">{selectedGRN.invoiceNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                    <div className="text-sm font-bold text-slate-700">{selectedGRN.status}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Date</label>
                    <div className="text-sm font-bold text-slate-700">{selectedGRN.completedDate ? new Date(selectedGRN.completedDate).toLocaleString('en-IN') : 'N/A'}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-[10px] font-black uppercase text-slate-500 border-b border-slate-100 pb-1">Verified Received Medicines</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                          <th className="py-2 px-3">Medicine Name</th>
                          <th className="py-2 px-3 text-center">Ordered</th>
                          <th className="py-2 px-3">Batch</th>
                          <th className="py-2 px-3 text-center">Received</th>
                          <th className="py-2 px-3 text-center">Damaged</th>
                          <th className="py-2 px-3 text-center">Cancelled</th>
                          <th className="py-2 px-3 text-center">Accepted</th>
                          <th className="py-2 px-3 text-center">Pending</th>
                          <th className="py-2 px-3">Remarks</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Mfg Date</th>
                          <th className="py-2 px-3">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGRN.items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-slate-800">{item.medicineName || `Med #${item.medicineId}`}</td>
                            <td className="py-3 px-3 text-center text-slate-500 font-bold">{item.orderedQty || 0}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 font-bold text-[10px]">{item.batchNumber || 'N/A'}</td>
                            <td className="py-3 px-3 text-center font-mono font-black text-emerald-600">{item.receivedQty || 0}</td>
                            <td className="py-3 px-3 text-center font-mono text-rose-500 font-bold">{item.damagedQty || 0}</td>
                            <td className="py-3 px-3 text-center font-mono text-rose-500 font-bold">{item.cancelledQty || 0}</td>
                            <td className="py-3 px-3 text-center font-mono font-black text-blue-600">{item.acceptedQty || 0}</td>
                            <td className="py-3 px-3 text-center font-mono text-amber-500 font-bold">{item.pendingQty || 0}</td>
                            <td className="py-3 px-3 text-slate-500 text-[10px]">{item.remarks || '-'}</td>
                            <td className="py-3 px-3 text-slate-500">{item.status || 'Completed'}</td>
                            <td className="py-3 px-3 text-slate-500">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'completed' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" /> Unified Procurement History Ledger
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Chronological ledger of completed and cancelled procurement order cycles.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="PO ID..." value={filters.history.poId} onChange={e => updateFilter('history', 'poId', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="GRN ID..." value={filters.history.grnId} onChange={e => updateFilter('history', 'grnId', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="Invoice..." value={filters.history.invoice} onChange={e => updateFilter('history', 'invoice', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="Supplier..." value={filters.history.supplier} onChange={e => updateFilter('history', 'supplier', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <input type="text" placeholder="Medicine..." value={filters.history.medicine} onChange={e => updateFilter('history', 'medicine', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="w-32">
                  <select value={filters.history.status} onChange={e => updateFilter('history', 'status', e.target.value)} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <input type="date" value={filters.history.dateFrom} onChange={e => updateFilter('history', 'dateFrom', e.target.value)} className="text-[10px] bg-transparent outline-none" title="From Date" />
                  <span className="text-[9px] text-slate-300">to</span>
                  <input type="date" value={filters.history.dateTo} onChange={e => updateFilter('history', 'dateTo', e.target.value)} className="text-[10px] bg-transparent outline-none" title="To Date" />
                </div>
                <button onClick={() => clearFilters('history')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Clear Filters">
                  <X size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200">
                      <th className="py-2.5 px-3">PO ID</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-center">Medicine Count</th>
                      <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                      <th className="py-2.5 px-3 text-center">Received Qty</th>
                      <th className="py-2.5 px-3 text-center">Damaged Qty</th>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3 text-center">Completed Date</th>
                      <th className="py-2.5 px-3 text-center">Final Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                      {completedPOs
                        .filter(po => {
                          const { dateFrom, dateTo, supplier, medicine, invoice, poId, grnId, status } = filters.history;
                          
                          // Date Filter
                          if (dateFrom && new Date(po.updatedAt) < new Date(dateFrom)) return false;
                          if (dateTo && new Date(po.updatedAt) > new Date(dateTo)) return false;
                          
                          // Status Filter
                          if (status && po.status !== status && po.status !== status.toUpperCase()) return false;
                          
                          // PO ID Filter
                          if (poId && !po.id.toLowerCase().includes(poId.toLowerCase())) return false;
                          
                          // Supplier Filter
                          if (supplier && !getSupplierName(po.supplier).toLowerCase().includes(supplier.toLowerCase())) return false;
                          
                          // GRN & Invoice Filter
                          if (grnId || invoice) {
                            let hasGrnMatch = false;
                            if (po.grns && po.grns.length > 0) {
                              hasGrnMatch = po.grns.some(g => {
                                const idMatch = !grnId || g.id.toLowerCase().includes(grnId.toLowerCase());
                                const invMatch = !invoice || (g.invoiceNumber && g.invoiceNumber.toLowerCase().includes(invoice.toLowerCase()));
                                return idMatch && invMatch;
                              });
                            }
                            if (!hasGrnMatch) return false;
                          }
                          
                          // Medicine Filter
                          if (medicine && !po.items?.some(it => (it.medicineName || '').toLowerCase().includes(medicine.toLowerCase()))) return false;
                          
                          return true;
                        })
                        .map(po => {
                      const medicineCount = po.items?.length || 0;
                      const orderedQty = po.items?.reduce((s, it) => s + it.qty, 0) || 0;
                      const receivedQty = po.items?.reduce((s, it) => s + (it.receivedQty || 0), 0) || 0;
                      const damagedQty = po.items?.reduce((s, it) => s + (it.damagedQty || 0), 0) || 0;
                      const invoiceNumbers = po.grns?.map(g => g.invoiceNumber).filter(Boolean).join(', ') || 'N/A';
                      const completedDate = new Date(po.updatedAt).toLocaleDateString('en-IN');
                      const statusDisplay = getPOStatusDisplay(po.status);
                      
                      return (
                        <tr key={po.id} tabIndex={0} data-kb-row className="border-b border-slate-100 hover:bg-slate-50/50 kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none">
                          <td className="py-3 px-3 font-mono font-bold text-[10px] text-slate-700">{po.id}</td>
                          <td className="py-3 px-3 font-bold text-slate-700">{getSupplierName(po.supplier)}</td>
                          <td className="py-3 px-3 text-center font-semibold">{medicineCount}</td>
                          <td className="py-3 px-3 text-center font-mono">{orderedQty}</td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-600 font-bold">{receivedQty}</td>
                          <td className="py-3 px-3 text-center font-mono text-rose-500">{damagedQty}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{invoiceNumbers}</td>
                          <td className="py-3 px-3 text-center text-slate-500 font-semibold">{completedDate}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusBadgeClass(po.status)}`}>
                              {statusDisplay}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedPOIdState(po.id);
                                  resetNavigation('po', 'details');
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-bold uppercase text-slate-700 transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  toast.success(`Downloading PDF Invoice for ${po.id}...`);
                                }}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-bold uppercase text-slate-700 transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => handlePrintPO(po)}
                                tabIndex={0}
                                data-kb-col
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[9px] font-black uppercase transition cursor-pointer kb-focusable focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {completedPOs.length === 0 && (
                      <tr>
                        <td colSpan="10" className="py-8 text-center text-slate-400 italic">No historical records logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification HUD */}
        <ToastContainer toasts={toasts} confirm={confirm} dismiss={dismiss} resolveConfirm={resolveConfirm} />
      </div>
    </ErrorBoundary>
  );
}
