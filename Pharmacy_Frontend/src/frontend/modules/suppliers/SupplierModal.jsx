import React, { useState, useMemo } from 'react';
import {
  X, Phone, Mail, Globe, MapPin, Shield, FileText, CreditCard,
  Gauge, AlertCircle, Layers, Link2, Package, Plus, Save, Trash2,
  Star, Edit3, Undo2, Receipt, Info, ArrowUpRight, ArrowDownRight,
  ClipboardList, FolderOpen, UploadCloud, Download, RefreshCw,
  ShieldAlert, History, Clock, DollarSign, Award, ChevronDown, ChevronRight,
  Pill, TrendingUp, TrendingDown, Tag, BarChart2, Search
} from 'lucide-react';
import { SupplierModel } from './SupplierModel';
import StatCard from './components/StatCard';
import DataTable from './components/DataTable';
import ConfirmDialog from './components/ConfirmDialog';
import FileUpload from './components/FileUpload';
import { useDB } from '../../db/DBContext';
import { suppliersAPI } from '../../db/api';

// ── Shared input classes ──────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700';
const lbl = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

// ── INNER TAB BAR (underline style for sub-tabs) ──────────────────────────────
function InnerTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-slate-200 mb-4">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-[11px] font-bold transition-all border-b-2 -mb-px cursor-pointer ${
            active === t.id
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── SECTION ACCORDION ─────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-xs font-extrabold text-slate-700 uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
function TabOverview({ supplier, controller }) {
  const { invoices, payments, returns } = controller;

  const financial = useMemo(() => {
    const sInv = invoices.filter(i => i.supplierId === supplier.id);
    const sPay = payments.filter(p => p.supplierId === supplier.id);
    const sRet = returns.filter(r => r.supplierId === supplier.id);
    const totalPurchase = sInv.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPaid = sPay.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalReturns = sRet.reduce((s, r) => s + parseFloat(r.creditAmount || r.returnValue || 0), 0);
    const outstanding = Math.max(0, totalPurchase - totalPaid - totalReturns);
    const creditLimit = parseFloat(supplier.creditLimit || 200000);
    const utilization = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;
    return { totalPurchase, totalPaid, outstanding, creditLimit, utilization, invoiceCount: sInv.length, paymentCount: sPay.length };
  }, [supplier, invoices, payments, returns]);

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">{supplier.code}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${supplier.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                {supplier.status || (supplier.isActive ? 'Active' : 'Inactive')}
              </span>
              {supplier.isPreferred && <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">★ Preferred</span>}
            </div>
            <p className="text-xs text-slate-500">{supplier.supplierType || 'Distributor'}</p>
            {supplier.contactPerson && <p className="text-xs font-semibold text-slate-700 mt-1">{supplier.contactPerson}</p>}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><Phone size={11} className="text-slate-400 shrink-0" /><span className="text-slate-700">{supplier.phone || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><Mail size={11} className="text-slate-400 shrink-0" /><span className="text-slate-600 truncate">{supplier.email || 'N/A'}</span></div>
            {supplier.website && <div className="flex items-center gap-2"><Globe size={11} className="text-slate-400 shrink-0" /><span className="text-slate-600 truncate">{supplier.website}</span></div>}
            <div className="flex items-center gap-2"><MapPin size={11} className="text-slate-400 shrink-0" /><span className="text-slate-600">{[supplier.addressCity, supplier.addressState].filter(Boolean).join(', ') || 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Shield size={12} className="text-blue-500" /> Compliance & Licenses
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><span className="text-[10px] text-slate-400 font-bold block">GSTIN</span><span className="font-mono font-bold text-slate-700">{supplier.gstNumber || '—'}</span></div>
          <div><span className="text-[10px] text-slate-400 font-bold block">PAN</span><span className="font-mono font-bold text-slate-700">{supplier.panNumber || '—'}</span></div>
          <div><span className="text-[10px] text-slate-400 font-bold block">Drug License</span><span className="font-mono font-bold text-slate-700">{supplier.drugLicenseNo || '—'}</span></div>
          <div><span className="text-[10px] text-slate-400 font-bold block">FSSAI</span><span className="font-mono font-bold text-slate-700">{supplier.fssaiNumber || '—'}</span></div>
        </div>
      </div>

      {/* Financial stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Total Purchase" value={`₹${financial.totalPurchase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="blue" subValue={`${financial.invoiceCount} invoices`} />
        <StatCard icon={CreditCard} label="Total Paid" value={`₹${financial.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="emerald" subValue={`${financial.paymentCount} payments`} />
        <StatCard icon={AlertCircle} label="Pending Payment" value={`₹${financial.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="rose" />
        <StatCard icon={Gauge} label="Credit Used" value={`${financial.utilization}%`} color={financial.utilization < 60 ? 'emerald' : financial.utilization < 80 ? 'amber' : 'rose'} subValue={`of ₹${financial.creditLimit.toLocaleString()}`} />
      </div>

      {/* Credit utilization bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1.5"><Gauge size={12} className="text-blue-500" /> Credit Utilization</h4>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${financial.utilization < 60 ? 'bg-emerald-50 text-emerald-700' : financial.utilization < 80 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
            {financial.utilization}% Used
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${financial.utilization < 60 ? 'bg-emerald-500' : financial.utilization < 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${financial.utilization}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div><span className="text-[9px] text-slate-400 font-sans font-bold block">Credit Limit</span>₹{financial.creditLimit.toLocaleString()}</div>
          <div><span className="text-[9px] text-slate-400 font-sans font-bold block">Pending Payment</span>₹{financial.outstanding.toFixed(0)}</div>
          <div><span className="text-[9px] text-slate-400 font-sans font-bold block">Available</span><span className="text-emerald-600">₹{Math.max(0, financial.creditLimit - financial.outstanding).toFixed(0)}</span></div>
        </div>
        {financial.utilization > 80 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold">
            <AlertCircle size={13} /> Credit limit nearing capacity. New procurement may be restricted.
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — MAPPING (Categories | Brand | Medicine)
// ══════════════════════════════════════════════════════════════════════════════
function TabMapping({ supplier, controller, addToast }) {
  const [subTab, setSubTab] = useState('categories');
  const { categories, brandMappings, medicinesList, createCategory, deleteCategory, createBrandMapping, deleteBrandMapping } = controller;
  const supplierId = supplier.id;

  // — Categories section —
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ categoryName: SupplierModel.categoryOptions[0], isPreferred: false });
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);

  const supplierCategories = categories.filter(c => c.supplierId === supplierId);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (supplierCategories.find(c => c.categoryName === catForm.categoryName)) {
      return addToast('Already mapped to this category', 'error');
    }
    try {
      await createCategory({ supplierId, ...catForm });
      addToast('Category mapped', 'success');
      setShowCatForm(false);
      setCatForm({ categoryName: SupplierModel.categoryOptions[0], isPreferred: false });
    } catch { addToast('Failed to map category', 'error'); }
  };

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(confirmDeleteCat.id);
      addToast('Category mapping removed', 'success');
    } catch { addToast('Failed to remove', 'error'); }
    setConfirmDeleteCat(null);
  };

  // — Brand section —
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [brandForm, setBrandForm] = useState({ brandName: '', manufacturer: '' });
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState(null);

  const supplierBrands = brandMappings.filter(b => b.supplierId === supplierId && !b.medicineId);

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.brandName) return addToast('Enter brand name', 'error');
    try {
      await createBrandMapping({ supplierId, ...brandForm });
      addToast('Brand mapped', 'success');
      setShowBrandForm(false);
      setBrandForm({ brandName: '', manufacturer: '' });
    } catch { addToast('Failed to map brand', 'error'); }
  };

  const handleDeleteBrand = async () => {
    try {
      await deleteBrandMapping(confirmDeleteBrand.id);
      addToast('Brand mapping removed', 'success');
    } catch { addToast('Failed to remove', 'error'); }
    setConfirmDeleteBrand(null);
  };

  // — Medicine section —
  const { supplierMappings, refetch } = useDB();
  const [showMedForm, setShowMedForm] = useState(false);
  const [medForm, setMedForm] = useState({ medicineId: '', purchasePrice: '', leadTimeDays: '3', minOrderQty: '1', isDefault: false });
  const [confirmDeleteMed, setConfirmDeleteMed] = useState(null);

  const supplierMeds = supplierMappings.filter(m => m.supplierId === supplierId);

  const handleSaveMed = async (e) => {
    e.preventDefault();
    if (!medForm.medicineId) return addToast('Select a medicine', 'error');
    try {
      await suppliersAPI.createMedicineMapping({
        supplierId,
        medicineId: medForm.medicineId,
        purchasePrice: parseFloat(medForm.purchasePrice) || 0,
        leadTimeDays: parseInt(medForm.leadTimeDays) || 3,
        minOrderQty: parseInt(medForm.minOrderQty) || 1,
        isDefault: !!medForm.isDefault
      });
      addToast('Medicine mapped successfully', 'success');
      setShowMedForm(false);
      setMedForm({ medicineId: '', purchasePrice: '', leadTimeDays: '3', minOrderQty: '1', isDefault: false });
      refetch();
    } catch (err) { addToast(err?.message || 'Failed to map medicine', 'error'); }
  };

  const handleDeleteMed = async () => {
    try {
      await suppliersAPI.deleteMedicineMapping(confirmDeleteMed.id);
      addToast('Mapping removed', 'success');
      refetch();
    } catch { addToast('Failed to remove mapping', 'error'); }
    setConfirmDeleteMed(null);
  };

  return (
    <div>
      <InnerTabs
        tabs={[{ id: 'categories', label: 'Categories' }, { id: 'brands', label: 'Brand Mapping' }, { id: 'medicines', label: 'Medicine Mapping' }]}
        active={subTab} onChange={setSubTab}
      />

      {/* ── Categories ── */}
      {subTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowCatForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
              {showCatForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add Category</>}
            </button>
          </div>
          {showCatForm && (
            <form onSubmit={handleSaveCategory} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className={lbl}>Category *</label>
                <select required value={catForm.categoryName} onChange={e => setCatForm({ ...catForm, categoryName: e.target.value })} className={inp}>
                  {SupplierModel.categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input type="checkbox" id="cat-preferred" checked={catForm.isPreferred} onChange={e => setCatForm({ ...catForm, isPreferred: e.target.checked })} className="rounded border-slate-300" />
                <label htmlFor="cat-preferred" className="text-xs font-semibold text-slate-600 cursor-pointer">Preferred</label>
              </div>
              <button type="submit" className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                <Save size={11} /> Save
              </button>
            </form>
          )}
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="py-2.5 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Flags</th>
                <th className="py-2.5 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {supplierCategories.length === 0
                ? <tr><td colSpan={4} className="py-6 text-center text-slate-400 text-xs italic">No categories mapped yet.</td></tr>
                : supplierCategories.map((c, i) => (
                  <tr key={c.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20 transition`}>
                    <td className="py-2 px-3 font-semibold text-slate-700">{c.categoryName}</td>
                    <td className="py-2 px-3">{c.isPreferred && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-700"><Star size={8} className="fill-amber-500" /> Preferred</span>}</td>
                    <td className="py-2 px-3 text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => setConfirmDeleteCat(c)} className="p-1 hover:bg-rose-50 rounded text-rose-500 transition cursor-pointer"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <ConfirmDialog isOpen={!!confirmDeleteCat} title="Remove Category" message={`Remove ${confirmDeleteCat?.categoryName} mapping?`} onConfirm={handleDeleteCategory} onCancel={() => setConfirmDeleteCat(null)} />
        </div>
      )}

      {/* ── Brand Mapping ── */}
      {subTab === 'brands' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowBrandForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
              {showBrandForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add Brand</>}
            </button>
          </div>
          {showBrandForm && (
            <form onSubmit={handleSaveBrand} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className={lbl}>Brand Name *</label>
                <input required type="text" value={brandForm.brandName} onChange={e => setBrandForm({ ...brandForm, brandName: e.target.value })} placeholder="e.g. Cipla, Sun Pharma" className={inp} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className={lbl}>Manufacturer (Optional)</label>
                <input type="text" value={brandForm.manufacturer} onChange={e => setBrandForm({ ...brandForm, manufacturer: e.target.value })} placeholder="Original manufacturer" className={inp} />
              </div>
              <button type="submit" className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                <Save size={11} /> Save
              </button>
            </form>
          )}
          <DataTable columns={[
            { key: 'brand', header: 'Brand Name', accessor: 'brandName', render: r => <span className="font-semibold text-blue-600">{r.brandName}</span> },
            { key: 'mfg', header: 'Manufacturer', accessor: 'manufacturer', render: r => <span className="text-slate-600">{r.manufacturer || '—'}</span> },
            { key: 'status', header: 'Status', render: r => <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.isActive ? 'Active' : 'Inactive'}</span> },
            { key: 'actions', header: '', sortable: false, render: r => <button onClick={() => setConfirmDeleteBrand(r)} className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"><Trash2 size={12} /></button> }
          ]} data={supplierBrands} searchPlaceholder="Search brands..." pageSize={8} />
          <ConfirmDialog isOpen={!!confirmDeleteBrand} title="Remove Brand" message={`Remove ${confirmDeleteBrand?.brandName}?`} onConfirm={handleDeleteBrand} onCancel={() => setConfirmDeleteBrand(null)} />
        </div>
      )}

      {/* ── Medicine Mapping ── */}
      {subTab === 'medicines' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowMedForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
              {showMedForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Map Medicine</>}
            </button>
          </div>
          {showMedForm && (
            <form onSubmit={handleSaveMed} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Select Medicine *</label>
                  <select required value={medForm.medicineId} onChange={e => setMedForm({ ...medForm, medicineId: e.target.value })} className={inp}>
                    <option value="">Select Medicine</option>
                    {medicinesList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Purchase Price (₹) *</label>
                  <input required type="number" step="0.01" value={medForm.purchasePrice} onChange={e => setMedForm({ ...medForm, purchasePrice: e.target.value })} placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Lead Time (Days)</label>
                  <input type="number" value={medForm.leadTimeDays} onChange={e => setMedForm({ ...medForm, leadTimeDays: e.target.value })} placeholder="3" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div>
                  <label className={lbl}>Minimum Order Quantity (MOQ)</label>
                  <input type="number" value={medForm.minOrderQty} onChange={e => setMedForm({ ...medForm, minOrderQty: e.target.value })} placeholder="1" className={inp} />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="med-default" checked={medForm.isDefault} onChange={e => setMedForm({ ...medForm, isDefault: e.target.checked })} className="rounded accent-blue-600 cursor-pointer h-4 w-4" />
                  <label htmlFor="med-default" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Set as Default Supplier for this Medicine</label>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                  <Save size={11} /> Save Mapping
                </button>
              </div>
            </form>
          )}
          <DataTable columns={[
            { key: 'medicine', header: 'Medicine Name', render: r => <span className="font-semibold text-blue-600">{r.medicine?.medicineName || r.medicine?.name || 'Unknown'}</span> },
            { key: 'price', header: 'Purchase Price', align: 'right', render: r => <span className="font-mono font-bold text-slate-700">₹{parseFloat(r.purchasePrice || 0).toFixed(2)}</span> },
            { key: 'leadTime', header: 'Lead Time', align: 'center', render: r => <span className="font-mono text-slate-600">{r.leadTimeDays || 3} days</span> },
            { key: 'moq', header: 'MOQ', align: 'center', render: r => <span className="font-mono text-slate-600">{r.minOrderQty || 1} units</span> },
            { key: 'default', header: 'Default Supplier', align: 'center', render: r => <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.isDefault ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>{r.isDefault ? 'Yes' : 'No'}</span> },
            { key: 'status', header: 'Status', align: 'center', render: r => <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>{r.status || 'Active'}</span> },
            { key: 'actions', header: '', sortable: false, render: r => <button onClick={() => setConfirmDeleteMed(r)} className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"><Trash2 size={12} /></button> }
          ]} data={supplierMeds} searchPlaceholder="Search mapped medicines..." pageSize={8} />
          <ConfirmDialog isOpen={!!confirmDeleteMed} title="Remove Mapping" message={`Remove mapping for ${confirmDeleteMed?.medicine?.medicineName || confirmDeleteMed?.medicine?.name}?`} onConfirm={handleDeleteMed} onCancel={() => setConfirmDeleteMed(null)} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PURCHASE TERMS & PRICING
// ══════════════════════════════════════════════════════════════════════════════
function TabPurchaseTerms({ supplier, controller, addToast }) {
  const { purchaseTerms, priceHistory, createPurchaseTerm, updatePurchaseTerm, deletePurchaseTerm, medicinesList } = controller;
  const supplierId = supplier.id;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ medicineId: '', purchasePrice: '', gstPercent: '', discount: '', scheme: '', moq: '1', creditDays: '30' });
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  const supplierTerms = purchaseTerms.filter(t => t.supplierId === supplierId);
  const supplierPriceHistory = priceHistory.filter(p => p.supplierId === supplierId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.purchasePrice) return addToast('Enter purchase price', 'error');
    const selectedMed = form.medicineId ? medicinesList.find(m => m.id === form.medicineId) : null;
    const payload = { supplierId, ...form, medicineName: selectedMed ? selectedMed.name : null };
    try {
      if (editingId) {
        await updatePurchaseTerm(editingId, payload);
        addToast('Purchase term updated', 'success');
      } else {
        await createPurchaseTerm(payload);
        addToast('Purchase term created', 'success');
      }
      setShowForm(false); setEditingId(null);
      setForm({ medicineId: '', purchasePrice: '', gstPercent: '', discount: '', scheme: '', moq: '1', creditDays: '30' });
    } catch { addToast('Failed to save term', 'error'); }
  };

  const handleDelete = async () => {
    try { await deletePurchaseTerm(confirmDelete.id); addToast('Term deactivated', 'success'); } catch { addToast('Failed', 'error'); }
    setConfirmDelete(null);
  };

  const ptCols = [
    { key: 'medicine', header: 'Medicine', render: r => <span className="font-semibold text-blue-600">{r.medicineName || 'General'}</span> },
    { key: 'price', header: 'Price', accessor: 'purchasePrice', align: 'right', render: r => <span className="font-mono font-bold text-slate-700">₹{parseFloat(r.purchasePrice).toFixed(2)}</span> },
    { key: 'gst', header: 'GST%', accessor: 'gstPercent', align: 'right', render: r => <span className="font-mono text-slate-600">{r.gstPercent || 0}%</span> },
    { key: 'disc', header: 'Disc%', accessor: 'discount', align: 'right', render: r => <span className="font-mono text-emerald-600">{r.discount || 0}%</span> },
    { key: 'moq', header: 'MOQ', accessor: 'moq', align: 'right', render: r => <span className="font-mono text-slate-600">{r.moq}</span> },
    { key: 'cd', header: 'Credit Days', accessor: 'creditDays', align: 'right', render: r => <span className="font-mono text-slate-600">{r.creditDays}d</span> },
    { key: 'scheme', header: 'Scheme', accessor: 'scheme', render: r => <span className="text-[10px] text-slate-500">{r.scheme || '—'}</span> },
    { key: 'status', header: 'Status', render: r => <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', header: '', sortable: false, render: r => (
      <div className="flex gap-1">
        <button onClick={() => { setForm(r); setEditingId(r.id); setShowForm(true); }} className="p-1 hover:bg-amber-50 rounded text-amber-600 cursor-pointer"><Edit3 size={12} /></button>
        <button onClick={() => setConfirmDelete(r)} className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
      </div>
    )}
  ];

  const phCols = [
    { key: 'date', header: 'Date', render: r => <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span> },
    { key: 'medicine', header: 'Medicine', render: r => <span className="font-semibold text-blue-600">{r.medicineName || 'General'}</span> },
    { key: 'price', header: 'Price', align: 'right', render: r => <span className="font-mono font-bold text-slate-700">₹{parseFloat(r.purchasePrice).toFixed(2)}</span> },
    { key: 'disc', header: 'Disc%', align: 'right', render: r => <span className="font-mono text-emerald-600">{r.discount || 0}%</span> },
    { key: 'scheme', header: 'Scheme', render: r => <span className="text-[10px] text-slate-500">{r.scheme || '—'}</span> },
    { key: 'reason', header: 'Change Reason', render: r => <span className="text-[10px] text-slate-500">{r.changeReason}</span> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm(v => !v); setEditingId(null); setForm({ medicineId: '', purchasePrice: '', gstPercent: '', discount: '', scheme: '', moq: '1', creditDays: '30' }); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
          {showForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> New Term</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">{editingId ? 'Edit Term' : 'New Purchase Term'}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className={lbl}>Medicine (Optional)</label>
              <select value={form.medicineId} onChange={e => setForm({ ...form, medicineId: e.target.value })} className={inp}>
                <option value="">General Term (All Medicines)</option>
                {medicinesList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Purchase Price (₹) *</label><input required type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" className={inp} /></div>
            <div><label className={lbl}>GST %</label><input type="number" step="0.01" value={form.gstPercent} onChange={e => setForm({ ...form, gstPercent: e.target.value })} placeholder="12" className={inp} /></div>
            <div><label className={lbl}>Discount %</label><input type="number" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="10" className={inp} /></div>
            <div><label className={lbl}>MOQ</label><input type="number" value={form.moq} onChange={e => setForm({ ...form, moq: e.target.value })} placeholder="1" className={inp} /></div>
            <div><label className={lbl}>Credit Days</label><input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: e.target.value })} placeholder="30" className={inp} /></div>
            <div><label className={lbl}>Scheme / Offer</label><input type="text" value={form.scheme} onChange={e => setForm({ ...form, scheme: e.target.value })} placeholder="e.g. 10+1 free" className={inp} /></div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
              <Save size={11} /> Save Term
            </button>
          </div>
        </form>
      )}

      <DataTable columns={ptCols} data={supplierTerms} searchPlaceholder="Search terms..." pageSize={8} />

      {/* Price History Accordion */}
      <Accordion title="Price History (Immutable Audit Log)" defaultOpen={false}>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold mb-3">
          <History size={13} /> Records in this table cannot be edited or deleted — it's an audit trail.
        </div>
        <DataTable columns={phCols} data={supplierPriceHistory} searchPlaceholder="Search price history..." pageSize={8} />
      </Accordion>

      <ConfirmDialog isOpen={!!confirmDelete} title="Deactivate Term" message="Deactivate this purchase term?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} confirmLabel="Deactivate" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — FINANCIALS (Payments | Returns | Credit Notes)
// ══════════════════════════════════════════════════════════════════════════════
function TabFinancials({ supplier, controller, addToast }) {
  const [subTab, setSubTab] = useState('payments');
  const supplierId = supplier.id;
  const { payments, returns, creditNotes, invoices, medicinesList,
    createPayment, updatePayment, deletePayment, createReturn, updateReturn, deleteReturn, createCreditNote } = controller;

  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  const supplierPayments = payments.filter(p => p.supplierId === supplierId);
  const [showPayForm, setShowPayForm] = useState(false);
  const [editingPayId, setEditingPayId] = useState(null);
  const [confirmDeletePay, setConfirmDeletePay] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'Bank Transfer', referenceNumber: '', remarks: '' });

  const supplierInvoices = invoices.filter(i => i.supplierId === supplierId);
  const outstanding = useMemo(() => {
    const totalPurchase = supplierInvoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPaid = supplierPayments.filter(p => p.id !== editingPayId).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    return Math.max(0, totalPurchase - totalPaid);
  }, [supplierInvoices, supplierPayments, editingPayId]);

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) return addToast('Enter a valid amount', 'error');
    try {
      if (editingPayId) {
        await updatePayment(editingPayId, { supplierId, ...payForm });
        addToast('Payment updated', 'success');
      } else {
        await createPayment({ supplierId, ...payForm });
        addToast('Payment recorded', 'success');
      }
      setShowPayForm(false); setEditingPayId(null);
      setPayForm({ amount: '', method: 'Bank Transfer', referenceNumber: '', remarks: '' });
    } catch { addToast('Failed to save payment', 'error'); }
  };

  const handleDeletePayment = async () => {
    try { await deletePayment(confirmDeletePay.id); addToast('Payment deleted', 'success'); } catch { addToast('Failed', 'error'); }
    setConfirmDeletePay(null);
  };

  const payCols = [
    { key: 'date', header: 'Date', render: r => <span className="text-[10px] text-slate-500">{new Date(r.date).toLocaleDateString()}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: r => <span className="font-mono font-bold text-emerald-600">₹{parseFloat(r.amount).toFixed(2)}</span> },
    { key: 'method', header: 'Mode', render: r => <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700">{r.method}</span> },
    { key: 'ref', header: 'Reference', render: r => <span className="font-mono text-xs text-slate-600">{r.referenceNumber || '—'}</span> },
    { key: 'remarks', header: 'Remarks', render: r => <span className="text-xs text-slate-500">{r.remarks}</span> },
    { key: 'actions', header: '', sortable: false, render: r => (
      <div className="flex gap-1">
        <button onClick={() => { setPayForm(r); setEditingPayId(r.id); setShowPayForm(true); }} className="p-1 hover:bg-amber-50 rounded text-amber-600 cursor-pointer"><Edit3 size={12} /></button>
        <button onClick={() => setConfirmDeletePay(r)} className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
      </div>
    )}
  ];

  // ── RETURNS ───────────────────────────────────────────────────────────────
  const supplierReturns = returns.filter(r => r.supplierId === supplierId);
  const [showRetForm, setShowRetForm] = useState(false);
  const [retForm, setRetForm] = useState({ grnId: '', reason: 'Near Expiry', remarks: '', items: [] });
  const [itemForm, setItemForm] = useState({ medicineId: '', batchNumber: '', qty: '', unitPrice: '' });
  const [confirmDeleteRet, setConfirmDeleteRet] = useState(null);

  const handleAddItem = () => {
    if (!itemForm.medicineId || !itemForm.qty) return addToast('Select medicine and qty', 'error');
    const m = medicinesList.find(x => x.id === itemForm.medicineId);
    setRetForm(p => ({ ...p, items: [...p.items, { medicineId: m.id, medicineName: m.name, batchNumber: itemForm.batchNumber, qty: parseInt(itemForm.qty), unitPrice: parseFloat(itemForm.unitPrice || 0) }] }));
    setItemForm({ medicineId: '', batchNumber: '', qty: '', unitPrice: '' });
  };

  const handleSaveReturn = async (e) => {
    e.preventDefault();
    if (retForm.items.length === 0) return addToast('Add at least one item', 'error');
    const returnValue = retForm.items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    try {
      await createReturn({ supplierId, supplierName: supplier.name, ...retForm, returnValue, creditAmount: returnValue });
      addToast('Return created', 'success');
      setShowRetForm(false);
      setRetForm({ grnId: '', reason: 'Near Expiry', remarks: '', items: [] });
    } catch { addToast('Failed to create return', 'error'); }
  };

  const handleApproveReturn = async (row) => {
    if (window.confirm('Approve this return? A Credit Note will be auto-generated.')) {
      try { await updateReturn(row.id, { status: 'Approved' }); addToast('Return approved, Credit Note generated', 'success'); }
      catch { addToast('Failed to approve', 'error'); }
    }
  };

  const handleDeleteReturn = async () => {
    try { await deleteReturn(confirmDeleteRet.id); addToast('Return deleted', 'success'); } catch { addToast('Failed', 'error'); }
    setConfirmDeleteRet(null);
  };

  const retCols = [
    { key: 'date', header: 'Date', render: r => <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span> },
    { key: 'num', header: 'Return No', render: r => <span className="font-mono font-bold text-slate-700">{r.returnNumber}</span> },
    { key: 'items', header: 'Items', render: r => <span className="font-mono text-slate-600">{r.items?.length || 0}</span> },
    { key: 'value', header: 'Value', align: 'right', render: r => <span className="font-mono font-bold text-rose-600">₹{parseFloat(r.returnValue || r.creditAmount || 0).toFixed(2)}</span> },
    { key: 'reason', header: 'Reason', render: r => <span className="text-[10px] text-slate-500">{r.reason}</span> },
    { key: 'status', header: 'Status', render: r => {
      const colors = { 'Pending': 'bg-amber-50 text-amber-700', 'Approved': 'bg-emerald-50 text-emerald-700', 'Rejected': 'bg-rose-50 text-rose-700', 'Credit Note Issued': 'bg-blue-50 text-blue-700' };
      return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${colors[r.status] || 'bg-slate-50 text-slate-700'}`}>{r.status}</span>;
    }},
    { key: 'actions', header: '', sortable: false, render: r => (
      <div className="flex gap-1">
        {r.status === 'Pending' && <button onClick={() => handleApproveReturn(r)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-[9px] font-bold cursor-pointer">Approve</button>}
        <button onClick={() => setConfirmDeleteRet(r)} className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
      </div>
    )}
  ];

  // ── CREDIT NOTES ──────────────────────────────────────────────────────────
  const supplierCreditNotes = creditNotes.filter(c => c.supplierId === supplierId);
  const [showCNForm, setShowCNForm] = useState(false);
  const [cnForm, setCnForm] = useState({ amount: '', reason: 'Adjustment', remarks: '' });

  const handleSaveCN = async (e) => {
    e.preventDefault();
    if (!cnForm.amount || parseFloat(cnForm.amount) <= 0) return addToast('Enter a valid amount', 'error');
    try {
      await createCreditNote({ supplierId, ...cnForm });
      addToast('Credit note issued', 'success');
      setShowCNForm(false);
      setCnForm({ amount: '', reason: 'Adjustment', remarks: '' });
    } catch { addToast('Failed to issue credit note', 'error'); }
  };

  const cnCols = [
    { key: 'date', header: 'Date', render: r => <span className="text-[10px] text-slate-500">{new Date(r.issueDate).toLocaleDateString()}</span> },
    { key: 'num', header: 'CN No', render: r => <span className="font-mono font-bold text-slate-700">{r.creditNoteNumber}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: r => <span className="font-mono font-bold text-blue-600">₹{parseFloat(r.amount).toFixed(2)}</span> },
    { key: 'reason', header: 'Reason', render: r => <span className="text-[10px] font-semibold text-slate-600">{r.reason}</span> },
    { key: 'status', header: 'Status', render: r => <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.isUtilized ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.isUtilized ? 'Utilized' : 'Available'}</span> }
  ];

  return (
    <div>
      <InnerTabs
        tabs={[{ id: 'payments', label: 'Payments' }, { id: 'returns', label: 'Returns' }, { id: 'credit-notes', label: 'Credit Notes' }]}
        active={subTab} onChange={setSubTab}
      />

      {/* ── Payments ── */}
      {subTab === 'payments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {outstanding > 0 && !showPayForm && (
              <div className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                Outstanding: <span className="font-mono">₹{outstanding.toFixed(2)}</span>
              </div>
            )}
            <div className="ml-auto">
              <button onClick={() => { setShowPayForm(v => !v); setEditingPayId(null); setPayForm({ amount: '', method: 'Bank Transfer', referenceNumber: '', remarks: '' }); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
                {showPayForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Record Payment</>}
              </button>
            </div>
          </div>
          {showPayForm && (
            <form onSubmit={handleSavePayment} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">{editingPayId ? 'Edit Payment' : 'Record Payment'}</h4>
              {outstanding > 0 && !editingPayId && (
                <div className="text-[10px] font-bold text-rose-600">Outstanding: <span className="font-mono">₹{outstanding.toFixed(2)}</span></div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={lbl}>Amount (₹) *</label>
                  <div className="relative">
                    <input required type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0.00" className={`${inp} pr-10`} />
                    {outstanding > 0 && !editingPayId && (
                      <button type="button" onClick={() => setPayForm(p => ({ ...p, amount: outstanding.toFixed(2) }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">MAX</button>
                    )}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Payment Mode</label>
                  <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })} className={inp}>
                    {SupplierModel.paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Reference No (UTR / Cheque)</label>
                  <input type="text" value={payForm.referenceNumber} onChange={e => setPayForm({ ...payForm, referenceNumber: e.target.value })} placeholder="e.g. UTR123456" className={`${inp} font-mono`} />
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Remarks</label>
                  <input type="text" value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Payment for invoice..." className={inp} />
                </div>
                <div className="md:col-span-2 flex justify-end items-end">
                  <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                    <Save size={11} /> {editingPayId ? 'Update Payment' : 'Record Payment'}
                  </button>
                </div>
              </div>
            </form>
          )}
          <DataTable columns={payCols} data={supplierPayments} searchPlaceholder="Search payments..." pageSize={8} />
          <ConfirmDialog isOpen={!!confirmDeletePay} title="Delete Payment" message={`Delete payment of ₹${confirmDeletePay?.amount}?`} onConfirm={handleDeletePayment} onCancel={() => setConfirmDeletePay(null)} />
        </div>
      )}

      {/* ── Returns ── */}
      {subTab === 'returns' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-2.5 rounded-xl flex items-start gap-2 text-[10px]">
            <ShieldAlert size={13} className="mt-0.5 shrink-0" />
            <span><strong>Automated Workflow:</strong> When a return is <strong>Approved</strong>, a Credit Note is auto-generated and ledger is adjusted.</span>
          </div>
          <div className="flex justify-end">
            <button onClick={() => { setShowRetForm(v => !v); setRetForm({ grnId: '', reason: 'Near Expiry', remarks: '', items: [] }); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
              {showRetForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Create Return</>}
            </button>
          </div>
          {showRetForm && (
            <form onSubmit={handleSaveReturn} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">New Return Request</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Return Reason *</label>
                  <select required value={retForm.reason} onChange={e => setRetForm({ ...retForm, reason: e.target.value })} className={inp}>
                    {SupplierModel.returnReasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Against GRN (Optional)</label>
                  <input type="text" value={retForm.grnId} onChange={e => setRetForm({ ...retForm, grnId: e.target.value })} placeholder="GRN Number" className={`${inp} font-mono`} />
                </div>
                <div>
                  <label className={lbl}>Remarks</label>
                  <input type="text" value={retForm.remarks} onChange={e => setRetForm({ ...retForm, remarks: e.target.value })} placeholder="Optional notes" className={inp} />
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Return Items</h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end bg-white p-3 rounded-xl border border-slate-200 mb-2">
                  <div className="md:col-span-2">
                    <select value={itemForm.medicineId} onChange={e => setItemForm({ ...itemForm, medicineId: e.target.value })} className={inp}>
                      <option value="">Select Medicine</option>
                      {medicinesList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div><input type="text" value={itemForm.batchNumber} onChange={e => setItemForm({ ...itemForm, batchNumber: e.target.value })} placeholder="Batch No" className={`${inp} font-mono`} /></div>
                  <div><input type="number" value={itemForm.qty} onChange={e => setItemForm({ ...itemForm, qty: e.target.value })} placeholder="Qty" className={inp} /></div>
                  <div className="flex gap-2">
                    <input type="number" step="0.01" value={itemForm.unitPrice} onChange={e => setItemForm({ ...itemForm, unitPrice: e.target.value })} placeholder="Price" className={inp} />
                    <button type="button" onClick={handleAddItem} className="px-3 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700 cursor-pointer whitespace-nowrap">Add</button>
                  </div>
                </div>
                {retForm.items.length > 0 && (
                  <table className="w-full text-xs mb-2 border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-slate-600 text-left">Item</th>
                        <th className="py-2 px-3 font-semibold text-slate-600">Batch</th>
                        <th className="py-2 px-3 font-semibold text-slate-600 text-right">Qty</th>
                        <th className="py-2 px-3 font-semibold text-slate-600 text-right">Price</th>
                        <th className="py-2 px-3 font-semibold text-slate-600 text-right">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {retForm.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="py-1.5 px-3 font-bold text-slate-700">{item.medicineName}</td>
                          <td className="py-1.5 px-3 font-mono text-center">{item.batchNumber || '—'}</td>
                          <td className="py-1.5 px-3 text-right">{item.qty}</td>
                          <td className="py-1.5 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">₹{(item.qty * item.unitPrice).toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right"><button type="button" onClick={() => setRetForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))} className="text-rose-500 hover:text-rose-700 cursor-pointer"><X size={13} /></button></td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={4} className="py-2 px-3 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider">Total Return Value</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-rose-600">₹{retForm.items.reduce((s, i) => s + (i.qty * i.unitPrice), 0).toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                  <Save size={11} /> Submit Return
                </button>
              </div>
            </form>
          )}
          <DataTable columns={retCols} data={supplierReturns} searchPlaceholder="Search returns..." pageSize={8} />
          <ConfirmDialog isOpen={!!confirmDeleteRet} title="Delete Return" message="Delete this return? Ledger may need manual adjustment." onConfirm={handleDeleteReturn} onCancel={() => setConfirmDeleteRet(null)} />
        </div>
      )}

      {/* ── Credit Notes ── */}
      {subTab === 'credit-notes' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 p-2.5 rounded-xl flex items-start gap-2 text-[10px]">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span><strong>Automated CN Generation:</strong> Credit notes for approved returns are auto-generated. Use this form for manual adjustments only.</span>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setShowCNForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
              {showCNForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Manual Credit Note</>}
            </button>
          </div>
          {showCNForm && (
            <form onSubmit={handleSaveCN} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-3">Issue Manual Credit Note</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className={lbl}>Amount (₹) *</label>
                  <input required type="number" step="0.01" value={cnForm.amount} onChange={e => setCnForm({ ...cnForm, amount: e.target.value })} placeholder="0.00" className={`${inp} font-mono`} />
                </div>
                <div>
                  <label className={lbl}>Reason</label>
                  <select value={cnForm.reason} onChange={e => setCnForm({ ...cnForm, reason: e.target.value })} className={inp}>
                    {['Adjustment', 'Rate Difference', 'Scheme/Discount', 'Damage Rebate', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Remarks</label>
                  <input type="text" value={cnForm.remarks} onChange={e => setCnForm({ ...cnForm, remarks: e.target.value })} placeholder="Specific details..." className={inp} />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                    <Save size={11} /> Issue Credit Note
                  </button>
                </div>
              </div>
            </form>
          )}
          <DataTable columns={cnCols} data={supplierCreditNotes} searchPlaceholder="Search credit notes..." pageSize={8} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — LEDGER
// ══════════════════════════════════════════════════════════════════════════════
function TabLedger({ supplier, controller }) {
  const { ledger } = controller;
  const supplierId = supplier.id;

  const filteredLedger = useMemo(() => {
    let data = ledger.filter(l => l.supplierId === supplierId);
    data = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    const withBalance = data.map(entry => {
      const isCredit = ['Payment', 'Return', 'CreditNote'].includes(entry.type);
      const amount = parseFloat(entry.amount);
      if (isCredit) runningBalance -= amount;
      else runningBalance += amount;
      return { ...entry, runningBalance };
    });
    return withBalance.reverse();
  }, [ledger, supplierId]);

  const outstanding = filteredLedger.length > 0 ? filteredLedger[0].runningBalance : 0;

  const columns = [
    { key: 'date', header: 'Date', render: r => <span className="text-[10px] text-slate-500">{new Date(r.date).toLocaleDateString()}</span> },
    { key: 'type', header: 'Tx Type', render: r => {
      const isCredit = ['Payment', 'Return', 'CreditNote'].includes(r.type);
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase ${isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        {isCredit ? <ArrowDownRight size={9} /> : <ArrowUpRight size={9} />} {r.type}
      </span>;
    }},
    { key: 'remarks', header: 'Particulars', render: r => <span className="text-xs text-slate-600">{r.remarks}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: r => {
      const isCredit = ['Payment', 'Return', 'CreditNote'].includes(r.type);
      return <span className={`font-mono font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>{isCredit ? '-' : '+'}₹{parseFloat(r.amount).toFixed(2)}</span>;
    }},
    { key: 'balance', header: 'Running Balance', align: 'right', render: r => (
      <span className={`font-mono font-bold ${r.runningBalance > 0 ? 'text-rose-600' : r.runningBalance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
        ₹{Math.abs(r.runningBalance).toFixed(2)} {r.runningBalance > 0 ? 'Cr' : r.runningBalance < 0 ? 'Dr' : ''}
      </span>
    )}
  ];

  return (
    <div className="space-y-4">
      {/* Outstanding badge */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complete Statement of Account</p>
          <p className="text-xs text-slate-500 mt-0.5">Invoices, Payments, Returns, Credit Notes</p>
        </div>
        {filteredLedger.length > 0 && (
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Outstanding</span>
            <span className={`text-xl font-black font-mono ${outstanding > 0 ? 'text-rose-600' : outstanding < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
              ₹{Math.abs(outstanding).toFixed(2)} {outstanding > 0 ? 'Payable' : outstanding < 0 ? 'Credit' : ''}
            </span>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={filteredLedger} searchPlaceholder="Search transactions..." pageSize={15} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 6 — DOCUMENTS & PERFORMANCE
// ══════════════════════════════════════════════════════════════════════════════
function TabDocsPerformance({ supplier, controller, addToast }) {
  const [subTab, setSubTab] = useState('documents');
  const supplierId = supplier.id;
  const { documents, performance, createDocument, deleteDocument, refreshPerformance } = controller;

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  const supplierDocs = documents.filter(d => d.supplierId === supplierId);
  const [showDocForm, setShowDocForm] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [docForm, setDocForm] = useState({ documentType: 'GST Certificate', documentName: '', fileUrl: '' });
  const [file, setFile] = useState(null);

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    if (!file && !docForm.fileUrl) return addToast('Upload a file or provide a URL', 'error');
    const mockFileUrl = file ? `/uploads/${file.name}` : docForm.fileUrl;
    const docName = file ? file.name : docForm.documentName;
    try {
      await createDocument({ supplierId, ...docForm, documentName: docName, fileUrl: mockFileUrl });
      addToast('Document uploaded', 'success');
      setShowDocForm(false);
      setDocForm({ documentType: 'GST Certificate', documentName: '', fileUrl: '' });
      setFile(null);
    } catch { addToast('Failed to upload', 'error'); }
  };

  const handleDeleteDoc = async () => {
    try { await deleteDocument(confirmDeleteDoc.id); addToast('Document deleted', 'success'); } catch { addToast('Failed', 'error'); }
    setConfirmDeleteDoc(null);
  };

  const docCols = [
    { key: 'type', header: 'Type', render: r => <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">{r.documentType}</span> },
    { key: 'name', header: 'File Name', render: r => (
      <div className="flex items-center gap-1.5"><FileText size={12} className="text-blue-500" /><span className="text-xs font-semibold text-slate-700">{r.documentName}</span></div>
    )},
    { key: 'date', header: 'Uploaded', render: r => <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', header: '', sortable: false, render: r => (
      <div className="flex gap-1">
        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-blue-50 rounded text-blue-600 cursor-pointer" title="Download"><Download size={12} /></a>
        <button onClick={() => setConfirmDeleteDoc(r)} className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
      </div>
    )}
  ];

  // ── PERFORMANCE ───────────────────────────────────────────────────────────
  const supplierPerf = performance.find(p => p.supplierId === supplierId) || {};
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshKPI = async () => {
    setRefreshing(true);
    try {
      await refreshPerformance(supplierId);
      addToast('KPI recalculated', 'success');
    } catch { addToast('Failed to refresh KPI', 'error'); }
    setRefreshing(false);
  };

  const score = supplierPerf.overallScore || 0;
  const stars = score >= 90 ? 5 : score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;
  const scoreColor = score >= 85 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : score >= 70 ? 'text-blue-600 bg-blue-50 border-blue-200' : score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <div>
      <InnerTabs
        tabs={[{ id: 'documents', label: 'Documents' }, { id: 'performance', label: 'Performance' }]}
        active={subTab} onChange={setSubTab}
      />

      {/* ── Documents ── */}
      {subTab === 'documents' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => { setShowDocForm(v => !v); setFile(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition cursor-pointer">
              {showDocForm ? <><X size={11} /> Cancel</> : <><UploadCloud size={11} /> Upload Document</>}
            </button>
          </div>
          {showDocForm && (
            <form onSubmit={handleSaveDoc} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">Upload New Document</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Document Type *</label>
                    <select required value={docForm.documentType} onChange={e => setDocForm({ ...docForm, documentType: e.target.value })} className={inp}>
                      {SupplierModel.documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {!file && (
                    <div>
                      <label className={lbl}>Document Name (if using URL)</label>
                      <input type="text" value={docForm.documentName} onChange={e => setDocForm({ ...docForm, documentName: e.target.value })} placeholder="Document Name" className={inp} />
                    </div>
                  )}
                </div>
                <div>
                  <label className={lbl}>File Upload</label>
                  <FileUpload onFileSelect={setFile} accept=".pdf,.jpg,.jpeg,.png" label="Upload License/Certificate" />
                  <div className="mt-3">
                    <label className={lbl}>OR External URL</label>
                    <input type="url" value={docForm.fileUrl} onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })} placeholder="https://..." disabled={!!file} className={`${inp} disabled:opacity-50`} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer">
                  <Plus size={11} /> Save Document
                </button>
              </div>
            </form>
          )}
          <DataTable columns={docCols} data={supplierDocs} searchPlaceholder="Search documents..." pageSize={8} />
          <ConfirmDialog isOpen={!!confirmDeleteDoc} title="Delete Document" message={`Delete ${confirmDeleteDoc?.documentName}? This is permanent.`} onConfirm={handleDeleteDoc} onCancel={() => setConfirmDeleteDoc(null)} />
        </div>
      )}

      {/* ── Performance ── */}
      {subTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={handleRefreshKPI} disabled={refreshing} className={`flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition cursor-pointer ${refreshing ? 'opacity-50' : ''}`}>
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Evaluating...' : 'Recalculate KPI'}
            </button>
          </div>

          {/* Score card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-700">Overall Performance Score</h4>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
                </div>
              </div>
              <span className={`text-3xl font-black font-mono px-4 py-2 rounded-xl border ${scoreColor}`}>{score}<span className="text-base font-bold">/100</span></span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Clock, label: 'Delivery', weight: '30%', score: supplierPerf.deliveryScore || 0, color: 'blue' },
                { icon: ShieldAlert, label: 'Quality', weight: '30%', score: supplierPerf.qualityScore || 0, color: 'emerald' },
                { icon: DollarSign, label: 'Pricing', weight: '20%', score: supplierPerf.pricingScore || 0, color: 'amber' },
                { icon: Award, label: 'Service', weight: '20%', score: supplierPerf.serviceScore || 0, color: 'violet' },
              ].map(({ icon: Icon, label, weight, score: s, color }) => (
                <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon size={12} className={`text-${color}-500`} />
                    <span className="text-[10px] font-bold text-slate-600">{label}</span>
                    <span className="text-[9px] text-slate-400 ml-auto">{weight}</span>
                  </div>
                  <div className="text-xl font-black font-mono text-slate-800">{s}</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${s}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {supplierPerf.updatedAt && (
              <p className="text-[10px] text-slate-400 mt-3">Last evaluated: {new Date(supplierPerf.updatedAt).toLocaleDateString()}</p>
            )}
          </div>

          {/* KPI methodology cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { Icon: Clock, bg: 'bg-blue-50', text: 'text-blue-600', title: 'Delivery Time', desc: 'Based on PO date vs GRN date.' },
              { Icon: ShieldAlert, bg: 'bg-emerald-50', text: 'text-emerald-600', title: 'Quality (Returns)', desc: 'Based on return value vs total purchase.' },
              { Icon: DollarSign, bg: 'bg-amber-50', text: 'text-amber-600', title: 'Pricing', desc: 'Compared against benchmark terms.' },
              { Icon: Award, bg: 'bg-violet-50', text: 'text-violet-600', title: 'Service Level', desc: 'Credit note resolution & manual input.' },
            ].map(({ Icon, bg, text, title, desc }) => (
              <div key={title} className={`${bg} border border-slate-200 rounded-xl p-3 flex items-start gap-2`}>
                <Icon size={13} className={text} />
                <div><h5 className="text-[10px] font-bold text-slate-600">{title}</h5><p className="text-[10px] text-slate-500 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 7 — MEDICINES SUPPLIED (new rich tab)
// ══════════════════════════════════════════════════════════════════════════════
function TabMedicinesSupplied({ supplier, controller }) {
  const { purchaseTerms, medicinesList, brandMappings } = controller;
  const supplierId = supplier.id;
  const [search, setSearch] = useState('');

  // Build a unified medicine list for this supplier:
  // Source 1: purchaseTerms with medicineName
  // Source 2: brandMappings with medicineName & medicineId
  // Source 3: medicines where supplierId matches
  const medicinesFromTerms = useMemo(() => {
    const terms = purchaseTerms.filter(t => t.supplierId === supplierId && t.medicineName);
    return terms.map(t => {
      const masterMed = medicinesList.find(m => m.id === t.medicineId || m.name === t.medicineName);
      return {
        id: t.id,
        medicineName: t.medicineName,
        genericName: masterMed?.generic || masterMed?.genericName || '—',
        strength: masterMed?.name?.match(/\d+(\.\d+)?(mg|mcg|g|ml|IU|U)/i)?.[0] || '—',
        category: masterMed?.category || '—',
        costPrice: parseFloat(t.purchasePrice || 0),
        sellingPrice: parseFloat(masterMed?.price || masterMed?.pricePerPiece || 0),
        gstPercent: parseFloat(t.gstPercent || 0),
        discount: parseFloat(t.discount || 0),
        scheme: t.scheme || '—',
        moq: t.moq || 1,
        creditDays: t.creditDays || 30,
        stock: masterMed?.stock ?? masterMed?.stockQuantity ?? '—',
        isActive: t.isActive,
        source: 'purchase-term',
      };
    });
  }, [purchaseTerms, medicinesList, supplierId]);

  // Also add brand-mapped medicines not already in terms
  const mappedMedIds = new Set(medicinesFromTerms.map(m => m.medicineName));
  const medicinesFromMapping = useMemo(() => {
    return brandMappings
      .filter(b => b.supplierId === supplierId && b.medicineName && !mappedMedIds.has(b.medicineName))
      .map(b => {
        const masterMed = medicinesList.find(m => m.id === b.medicineId || m.name === b.medicineName);
        return {
          id: b.id,
          medicineName: b.medicineName,
          genericName: b.genericName || masterMed?.generic || '—',
          strength: masterMed?.name?.match(/\d+(\.\d+)?(mg|mcg|g|ml|IU|U)/i)?.[0] || '—',
          category: masterMed?.category || '—',
          costPrice: parseFloat(masterMed?.price || masterMed?.pricePerPiece || 0) * 0.62,
          sellingPrice: parseFloat(masterMed?.price || masterMed?.pricePerPiece || 0),
          gstPercent: parseFloat(masterMed?.taxPercentage || masterMed?.gstRate || 0),
          discount: 0,
          scheme: '—',
          moq: 10,
          creditDays: 30,
          stock: masterMed?.stock ?? masterMed?.stockQuantity ?? '—',
          isActive: b.isActive !== false,
          source: 'brand-mapping',
        };
      });
  }, [brandMappings, medicinesList, supplierId, mappedMedIds]);

  // Also include medicines directly linked via supplierId
  const allMedNames = new Set([...medicinesFromTerms, ...medicinesFromMapping].map(m => m.medicineName));
  const medicinesFromMaster = useMemo(() => {
    return medicinesList
      .filter(m => m.supplierId === supplierId && !allMedNames.has(m.name) && !allMedNames.has(m.medicineName))
      .map(m => ({
        id: m.id,
        medicineName: m.name || m.medicineName,
        genericName: m.generic || m.genericName || '—',
        strength: (m.name || m.medicineName || '').match(/\d+(\.\d+)?(mg|mcg|g|ml|IU|U)/i)?.[0] || '—',
        category: m.category || '—',
        costPrice: parseFloat(m.price || m.pricePerPiece || 0) * 0.62,
        sellingPrice: parseFloat(m.price || m.pricePerPiece || 0),
        gstPercent: parseFloat(m.taxPercentage || m.gstRate || 0),
        discount: 0,
        scheme: '—',
        moq: 10,
        creditDays: 30,
        stock: m.stock ?? m.stockQuantity ?? '—',
        isActive: m.isActive !== false,
        source: 'master',
      }));
  }, [medicinesList, supplierId, allMedNames]);

  const allMeds = [...medicinesFromTerms, ...medicinesFromMapping, ...medicinesFromMaster];

  const filtered = useMemo(() => {
    if (!search.trim()) return allMeds;
    const q = search.toLowerCase();
    return allMeds.filter(m =>
      m.medicineName?.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.strength?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
  }, [allMeds, search]);

  // Stats
  const avgMargin = allMeds.length > 0
    ? allMeds.reduce((s, m) => {
        const margin = m.sellingPrice > 0 ? ((m.sellingPrice - m.costPrice) / m.sellingPrice * 100) : 0;
        return s + margin;
      }, 0) / allMeds.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-blue-700">{allMeds.length}</div>
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Total Medicines</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-emerald-700">{allMeds.filter(m => m.isActive).length}</div>
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Active</div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-violet-700">{new Set(allMeds.map(m => m.category)).size}</div>
          <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mt-0.5">Categories</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-amber-700">{avgMargin.toFixed(1)}%</div>
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">Avg Margin</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search medicines by name, generic, strength, category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
        />
      </div>

      {/* Medicines Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Pill size={32} className="mb-3 text-slate-300" />
          <p className="text-sm font-semibold">No medicines found for this supplier</p>
          <p className="text-xs mt-1">Map medicines in the Mapping tab or add Purchase Terms</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <tr>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider">#</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider">Medicine Name</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider">Generic</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider">Strength</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider">Category</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider text-right">Cost Price</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider text-right">Selling Price</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider text-right">Margin</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider text-center">GST%</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider text-center">Stock</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider">Scheme</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((med, i) => {
                  const margin = med.sellingPrice > 0
                    ? ((med.sellingPrice - med.costPrice) / med.sellingPrice * 100)
                    : 0;
                  const isGoodMargin = margin >= 20;
                  return (
                    <tr
                      key={med.id}
                      className={`border-b border-slate-100 transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      } hover:bg-blue-50/30`}
                    >
                      <td className="py-2.5 px-3 text-[10px] text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <Pill size={9} className="text-white" />
                          </div>
                          <span className="font-bold text-slate-800">{med.medicineName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic text-[10px]">{med.genericName}</td>
                      <td className="py-2.5 px-3">
                        {med.strength !== '—' ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-200">
                            {med.strength}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">{med.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono font-bold text-rose-600">₹{med.costPrice.toFixed(2)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono font-black text-emerald-600 text-sm">₹{med.sellingPrice.toFixed(2)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-flex items-center gap-0.5 font-mono font-bold text-[10px] ${
                          isGoodMargin ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {isGoodMargin
                            ? <TrendingUp size={10} />
                            : <TrendingDown size={10} />}
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono text-slate-600 text-[10px]">{med.gstPercent}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-mono font-bold text-[10px] ${
                          med.stock === 0 ? 'text-rose-600' :
                          typeof med.stock === 'number' && med.stock < 50 ? 'text-amber-600' :
                          'text-slate-700'
                        }`}>{med.stock}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {med.scheme !== '—' ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200">{med.scheme}</span>
                        ) : <span className="text-slate-300 text-[10px]">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          med.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>{med.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold">
              Showing {filtered.length} of {allMeds.length} medicines
            </span>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-emerald-400 rounded-full"></span> Good Margin ≥20%</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-amber-400 rounded-full"></span> Low Margin &lt;20%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 8 — PURCHASE HISTORY (Invoices / GRNs & Purchase Orders)
// ══════════════════════════════════════════════════════════════════════════════
function TabPurchaseHistory({ supplier, controller }) {
  const [viewMode, setViewMode] = useState('invoices'); // 'invoices' or 'pos'
  const { invoices, purchaseOrders } = controller;

  const supplierInvoices = useMemo(() => {
    return invoices.filter(i => i.supplierId === supplier.id);
  }, [invoices, supplier]);

  const supplierPOs = useMemo(() => {
    return purchaseOrders.filter(p => p.supplierId === supplier.id);
  }, [purchaseOrders, supplier]);

  const invColumns = [
    { key: 'date', header: 'Date', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.date || row.createdAt).toLocaleDateString()}</span> },
    { key: 'invNum', header: 'Invoice No / GRN', render: (row) => <span className="font-mono font-bold text-slate-700">{row.invoiceNumber || `GRN-${row.id.toString().slice(-6).toUpperCase()}`}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (row) => <span className="font-mono font-bold text-slate-700">₹{parseFloat(row.amount || 0).toFixed(2)}</span> },
    { key: 'status', header: 'Status', render: (row) => {
      const colors = {
        'Paid': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'Unpaid': 'bg-rose-50 text-rose-700 border border-rose-200',
        'Partially Paid': 'bg-amber-50 text-amber-700 border border-amber-200'
      };
      const color = colors[row.status] || 'bg-slate-50 text-slate-700';
      return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color}`}>{row.status || 'Unpaid'}</span>;
    }}
  ];

  const poColumns = [
    { key: 'date', header: 'Order Date', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.orderDate || row.createdAt).toLocaleDateString()}</span> },
    { key: 'poNum', header: 'PO Number', render: (row) => <span className="font-mono font-bold text-slate-700">{row.poNumber || `PO-${row.id.toString().slice(-6).toUpperCase()}`}</span> },
    { key: 'total', header: 'Total Value', align: 'right', render: (row) => <span className="font-mono font-bold text-slate-700">₹{parseFloat(row.total || 0).toFixed(2)}</span> },
    { key: 'status', header: 'Status', render: (row) => {
      const colors = {
        'Completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
        'Draft': 'bg-slate-100 text-slate-500 border border-slate-200',
        'Cancelled': 'bg-rose-50 text-rose-700 border border-rose-200'
      };
      const color = colors[row.status] || 'bg-slate-50 text-slate-700';
      return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color}`}>{row.status || 'Draft'}</span>;
    }}
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('invoices')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'invoices' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Invoices (GRN)</button>
          <button onClick={() => setViewMode('pos')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'pos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Purchase Orders</button>
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          {viewMode === 'invoices' ? `${supplierInvoices.length} Invoices` : `${supplierPOs.length} POs`}
        </span>
      </div>

      {viewMode === 'invoices' ? (
        <DataTable columns={invColumns} data={supplierInvoices} searchPlaceholder="Search invoices..." pageSize={8} />
      ) : (
        <DataTable columns={poColumns} data={supplierPOs} searchPlaceholder="Search POs..." pageSize={8} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SUPPLIER MODAL COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'medicines-supplied', label: '💊 Medicines Supplied' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'purchase-terms', label: 'Purchase Terms' },
  { id: 'purchase-history', label: '🛒 Purchase History' },
  { id: 'financials', label: 'Financials' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'docs-performance', label: 'Docs & Performance' },
];

export default function SupplierModal({ supplier, controller, onClose, addToast }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!supplier) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <TabOverview supplier={supplier} controller={controller} />;
      case 'medicines-supplied': return <TabMedicinesSupplied supplier={supplier} controller={controller} />;
      case 'mapping': return <TabMapping supplier={supplier} controller={controller} addToast={addToast} />;
      case 'purchase-terms': return <TabPurchaseTerms supplier={supplier} controller={controller} addToast={addToast} />;
      case 'purchase-history': return <TabPurchaseHistory supplier={supplier} controller={controller} />;
      case 'financials': return <TabFinancials supplier={supplier} controller={controller} addToast={addToast} />;
      case 'ledger': return <TabLedger supplier={supplier} controller={controller} />;
      case 'docs-performance': return <TabDocsPerformance supplier={supplier} controller={controller} addToast={addToast} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow shadow-blue-500/30">
              <span className="text-white text-[10px] font-black">S</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">{supplier.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">{supplier.code}</span>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${supplier.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {supplier.status || (supplier.isActive ? 'Active' : 'Inactive')}
                </span>
                {supplier.isPreferred && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">★ Preferred</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-slate-200 shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
