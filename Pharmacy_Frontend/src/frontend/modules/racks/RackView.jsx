import React from 'react';
import { 
  Layers, Plus, ArrowRightLeft, Clock, ShieldCheck, 
  AlertCircle, ArrowLeft, Archive, Database, Info, PackageSearch, X
} from 'lucide-react';
import { useRackController } from './useRackController';

export default function RackView({ role, setSchemaModalTable }) {
  const {
    viewState, setViewState, selectedRackId, setSelectedRackId,
    selectedCompId, setSelectedCompId, activeModal, setActiveModal,
    racks, compartments, storedMedicines, transferHistory, localNotifications,
    dashboardStats, activeRack, activeCompartments, activeCompartment,
    activeCompartmentUsage, activeCompartmentMeds, filteredHistory,
    getCompartmentUsage, getRackUsage, getRackTotalCapacity, addNotification,
    rackNameInput, setRackNameInput, rackCodeInput, setRackCodeInput,
    rackTypeInput, setRackTypeInput, rackCatInput, setRackCatInput,
    rackCapInput, setRackCapInput, rackCompCountInput, setRackCompCountInput,
    rackLocationInput, setRackLocationInput, rackDescInput, setRackDescInput,
    rackStatusInput, setRackStatusInput, submitNewRack,
    compNameInput, setCompNameInput, compCatInput, setCompCatInput,
    compTypeInput, setCompTypeInput, compCapInput, setCompCapInput,
    compDescInput, setCompDescInput, compStatusInput, setCompStatusInput,
    submitNewCompartment,
    medNameInput, setMedNameInput, medBrandInput, setMedBrandInput,
    medBatchInput, setMedBatchInput, medQtyInput, setMedQtyInput,
    medUnitInput, setMedUnitInput, medSupplierInput, setMedSupplierInput,
    submitAddMedicine,
    xFromRack, setXFromRack, xFromComp, setXFromComp,
    xToRack, setXToRack, xToComp, setXToComp,
    xWHName, setXWHName, xMedName, setXMedName,
    xBatch, setXBatch, xQty, setXQty, xRemarks, setXRemarks,
    xReason, setXReason,
    handleSourceCompChange, handleWHCompChange,
    submitRackToRack, submitRackToWarehouse, submitWarehouseToRack,
    reqMedName, setReqMedName, reqQty, setReqQty,
    reqReason, setReqReason, reqRackId, setReqRackId,
    submitStockRequest,
    filterType, setFilterType, filterFromRack, setFilterFromRack,
    filterToRack, setFilterToRack, filterMedName, setFilterMedName,
    filterDate, setFilterDate, filterStatus, setFilterStatus
  } = useRackController(role);
  



  return (
    <div className="space-y-6 text-left font-sans text-slate-800">
      
      {/* Top Banner and Header */}
      <div className="text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Pharmacy Rack Management Desk
            <button 
              onClick={() => setSchemaModalTable && setSchemaModalTable('rack_master')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Table Columns Schema"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">
            Configure main racks, sub-racks, stock allocations, and track physical placement mapping.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW A: RACK DASHBOARD (Main Landing View) */}
      {/* ============================================================== */}
      {viewState === 'dashboard' && (
        <div className="space-y-6">
          
          {/* 1. Dashboard summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Main Racks</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{dashboardStats.totalRacks}</span>
                <span className="text-[9px] text-slate-400 font-bold">Physical units</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sub-Racks</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{dashboardStats.totalComps}</span>
                <span className="text-[9px] text-slate-400 font-bold">Shelves partitions</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Sub-Racks</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-red-600">{dashboardStats.fullComps}</span>
                <span className="text-[9px] text-slate-400 font-bold">At max limit</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Sub-Racks</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-blue-600">{dashboardStats.availComps}</span>
                <span className="text-[9px] text-slate-400 font-bold">Active partitions</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warehouse Stock</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-blue-700">{dashboardStats.whStock}</span>
                <span className="text-[9px] text-slate-400 font-bold">Bulk Units</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rack to Rack Transfers</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{dashboardStats.r2rTransfersCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">Relocations</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rack to Warehouse Transfers</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{dashboardStats.r2wTransfersCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">Overflows</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Restocks</span>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="text-2xl font-black text-red-600">
                  {storedMedicines.filter(m => m.quantity === 0).length}
                </span>
                <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Out of stock</span>
              </div>
              <button 
                onClick={() => setActiveModal('restock-details')}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider text-left mt-2 block w-full hover:underline focus:outline-none cursor-pointer"
              >
                More Details &rarr;
              </button>
            </div>

          </div>



          {/* Main racks cards explorer */}
          <div className="space-y-4">
            
            {/* Dashboard Header containing requested buttons on the side of + Add New Rack */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm">
              <div>
                <span className="text-sm font-black uppercase text-slate-800 tracking-wider">Main Racks Storage Units</span>
                <p className="text-xs text-slate-400 mt-1">Select a main rack card to modify sub-rack properties or load storage details.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveModal('add-rack')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus size={14} /> Add New Rack
                </button>
                <button
                  onClick={() => {
                    setXFromRack('RACK-A');
                    handleSourceCompChange('COMP-A1');
                    setXToRack('RACK-B');
                    setXToComp('COMP-B1');
                    setActiveModal('r2r');
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowRightLeft size={14} className="text-slate-500" /> Rack to Rack Transfer
                </button>
                <button
                  onClick={() => {
                    setXFromRack('RACK-A');
                    handleSourceCompChange('COMP-A1');
                    setXWHName('COMP-WH1');
                    setActiveModal('r2w');
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <Archive size={14} className="text-slate-500" /> Rack to Warehouse Transfer
                </button>
                <button
                  onClick={() => {
                    setXToRack('RACK-A');
                    setXToComp('COMP-A1');
                    handleWHCompChange('COMP-WH1');
                    setActiveModal('w2r');
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowRightLeft size={14} className="text-slate-500" /> Warehouse to Rack Transfer
                </button>
                <button
                  onClick={() => setActiveModal('req-stock')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <PackageSearch size={14} /> Request Stock from Warehouse
                </button>
                <button
                  onClick={() => setViewState('history')}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <Clock size={14} className="text-slate-500" /> View Transaction History
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {racks.map(rack => {
                const totalCompInRack = compartments.filter(c => c.rackId === rack.id).length;
                const usedCompInRack = compartments.filter(c => c.rackId === rack.id && getCompartmentUsage(c.id) > 0).length;
                const availCompInRack = totalCompInRack - usedCompInRack;
                const rackUsage = getRackUsage(rack.id);
                const rackCap = getRackTotalCapacity(rack.id);
                const percentUsed = rackCap > 0 ? Math.min(100, Math.round((rackUsage / rackCap) * 100)) : 0;

                return (
                  <div
                    key={rack.id}
                    onClick={() => {
                      setSelectedRackId(rack.id);
                      setViewState('rack-detail');
                      // Focus first compartment by default
                      const ass = compartments.filter(c => c.rackId === rack.id);
                      if (ass.length > 0) setSelectedCompId(ass[0].id);
                    }}
                    className="p-6 bg-white border border-slate-200 hover:border-blue-500 rounded-[28px] text-left space-y-4 shadow-sm hover:shadow-md transition duration-200 cursor-pointer relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{rack.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{rack.type} | {rack.category}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                        rack.status === 'Active' ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'bg-red-50 text-red-800 border border-red-100'
                      }`}>
                        {rack.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] bg-slate-50 p-3 rounded-2xl border border-slate-100 font-bold text-slate-500 uppercase">
                      <div>
                        <span className="text-slate-400 block text-[9px]">Total Sub-Racks</span>
                        <span className="text-slate-800 font-black">{totalCompInRack}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Used Sub-Racks</span>
                        <span className="text-slate-800 font-black">{usedCompInRack}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Available Sub-Racks</span>
                        <span className="text-slate-800 font-black">{availCompInRack}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Used Capacity / Total Capacity</span>
                        <span>{rackUsage} / {rackCap} Boxes ({percentUsed}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                        <div 
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: RACK DETAIL PAGE */}
      {/* ============================================================== */}
      {viewState === 'rack-detail' && activeRack && (
        <div className="space-y-6">
          
          {/* Breadcrumbs return link */}
          <button 
            onClick={() => setViewState('dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-700 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Rack Dashboard
          </button>

          {/* Heading */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-3 text-left">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                {activeRack.name} Management
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure sub-racks, allocate medicine boxes, and adjust storage capacities.</p>
            </div>
            
            {/* Buttons on Rack Detail page */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModal('add-comp')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-1 shadow transition cursor-pointer"
              >
                <Plus size={12} /> Add New Sub-Rack
              </button>
              <button
                onClick={() => setViewState('dashboard')}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center gap-1 shadow-sm hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={12} className="text-slate-500" /> Back to Rack Dashboard
              </button>
            </div>

          </div>

          {/* Grid layout of sub-racks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCompartments.map(comp => {
              const usage = getCompartmentUsage(comp.id);
              const isFull = usage >= comp.maxCapacity;
              const availSpace = comp.maxCapacity - usage;
              const medCount = storedMedicines.filter(m => m.compartmentId === comp.id).length;

              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompId(comp.id);
                    setViewState('compartment-detail');
                  }}
                  className="p-5 bg-white border border-slate-200 hover:border-blue-500 rounded-[28px] text-left space-y-4 shadow-sm hover:shadow duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black px-2 py-0.5 bg-blue-600 text-white rounded">{comp.name}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Sub-Rack ID: {comp.id}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isFull ? 'bg-red-50 text-red-700 border border-red-200/50' : 'bg-blue-50 text-blue-800'
                    }`}>
                      {isFull ? 'Full' : 'Active'}
                    </span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50 space-y-2 text-[10px] font-bold text-slate-500 uppercase">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Medicine Category:</span>
                      <span className="text-slate-800 font-black">{comp.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Medicine Count:</span>
                      <span className="text-slate-800 font-black">{medCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Quantity:</span>
                      <span className="text-slate-800 font-black">{usage} Boxes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capacity:</span>
                      <span className="text-slate-800 font-black">{comp.maxCapacity} Boxes</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/40 pt-2 mt-1.5">
                      <span className="text-slate-400">Available Space:</span>
                      <span className="text-blue-700 font-black">{availSpace} Boxes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW C: SUB-RACK DETAILS PAGE */}
      {/* ============================================================== */}
      {viewState === 'compartment-detail' && activeCompartment && (
        <div className="space-y-6">
          
          {/* Breadcrumbs return link */}
          <button 
            onClick={() => setViewState('rack-detail')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-700 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Rack {activeRack?.name}
          </button>

          {/* Heading */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-3 text-left">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                Sub-Rack Details: {activeCompartment.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Displaying physical sub-rack metrics, specifications, and stored medicine strips catalog.</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModal('add-medicine')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-1 shadow transition cursor-pointer"
              >
                <Plus size={12} /> Add Medicine
              </button>
              <button
                onClick={() => setViewState('rack-detail')}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center gap-1 shadow-sm hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={12} className="text-slate-500" /> Back to {activeRack?.name}
              </button>
            </div>
          </div>

          {/* Details specs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white border border-slate-200 p-6 rounded-[24px] space-y-4 shadow-sm">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <Info size={14} className="text-blue-600" />
                Physical Specifications
              </h4>

              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sub-Rack ID:</span>
                  <span className="font-bold text-slate-800">{activeCompartment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Main Rack Name:</span>
                  <span className="font-bold text-slate-800">{activeRack?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sub-Rack Name:</span>
                  <span className="font-bold text-slate-800">{activeCompartment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Medicine Category:</span>
                  <span className="font-bold text-slate-800">{activeCompartment.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="font-bold text-slate-800">{activeCompartment.maxCapacity} Boxes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Used Space:</span>
                  <span className="font-bold text-slate-800">{activeCompartmentUsage} Boxes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Space:</span>
                  <span className="font-bold text-blue-700">{activeCompartment.maxCapacity - activeCompartmentUsage} Boxes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-blue-700 uppercase">{activeCompartmentUsage >= activeCompartment.maxCapacity ? 'Full' : activeCompartment.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created By:</span>
                  <span className="font-bold text-slate-800">{activeCompartment.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created Date:</span>
                  <span className="font-bold text-slate-800">{activeCompartment.createdDate}</span>
                </div>
              </div>
            </div>

            {/* Stored Medicines list table */}
            <div className="bg-white border border-slate-200 p-6 rounded-[24px] space-y-4 shadow-sm">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-blue-600" />
                Allocated Medicine Catalog
              </h4>

              {activeCompartmentMeds.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic font-medium bg-slate-50 border border-slate-100 rounded-2xl">
                  No medicines currently allocated in this slot. Click "Add Medicine" above to stock it.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200/50">
                        <th className="py-2.5 px-3">Medicine ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Batch Number</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3">Added By</th>
                        <th className="py-2.5 px-3">Added Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCompartmentMeds.map(med => (
                        <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{med.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{med.name} <span className="text-slate-400 text-[10px] block">Brand: {med.brandName}</span></td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{med.batchNumber}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">{med.quantity} {med.unit}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-semibold">{med.addedBy}</td>
                          <td className="py-2.5 px-3 text-slate-400 font-medium">{med.addedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW D: TRANSACTION HISTORY */}
      {/* ============================================================== */}
      {viewState === 'history' && (
        <div className="space-y-6">
          
          <button 
            onClick={() => setViewState('dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-700 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Rack Dashboard
          </button>

          <div className="bg-white border border-slate-200 p-6 rounded-[24px] space-y-5 text-left shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                Transaction History Ledger
              </h4>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Transfer Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Rack to Rack">Rack to Rack</option>
                  <option value="Rack to Warehouse">Rack to Warehouse</option>
                  <option value="Warehouse to Rack">Warehouse to Rack</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">From Rack</label>
                <select
                  value={filterFromRack}
                  onChange={(e) => setFilterFromRack(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                >
                  <option value="All">All Racks</option>
                  {racks.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">To Rack</label>
                <select
                  value={filterToRack}
                  onChange={(e) => setFilterToRack(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                >
                  <option value="All">All Racks</option>
                  {racks.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Medicine Name</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={filterMedName}
                  onChange={(e) => setFilterMedName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200/50">
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-4">Transfer Type</th>
                    <th className="py-2.5 px-4">Source</th>
                    <th className="py-2.5 px-4">Destination</th>
                    <th className="py-2.5 px-4">Medicine Name</th>
                    <th className="py-2.5 px-4">Batch Number</th>
                    <th className="py-2.5 px-4 text-center">Quantity</th>
                    <th className="py-2.5 px-4">Done By</th>
                    <th className="py-2.5 px-4">Date and Time</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 italic">No transfers match the current filters.</td>
                    </tr>
                  ) : (
                    filteredHistory.map((txn) => (
                      <tr key={txn.transactionId} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{txn.transactionId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{txn.transferType}</td>
                        <td className="py-3 px-4 text-slate-500">{txn.source}</td>
                        <td className="py-3 px-4"><span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded font-black text-[10px]">{txn.destination}</span></td>
                        <td className="py-3 px-4 font-bold text-slate-700">{txn.medicineName}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{txn.batchNumber}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{txn.quantity} Boxes</td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{txn.doneBy}</td>
                        <td className="py-3 px-4 text-slate-400 font-medium">{txn.dateTime}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-800">
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP MODAL DIALOG OVERLAYS */}
      {/* ============================================================== */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 w-full max-w-lg text-left space-y-4 animate-fade-in-up">
            
            {/* Modal Restock Details */}
            {activeModal === 'restock-details' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <AlertCircle size={16} className="text-red-600" />
                    Required Restock Alerts Details
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold cursor-pointer">Close</button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {storedMedicines.filter(m => m.quantity === 0).length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                      All pharmacy medicines are fully stocked. No restock needed.
                    </div>
                  ) : (
                    storedMedicines.filter(m => m.quantity === 0).map(med => {
                      const compObj = compartments.find(c => c.id === med.compartmentId);
                      const rackObj = racks.find(r => r.id === compObj?.rackId);
                      return (
                        <div key={med.id} className="flex items-center justify-between p-3.5 bg-red-50/40 border border-red-100 rounded-2xl text-xs font-semibold shadow-sm">
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-sm">{med.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-black block mt-0.5">Brand: {med.brandName}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mt-1">
                              Location: {rackObj?.name || 'Rack'} &gt; Sub-Rack {compObj?.name || 'Slot'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">Batch: {med.batchNumber} | Supplier: {med.supplier}</span>
                          </div>
                          <button
                            onClick={() => {
                              // Quick restock action: replenish 100 boxes instantly!
                              setStoredMedicines(prev => prev.map(m => {
                                if (m.id === med.id) return { ...m, quantity: 100 };
                                return m;
                              }));
                              addNotification(`${med.name} restocked with 100 boxes successfully`);
                              addNotification('Capacity updated successfully');
                            }}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[10px] uppercase shadow transition cursor-pointer"
                          >
                            Quick Restock
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex pt-2 justify-end">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Close</button>
                </div>
              </div>
            )}

            {/* Modal A: Add New Main Rack */}
            {activeModal === 'add-rack' && (
              <form onSubmit={submitNewRack} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Plus size={16} className="text-blue-600" />
                    Add New Main Rack
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Rack ID</label>
                    <input
                      type="text"
                      value={rackCodeInput ? `RACK-${rackCodeInput.toUpperCase()}` : 'Auto-generated'}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Rack Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rack E"
                      value={rackNameInput}
                      onChange={(e) => setRackNameInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Rack Code</label>
                    <input
                      type="text"
                      placeholder="e.g. E"
                      value={rackCodeInput}
                      onChange={(e) => setRackCodeInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Rack Type</label>
                    <select
                      value={rackTypeInput}
                      onChange={(e) => setRackTypeInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Dry Storage">Dry Storage</option>
                      <option value="Refrigerated">Refrigerated</option>
                      <option value="Controlled Storage">Controlled Storage</option>
                      <option value="Bulk Storage">Bulk Storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Storage Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Tablets"
                      value={rackCatInput}
                      onChange={(e) => setRackCatInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Total Capacity</label>
                    <input
                      type="number"
                      value={rackCapInput}
                      onChange={(e) => setRackCapInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Sub-Racks Count</label>
                    <input
                      type="number"
                      value={rackCompCountInput}
                      onChange={(e) => setRackCompCountInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      placeholder="e.g. 5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Status</label>
                    <select
                      value={rackStatusInput}
                      onChange={(e) => setRackStatusInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Location inside Pharmacy</label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle 4 Counter"
                    value={rackLocationInput}
                    onChange={(e) => setRackLocationInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Created By</label>
                    <input type="text" value={role || 'Admin'} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Created Date</label>
                    <input type="text" value={new Date().toISOString().substring(0, 10)} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Description</label>
                  <textarea
                    placeholder="Enter physical shelf positioning notes..."
                    value={rackDescInput}
                    onChange={(e) => setRackDescInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Save Rack</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</button>
                </div>
              </form>
            )}

            {/* Modal B: Add New Sub-Rack */}
            {activeModal === 'add-comp' && (
              <form onSubmit={submitNewCompartment} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Plus size={16} className="text-blue-600" />
                    Add New Sub-Rack
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Sub-Rack ID / Slot ID</label>
                    <input
                      type="text"
                      value={compNameInput ? `COMP-${activeRack?.code.toUpperCase()}-${compNameInput.toUpperCase()}` : 'Auto-generated'}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Main Rack Name</label>
                    <input
                      type="text"
                      value={activeRack?.name}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Sub-Rack Name</label>
                    <input
                      type="text"
                      placeholder="e.g. A6"
                      value={compNameInput}
                      onChange={(e) => setCompNameInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Medicine Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Tablets"
                      value={compCatInput}
                      onChange={(e) => setCompCatInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Suitable Medicine Type</label>
                    <select
                      value={compTypeInput}
                      onChange={(e) => setCompTypeInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer focus:outline-none"
                    >
                      <option value="Boxes">Boxes</option>
                      <option value="Bottles">Bottles</option>
                      <option value="Vials">Vials</option>
                      <option value="Tubes">Tubes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Maximum Capacity</label>
                    <input
                      type="number"
                      value={compCapInput}
                      onChange={(e) => setCompCapInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Current Capacity</label>
                    <input
                      type="number"
                      value={0}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Status</label>
                    <select
                      value={compStatusInput}
                      onChange={(e) => setCompStatusInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Created By</label>
                    <input type="text" value={role || 'Admin'} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Created Date</label>
                    <input type="text" value={new Date().toISOString().substring(0, 10)} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Description</label>
                  <textarea
                    placeholder="Enter description..."
                    value={compDescInput}
                    onChange={(e) => setCompDescInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Save Sub-Rack</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</button>
                </div>
              </form>
            )}

            {/* Modal C: Add Medicine */}
            {activeModal === 'add-medicine' && (
              <form onSubmit={submitAddMedicine} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Plus size={16} className="text-blue-600" />
                    Allocate New Medicine Package
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Allocation ID</label>
                    <input
                      type="text"
                      value={`ALC-${Date.now().toString().slice(-3)}`}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 font-mono"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Medicine Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Calpol 650mg"
                      value={medNameInput}
                      onChange={(e) => setMedNameInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Batch Number</label>
                    <input
                      type="text"
                      placeholder="e.g. B-CALP45"
                      value={medBatchInput}
                      onChange={(e) => setMedBatchInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Brand Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Calpol"
                      value={medBrandInput}
                      onChange={(e) => setMedBrandInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Target Rack</label>
                    <input type="text" value={activeRack?.name} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Sub-Rack</label>
                    <input type="text" value={activeCompartment?.name} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={medQtyInput}
                      onChange={(e) => setMedQtyInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Supplier</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Medical"
                      value={medSupplierInput}
                      onChange={(e) => setMedSupplierInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Added By</label>
                    <input type="text" value={role || 'Admin'} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Save Medicine</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</button>
                </div>
              </form>
            )}

            {/* Modal D: Rack to Rack Transfer */}
            {activeModal === 'r2r' && (
              <form onSubmit={submitRackToRack} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <ArrowRightLeft size={16} className="text-blue-600" />
                    Rack to Rack Transfer
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Transfer ID</label>
                    <input
                      type="text"
                      value={`TRF-RR-${Date.now().toString().slice(-3)}`}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">From Rack</label>
                    <select
                      value={xFromRack}
                      onChange={(e) => {
                        setXFromRack(e.target.value);
                        const ass = compartments.filter(c => c.rackId === e.target.value);
                        if (ass.length > 0) handleSourceCompChange(ass[0].id);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {racks.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">From Sub-Rack</label>
                    <select
                      value={xFromComp}
                      onChange={(e) => handleSourceCompChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {compartments.filter(c => c.rackId === xFromRack).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Medicine Name</label>
                    <select
                      value={xMedName}
                      onChange={(e) => {
                        setXMedName(e.target.value);
                        const medObj = storedMedicines.find(m => m.name === e.target.value && m.compartmentId === xFromComp);
                        if (medObj) {
                          setXBatch(medObj.batchNumber);
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">-- Select Medicine --</option>
                      {storedMedicines.filter(m => m.compartmentId === xFromComp).map(m => (
                        <option key={m.id} value={m.name}>{m.name} (Available: {m.quantity})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">To Rack</label>
                    <select
                      value={xToRack}
                      onChange={(e) => {
                        setXToRack(e.target.value);
                        const ass = compartments.filter(c => c.rackId === e.target.value);
                        if (ass.length > 0) setXToComp(ass[0].id);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {racks.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">To Sub-Rack</label>
                    <select
                      value={xToComp}
                      onChange={(e) => setXToComp(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {compartments.filter(c => c.rackId === xToRack && c.id !== xFromComp).map(c => {
                        const avail = c.maxCapacity - getCompartmentUsage(c.id);
                        return <option key={c.id} value={c.id}>{c.name} (Space: {avail})</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={xBatch}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={xQty}
                      onChange={(e) => setXQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Transferred By</label>
                    <input type="text" value={role || 'Admin'} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Reason for Transfer</label>
                    <textarea
                      placeholder="Reason..."
                      value={xReason}
                      onChange={(e) => setXReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Remarks</label>
                    <textarea
                      placeholder="Remarks..."
                      value={xRemarks}
                      onChange={(e) => setXRemarks(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Submit Transfer</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Close</button>
                </div>
              </form>
            )}

            {/* Modal E: Rack to Warehouse Transfer */}
            {activeModal === 'r2w' && (
              <form onSubmit={submitRackToWarehouse} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Archive size={16} className="text-blue-600" />
                    Rack to Warehouse Transfer
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Transfer ID</label>
                    <input
                      type="text"
                      value={`TRF-RW-${Date.now().toString().slice(-3)}`}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">From Rack</label>
                    <select
                      value={xFromRack}
                      onChange={(e) => {
                        setXFromRack(e.target.value);
                        const ass = compartments.filter(c => c.rackId === e.target.value);
                        if (ass.length > 0) handleSourceCompChange(ass[0].id);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {racks.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">From Sub-Rack</label>
                    <select
                      value={xFromComp}
                      onChange={(e) => handleSourceCompChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {compartments.filter(c => c.rackId === xFromRack).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Warehouse Name</label>
                    <select
                      value={xWHName}
                      onChange={(e) => setXWHName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {compartments.filter(c => c.rackId === 'RACK-WH').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Medicine Name</label>
                    <select
                      value={xMedName}
                      onChange={(e) => {
                        setXMedName(e.target.value);
                        const medObj = storedMedicines.find(m => m.name === e.target.value && m.compartmentId === xFromComp);
                        if (medObj) {
                          setXBatch(medObj.batchNumber);
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">-- Select Medicine --</option>
                      {storedMedicines.filter(m => m.compartmentId === xFromComp).map(m => (
                        <option key={m.id} value={m.name}>{m.name} (Available: {m.quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={xBatch}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={xQty}
                      onChange={(e) => setXQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Transferred By</label>
                    <input type="text" value={role || 'Admin'} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Overstock"
                      value={xReason}
                      onChange={(e) => setXReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Remarks</label>
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={xRemarks}
                      onChange={(e) => setXRemarks(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Transfer to Warehouse</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Close</button>
                </div>
              </form>
            )}

            {/* Modal F: Warehouse to Rack Transfer */}
            {activeModal === 'w2r' && (
              <form onSubmit={submitWarehouseToRack} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <ArrowRightLeft size={16} className="text-blue-600" />
                    Warehouse to Rack Transfer
                  </h4>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 font-bold">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Transfer ID</label>
                    <input
                      type="text"
                      value={`TRF-WR-${Date.now().toString().slice(-3)}`}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Warehouse Name</label>
                    <select
                      value={xWHName}
                      onChange={(e) => handleWHCompChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {compartments.filter(c => c.rackId === 'RACK-WH').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">To Rack</label>
                    <select
                      value={xToRack}
                      onChange={(e) => {
                        setXToRack(e.target.value);
                        const ass = compartments.filter(c => c.rackId === e.target.value);
                        if (ass.length > 0) setXToComp(ass[0].id);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {racks.filter(r => r.id !== 'RACK-WH').map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">To Sub-Rack</label>
                    <select
                      value={xToComp}
                      onChange={(e) => setXToComp(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {compartments.filter(c => c.rackId === xToRack).map(c => {
                        const avail = c.maxCapacity - getCompartmentUsage(c.id);
                        return <option key={c.id} value={c.id}>{c.name} (Space: {avail})</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Medicine Name</label>
                    <select
                      value={xMedName}
                      onChange={(e) => {
                        setXMedName(e.target.value);
                        const medObj = storedMedicines.find(m => m.name === e.target.value && m.compartmentId === xWHName);
                        if (medObj) {
                          setXBatch(medObj.batchNumber);
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">-- Select Medicine --</option>
                      {storedMedicines.filter(m => m.compartmentId === xWHName).map(m => (
                        <option key={m.id} value={m.name}>{m.name} (Available: {m.quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={xBatch}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={xQty}
                      onChange={(e) => setXQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Transferred By</label>
                    <input type="text" value={role || 'Admin'} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Reason</label>
                    <input
                      type="text"
                      placeholder="Reason..."
                      value={xReason}
                      onChange={(e) => setXReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Remarks</label>
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={xRemarks}
                      onChange={(e) => setXRemarks(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Transfer to Rack</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Close</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REQUEST STOCK FROM WAREHOUSE                             */}
      {/* ============================================================== */}
      {activeModal === 'req-stock' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <PackageSearch size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Request Stock from Warehouse</h3>
                  <p className="text-[10px] text-slate-400">This request will notify the Warehouse Admin via the alert feed.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={submitStockRequest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-500 uppercase mb-1">Target Sub-Rack (Receiving Location)</label>
                <select
                  value={reqRackId}
                  onChange={(e) => setReqRackId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                >
                  {compartments.filter(c => !c.rackId.includes('WH')).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-extrabold text-slate-500 uppercase mb-1">Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin 500mg"
                  value={reqMedName}
                  onChange={(e) => setReqMedName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-500 uppercase mb-1">Quantity Requested *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-500 uppercase mb-1">Requested By</label>
                  <input
                    type="text"
                    value={role || 'Admin'}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold"
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="block font-extrabold text-slate-500 uppercase mb-1">Reason for Request</label>
                <textarea
                  placeholder="e.g. Out of stock, replenishment needed..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none h-16 resize-none"
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[10px] font-semibold">
                ⚠️ This request will appear in the <strong>Warehouse Management Alert Feed</strong> and will be visible to the Warehouse Admin immediately.
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase cursor-pointer">Submit Request to Warehouse</button>
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
