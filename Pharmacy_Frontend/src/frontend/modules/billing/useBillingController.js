import { useState, useEffect, useCallback, useRef } from 'react';
import { useDB } from '../../db/DBContext';
import { billingAPI } from '../../db/api';
import axios from 'axios';
import { useToast } from './useToast';

export function useBillingController(role) {
  const getAuthHeader = () => {
    const token = localStorage.getItem('pharmacy_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const { toasts, toast, confirm, dismiss, resolveConfirm } = useToast();

  const { medicines, setMedicines, salesHistory, setSalesHistory, batches } = useDB();

  // Navigation state
  const [viewState, setViewState] = useState('new-bill');

  // Customer Data
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerHistory, setCustomerHistory] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  // Cart
  const [billingCart, setBillingCart] = useState([]);
  
  // Barcode / Search
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const barcodeInputRef = useRef(null);

  // Queue
  const [savedQueue, setSavedQueue] = useState([]);

  // Payment
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [payCash, setPayCash] = useState('');
  const [payUPI, setPayUPI] = useState('');
  const [payCard, setPayCard] = useState('');
  
  // Invoice Preview
  const [printBillObj, setPrintBillObj] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentSnapshot, setPaymentSnapshot] = useState({ cash: 0, upi: 0, card: 0 });

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  // Daily Discount
  const [dailyDiscountRate, setDailyDiscountRate] = useState(5);

  // Prescription Upload
  const [prescriptionBase64, setPrescriptionBase64] = useState('');

  // Keyboard navigation for billing cart
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [editQtyValue, setEditQtyValue] = useState('');

  // Auto-focus barcode field
  const focusBarcode = useCallback(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Live clock tick & Settings fetch
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch daily discount rate from settings
    billingAPI.getSettings().then(res => {
      if (res && res.data && res.data.dailyDiscountRate !== undefined) {
        setDailyDiscountRate(res.data.dailyDiscountRate);
      }
    }).catch(err => console.error("Failed to fetch settings:", err));

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewState === 'new-bill' && !checkoutModal) {
      focusBarcode();
    }
  }, [viewState, checkoutModal, focusBarcode, billingCart]);

  // Handle Mobile Number Change (Fetch Customer)
  useEffect(() => {
    const fetchCustomer = async () => {
      if (mobileNumber.length === 10) {
        try {
          const res = await axios.get(`${API_BASE_URL}/customers/mobile/${mobileNumber}`, { headers: getAuthHeader() });
          if (res.data && res.data.data) {
            setCustomerName(res.data.data.name);
            setOutstandingBalance(res.data.data.outstandingBalance || 0);
          } else {
            setCustomerName('');
            setOutstandingBalance(0);
          }

          const histRes = await axios.get(`${API_BASE_URL}/billing/history/${mobileNumber}`, { headers: getAuthHeader() });
          if (histRes.data && histRes.data.data) {
            setCustomerHistory(histRes.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch customer data", err);
        }
      } else {
        setCustomerName('');
        setOutstandingBalance(0);
        setCustomerHistory([]);
      }
    };
    fetchCustomer();
  }, [mobileNumber]);

  // Cart Calculations — respects per-item discount
  const calcItemTotal = (price, qty, discount = 0) => {
    const discountedPrice = price * (1 - (Number(discount) || 0) / 100);
    return discountedPrice * qty;
  };
  const getSubtotal = () => billingCart.reduce((sum, item) => sum + item.total, 0);
  const getTaxAmount = () => billingCart.reduce((sum, item) => sum + (item.total * (item.gstRate || 0) / 100), 0);
  // Pre-round grand total (subtotal + tax)
  const getGrandTotal = () => getSubtotal() + getTaxAmount();
  // Round-off: Math.round to nearest rupee
  const getRoundOff = () => parseFloat((Math.round(getGrandTotal()) - getGrandTotal()).toFixed(2));
  // Final total after rounding
  const getFinalTotal = () => Math.round(getGrandTotal());

  const getFefoBatch = (medicineId) => {
    const medBatches = (batches || []).filter(b => String(b.medicineId) === String(medicineId) && b.status === 'Active' && b.stockQty > 0);
    if (medBatches.length === 0) return { batchNumber: 'B-DEFAULT', expiryDate: '2028-12-31' };
    medBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    return medBatches[0];
  };

  // Live search as user types
  useEffect(() => {
    const query = barcodeInput.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setSelectedSearchIndex(-1);
      return;
    }
    
    const results = medicines.filter(m => 
      m.name.toLowerCase().includes(query) || 
      (m.generic && m.generic.toLowerCase().includes(query)) || 
      m.sku.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
    setSelectedSearchIndex(results.length > 0 ? 0 : -1);
  }, [barcodeInput, medicines]);

  const handleBarcodeScan = (e) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    // Exact SKU match bypasses the dropdown (useful for fast hardware barcode scanners)
    const exactMed = medicines.find(m => m.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (exactMed) {
      addMedicineToCart(exactMed);
      setBarcodeInput('');
      setSearchResults([]);
      return;
    }

    // If not exact SKU but there are search results, add the highlighted one
    if (searchResults.length > 0 && selectedSearchIndex > -1) {
      addMedicineToCart(searchResults[selectedSearchIndex], true);
      setBarcodeInput('');
      setSearchResults([]);
    } else {
      toast.error('No medicine matches your search');
    }
  };

  const SELLING_UNITS = ['Tablet', 'Strip', 'Capsule', 'Syrup (ml)', 'Injection', 'Box', 'Sachet', 'Tube', 'Drops', 'Cream'];

  const addMedicineToCart = (med, focusQty = false) => {
    const activeBatch = getFefoBatch(med.id);
    const defaultUnit = med.sellingUnit || 'Tablet';
    const existingIndex = billingCart.findIndex(item => item.medicineId === med.id && item.batchNumber === activeBatch.batchNumber);
    let updatedCart = [...billingCart];

    if (existingIndex > -1) {
      const item = updatedCart[existingIndex];
      const newQty = item.qty + 1;
      updatedCart[existingIndex] = {
        ...item,
        qty: newQty,
        total: calcItemTotal(item.price, newQty, item.discount)
      };
    } else {
      updatedCart.push({
        medicineId: med.id,
        name: med.name,
        generic: med.generic || '',
        batchNumber: activeBatch.batchNumber,
        expiryDate: activeBatch.expiryDate,
        rack: med.rack || activeBatch.rack || 'A-01',
        stock: med.stock,
        qty: 1,
        price: med.price,
        gstRate: med.gstRate || 12,
        sellingUnit: defaultUnit,
        discount: dailyDiscountRate > 0 ? dailyDiscountRate : 0,
        total: calcItemTotal(med.price, 1, dailyDiscountRate > 0 ? dailyDiscountRate : 0)
      });
    }

    setBillingCart(updatedCart);
    checkLowStock(med, updatedCart);
    
    const targetIdx = existingIndex > -1 ? existingIndex : updatedCart.length - 1;
    setSelectedCartIndex(targetIdx);

    if (focusQty) {
      setIsEditingQty(true);
      setEditQtyValue(updatedCart[targetIdx].qty.toString());
    } else {
      focusBarcode();
    }
  };

  const updateCartQty = (index, delta) => {
    const updated = [...billingCart];
    const newQty = (Number(updated[index].qty) || 0) + delta;
    if (newQty > 0) {
      updated[index] = {
        ...updated[index],
        qty: newQty,
        total: calcItemTotal(updated[index].price, newQty, updated[index].discount)
      };
      setBillingCart(updated);
      const med = medicines.find(m => m.id === updated[index].medicineId);
      if (med) checkLowStock(med, updated);
    }
  };

  const updateCartItemQtyExact = (index, newQtyStr) => {
    const updated = [...billingCart];
    const qtyToSet = newQtyStr === '' ? '' : Math.max(1, parseInt(newQtyStr, 10) || 1);
    updated[index] = {
      ...updated[index],
      qty: qtyToSet,
      total: calcItemTotal(updated[index].price, Number(qtyToSet) || 0, updated[index].discount)
    };
    setBillingCart(updated);
    if (qtyToSet !== '') {
      const med = medicines.find(m => m.id === updated[index].medicineId);
      if (med) checkLowStock(med, updated);
    }
  };

  const updateCartItemDiscount = (index, newDiscount) => {
    const updated = [...billingCart];
    const disc = Math.min(100, Math.max(0, Number(newDiscount) || 0));
    updated[index] = {
      ...updated[index],
      discount: disc,
      total: calcItemTotal(updated[index].price, updated[index].qty, disc)
    };
    setBillingCart(updated);
  };

  const applyGlobalDiscount = (rate) => {
    const r = Math.min(100, Math.max(0, Number(rate) || 0));
    setDailyDiscountRate(r);
    if (billingCart.length > 0) {
      const updated = billingCart.map(item => ({
        ...item,
        discount: r,
        total: calcItemTotal(item.price, item.qty, r)
      }));
      setBillingCart(updated);
    }
  };

  const saveDefaultDiscount = async (rate) => {
    try {
      await billingAPI.updateSettings({ dailyDiscountRate: rate });
      toast.success(`Default discount saved as ${rate}%`);
    } catch (err) {
      toast.error('Failed to save default discount');
    }
  };

  const updateCartItemUnit = (index, newUnit) => {
    const updated = [...billingCart];
    updated[index] = { ...updated[index], sellingUnit: newUnit };
    setBillingCart(updated);
  };

  const removeFromCart = (index) => {
    const updated = billingCart.filter((_, idx) => idx !== index);
    setBillingCart(updated);
    if (updated.length === 0) {
      setSelectedCartIndex(-1);
    } else if (selectedCartIndex >= updated.length) {
      setSelectedCartIndex(updated.length - 1);
    }
    focusBarcode();
  };

  const checkLowStock = (med, cart) => {
    const cartQty = cart.filter(i => i.medicineId === med.id).reduce((sum, i) => sum + i.qty, 0);
    const remaining = med.stock - cartQty;
    if (remaining < med.reorderLevel) {
      toast.warning(`Low Stock Warning: ${med.name} will have ${remaining} remaining (below reorder level)`);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in inputs other than barcode (unless it's an F-key)
      if (e.target.tagName === 'INPUT' && e.target !== barcodeInputRef.current && !e.key.startsWith('F')) {
        return;
      }

      switch(e.key) {
        case 'F2':
          e.preventDefault();
          if (billingCart.length > 0) {
            const indexToEdit = selectedCartIndex > -1 ? selectedCartIndex : 0;
            setSelectedCartIndex(indexToEdit);
            setIsEditingQty(true);
            setEditQtyValue(billingCart[indexToEdit].qty.toString());
          }
          break;
        case 'F4':
          e.preventDefault();
          holdCurrentBill();
          break;
        case 'F3':
          e.preventDefault();
          setViewState(prev => prev === 'queue' ? 'new-bill' : 'queue');
          break;
        case 'F5':
          e.preventDefault();
          if (checkoutModal) return;
          const mobileInput = document.querySelector('input[placeholder="Mobile Number"]');
          if (mobileInput) mobileInput.focus();
          break;
        case 'F6':
          e.preventDefault();
          if (billingCart.length > 0) setCheckoutModal(true);
          break;
        case 'F7':
          e.preventDefault();
          if (checkoutModal) {
             const activeElt = document.activeElement;
             const cashInput = document.querySelector('input[placeholder="Cash amount"]');
             const upiInput = document.querySelector('input[placeholder="UPI amount"]');
             const cardInput = document.querySelector('input[placeholder="Card amount"]');
             
             if (activeElt === cashInput) upiInput?.focus();
             else if (activeElt === upiInput) cardInput?.focus();
             else cashInput?.focus();
          }
          break;
        case 'F8':
          e.preventDefault();
          if (viewState === 'invoice-preview' && invoiceData) triggerPrintWindow(invoiceData);
          else if (printBillObj) triggerPrintWindow(printBillObj);
          break;
        case 'Escape':
          if (viewState === 'invoice-preview') { setViewState('new-bill'); setInvoiceData(null); }
          else if (checkoutModal) setCheckoutModal(false);
          else if (searchResults.length > 0) setSearchResults([]);
          else if (isEditingQty) { setIsEditingQty(false); focusBarcode(); }
          else if (viewState !== 'new-bill') setViewState('new-bill');
          else focusBarcode();
          break;
        case 'ArrowUp':
          if (searchResults.length > 0) {
            e.preventDefault();
            setSelectedSearchIndex(prev => prev > 0 ? prev - 1 : prev);
          } else if (billingCart.length > 0 && !isEditingQty) {
            e.preventDefault();
            setSelectedCartIndex(prev => prev > 0 ? prev - 1 : prev);
          }
          break;
        case 'ArrowDown':
          if (searchResults.length > 0) {
            e.preventDefault();
            setSelectedSearchIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
          } else if (billingCart.length > 0 && !isEditingQty) {
            e.preventDefault();
            setSelectedCartIndex(prev => prev < billingCart.length - 1 ? prev + 1 : prev);
          }
          break;
        case 'Enter':
          if (searchResults.length > 0 && selectedSearchIndex > -1) {
            e.preventDefault();
            addMedicineToCart(searchResults[selectedSearchIndex], true);
            setSearchResults([]);
            setBarcodeInput('');
          } else if (isEditingQty && selectedCartIndex > -1) {
            e.preventDefault();
            updateCartItemQtyExact(selectedCartIndex, editQtyValue);
            setIsEditingQty(false);
            focusBarcode();
          }
          break;
        case 'ArrowRight':
          if (!isEditingQty && billingCart.length > 0 && selectedCartIndex > -1) {
            if (document.activeElement === barcodeInputRef.current && barcodeInput.length > 0) return;
            e.preventDefault();
            updateCartQty(selectedCartIndex, 1);
          }
          break;
        case 'ArrowLeft':
          if (!isEditingQty && billingCart.length > 0 && selectedCartIndex > -1) {
            if (document.activeElement === barcodeInputRef.current && barcodeInput.length > 0) return;
            e.preventDefault();
            updateCartQty(selectedCartIndex, -1);
          }
          break;
        case '+':
          if (!isEditingQty && billingCart.length > 0 && selectedCartIndex > -1) {
            e.preventDefault();
            updateCartQty(selectedCartIndex, 1);
          }
          break;
        case '-':
          if (!isEditingQty && billingCart.length > 0 && selectedCartIndex > -1) {
            e.preventDefault();
            updateCartQty(selectedCartIndex, -1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billingCart, searchResults, viewState, checkoutModal, invoiceData, printBillObj, selectedSearchIndex, selectedCartIndex, isEditingQty, editQtyValue]);

  const holdCurrentBill = async () => {
    if (billingCart.length === 0) return;
    const queueId = `Q-${Date.now().toString().slice(-4)}`;
    const heldBill = {
      queueId,
      customerName: customerName || 'Walk-in',
      mobileNumber,
      items: [...billingCart],
      draftTotalAmount: getGrandTotal(),
      createdTime: new Date().toLocaleString()
    };
    try {
      await axios.post(`${API_BASE_URL}/billing/hold`, heldBill, { headers: getAuthHeader() });
      setSavedQueue(prev => [heldBill, ...prev]);
      resetBill();
      toast.success(`Bill saved to queue: ${queueId}`);
    } catch (err) {
      toast.error('Failed to hold bill');
    }
  };

  const resumeBill = async (queueId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/billing/resume`, { queueId }, { headers: getAuthHeader() });
      if (res.data && res.data.data) {
        const bill = res.data.data;
        setCustomerName(bill.customerName);
        setMobileNumber(bill.mobileNumber);
        setBillingCart(bill.items);
        setSavedQueue(prev => prev.filter(b => b.queueId !== queueId));
        setViewState('new-bill');
        toast.success('Bill resumed');
      }
    } catch (err) {
      toast.error('Failed to resume bill');
    }
  };

  const cancelQueueBill = async (queueId) => {
    try {
      await axios.delete(`${API_BASE_URL}/billing/queue/${queueId}`, { headers: getAuthHeader() });
      setSavedQueue(prev => prev.filter(b => b.queueId !== queueId));
      toast.success('Queued bill cancelled');
    } catch (err) {
      toast.error('Failed to cancel queue item');
    }
  };

  const resetBill = () => {
    setCustomerName('');
    setMobileNumber('');
    setBillingCart([]);
    setBarcodeInput('');
    setPayCash('');
    setPayUPI('');
    setPayCard('');
    setCustomerHistory([]);
    setOutstandingBalance(0);
    setPrescriptionBase64('');
    setSelectedCartIndex(-1);
    setIsEditingQty(false);
    setEditQtyValue('');
  };
  const handleCheckout = () => {
    if (billingCart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    setCheckoutModal(true);
  };
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const total = getGrandTotal();
    const paid = Number(payCash || 0) + Number(payUPI || 0) + Number(payCard || 0);
    
    if (paid <= 0) {
      toast.warning('Please enter a payment amount');
      return;
    }

    const paymentModes = [];
    if (payCash) paymentModes.push('Cash');
    if (payUPI) paymentModes.push('UPI');
    if (payCard) paymentModes.push('Card');

    const newSale = {
      patientName: customerName || 'Walk-in',
      mobileNumber: mobileNumber || null,
      billType: 'Normal',
      subtotal: getSubtotal(),
      gstTax: getTaxAmount(),
      grandTotal: getGrandTotal(),
      roundOff: getRoundOff(),
      paymentMethod: paymentModes.join('+'),
      paymentStatus: paid >= getFinalTotal() ? 'Paid' : 'Partially Paid',
      paidAmount: paid,
      balanceAmount: Math.max(0, getFinalTotal() - paid),
      items: billingCart.map(item => ({
        medicineId: item.medicineId,
        name: item.name,
        qty: item.qty,
        price: item.price,
        gstRate: item.gstRate,
        total: item.total,
        discount: item.discount || 0,
        sellingUnit: item.sellingUnit || 'Tablet',
        rack: item.rack || 'A-01',
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        totalPieces: item.qty
      }))
    };

    try {
      const res = await billingAPI.createBill(newSale);
      // billingAPI uses fetch wrapper that returns JSON directly (not axios {data:...})
      if (res && res.success) {
        toast.success('Checkout successful! Invoice ready.');
        const confirmedBill = res.data;
        setPrintBillObj(confirmedBill);
        setInvoiceData(confirmedBill);
        setSalesHistory(prev => [confirmedBill, ...(prev || [])]);
        setPaymentSnapshot({ cash: Number(payCash || 0), upi: Number(payUPI || 0), card: Number(payCard || 0) });
        setCheckoutModal(false);
        resetBill();
        setViewState('invoice-preview');
      } else {
        toast.error('Checkout failed: ' + (res?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('[Checkout Error]', err);
      const msg = err?.message || 'Server error';
      toast.error('Checkout failed: ' + msg);
    }
  };

  const triggerPrintWindow = async (billObj) => {
    try {
      await axios.put(`${API_BASE_URL}/billing/print-count`, { id: billObj.id }, { headers: getAuthHeader() });
    } catch (err) {
      console.warn('Could not update print count', err);
    }
  };

  const handleNewBillAfterInvoice = () => {
    setViewState('new-bill');
    setInvoiceData(null);
    setPaymentSnapshot({ cash: 0, upi: 0, card: 0 });
    focusBarcode();
  };

  // Queue fetching
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/billing/queue`, { headers: getAuthHeader() });
        if (res.data && res.data.success) {
          setSavedQueue(res.data.data);
        }
      } catch (err) {}
    };
    fetchQueue();
  }, [API_BASE_URL]);

  return {
    viewState, setViewState,
    mobileNumber, setMobileNumber,
    customerName, setCustomerName,
    customerHistory, outstandingBalance,
    billingCart,
    barcodeInput, setBarcodeInput, handleBarcodeScan,
    searchResults, selectedSearchIndex, barcodeInputRef, addMedicineToCart,
    updateCartQty, removeFromCart, updateCartItemQtyExact,
    getSubtotal, getTaxAmount, getGrandTotal, getRoundOff, getFinalTotal,
    holdCurrentBill, resumeBill, cancelQueueBill,
    checkoutModal, setCheckoutModal,
    payCash, setPayCash, payUPI, setPayUPI, payCard, setPayCard,
    handleCheckoutSubmit, triggerPrintWindow, printBillObj,
    invoiceData, paymentSnapshot, handleNewBillAfterInvoice,
    updateCartQty, updateCartItemQtyExact, updateCartItemDiscount, applyGlobalDiscount, saveDefaultDiscount, updateCartItemUnit, SELLING_UNITS,
    currentTime, dailyDiscountRate,
    salesHistory, setSalesHistory, setInvoiceData,
    savedQueue, toasts, dismiss, resolveConfirm,
    prescriptionBase64, setPrescriptionBase64,
    selectedCartIndex, setSelectedCartIndex,
    isEditingQty, setIsEditingQty,
    editQtyValue, setEditQtyValue
  };
}
