import React from 'react';
import {
  BarChart3, AlertCircle, ShieldAlert, AlertTriangle, Package, ArrowRight,
  Wallet, CreditCard, Smartphone, TrendingUp, TrendingDown, Warehouse,
  Layers, Building2, Bell, ClipboardList, Users, ShoppingCart,
  CalendarDays, Activity, RefreshCw, ChevronRight
} from 'lucide-react';
import { useDashboardController } from './useDashboardController';

// ─── Reusable Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accentColor = 'blue', icon: Icon, onClick, urgent, trend }) {
  const colors = {
    blue:   { bar: 'bg-blue-500',   text: 'text-blue-600',   hover: 'hover:border-blue-200',  badge: 'text-blue-500' },
    green:  { bar: 'bg-emerald-500', text: 'text-emerald-600', hover: 'hover:border-emerald-200', badge: 'text-emerald-500' },
    amber:  { bar: 'bg-amber-500',  text: 'text-amber-600',  hover: 'hover:border-amber-200', badge: 'text-amber-600' },
    red:    { bar: 'bg-red-500',    text: 'text-red-600',    hover: 'hover:border-red-200',   badge: 'text-red-600' },
    indigo: { bar: 'bg-indigo-500', text: 'text-indigo-600', hover: 'hover:border-indigo-200', badge: 'text-indigo-500' },
    purple: { bar: 'bg-purple-500', text: 'text-purple-600', hover: 'hover:border-purple-200', badge: 'text-purple-500' },
  };
  const c = colors[accentColor] || colors.blue;

  return (
    <div
      onClick={onClick}
      className={`unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl ${c.hover} hover:scale-[1.01] transition-all duration-300 group ${urgent ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <div className={`absolute right-3 top-3 p-2 rounded-xl bg-slate-50 ${c.text}`}>
        {Icon && <Icon size={16} />}
      </div>
      <div className={`w-1 h-8 ${c.bar} rounded-full absolute right-0 top-0 bottom-0 my-auto`} />
      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider pr-10">{label}</span>
      <h3 className={`text-xl font-black mt-1 ${urgent ? 'text-red-600' : 'text-slate-800'}`}>{value}</h3>
      {sub && <p className="text-[9px] text-slate-500 font-semibold mt-1">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[9px] font-bold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{trend >= 0 ? '+' : ''}{trend}% vs yesterday</span>
        </div>
      )}
      <div className={`flex items-center gap-1 text-[8px] font-extrabold ${c.badge} mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none`}>
        <span>View Details</span>
        <ChevronRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, label, color = 'text-blue-600' }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${color} mb-3`}>
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
}

// ─── Mini Spark Bar ────────────────────────────────────────────────────────────
function SalesSparkBar({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/50 rounded-sm transition-all duration-200 cursor-pointer"
          style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
          title={`${d.date}: ₹${d.revenue.toLocaleString()}`}
        />
      ))}
    </div>
  );
}

