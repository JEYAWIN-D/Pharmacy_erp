import React, { useState } from 'react';
import { Database, User, Plus, Search, Award, DollarSign, History, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCustomerController } from './useCustomerController';

export default function CustomerView({ setSchemaModalTable }) {
  const {
    customers,
    salesHistory,
    newCustomer,
    setNewCustomer,
    handleAddCustomer,
    handleClearBalance
  } = useCustomerController();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || (filteredCustomers.length > 0 ? filteredCustomers[0] : null);

  // Get purchases (bills) associated with the selected customer
  const customerPurchases = selectedCustomer 
    ? salesHistory.filter(s => s.patient.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim()) 
    : [];

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Patient & Customer Records
            <button 
              onClick={() => setSchemaModalTable('customer_master')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Table Columns Schema"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400 font-medium">Manage customer billing accounts, award loyalty club points, and monitor outstanding credit balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Customer List Card */}
        <div className="unique-card p-6 xl:col-span-2 text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User size={15} className="text-blue-600" />
              Customer Master Ledger
            </h4>
            
            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-64">
              <Search size={12} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5 pl-2">Customer Profile</th>
                  <th className="py-2.5">Contact Details</th>
                  <th className="py-2.5 text-center">Loyalty Tier</th>
                  <th className="py-2.5 text-right">Outstanding Credit</th>
                  <th className="py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold italic">No customer records matching search found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/40 border-l-2 border-l-blue-600 pl-1.5' : ''
                        }`}
                      >
                        <td className="py-3 pl-2 font-bold text-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                              {c.name.slice(0,2).toUpperCase()}
                            </span>
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-500 font-semibold">
                          <div>{c.phone}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.email}</div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-extrabold text-slate-700">{c.loyaltyPoints} pts</span>
                            {c.loyaltyPoints >= 300 ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200" title="Gold Member">Gold</span>
                            ) : c.loyaltyPoints >= 100 ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-slate-600 bg-slate-100 border border-slate-200" title="Silver Member">Silver</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200" title="Bronze Member">Bronze</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right font-black text-slate-700">
                          {c.outstandingBalance > 0 ? (
                            <span className="text-red-600 font-extrabold">₹ {c.outstandingBalance.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400 font-semibold">-</span>
                          )}
                        </td>
                        <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {c.outstandingBalance > 0 ? (
                            <button
                              onClick={() => handleClearBalance(c.id)}
                              className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Settle Credit
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Clear</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Add Customer Form & Details panel */}
        <div className="space-y-6">
          
          {/* Add Customer Form */}
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Plus size={15} className="text-blue-600" />
              Register Patient Profile
            </h4>
            
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer / Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 00000"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@gmail.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Starting Points</label>
                  <input
                    type="number"
                    value={newCustomer.loyaltyPoints}
                    onChange={(e) => setNewCustomer({ ...newCustomer, loyaltyPoints: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCustomer.outstandingBalance}
                    onChange={(e) => setNewCustomer({ ...newCustomer, outstandingBalance: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center"
              >
                Create Account Profile
              </button>
            </form>
          </div>

          {/* Customer Detail & Purchase History Drawer */}
          {selectedCustomer && (
            <div className="unique-card p-6 text-left space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <History size={15} className="text-blue-600" />
                  Account Summary: {selectedCustomer.name}
                </h4>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Loyalty points</span>
                    <span className="text-base font-extrabold text-slate-700 flex items-center gap-1">
                      <Sparkles size={14} className="text-amber-500" />
                      {selectedCustomer.loyaltyPoints}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Credit Balance</span>
                    <span className={`text-base font-extrabold ${selectedCustomer.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      ₹ {selectedCustomer.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Purchase List */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purchase History ({customerPurchases.length} invoices)</span>
                  {customerPurchases.length === 0 ? (
                    <div className="p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-[11px] text-center text-slate-400 font-medium italic">
                      No invoices found under this exact name.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {customerPurchases.map(invoice => (
                        <div key={invoice.id} className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100/50 rounded-lg text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-700">{invoice.id}</span>
                            <span className="block text-[9px] text-slate-400">{invoice.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-800 block">₹ {invoice.total.toFixed(2)}</span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[8px] font-bold text-blue-600 border border-blue-100">{invoice.paymentMethod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-relaxed flex gap-2">
                  <CheckCircle2 size={13} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    Points system rules: Customers earn points automatically during checkout when matching profiles are detected.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
