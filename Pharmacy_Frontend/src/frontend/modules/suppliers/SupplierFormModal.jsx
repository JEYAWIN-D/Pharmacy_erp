import React, { useState } from 'react';
import { X, Save, ArrowLeft } from 'lucide-react';
import { SupplierModel } from './SupplierModel';

// ── Shared input classes ──────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700';
const lbl = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

function Field({ label, field, type = 'text', required, placeholder, options, wide, form, onChange }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className={lbl}>{label} {required && <span className="text-rose-500">*</span>}</label>
      {options ? (
        <select value={form[field]} onChange={e => onChange(field, e.target.value)} className={inp}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[field]} onChange={e => onChange(field, e.target.value)} placeholder={placeholder} rows={3}
          className={`${inp} resize-none`} />
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input type="checkbox" checked={form[field]} onChange={e => onChange(field, e.target.checked)} className="rounded border-slate-300" />
          <span className="text-xs text-slate-600">{placeholder}</span>
        </label>
      ) : (
        <input type={type} value={form[field]} onChange={e => onChange(field, e.target.value)} placeholder={placeholder}
          className={inp} />
      )}
    </div>
  );
}

export default function SupplierFormModal({ supplier, onSave, onClose, addToast }) {
  const isEdit = !!supplier;

  const [form, setForm] = useState(supplier ? {
    name: supplier.name || '', supplierType: supplier.supplierType || 'Distributor',
    contactPerson: supplier.contactPerson || '', phone: supplier.phone || '',
    alternatePhone: supplier.alternatePhone || supplier.secondaryPhone || '',
    email: supplier.email || '', website: supplier.website || '',
    addressStreet: supplier.addressStreet || '', addressCity: supplier.addressCity || '',
    addressState: supplier.addressState || '', addressCountry: supplier.addressCountry || 'India',
    addressPincode: supplier.addressPincode || '', gstNumber: supplier.gstNumber || '',
    panNumber: supplier.panNumber || '', drugLicenseNo: supplier.drugLicenseNo || '',
    fssaiNumber: supplier.fssaiNumber || '',
    creditLimit: String(supplier.creditLimit || '200000'), creditPeriod: String(supplier.creditPeriod || '30'),
    paymentMode: supplier.paymentMode || 'Bank Transfer', openingBalance: String(supplier.openingBalance || '0'),
    remarks: supplier.remarks || '', status: supplier.status || 'Active',
    isPreferred: supplier.isPreferred || false
  } : SupplierModel.getEmptyForm());

  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = SupplierModel.validate({ ...form, contact: form.contactPerson });
    if (!validation.isValid) {
      setErrors(validation.errors);
      addToast(validation.errors[0], 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        creditLimit: parseFloat(form.creditLimit) || 200000,
        creditPeriod: parseInt(form.creditPeriod) || 30,
        openingBalance: parseFloat(form.openingBalance) || 0
      });
    } catch {
      // error handled by parent
    }
    setSaving(false);
  };

  const fieldProps = { form, onChange: handleChange };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow shadow-blue-500/30">
              <Save size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">{isEdit ? `Edit Supplier — ${supplier.name}` : 'Add New Supplier'}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{isEdit ? `Editing ${supplier.code}` : 'Fill in the supplier details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
                {errors.map((err, i) => <p key={i} className="text-xs text-rose-700 font-semibold">• {err}</p>)}
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Supplier Name" field="name" required placeholder="Enter company name" {...fieldProps} />
                <Field label="Supplier Type" field="supplierType" options={SupplierModel.supplierTypes} {...fieldProps} />
                <Field label="Status" field="status" options={SupplierModel.statusOptions} {...fieldProps} />
                <Field label="Contact Person" field="contactPerson" required placeholder="Primary contact name" {...fieldProps} />
                <Field label="Phone" field="phone" placeholder="10-digit mobile" {...fieldProps} />
                <Field label="Alternate Phone" field="alternatePhone" placeholder="Secondary number" {...fieldProps} />
                <Field label="Email" field="email" type="email" placeholder="email@supplier.com" {...fieldProps} />
                <Field label="Website" field="website" placeholder="www.supplier.com" {...fieldProps} />
                <Field label="Preferred Supplier" field="isPreferred" type="checkbox" placeholder="Mark as preferred supplier" {...fieldProps} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Street Address" field="addressStreet" placeholder="Street, Building" wide {...fieldProps} />
                <Field label="City" field="addressCity" placeholder="City" {...fieldProps} />
                <Field label="State" field="addressState" placeholder="State" {...fieldProps} />
                <Field label="Country" field="addressCountry" placeholder="Country" {...fieldProps} />
                <Field label="Pincode" field="addressPincode" placeholder="PIN Code" {...fieldProps} />
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Compliance & Licenses</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="GST Number" field="gstNumber" placeholder="29AAFCS9829K1Z4" {...fieldProps} />
                <Field label="PAN Number" field="panNumber" placeholder="ABCDE1234F" {...fieldProps} />
                <Field label="Drug License No" field="drugLicenseNo" placeholder="DL-XXX-XXXX" {...fieldProps} />
                <Field label="FSSAI Number" field="fssaiNumber" placeholder="FSSAI Number" {...fieldProps} />
              </div>
            </div>

            {/* Financial */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Financial Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Credit Limit (₹)" field="creditLimit" type="number" placeholder="200000" {...fieldProps} />
                <Field label="Credit Period (Days)" field="creditPeriod" type="number" placeholder="30" {...fieldProps} />
                <Field label="Payment Mode" field="paymentMode" options={SupplierModel.paymentModes} {...fieldProps} />
                <Field label="Opening Balance (₹)" field="openingBalance" type="number" placeholder="0" {...fieldProps} />
                <Field label="Remarks" field="remarks" type="textarea" placeholder="Additional notes..." wide {...fieldProps} />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl shrink-0">
            <button type="button" onClick={onClose} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer">
              <X size={14} /> Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer">
              <Save size={14} /> {saving ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