// ─── Main Dashboard View ───────────────────────────────────────────────────────
export default function DashboardView({ role, setActiveTab }) {
  const {
    salesHistory,
    medicines,
    suppliers,
    purchaseOrders,
    batches,
    prescriptions,
    warehouseStock,
    notifications,
    handleRackReallocationSimulation,
    stats,
    loadingStats,
    refetchStats,
    dateFilter,
    setDateFilter,
    customDate,
    setCustomDate,
    getFilteredSales,
  } = useDashboardController(role);

  // Navigate to a specific report sub-tab
  const navigateToReport = (subtab) => {
    localStorage.setItem('active_report_subtab', subtab);
    setActiveTab('reports');
  };

  // Today label
  const filterLabel = dateFilter === 'today' ? "Today" : dateFilter === 'yesterday' ? "Yesterday" : customDate;
  const filteredSales = getFilteredSales();
  const filteredSalesTotal = filteredSales.reduce((s, b) => s + Number(b.grandTotal || b.total || 0), 0);
  const filteredCash = filteredSales.filter(s => (s.paymentMethod || '').toLowerCase().includes('cash')).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0);
  const filteredUpi = filteredSales.filter(s => (s.paymentMethod || '').toLowerCase().includes('upi')).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0);
  const filteredCredit = filteredSales.filter(s => (s.paymentMethod || '').toLowerCase().includes('credit')).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0);

  // Merged urgent alerts
  const allAlerts = [
    ...(stats.urgentNotifications || []),
    ...(stats.lowStockItems || []).map(item => ({
      id: `low-stock-${item.id}`,
      type: 'danger',
      message: `LOW STOCK: "${item.medicineName || item.name}" — only ${item.stockQuantity ?? item.stock ?? 0} units left`,
      time: 'System Alert',
      medicineId: item.id
    })),
    ...(notifications || []).filter(n => !n.resolved)
  ].slice(0, 6);

  // Expired batch count
  const expiredBatches = batches.filter(b => b.status === 'Expired').length;
  const nearExpiryBatches = batches.filter(b => {
    if (!b.expiryDate) return false;
    const diff = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  }).length;

  // Inventory summary numbers
  const totalMedTypes = Array.isArray(medicines) ? medicines.length : 0;
  const totalStockPcs = Array.isArray(medicines)
    ? medicines.reduce((s, m) => s + Number(m.stockQuantity ?? m.stock ?? 0), 0)
    : 0;
  const outOfStock = Array.isArray(medicines)
    ? medicines.filter(m => Number(m.stockQuantity ?? m.stock ?? 0) === 0).length
    : 0;
  const lowStockCount = stats.lowStockAlertsCount;

  return (
    <div className="space-y-6 font-sans">

      {/* ── TOP HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="opacity-80 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Live Business Dashboard</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">{role} — {filterLabel}'s Overview</h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-md font-medium">
            Real-time snapshot of your store's health. Click any card to open the detailed report.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {/* Date Filter Buttons */}
          {['today', 'yesterday', 'custom'].map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${dateFilter === f ? 'bg-white text-blue-800 shadow-md' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
            >
              <CalendarDays size={11} />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="px-2 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/30 focus:outline-none focus:bg-white/20 cursor-pointer"
            />
          )}
          <button
            onClick={refetchStats}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={11} className={loadingStats ? 'animate-spin' : ''} />
            Refresh
          </button>
          {role !== 'Doctor' && (
            <button
              onClick={() => setActiveTab('billing')}
              className="px-4 py-1.5 bg-white text-blue-800 rounded-xl text-xs font-bold shadow-md hover:bg-slate-50 transition cursor-pointer"
            >
              + New Bill
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ── SECTION 1: TODAY'S SALES SUMMARY (All roles except Doctor) ──  */}
      {/* ================================================================= */}
      {role !== 'Doctor' && (
        <div className="space-y-3">
          <SectionTitle icon={Wallet} label={`${filterLabel}'s Sales Summary`} color="text-blue-600" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

            {/* Today Sales Total */}
            <StatCard
              label={`${filterLabel}'s Total Sales`}
              value={`₹ ${(dateFilter === 'today' ? stats.totalSalesToday : filteredSalesTotal).toFixed(2)}`}
              sub={`${filteredSales.length} bills`}
              accentColor="blue"
              icon={TrendingUp}
              onClick={() => navigateToReport('sales')}
            />

            {/* Cash Collection */}
            <StatCard
              label="Cash Collection"
              value={`₹ ${(dateFilter === 'today' ? stats.todayCollectionsCash : filteredCash).toFixed(2)}`}
              accentColor="green"
              icon={Wallet}
              onClick={() => navigateToReport('sales')}
            />

            {/* UPI Collection */}
            <StatCard
              label="UPI / GPay Collected"
              value={`₹ ${(dateFilter === 'today' ? stats.todayCollectionsUPI : filteredUpi).toFixed(2)}`}
              accentColor="indigo"
              icon={Smartphone}
              onClick={() => navigateToReport('sales')}
            />

            {/* Credit Sales */}
            <StatCard
              label="Credit Sales (Pending)"
              value={`₹ ${(dateFilter === 'today' ? stats.creditSalesToday : filteredCredit).toFixed(2)}`}
              accentColor="amber"
              icon={CreditCard}
              onClick={() => navigateToReport('sales')}
            />

            {/* Supplier Payables */}
            <StatCard
              label="Supplier Payables (Due)"
              value={`₹ ${stats.totalSupplierPayable.toFixed(2)}`}
              accentColor="red"
              icon={ShoppingCart}
              onClick={() => setActiveTab('supplier-management')}
              urgent
            />

            {/* Customer Receivables */}
            <StatCard
              label="Customer Receivables"
              value={`₹ ${stats.customerReceivable.toFixed(2)}`}
              accentColor="purple"
              icon={Users}
              onClick={() => setActiveTab('customer-management')}
            />

          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ── SECTION 2: INVENTORY SUMMARY ── */}
      {/* ================================================================= */}
      <div className="space-y-3">
        <SectionTitle icon={Package} label="Inventory Summary" color="text-emerald-700" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* Total Medicines */}
          <StatCard
            label="Medicine Types"
            value={`${totalMedTypes} Types`}
            accentColor="blue"
            icon={Package}
            onClick={() => setActiveTab('medicine-master')}
          />

          {/* Total Stock */}
          <StatCard
            label="Total Stock on Shelves"
            value={`${totalStockPcs.toLocaleString()} pcs`}
            accentColor="green"
            icon={ClipboardList}
            onClick={() => navigateToReport('inventory')}
          />

          {/* Low Stock */}
          <StatCard
            label="Low Stock SKUs"
            value={`${lowStockCount} Items`}
            accentColor="amber"
            icon={AlertTriangle}
            onClick={() => navigateToReport('inventory')}
            urgent={lowStockCount > 0}
          />

          {/* Out of Stock */}
          <StatCard
            label="Out of Stock"
            value={`${outOfStock} Medicines`}
            accentColor="red"
            icon={ShieldAlert}
            onClick={() => setActiveTab('medicine-master')}
            urgent={outOfStock > 0}
          />

          {/* Expired Batches */}
          <StatCard
            label="Expired Batches"
            value={`${expiredBatches} Lots`}
            accentColor="red"
            icon={AlertCircle}
            onClick={() => setActiveTab('expiry')}
            urgent={expiredBatches > 0}
          />

          {/* Near Expiry */}
          <StatCard
            label="Expiring in 90 Days"
            value={`${nearExpiryBatches} Batches`}
            accentColor="amber"
            icon={CalendarDays}
            onClick={() => setActiveTab('expiry')}
          />

        </div>
      </div>

      {/* ================================================================= */}
      {/* ── SECTION 3: WAREHOUSE & RACK SUMMARY ── */}
      {/* ================================================================= */}
      <div className="space-y-3">
        <SectionTitle icon={Warehouse} label="Warehouse & Rack Summary" color="text-indigo-700" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* Warehouse Stock */}
          <StatCard
            label="Warehouse Stock"
            value={`${Number(stats.totalWarehouseStock).toLocaleString()} boxes`}
            sub="Total across all warehouses"
            accentColor="blue"
            icon={Building2}
            onClick={() => setActiveTab('warehouse-management')}
          />

          {/* Rack Stock */}
          <StatCard
            label="Rack / Shelf Stock"
            value={`${Number(stats.totalRackStock).toLocaleString()} units`}
            sub="Allocated to racks"
            accentColor="indigo"
            icon={Layers}
            onClick={() => setActiveTab('rack-management')}
          />

          {/* Total Batches */}
          <StatCard
            label="Total Batch Lots"
            value={`${batches.length} Lots`}
            accentColor="green"
            icon={ClipboardList}
            onClick={() => setActiveTab('medicine-batch')}
          />

          {/* Active Purchase Orders */}
          <StatCard
            label="Active Purchase Orders"
            value={`${purchaseOrders.filter(p => p.status !== 'Goods Received').length} Orders`}
            accentColor="amber"
            icon={ShoppingCart}
            onClick={() => setActiveTab('purchase-management')}
          />

          {/* Pending Approval POs */}
          <StatCard
            label="POs Pending Approval"
            value={`${purchaseOrders.filter(p => p.status === 'Pending Approval').length} Orders`}
            accentColor="red"
            icon={ClipboardList}
            onClick={() => setActiveTab('purchase-management')}
          />

          {/* Supplier Count */}
          <StatCard
            label="Active Suppliers"
            value={`${suppliers.length} Partners`}
            accentColor="purple"
            icon={Users}
            onClick={() => setActiveTab('supplier-management')}
          />

        </div>
      </div>

      {/* ================================================================= */}
      {/* ── SECTION 4: URGENT NOTIFICATIONS + 7-DAY SPARK ── */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Urgent Notifications Panel */}
        <div className="lg:col-span-2 unique-card p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} className="text-red-500 animate-pulse" />
              Urgent Notifications
              {allAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-black">
                  {allAlerts.length}
                </span>
              )}
            </h4>
            <button
              onClick={() => navigateToReport('audit')}
              className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
            >
              View All Logs →
            </button>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {allAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                ✅ No urgent alerts. Everything is running fine!
              </div>
            ) : (
              allAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                    alert.type === 'danger' || alert.type === 'error'
                      ? 'bg-red-50/70 border-red-200 text-red-800'
                      : 'bg-amber-50/70 border-amber-200 text-amber-800'
                  }`}
                >
                  {alert.type === 'danger' || alert.type === 'error'
                    ? <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                    : <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  }
                  <div className="text-xs text-left flex-1">
                    <p className="font-bold leading-snug">{alert.message}</p>
                    <span className="text-[9px] opacity-75 block mt-1">{alert.time}</span>
                  </div>
                  {alert.medicineId && (
                    <button
                      onClick={() => {
                        localStorage.setItem('auto_po_medicine_id', alert.medicineId);
                        setActiveTab('purchase');
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black shadow-sm transition cursor-pointer self-center"
                    >
                      ⚡ Raise PO
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 7-Day Sales Spark + Quick Links */}
        <div className="space-y-4">
          {/* 7-day mini chart */}
          <div className="unique-card p-5 text-left space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-600" />
              7-Day Sales Trend
            </h4>
            <SalesSparkBar data={stats.salesChart} />
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
              <span>6 days ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Quick action shortcuts */}
          <div className="unique-card p-5 text-left space-y-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Quick Actions</h4>
            {[
              { label: 'Full Sales Report', tab: null, report: 'sales', color: 'text-blue-600' },
              { label: 'Inventory Report', tab: null, report: 'inventory', color: 'text-emerald-600' },
              { label: 'Supplier Payments', tab: 'supplier-management', report: null, color: 'text-red-600' },
              { label: 'Purchase Orders', tab: 'purchase-management', report: null, color: 'text-amber-600' },
              { label: 'Warehouse View', tab: 'warehouse-management', report: null, color: 'text-indigo-600' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => item.report ? navigateToReport(item.report) : setActiveTab(item.tab)}
                className={`w-full text-left flex items-center justify-between text-xs font-bold py-2 px-3 rounded-xl hover:bg-slate-50 transition cursor-pointer ${item.color}`}
              >
                <span>{item.label}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ── SECTION 5: ROLE-SPECIFIC DOCTOR CARDS ── */}
      {/* ================================================================= */}
      {role === 'Doctor' && (
        <div className="space-y-3">
          <SectionTitle icon={Activity} label="Doctor's Today Panel" color="text-blue-700" />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending Prescriptions" value={`${prescriptions.filter(p => p.status === 'Pending').length} Patients`} accentColor="amber" icon={ClipboardList} onClick={() => setActiveTab('prescription')} />
            <StatCard label="Dispensed Today" value={`${prescriptions.filter(p => p.status === 'Dispensed').length} Cases`} accentColor="green" icon={Package} onClick={() => setActiveTab('prescription')} />
            <StatCard label="Write New Rx" value="New Prescription" accentColor="blue" icon={Activity} onClick={() => setActiveTab('prescription')} />
            <StatCard label="Active Visits" value="12 Today" accentColor="indigo" icon={Users} onClick={() => setActiveTab('prescription')} />
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ── SECTION 6: LIVE SHELF STOCK TABLE ── */}
      {/* ================================================================= */}
      <div className="unique-card p-6 text-left space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Package size={14} className="text-blue-600" />
            Fast-Moving Shelf Stocks (Top Items)
          </h4>
          <button
            onClick={() => setActiveTab('medicine-master')}
            className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
          >
            View Full Catalog →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5">Medicine Name</th>
                <th className="py-2.5">Code / SKU</th>
                <th className="py-2.5 text-center">Shelf / Rack</th>
                <th className="py-2.5 text-center">Stock Qty</th>
                <th className="py-2.5 text-center">Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(medicines) && medicines.slice(0, 8).map(med => {
                const stock = Number(med.stockQuantity ?? med.stock ?? 0);
                const reorder = Number(med.reorderLevel ?? med.minStock ?? 10);
                const isOut = stock === 0;
                const isLow = !isOut && stock <= reorder;
                return (
                  <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer" onClick={() => setActiveTab('medicine-master')}>
                    <td className="py-3 font-bold text-slate-700">{med.medicineName || med.name}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">{med.medicineCode || med.sku || '—'}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">{med.rack || 'Unassigned'}</span>
                    </td>
                    <td className="py-3 text-center font-black text-slate-800">{stock.toLocaleString()}</td>
                    <td className="py-3 text-center">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 animate-pulse">⚠ Empty</span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200">⬇ Low Stock</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">✓ Good</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!Array.isArray(medicines) || medicines.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No medicines in catalog yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Reports Banner ── */}
      <div
        onClick={() => setActiveTab('reports')}
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 group select-none"
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <BarChart3 size={22} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black tracking-tight">Open Full Reports & Analytics</h3>
            <p className="text-xs text-blue-100/90 mt-0.5 max-w-md font-medium">
              Sales history, purchase statements, stock valuations, audit logs — all in one place.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-800 rounded-xl text-xs font-black shadow-md transition relative z-10 shrink-0 group-hover:scale-[1.02]">
          <BarChart3 size={13} />
          Open Reports
        </div>
      </div>

    </div>
  );
}
