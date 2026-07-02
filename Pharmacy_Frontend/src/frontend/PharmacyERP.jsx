import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Layers, ShieldAlert, BarChart3, Settings, LogOut, 
  Search, Bell, User as UserIcon, ArrowRight, Database, Info, X,
  Truck, ArrowLeftRight, RefreshCw, FileText, UserCheck, ShoppingCart, Thermometer,
  Users, CalendarClock, CreditCard
} from 'lucide-react';
import { useDB } from './db/DBContext';

// Import Modular Views
import DashboardView from './modules/dashboard/DashboardView';
import MedicineView from './modules/medicines/MedicineView';
import SupplierView from './modules/suppliers/SupplierView';
import PurchaseView from './modules/purchase/PurchaseView';
import BatchView from './modules/batches/BatchView';
import RackView from './modules/racks/RackView';
import WarehouseView from './modules/warehouse/WarehouseView';
import InventoryView from './modules/inventory/InventoryView';
import PrescriptionView from './modules/prescriptions/PrescriptionView';
import DispenseView from './modules/dispensing/DispenseView';
import BillingPOSView from './modules/billing/BillingPOSView';
import ReturnsView from './modules/returns/ReturnsView';
import ExpiryView from './modules/expiry/ExpiryView';
import ColdStorageView from './modules/coldstorage/ColdStorageView';
import NotificationsView from './modules/notifications/NotificationsView';
import ReportsView from './modules/reports/ReportsView';
import CustomerView from './modules/customers/CustomerView';
import AdministrationView from './modules/administration/AdministrationView';
import SalesHistoryPage from './modules/billing/SalesHistoryPage';

// HR Modules
import HRDashboard from './modules/hr/HRDashboard';
import DepartmentManagement from './modules/hr/DepartmentManagement';
import EmployeeManagement from './modules/hr/EmployeeManagement';
import AttendanceManagement from './modules/hr/AttendanceManagement';
import LeaveManagement from './modules/hr/LeaveManagement';
import ShiftManagement from './modules/hr/ShiftManagement';
import PayrollManagement from './modules/hr/PayrollManagement';

