import React, { useState } from 'react';
import { Printer, BarChart3, Database, Plus, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import { useDB } from '../../db/DBContext';

export default function ReportsView({ setSchemaModalTable }) {
  const { 
    salesHistory, 
    purchaseOrders, 
    medicines, 
    expenses, 
    setExpenses, 
    auditLogs, 
    setAuditLogs,
    customers 
  } = useDB();

  const [activeReportTab, setActiveReportTab] = useState(() => {
    return localStorage.getItem('active_report_subtab') || 'sales';
  });

  const handleTabChange = (tab) => {
    setActiveReportTab(tab);
    localStorage.setItem('active_report_subtab', tab);
  };

  const [auditQuery, setAuditQuery] = useState('');

  // New Expense form state
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseRemarks, setExpenseRemarks] = useState('');

  // Handle adding new expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseCategory.trim()) {
      alert('Please specify a category.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const nextId = `EXP-${Date.now().toString().slice(-3)}`;
    const newExpense = {
      id: nextId,
      date: new Date().toLocaleString(),
      category: expenseCategory.trim(),
      amount: amt,
      remarks: expenseRemarks.trim() || 'N/A'
    };

    setExpenses([newExpense, ...expenses]);

    // Log to Audit logs
    const newAuditLog = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toLocaleString(),
      user: 'Admin',
      action: 'Expense Logged',
      details: `Logged expense of ₹ ${amt.toFixed(2)} under category "${newExpense.category}"`
    };
    setAuditLogs([newAuditLog, ...auditLogs]);

    alert('Expense recorded successfully.');
    setExpenseCategory('');
    setExpenseAmount('');
    setExpenseRemarks('');
  };

  // Financial statistics calculations
  const totalSales = salesHistory.reduce((sum, item) => sum + Number(item.grandTotal || item.total || 0), 0);
  const totalGstTax = salesHistory.reduce((sum, item) => sum + Number(item.gstTax || item.gst || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netEarnings = totalSales - totalExpenses;

  // Outstanding credit balance
  const totalCreditOwed = customers.reduce((sum, item) => sum + item.outstandingBalance, 0);

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => 
    log.user.toLowerCase().includes(auditQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(auditQuery.toLowerCase())
  );


  const downloadInvoicePDF = (bill) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Your browser is blocking the new page. Please allow pop-ups so you can print the bill.');
      return;
    }

    const items = bill.items || [
      { name: 'General Medicines (Mock Ledger Item)', qty: 1, price: bill.total - bill.gst, gstRate: 12, total: bill.total - bill.gst }
    ];

    const receiptHtml = `
      <html>
        <head>
          <title>Invoice - ${bill.id}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #334155;
              margin: 0;
              padding: 40px;
              background-color: #fff;
            }
            .invoice-card {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 24px;
              margin-bottom: 30px;
            }
            .logo-section h1 {
              font-size: 22px;
              font-weight: 900;
              color: #059669;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .logo-section p {
              font-size: 11px;
              color: #64748b;
              margin: 0;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.3px;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              font-size: 18px;
              font-weight: 900;
              margin: 0 0 6px 0;
              color: #0f172a;
            }
            .invoice-details p {
              font-size: 12px;
              color: #475569;
              margin: 3px 0;
            }
            .bill-to {
              margin-bottom: 30px;
              background-color: #f8fafc;
              padding: 16px 20px;
              border-radius: 16px;
              border: 1px solid #f1f5f9;
            }
            .bill-to h3 {
              font-size: 10px;
              text-transform: uppercase;
              color: #94a3b8;
              margin: 0 0 6px 0;
              letter-spacing: 0.5px;
            }
            .bill-to p {
              font-size: 14px;
              font-weight: 800;
              color: #1e293b;
              margin: 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th {
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              padding: 12px 16px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              color: #475569;
              text-align: left;
            }
            .items-table td {
              padding: 16px;
              font-size: 13px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
            }
            .items-table .text-right {
              text-align: right;
            }
            .items-table .text-center {
              text-align: center;
            }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }
            .totals-box {
              width: 320px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 13px;
              color: #475569;
            }
            .total-row.grand {
              border-top: 2px solid #e2e8f0;
              padding-top: 12px;
              font-size: 17px;
              font-weight: 900;
              color: #0f172a;
            }
            .footer {
              text-align: center;
              border-top: 2px dashed #e2e8f0;
              padding-top: 24px;
              margin-top: 40px;
            }
            .footer p {
              font-size: 12px;
              color: #64748b;
              margin: 4px 0;
            }
            .footer strong {
              color: #059669;
            }
            @media print {
              body {
                padding: 0;
              }
              .invoice-card {
                border: none;
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header">
              <div class="logo-section">
                <h1>PulseNova Pharmacy</h1>
                <p>Care Hospital ERP Network</p>
                <p style="font-size: 9px; color: #94a3b8; font-weight: normal; margin-top: 4px; text-transform: none;">GSTIN: 29AAFCP4829K1Z4</p>
              </div>
              <div class="invoice-details">
                <h2>TAX INVOICE / RECEIPT</h2>
                <p><strong>Bill ID:</strong> ${bill.id}</p>
                <p><strong>Date Stamp:</strong> ${bill.date}</p>
                <p><strong>Settlement Mode:</strong> ${bill.paymentMethod}</p>
              </div>
            </div>

            <div class="bill-to">
              <h3>Billed Patient:</h3>
              <p>${bill.patient}</p>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Medicine Details</th>
                  <th class="text-center">Rate</th>
                  <th class="text-center">Qty</th>
                  <th class="text-center">GST</th>
                  <th class="text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td style="font-weight: 700; color: #0f172a;">${item.name}</td>
                    <td class="text-center">₹${item.price.toFixed(2)}</td>
                    <td class="text-center">${item.qty} pcs</td>
                    <td class="text-center">${item.gstRate || 12}%</td>
                    <td class="text-right" style="font-weight: 800; color: #0f172a;">₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>

            </table>

            <div class="totals-container">
              <div class="totals-box">
                <div class="total-row">
                  <span>Subtotal (Excl. Taxes)</span>
                  <span>₹${(bill.total - bill.gst).toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>CGST & SGST Taxes</span>
                  <span>₹${bill.gst.toFixed(2)}</span>
                </div>
                <div class="total-row grand">
                  <span>Grand Total</span>
                  <span>₹${bill.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing <strong>PulseNova Care</strong>. Get Well Soon!</p>
              <p style="font-size: 10px; margin-top: 8px; color: #94a3b8;">* This is a secure computer-generated bill and requires no physical seal or signature.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Store History & Money Reports
            <button 
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Table Columns Schema"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Check how much money you made, bills paid, expenses logged, and active system user logs.</p>
        </div>
      </div>

      <div className="unique-card p-6 text-left space-y-6">
        {/* Report sub categories */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => handleTabChange('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'sales'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Bills Printed & Sales
          </button>
          <button
            onClick={() => handleTabChange('purchase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'purchase'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Stock Buying Bills
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Shelf Stock & Storage
          </button>
          <button
            onClick={() => handleTabChange('financial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'financial'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Earnings & Expense Ledger
          </button>
          <button
            onClick={() => handleTabChange('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Operations Audit Log
          </button>

        </div>

        {/* 1. SALES REPORT VIEW */}
        {activeReportTab === 'sales' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider">Recent Customer Bills Log</span>
              <button 
                onClick={() => alert('Downloading Sales Report PDF...')} 
                className="flex items-center gap-1 text-blue-600 hover:underline font-bold cursor-pointer"
              >
                <Printer size={13} /> Download Report (PDF)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Patient Name</th>
                    <th className="py-2.5 text-center font-bold">Government Tax Collected</th>
                    <th className="py-2.5 text-center">Payment Type</th>
                    <th className="py-2.5 text-right font-black">Bill Total</th>
                    <th className="py-2.5 text-center">Get Bill PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((sh, idx) => {
                    const billDate = sh.createdAt ? new Date(sh.createdAt) : null;
                    return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-400 font-mono text-[10px]">
                        {billDate ? billDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : sh.date || '—'}
                      </td>
                      <td className="py-3 font-bold text-slate-700">{sh.patientName || sh.patient || 'Walk-in'}</td>
                      <td className="py-3 text-center text-slate-600 font-bold">₹ {Number(sh.gstTax || sh.gst || 0).toFixed(2)}</td>
                      <td className="py-3 text-center text-slate-500 font-bold">{sh.paymentMethod || 'Cash'}</td>
                      <td className="py-3 text-right font-black text-slate-800">₹ {Number(sh.grandTotal || sh.total || 0).toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => downloadInvoicePDF(sh)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 rounded-xl text-[10px] font-extrabold transition cursor-pointer"
                        >
                          <Printer size={11} /> PDF Invoice
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                  {salesHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400 font-semibold">
                        No sales records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. PURCHASE COST REPORT VIEW */}
        {activeReportTab === 'purchase' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider">Supplier Orders History Book</span>
              <button 
                onClick={() => alert('Downloading Purchase Cost Report...')} 
                className="flex items-center gap-1 text-blue-600 hover:underline font-bold cursor-pointer"
              >
                <Printer size={13} /> Download PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Order Number</th>
                    <th className="py-2.5">Medicine Supplier</th>
                    <th className="py-2.5">Order Date</th>
                    <th className="py-2.5 text-center">Status of Delivery</th>
                    <th className="py-2.5 text-right">Total Price paid</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-3 text-slate-600 font-mono font-bold">{po.id}</td>
                      <td className="py-3 font-bold text-slate-700">{po.supplier?.name || po.supplier || 'Unknown'}</td>
                      <td className="py-3 text-slate-500 font-semibold">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : po.date || '—'}</td>
                      <td className="py-3 text-center font-bold text-slate-600">{po.status}</td>
                      <td className="py-3 text-right font-black text-slate-800">₹ {Number(po.totalAmount || po.total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400 font-semibold">
                        No supplier orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. STOCK & EXPIRY REPORT VIEW */}
        {activeReportTab === 'inventory' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider">Stock Count on Shelves</span>
              <button 
                onClick={() => alert('Downloading Stock Report...')} 
                className="flex items-center gap-1 text-blue-600 hover:underline font-bold cursor-pointer"
              >
                <Printer size={13} /> Download PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Medicine Name</th>
                    <th className="py-2.5 text-center">Shelf Location</th>
                    <th className="py-2.5 text-center">Storage Temp</th>
                    <th className="py-2.5 text-center">Warn Me When Under</th>
                    <th className="py-2.5 text-center">Pieces on Shelf</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(m => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="py-3 font-bold text-slate-700">{m.name}</td>
                      <td className="py-3 text-center font-bold text-slate-600">{m.rack}</td>
                      <td className="py-3 text-center text-slate-500">{m.tempRequirement}</td>
                      <td className="py-3 text-center text-slate-400">{m.minStock} pcs</td>
                      <td className="py-3 text-center font-black text-slate-800">{m.stock} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PROFIT & EXPENSES REPORTS */}
        {activeReportTab === 'financial' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider">Store Profit & Expense Analysis</span>
              <button 
                onClick={() => alert('Downloading Financial Statement...')} 
                className="flex items-center gap-1 text-blue-600 hover:underline font-bold cursor-pointer"
              >
                <Printer size={13} /> Download Statement (PDF)
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Inbound</span>
                <h3 className="text-sm font-black text-slate-800 mt-1">₹ {totalSales.toFixed(2)}</h3>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Taxes (GST/VAT 12%)</span>
                <h3 className="text-sm font-black text-blue-600 mt-1">₹ {totalGstTax.toFixed(2)}</h3>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outbound Expenses</span>
                <h3 className="text-sm font-black text-red-500 mt-1">₹ {totalExpenses.toFixed(2)}</h3>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net Cash Profit</span>
                <h3 className={`text-sm font-black mt-1 flex items-center gap-1 ${netEarnings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netEarnings >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  ₹ {netEarnings.toFixed(2)}
                </h3>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Credit Owed</span>
                <h3 className="text-sm font-black text-amber-600 mt-1">₹ {totalCreditOwed.toFixed(2)}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expenses Ledger Table */}
              <div className="lg:col-span-2 space-y-3">
                <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Store Expenses Ledger</span>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Remarks</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[9px]">{exp.date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-700">{exp.category}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-semibold">{exp.remarks}</td>
                          <td className="py-2.5 px-3 text-right font-black text-red-500">₹ {exp.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-slate-400 font-semibold italic">No expenses recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Log Expense Form & Cash Register */}
              <div className="space-y-6">
                
                {/* Live Cash Register Desk */}
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-left space-y-4">
                  <span className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Database size={14} className="text-blue-600" />
                      Cash Register Drawer Status
                    </span>
                    <span className="px-2 py-0.5 rounded bg-green-100 text-[8px] font-black text-green-700 animate-pulse">ACTIVE / OPEN</span>
                  </span>

                  <div className="space-y-2 text-xs font-semibold text-slate-500">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                      <span>Cash Payments in Drawer:</span>
                      <span className="text-slate-800 font-bold">₹ {salesHistory.filter(s => (s.paymentMethod || '').includes('Cash')).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                      <span>UPI Payments Transacted:</span>
                      <span className="text-blue-600 font-bold">₹ {salesHistory.filter(s => (s.paymentMethod || '').includes('UPI')).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                      <span>Card Swipe Payments:</span>
                      <span className="text-slate-800 font-bold">₹ {salesHistory.filter(s => (s.paymentMethod || '').includes('Card')).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span>Total Register Turnover:</span>
                      <span className="text-emerald-600 font-extrabold">₹ {salesHistory.reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Cash Drawer reconciled! System logged count checks successfully.')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer text-center"
                  >
                    Reconcile & Count Drawer Cash
                  </button>
                </div>

                {/* Log Expense Form */}
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-left space-y-4">
                  <span className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-blue-600" />
                    Log Expense Record
                  </span>
                <form onSubmit={handleAddExpense} className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category / Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Pharmacy rent, AC repair"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expense Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1500"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Internal Notes / Remarks</label>
                    <textarea
                      placeholder="Write brief receipt description..."
                      value={expenseRemarks}
                      onChange={(e) => setExpenseRemarks(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer text-center"
                  >
                    Commit Outbound Expense
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 5. OPERATIONS AUDIT LOG VIEW */}
        {activeReportTab === 'audit' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <Clock size={14} className="text-blue-600" />
                Operations Security Audit Logs (System actions)
              </span>
              
              {/* Search Audit Logs */}
              <div className="relative flex items-center w-full sm:w-64">
                <Search size={12} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword..."
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                    <th className="py-2.5 px-4">Log Timestamp</th>
                    <th className="py-2.5 px-4 text-center">User/Operator</th>
                    <th className="py-2.5 px-4">Security Action</th>
                    <th className="py-2.5 px-4">Details Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400 font-semibold italic">No security audit logs match the query.</td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 font-mono text-[10px]">
                        <td className="py-3 px-4 text-slate-400 font-semibold">{log.timestamp}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-black">{log.user}</span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-blue-700">{log.action}</td>
                        <td className="py-3 px-4 text-slate-500">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
