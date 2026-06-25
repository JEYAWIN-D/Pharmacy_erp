import React from 'react';
import { 
  BarChart3, AlertCircle, ShieldAlert, AlertTriangle, Package, ArrowRight
} from 'lucide-react';
import { useDashboardController } from './useDashboardController';

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
    handleRackReallocationSimulation
  } = useDashboardController(role);

  // Helper to switch report sub-tabs via localStorage
  const navigateToReport = (subtab) => {
    localStorage.setItem('active_report_subtab', subtab);
    setActiveTab('reports');
  };

  return (
    <div className="space-y-6">
      {/* Greeter Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 text-left">
          <h3 className="text-xl font-black">{role} Dashboard Overview! 👋</h3>
          <p className="text-xs text-blue-100/90 mt-1 max-w-lg leading-relaxed font-semibold">
            Simple numbers and tasks matching your job. Easy to understand and manage.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {role === 'Doctor' ? (
            <>
              <button 
                onClick={() => setActiveTab('prescription')}
                className="px-4 py-2.5 bg-white text-blue-800 rounded-xl text-xs font-bold shadow-md hover:bg-slate-50 active:scale-[0.99] transition cursor-pointer"
              >
                Prescribe New Medicine
              </button>
              <button 
                onClick={() => setActiveTab('prescription')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold shadow-md active:scale-[0.99] transition cursor-pointer"
              >
                View Patient Rx Logs
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('billing')}
                className="px-4 py-2.5 bg-white text-blue-800 rounded-xl text-xs font-bold shadow-md hover:bg-slate-50 active:scale-[0.99] transition cursor-pointer"
              >
                Create New Bill
              </button>
              <button 
                onClick={handleRackReallocationSimulation}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold shadow-md active:scale-[0.99] transition cursor-pointer"
              >
                Test Shelf Full Alarm
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROLE SPECIFIC DASHBOARDS */}
      {/* ========================================================= */}
      
      {/* 1. ADMIN DASHBOARD */}
      {role === 'Admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div 
              onClick={() => navigateToReport('sales')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to view sales reports"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales (Money In)</span>
              <h3 className="text-lg font-black text-slate-800 mt-1">₹ {(Array.isArray(salesHistory) ? salesHistory.reduce((sum, s) => sum + (parseFloat(s.grandTotal || s.total) || 0), 0) : 0).toFixed(2)}</h3>
              <div className="w-1.5 h-6 bg-blue-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Details</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => navigateToReport('financial')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to view earnings ledger"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Money Made This Month</span>
              <h3 className="text-lg font-black text-blue-600 mt-1">₹ 2,45,800.00</h3>
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Details</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('medicine-master')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to manage medicines list"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Medicines in Shop</span>
              <h3 className="text-lg font-black text-slate-800 mt-1">{medicines.length} Types</h3>
              <div className="w-1.5 h-6 bg-blue-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>Manage Catalog</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('supplier-management')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to manage suppliers"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medicine Suppliers</span>
              <h3 className="text-lg font-black text-slate-800 mt-1">{suppliers.length} Contacts</h3>
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>Manage Suppliers</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('purchase-management')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to view purchase orders"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Orders Sent to Suppliers</span>
              <h3 className="text-lg font-black text-slate-800 mt-1">{purchaseOrders.length} Orders</h3>
              <div className="w-1.5 h-6 bg-amber-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Orders</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>
            
            <div 
              onClick={() => setActiveTab('supplier-management')}
              className="unique-card p-5 text-left relative overflow-hidden border-l-4 border-l-red-500 cursor-pointer hover:shadow-xl hover:border-red-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to check supplier balances"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Money We Owe Suppliers</span>
              <h3 className="text-lg font-black text-red-600 mt-1">₹ {(Array.isArray(suppliers) ? suppliers.reduce((sum, s) => sum + (parseFloat(s.outstandingBalance || s.balanceDue) || 0), 0) : 0).toFixed(2)}</h3>
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-red-600 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>Check Balances</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('expiry')}
              className="unique-card p-5 text-left relative overflow-hidden border-l-4 border-l-red-500 cursor-pointer hover:shadow-xl hover:border-red-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to check expired stocks"
            >
              <span className="block text-[9px] font-bold text-red-500 uppercase tracking-wider">Expired (Do Not Sell)</span>
              <h3 className="text-lg font-black text-red-600 mt-1">{batches.filter(b => b.status === 'Expired').length} Boxes</h3>
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-red-600 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Discards</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('expiry')}
              className="unique-card p-5 text-left relative overflow-hidden border-l-4 border-l-amber-500 cursor-pointer hover:shadow-xl hover:border-amber-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to view running out stock"
            >
              <span className="block text-[9px] font-bold text-amber-500 uppercase tracking-wider">Almost Empty (Need to Order)</span>
              <h3 className="text-lg font-black text-amber-600 mt-1">{Array.isArray(medicines) ? medicines.filter(m => (m.stockQuantity ?? m.stock ?? 0) <= (m.reorderLevel ?? m.minStock ?? 0)).length : 0} Medicines</h3>
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-amber-600 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Low Stock</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('warehouse-management')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to manage warehouse transfers"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Warehouse Storage Space Used</span>
              <h3 className="text-lg font-black text-slate-800 mt-1">42% Filled</h3>
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Warehouse</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('customer-management')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to check customer accounts"
            >
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Customer Bills</span>
              <h3 className="text-lg font-black text-slate-800 mt-1">₹ 24,100.00</h3>
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>Manage Accounts</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. PHARMACY MANAGER DASHBOARD */}
      {role === 'Pharmacy Manager' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div 
            onClick={() => navigateToReport('sales')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bills Handled Today</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">₹ {(Array.isArray(salesHistory) ? salesHistory.reduce((sum, s) => sum + (parseFloat(s.grandTotal || s.total) || 0), 0) : 0).toFixed(2)}</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Sales</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('prescription')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Doctor Slips Pending</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{prescriptions.filter(p => p.status === 'Pending').length} Slips</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Slips</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="unique-card p-5 text-left border-l-4 border-l-amber-500 cursor-pointer hover:shadow-xl hover:border-amber-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider">Medicines Running Out</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{Array.isArray(medicines) ? medicines.filter(m => (m.stockQuantity ?? m.stock ?? 0) <= (m.reorderLevel ?? m.minStock ?? 0)).length : 0} Types</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-amber-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Expiries</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="unique-card p-5 text-left border-l-4 border-l-red-500 cursor-pointer hover:shadow-xl hover:border-red-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">Lots Expiring Soon</span>
            <h3 className="text-2xl font-black text-red-600 mt-1">{batches.filter(b => b.status === 'Expired').length} Lots</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-red-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Expired</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('purchase-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders Waiting for Approval</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{purchaseOrders.filter(p => p.status === 'Pending Approval').length} Orders</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Orders</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('customer-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Customer Bills</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">₹ 24,100.00</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Credits</span>
              <ArrowRight size={9} />
            </div>
          </div>

        </div>
      )}

      {/* 3. PHARMACIST DASHBOARD */}
      {role === 'Pharmacist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div 
            onClick={() => setActiveTab('prescription')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor Slips to Dispense</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{prescriptions.filter(p => p.status === 'Pending').length} Slips</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Dispense Now</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('dispensing')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicines Handled</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{prescriptions.filter(p => p.status === 'Dispensed').length} Bills</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Logs</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('medicine-master')}
            className="unique-card p-5 text-left border-l-4 border-l-red-500 cursor-pointer hover:shadow-xl hover:border-red-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">Out of Stock (Empty)</span>
            <h3 className="text-2xl font-black text-red-600 mt-1">{Array.isArray(medicines) ? medicines.filter(m => (m.stockQuantity ?? m.stock ?? 0) === 0).length : 0} Medicines</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-red-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Catalog</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('dispensing')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alternative Suggestions</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">4 Active</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Subs</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => navigateToReport('sales')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient History Logs</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">120 Logs</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Invoices</span>
              <ArrowRight size={9} />
            </div>
          </div>

        </div>
      )}

      {/* 4. INVENTORY DASHBOARD */}
      {role === 'Inventory Staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div 
            onClick={() => setActiveTab('medicine-master')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock on Shelves</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{Array.isArray(medicines) ? medicines.reduce((sum, m) => sum + (m.stockQuantity ?? m.stock ?? 0), 0) : 0} Pcs</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Stocks</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('rack-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shelf Space Filled</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">68% Space</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Racks</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('warehouse-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock in Warehouse</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{warehouseStock.reduce((sum, w) => sum + w.qty, 0)} Pcs</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Warehouse</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('medicine-batch')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch Lots in Shop</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{batches.length} Lots</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Lots</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="unique-card p-5 text-left border-l-4 border-l-amber-500 cursor-pointer hover:shadow-xl hover:border-amber-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider">Expiring in 60 Days</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{batches.filter(b => b.status === 'Active' && new Date(b.expiryDate) < new Date('2026-08-30')).length} Lots</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-amber-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Expiry</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('inventory')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stocks Moved Today</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">14 Times</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Logs</span>
              <ArrowRight size={9} />
            </div>
          </div>

        </div>
      )}

      {/* 5. PURCHASE MANAGER DASHBOARD */}
      {role === 'Purchase Manager' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div 
            onClick={() => setActiveTab('purchase-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Orders We Sent</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{purchaseOrders.filter(p => p.status !== 'Goods Received').length} Orders</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Orders</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('purchase-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deliveries on the Way</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">2 Shipments</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Track Orders</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('supplier-management')}
            className="unique-card p-5 text-left border-l-4 border-l-red-500 cursor-pointer hover:shadow-xl hover:border-red-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">Money We Owe Distributors</span>
            <h3 className="text-2xl font-black text-red-600 mt-1">₹ {(Array.isArray(suppliers) ? suppliers.reduce((sum, s) => sum + (parseFloat(s.outstandingBalance || s.balanceDue) || 0), 0) : 0).toFixed(2)}</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-red-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Ledger</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('returns')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expired Lots Sent Back</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">7 Lots</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Returns</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => navigateToReport('purchase')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent on Orders</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">₹ 40,750.00</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Statements</span>
              <ArrowRight size={9} />
            </div>
          </div>

        </div>
      )}

      {/* 6. BILLING DASHBOARD */}
      {role === 'Billing Staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div 
            onClick={() => navigateToReport('sales')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bills Printed Today</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{salesHistory.length} Bills</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>View Sales</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => navigateToReport('sales')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Cash Received</span>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">₹ 65.00</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-indigo-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Cash</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => navigateToReport('sales')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider">Online / GPay / UPI Received</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">₹ 615.00</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Online</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => navigateToReport('sales')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Swipes Received</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">₹ 0.00</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Check Card</span>
              <ArrowRight size={9} />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('customer-management')}
            className="unique-card p-5 text-left cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Customer Bills</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">₹ 24,100.00</h3>
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
              <span>Manage Credits</span>
              <ArrowRight size={9} />
            </div>
          </div>

        </div>
      )}

      {/* 7. DOCTOR DASHBOARD */}
      {role === 'Doctor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div 
              onClick={() => setActiveTab('prescription')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to view all pending prescriptions"
            >
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Pending Prescriptions</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{prescriptions.filter(p => p.status === 'Pending').length} Patients</h3>
              <div className="w-1.5 h-6 bg-blue-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-500 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Queue</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('prescription')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-emerald-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to view dispensed prescriptions log"
            >
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispensed (Patient Log)</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{prescriptions.filter(p => p.status === 'Dispensed').length} Cases</h3>
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-emerald-600 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>View Patient Log</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('prescription')}
              className="unique-card p-5 text-left relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 group"
              title="Click to write a new prescription"
            >
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prescribe New Rx</span>
              <h3 className="text-2xl font-black text-blue-600 mt-1">New Slip</h3>
              <div className="w-1.5 h-6 bg-blue-600 rounded-full absolute right-4 top-5" />
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-600 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                <span>Write Prescription</span>
                <ArrowRight size={9} className="transform group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>

            <div className="unique-card p-5 text-left relative overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Patient Visits</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">12 Today</h3>
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full absolute right-4 top-5" />
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="unique-card p-6 text-left space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Patient Visits vs Prescriptions (Last 7 Days)
              </h4>
              <div className="h-48 flex items-end justify-between gap-2 pt-6">
                {[
                  { day: 'Mon', visits: 10, rx: 8 },
                  { day: 'Tue', visits: 12, rx: 11 },
                  { day: 'Wed', visits: 8, rx: 7 },
                  { day: 'Thu', visits: 15, rx: 14 },
                  { day: 'Fri', visits: 11, rx: 9 },
                  { day: 'Sat', visits: 7, rx: 6 },
                  { day: 'Sun', visits: 4, rx: 3 },
                ].map((d, idx) => {
                  const maxVal = 18;
                  const visitHeight = (d.visits / maxVal) * 100;
                  const rxHeight = (d.rx / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        <div 
                          style={{ height: `${visitHeight}%` }} 
                          className="w-3 sm:w-4 bg-blue-500/20 hover:bg-blue-500 rounded-t-sm transition-all duration-300 relative cursor-pointer"
                          title={`Visits: ${d.visits}`}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {d.visits}
                          </span>
                        </div>
                        <div 
                          style={{ height: `${rxHeight}%` }} 
                          className="w-3 sm:w-4 bg-teal-500/30 hover:bg-teal-500 rounded-t-sm transition-all duration-300 relative cursor-pointer"
                          title={`Prescriptions: ${d.rx}`}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {d.rx}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                  <span>Patient Visits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-teal-500 rounded-sm" />
                  <span>Prescriptions Written</span>
                </div>
              </div>
            </div>

            <div className="unique-card p-6 text-left space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Top Prescribed Medicines (This Month)
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'Paracetamol 650mg (Calpol)', count: 42, percentage: 85, color: 'bg-blue-500' },
                  { name: 'Amoxicillin 500mg', count: 28, percentage: 60, color: 'bg-teal-500' },
                  { name: 'Metformin 500mg', count: 21, percentage: 45, color: 'bg-indigo-500' },
                  { name: 'Pantoprazole 40mg', count: 18, percentage: 38, color: 'bg-purple-500' },
                  { name: 'Cetirizine 10mg', count: 15, percentage: 30, color: 'bg-pink-500' }
                ].map((med, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 font-sans">
                      <span>{med.name}</span>
                      <span>{med.count} times</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${med.percentage}%` }} className={`h-full ${med.color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View Full Reports Banner */}
      <div 
        onClick={() => setActiveTab('reports')}
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300 group select-none"
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <BarChart3 size={22} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black tracking-tight">See Store History & Reports</h3>
            <p className="text-xs text-blue-100/90 mt-1 max-w-md leading-relaxed font-semibold">
              Check daily sales invoices, stock buying statements, and manual stock updates in simple tables.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold shadow-md transition relative z-10 shrink-0 select-none">
          Open History Book
        </div>
      </div>

      {/* Live System Alerts Log */}
      <div className="unique-card p-6 text-left space-y-4">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle size={15} className="text-red-500 animate-pulse" />
          Urgent Message Inbox
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notifications.filter(n => !n.resolved).slice(0, 3).map(alert => (
            <div key={alert.id} className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              alert.type === 'danger' ? 'bg-red-50/60 border-red-200 text-red-800' : 'bg-amber-50/60 border-amber-200 text-amber-800'
            }`}>
              {alert.type === 'danger' ? <ShieldAlert size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              <div className="text-xs text-left">
                <p className="font-bold leading-snug">{alert.message}</p>
                <span className="text-[9px] opacity-75 block mt-1">{alert.time}</span>
              </div>
            </div>
          ))}
          {notifications.filter(n => !n.resolved).length === 0 && (
            <div className="col-span-3 text-center py-8 text-slate-400 text-xs font-semibold">
              No new alerts. Everything is running fine!
            </div>
          )}
        </div>
      </div>

      {/* Fast Moving Medicine Stock Table */}
      <div className="unique-card p-6 text-left space-y-4">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Package size={15} className="text-blue-600" />
          Fast Moving Shelf Stocks
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5">Medicine Name</th>
                <th className="py-2.5">Barcode Code / SKU</th>
                <th className="py-2.5 text-center">Shelf Location</th>
                <th className="py-2.5 text-center">Pcs Available</th>
                <th className="py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.slice(0, 5).map(med => {
                const isLow = med.stock <= med.minStock;
                const isOut = med.stock === 0;
                return (
                  <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-700">{med.name}</td>
                    <td className="py-3 text-slate-500 font-mono">{med.sku}</td>
                    <td className="py-3 text-center text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200/50 font-bold">{med.rack}</span>
                    </td>
                    <td className="py-3 text-center font-black text-slate-700">{med.stock} pcs</td>
                    <td className="py-3 text-center">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-red-700 bg-red-50 border border-red-200/50">Empty (No Stock)</span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 animate-pulse">Running Out</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/50">Good Stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