export default function PharmacyERP() {
  const navigate = useNavigate();
  const contentScrollRef = useRef(null);
  const { 
    notifications,
    selectedOutlet,
    setSelectedOutlet,
    erpTopology,
    setErpTopology
  } = useDB();

  // Retrieve initial role or set Admin
  const [role, setRole] = useState(() => {
    const raw = localStorage.getItem('pharmacy_role') || 'Admin';
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'doctor') return 'Doctor';
    if (normalized === 'staff') return 'Pharmacist';
    if (normalized === 'pharmacist') return 'Pharmacist';
    if (normalized === 'inventory' || normalized === 'inventory staff') return 'Inventory Staff';
    if (normalized === 'purchase' || normalized === 'purchase manager') return 'Purchase Manager';
    if (normalized === 'billing' || normalized === 'billing staff') return 'Billing Staff';
    return raw;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Database Schema modal state
  const [schemaModalTable, setSchemaModalTable] = useState(null);

  // Cross-tab verification & coordination states for Prescriptions -> Dispensing POS
  const [dispenseRxId, setDispenseRxId] = useState(null);
  const [rxDispenseItems, setRxDispenseItems] = useState([]);
  const [fefoMedId, setFefoMedId] = useState(1);
  const [fefoPrescriptionId, setFefoPrescriptionId] = useState('');

  // Sidebar Modules with simple, simplified names
  const sidebarModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'DASHBOARD', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff', 'Purchase Manager', 'Billing Staff', 'Doctor'] },
    
    { id: 'medicine-master', label: 'Medicine Master', icon: Package, category: 'MASTER MANAGEMENT', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist'] },
    { id: 'supplier-management', label: 'Supplier Management', icon: Truck, category: 'MASTER MANAGEMENT', roles: ['Admin', 'Pharmacy Manager', 'Purchase Manager'] },
    { id: 'rack-management', label: 'Rack Management', icon: Layers, category: 'MASTER MANAGEMENT', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff'] },
    { id: 'warehouse-management', label: 'Warehouse Management', icon: ArrowLeftRight, category: 'MASTER MANAGEMENT', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff'] },
    
    { id: 'purchase-management', label: 'Procurement & Orders', icon: Truck, category: 'PROCUREMENT', roles: ['Admin', 'Pharmacy Manager', 'Purchase Manager'] },
    
    { id: 'medicine-batch', label: 'Batch Management', icon: Layers, category: 'INVENTORY', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff'] },
    { id: 'inventory', label: 'Stock Management', icon: RefreshCw, category: 'INVENTORY', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff'] },
    { id: 'expiry', label: 'Expiry Management', icon: ShieldAlert, category: 'INVENTORY', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff'] },
    { id: 'cold-storage', label: 'Cold Storage', icon: Thermometer, category: 'INVENTORY', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff'] },
    
    { id: 'prescription', label: 'Prescription', icon: FileText, category: 'PRESCRIPTION & DISPENSING', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Billing Staff', 'Doctor'] },
    { id: 'dispensing', label: 'Dispensing', icon: UserCheck, category: 'PRESCRIPTION & DISPENSING', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Billing Staff'] },
    
    { id: 'billing', label: 'Billing & POS Desk', icon: ShoppingCart, category: 'BILLING & PAYMENTS', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Billing Staff'] },
    { id: 'sales-history', label: 'Sales History', icon: BarChart3, category: 'BILLING & PAYMENTS', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Billing Staff'] },
    { id: 'returns', label: 'Refunds & Returns', icon: RefreshCw, category: 'BILLING & PAYMENTS', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Billing Staff'] },
    { id: 'customer-management', label: 'Customer Management', icon: UserIcon, category: 'BILLING & PAYMENTS', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Billing Staff'] },
    
    { id: 'notifications', label: 'Notifications', icon: Bell, category: 'NOTIFICATIONS', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff', 'Purchase Manager', 'Billing Staff', 'Doctor'] },
    
    { id: 'reports', label: 'Reports', icon: BarChart3, category: 'REPORTS', roles: ['Admin', 'Pharmacy Manager', 'Pharmacist', 'Inventory Staff', 'Purchase Manager', 'Billing Staff'] },
    
    { id: 'administration', label: 'Administration', icon: Settings, category: 'ADMINISTRATION', roles: ['Admin', 'Pharmacy Manager'] },

    { id: 'hr-dashboard', label: 'HR Dashboard', icon: LayoutDashboard, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager'] },
    { id: 'hr-departments', label: 'Departments & Designations', icon: Layers, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager'] },
    { id: 'hr-employees', label: 'Employee Master', icon: Users, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager'] },
    { id: 'hr-attendance', label: 'Attendance', icon: UserCheck, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager', 'Pharmacist', 'Billing Staff', 'Inventory Staff'] },
    { id: 'hr-leaves', label: 'Leave Requests', icon: CalendarClock, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager'] },
    { id: 'hr-shifts', label: 'Shift Management', icon: Thermometer, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager'] },
    { id: 'hr-payroll', label: 'Payroll Generation', icon: CreditCard, category: 'HR MANAGEMENT', roles: ['Admin', 'HR Manager'] }
  ];

  // Dynamically compute allowed tabs based on active role
  const allowedTabs = useMemo(() => {
    return sidebarModules.filter(tab => tab.roles.includes(role));
  }, [role]);

  // Reset active tab to dashboard if changing role removes access to active tab
  useEffect(() => {
    const isAllowed = allowedTabs.some(tab => tab.id === activeTab);
    if (!isAllowed) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab, allowedTabs]);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const categories = ['DASHBOARD', 'MASTER MANAGEMENT', 'PROCUREMENT', 'INVENTORY', 'PRESCRIPTION & DISPENSING', 'BILLING & PAYMENTS', 'NOTIFICATIONS', 'REPORTS', 'ADMINISTRATION', 'HR MANAGEMENT'];

  const handleLogout = () => {
    localStorage.removeItem('pharmacy_role');
    navigate('/login');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('pharmacy_role', newRole);
  };

  // Render the selected view dynamically
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView role={role} setActiveTab={setActiveTab} />;
      case 'medicine-master':
        return <MedicineView role={role} setSchemaModalTable={setSchemaModalTable} setAppTab={setActiveTab} />;
      case 'supplier-management':
        return <SupplierView setSchemaModalTable={setSchemaModalTable} />;
      case 'purchase-management':
        return <PurchaseView role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'medicine-batch':
        return <BatchView setSchemaModalTable={setSchemaModalTable} />;
      case 'rack-management':
        return <RackView setSchemaModalTable={setSchemaModalTable} />;
      case 'warehouse-management':
        return <WarehouseView role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'inventory':
        return <InventoryView role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'prescription':
        return (
          <PrescriptionView
            dispenseRxId={dispenseRxId}
            setDispenseRxId={setDispenseRxId}
            rxDispenseItems={rxDispenseItems}
            setRxDispenseItems={setRxDispenseItems}
            setActiveTab={setActiveTab}
            setFefoMedId={setFefoMedId}
            setFefoPrescriptionId={setFefoPrescriptionId}
            setSchemaModalTable={setSchemaModalTable}
          />
        );
      case 'dispensing':
        return (
          <DispenseView
            role={role}
            fefoMedId={fefoMedId}
            setFefoMedId={setFefoMedId}
            fefoPrescriptionId={fefoPrescriptionId}
            setFefoPrescriptionId={setFefoPrescriptionId}
            setSchemaModalTable={setSchemaModalTable}
          />
        );
      case 'billing':
        return <BillingPOSView role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'sales-history':
        return <SalesHistoryPage role={role} />;
      case 'returns':
        return <ReturnsView role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'customer-management':
        return <CustomerView setSchemaModalTable={setSchemaModalTable} />;
      case 'expiry':
        return <ExpiryView setSchemaModalTable={setSchemaModalTable} />;
      case 'cold-storage':
        return <ColdStorageView setSchemaModalTable={setSchemaModalTable} />;
      case 'notifications':
        return <NotificationsView setSchemaModalTable={setSchemaModalTable} />;
      case 'reports':
        return <ReportsView setSchemaModalTable={setSchemaModalTable} />;
      case 'administration':
        return <AdministrationView role={role} setRole={handleRoleChange} />;
      case 'hr-dashboard':
        return <HRDashboard role={role} setActiveTab={setActiveTab} />;
      case 'hr-departments':
        return <DepartmentManagement role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'hr-employees':
        return <EmployeeManagement role={role} setSchemaModalTable={setSchemaModalTable} setActiveTab={setActiveTab} />;
      case 'hr-attendance':
        return <AttendanceManagement role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'hr-leaves':
        return <LeaveManagement role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'hr-shifts':
        return <ShiftManagement role={role} setSchemaModalTable={setSchemaModalTable} />;
      case 'hr-payroll':
        return <PayrollManagement role={role} setSchemaModalTable={setSchemaModalTable} />;
      default:
        return <DashboardView role={role} setActiveTab={setActiveTab} />;
    }
  };

  // Database Schema Details for overlays
  const tableSchemas = {
    medicine_master: [
      { name: 'id', type: 'INT (PK)', desc: 'Unique medicine ID' },
      { name: 'generic_name', type: 'VARCHAR(150)', desc: 'Generic Formulation' },
      { name: 'brand_name', type: 'VARCHAR(100)', desc: 'Vocal brand name' },
      { name: 'category_id', type: 'INT (FK)', desc: 'Mapping to categories' },
      { name: 'manufacturer_id', type: 'INT (FK)', desc: 'Mapping to manufacturers' },
      { name: 'gst_rate', type: 'INT', desc: 'GST percentage setup (5, 12, 18)' },
      { name: 'prescription_required', type: 'BOOLEAN', desc: 'Is Rx prescription required' },
      { name: 'reorder_level', type: 'INT', desc: 'Low stock threshold limits' }
    ],
    supplier_master: [
      { name: 'id', type: 'INT (PK)', desc: 'Supplier database ID' },
      { name: 'name', type: 'VARCHAR(150)', desc: 'Distributor company name' },
      { name: 'liaison', type: 'VARCHAR(100)', desc: 'Primary contact manager name' },
      { name: 'phone', type: 'VARCHAR(20)', desc: 'Active phone number' },
      { name: 'email', type: 'VARCHAR(100)', desc: 'Supplier email address' }
    ],
    purchase_request: [
      { name: 'id', type: 'INT (PK)', desc: 'Purchase request identifier' },
      { name: 'medicine_id', type: 'INT (FK)', desc: 'Formula requested' },
      { name: 'requested_qty', type: 'INT', desc: 'Est quantities desired' },
      { name: 'priority', type: 'VARCHAR(10)', desc: 'Urgent, High, Normal' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Draft, Pending, Approved' }
    ],
    medicine_batch: [
      { name: 'id', type: 'INT (PK)', desc: 'Lot primary key' },
      { name: 'medicine_id', type: 'INT (FK)', desc: 'Medicine master relation' },
      { name: 'batch_number', type: 'VARCHAR(50)', desc: 'Unique manufacturing batch lot' },
      { name: 'expiry_date', type: 'DATE', desc: 'Expiration limit' },
      { name: 'stock_qty', type: 'INT', desc: 'Active stock in batch lot' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Active, Expired, Blocked' }
    ],
    rack_master: [
      { name: 'id', type: 'VARCHAR(10) (PK)', desc: 'Shelf identifier (A1, A2...)' },
      { name: 'category', type: 'VARCHAR(100)', desc: 'Allocated category classes' },
      { name: 'capacity', type: 'INT', desc: 'Maximum pack capacity' },
      { name: 'current_usage', type: 'INT', desc: 'Filled space count' }
    ],
    warehouse_master: [
      { name: 'id', type: 'INT (PK)', desc: 'Warehouse building ID' },
      { name: 'location_bin', type: 'VARCHAR(50)', desc: 'Warehouse row/bin path' },
      { name: 'capacity', type: 'INT', desc: 'Max pallets storage' }
    ],
    inventory_stock: [
      { name: 'medicine_id', type: 'INT (PK/FK)', desc: 'Catalog reference' },
      { name: 'on_hand', type: 'INT', desc: 'Available stock on shelf' },
      { name: 'reserved_stock', type: 'INT', desc: 'Booked/billed stock' },
      { name: 'warehouse_stock', type: 'INT', desc: 'Bulk buffer warehouse stock' }
    ],
    prescription: [
      { name: 'id', type: 'VARCHAR(20) (PK)', desc: 'Prescription slip reference' },
      { name: 'patient_name', type: 'VARCHAR(150)', desc: 'Customer name' },
      { name: 'doctor_name', type: 'VARCHAR(150)', desc: 'Prescriber details' },
      { name: 'verification_flag', type: 'BOOLEAN', desc: 'Doctor verified check' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Pending, Dispensed' }
    ],
    medicine_dispensing: [
      { name: 'id', type: 'INT (PK)', desc: 'Dispensing log key' },
      { name: 'prescription_id', type: 'VARCHAR(20) (FK)', desc: 'Related doctor order' },
      { name: 'batch_id', type: 'INT (FK)', desc: 'FEFO batch source lot' },
      { name: 'dispense_qty', type: 'INT', desc: 'Stock deducted count' },
      { name: 'date_logged', type: 'TIMESTAMP', desc: 'Dispensed stamp' }
    ],
    pharmacy_bill: [
      { name: 'id', type: 'VARCHAR(20) (PK)', desc: 'Invoice checkout key' },
      { name: 'patient_name', type: 'VARCHAR(150)', desc: 'Customer name' },
      { name: 'subtotal', type: 'DECIMAL(10,2)', desc: 'Sum total raw cost' },
      { name: 'discount', type: 'DECIMAL(10,2)', desc: 'Discount subtracted value' },
      { name: 'gst_tax', type: 'DECIMAL(10,2)', desc: 'Computed taxes' },
      { name: 'grand_total', type: 'DECIMAL(10,2)', desc: 'Grand total cost' },
      { name: 'payment_status', type: 'VARCHAR(20)', desc: 'Paid, Unpaid, Credit' }
    ],
    payment_transaction: [
      { name: 'id', type: 'INT (PK)', desc: 'Payment receipt ID' },
      { name: 'bill_id', type: 'VARCHAR(20) (FK)', desc: 'Bill reference link' },
      { name: 'cash_paid', type: 'DECIMAL(10,2)', desc: 'Cash share' },
      { name: 'upi_paid', type: 'DECIMAL(10,2)', desc: 'UPI payment values' },
      { name: 'card_paid', type: 'DECIMAL(10,2)', desc: 'Card payment values' },
      { name: 'insurance_claim', type: 'DECIMAL(10,2)', desc: 'Claim co-pay share' }
    ],
    medicine_return: [
      { name: 'id', type: 'INT (PK)', desc: 'Return receipt ID' },
      { name: 'bill_id', type: 'VARCHAR(20) (FK)', desc: 'Original invoice' },
      { name: 'medicine_id', type: 'INT (FK)', desc: 'Returned item' },
      { name: 'qty', type: 'INT', desc: 'Lot returned qty' },
      { name: 'refund_amount', type: 'DECIMAL(10,2)', desc: 'Net refund total' }
    ],
    customer_master: [
      { name: 'id', type: 'INT (PK)', desc: 'Unique customer/patient ID' },
      { name: 'name', type: 'VARCHAR(150)', desc: 'Customer/Patient full name' },
      { name: 'email', type: 'VARCHAR(100)', desc: 'Customer email' },
      { name: 'phone', type: 'VARCHAR(20)', desc: 'Customer contact phone' },
      { name: 'loyaltyPoints', type: 'INT', desc: 'Loyalty points accrued' },
      { name: 'outstandingBalance', type: 'DECIMAL(10,2)', desc: 'Unpaid/credit balance outstanding' }
    ],
    supplier_invoice: [
      { name: 'id', type: 'VARCHAR(20) (PK)', desc: 'Supplier invoice ID' },
      { name: 'supplierId', type: 'INT (FK)', desc: 'Relation to supplier_master' },
      { name: 'invoiceNumber', type: 'VARCHAR(50)', desc: 'Supplier invoice reference code' },
      { name: 'amount', type: 'DECIMAL(10,2)', desc: 'Invoice amount' },
      { name: 'date', type: 'TIMESTAMP', desc: 'Invoice generation timestamp' },
      { name: 'remarks', type: 'TEXT', desc: 'Acquisition or payment terms notes' }
    ],
    supplier_payment: [
      { name: 'id', type: 'VARCHAR(20) (PK)', desc: 'Payment receipt ID' },
      { name: 'supplierId', type: 'INT (FK)', desc: 'Relation to supplier_master' },
      { name: 'referenceNumber', type: 'VARCHAR(50)', desc: 'Payment bank reference number' },
      { name: 'amount', type: 'DECIMAL(10,2)', desc: 'Amount transacted' },
      { name: 'method', type: 'VARCHAR(20)', desc: 'Bank Transfer, UPI, Cash, Cheque' },
      { name: 'date', type: 'TIMESTAMP', desc: 'Payment transaction timestamp' }
    ],
    supplier_ledger: [
      { name: 'id', type: 'VARCHAR(20) (PK)', desc: 'Ledger transaction ID' },
      { name: 'supplierId', type: 'INT (FK)', desc: 'Supplier reference' },
      { name: 'type', type: 'VARCHAR(10)', desc: 'Invoice (+) or Payment (-)' },
      { name: 'amount', type: 'DECIMAL(10,2)', desc: 'Transaction value' },
      { name: 'date', type: 'TIMESTAMP', desc: 'Ledger entry timestamp' },
      { name: 'remarks', type: 'TEXT', desc: 'Description of the transaction' }
    ]
  };

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans overflow-hidden text-slate-800">
      
      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION - Collapsible Premium Dark Theme */}
      {/* ========================================================= */}
      <aside 
        className={`relative ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#013527] flex flex-col justify-between shadow-2xl shrink-0 z-30 transition-all duration-300 ease-in-out`}
        style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Collapse toggle button on the right border */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-md z-40 transition-transform duration-300 cursor-pointer"
        >
          {isSidebarCollapsed ? <ArrowRight size={12} /> : <ArrowRight size={12} className="rotate-180" />}
        </button>

        {/* Sidebar Brand Logo */}
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-emerald-900/60">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-emerald-500/30 shrink-0">
              Rx
            </div>
            {!isSidebarCollapsed && (
              <div className="transition-all duration-300 text-left animate-fade-in-up">
                <h1 className="text-white font-extrabold text-sm tracking-wider uppercase leading-none">Pharmacy ERP</h1>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Enterprise Rx v1.0</span>
              </div>
            )}
          </div>

          {/* Navigation Scrollbox */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
            {categories.map(cat => {
              const catTabs = allowedTabs.filter(t => t.category === cat);
              if (catTabs.length === 0) return null;
              return (
                <div key={cat} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <span className="block text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest pl-2 mb-1.5 text-left">{cat}</span>
                  )}
                  {catTabs.map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.label}
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-slate-400 hover:bg-[#044434]/40 hover:text-emerald-300'
                        }`}
                      >
                        <TabIcon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                        {!isSidebarCollapsed && <span>{tab.label}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom */}
        <div className={`p-4 border-t border-emerald-900/60 bg-[#002219] flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
              {role.slice(0, 2).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left transition-all duration-300">
                <h4 className="text-xs font-bold text-slate-200 leading-tight">System Operator</h4>
                <span className="text-[10px] font-semibold text-slate-400 leading-none">{role}</span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-red-400 transition hover:bg-emerald-950/40 rounded-lg cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* ========================================================= */}
        {/* TOP HEADER */}
        {/* ========================================================= */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 z-20">
          
          {/* Breadcrumbs Header */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="hover:text-slate-600 flex items-center gap-1.5 cursor-pointer">
              <span className="h-5 w-5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"><UserIcon size={12} className="text-slate-500" /></span>
              Home
            </span>
            <span>/</span>
            <span className="text-slate-600 uppercase tracking-tight">
              {sidebarModules.find(m => m.id === activeTab)?.label || 'Overview'}
            </span>
          </div>

          {/* Quick Config Actions */}
          <div className="flex items-center gap-4">
            
            {/* Global Search box with Ctrl+K shortcut badge */}
            <div className="relative hidden md:flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search SKU, name, barcode..."
                className="pl-9 pr-14 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-60 text-slate-700 shadow-sm"
              />
              <span className="absolute right-2.5 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-[9px] font-extrabold text-slate-400 font-mono shadow-sm pointer-events-none select-none">
                ⌘K
              </span>
            </div>

            {/* Multi-Store Outlet Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Outlet:</span>
              <select
                value={selectedOutlet}
                onChange={(e) => {
                  setSelectedOutlet(e.target.value);
                  alert(`Switched active outlet environment to: ${e.target.value}`);
                }}
                className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="Main Pharmacy Branch">Main Pharmacy Branch</option>
                <option value="Emergency Care Pharmacy">Emergency Care Pharmacy</option>
                <option value="Annex Ward Pharmacy">Annex Ward Pharmacy</option>
              </select>
            </div>



            {/* Quick Role switcher */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dashboard Role Switch:</span>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Pharmacy Manager">Pharmacy Manager</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Inventory Staff">Inventory Staff</option>
                <option value="Purchase Manager">Purchase Manager</option>
                <option value="Billing Staff">Billing Staff</option>
                <option value="Doctor">Doctor</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-500 hover:text-blue-600 transition hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <Bell size={18} />
              {notifications.filter(n => !n.resolved).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
              )}
            </button>

            {/* Quick Info Profile */}
            <div className="h-8 border-l border-slate-200" />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="block text-[11px] font-extrabold text-slate-700 leading-tight">Welcome Operator</span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">{role} Portal</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-sm">
                <UserIcon size={14} />
              </div>
            </div>

          </div>

        </header>

        {/* ========================================================= */}
        {/* INNER CONTENT SCROLL CONTAINER */}
        {/* ========================================================= */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-8">
          
          {renderActiveView()}

        </div>

      </main>

      {/* ========================================================= */}
      {/* DB SCHEMA DIALOG OVERLAY (Interactive Tables schema popup) */}
      {/* ========================================================= */}
      {schemaModalTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-lg text-left space-y-4 animate-fade-in-up">
            
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
                <Database size={16} className="text-blue-600" />
                Table Schema Reference: <span className="font-mono text-blue-700 font-black">{schemaModalTable}</span>
              </h3>
              <button
                onClick={() => setSchemaModalTable(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-x-auto max-h-80 border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] border-b border-slate-200/50">
                    <th className="py-2.5 px-4">Column Name</th>
                    <th className="py-2.5 px-4 text-center">Datatype (Constraint)</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(tableSchemas[schemaModalTable] || []).map((col, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{col.name}</td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-500 font-semibold">{col.type}</td>
                      <td className="py-2.5 px-4 text-slate-500">{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-slate-500 leading-relaxed flex gap-2">
              <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
              This panel visualizes the database table layout associated with the active module, reflecting foreign keys and core transaction structures.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
