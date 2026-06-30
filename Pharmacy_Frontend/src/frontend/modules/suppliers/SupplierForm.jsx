import React, { useState } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { SupplierModel } from './SupplierModel';

export default function SupplierForm({ supplier, onSave, onCancel, suppliers, addToast }) {
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

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = SupplierModel.validate({ ...form, contact: form.contactPerson });
    if (!validation.isValid) {
      setErrors(validation.errors);
      addToast(validation.errors[0], 'error');
      return;
    }
    onSave({
      ...form,
      creditLimit: parseFloat(form.creditLimit) || 200000,
      creditPeriod: parseInt(form.creditPeriod) || 30,
      openingBalance: parseFloat(form.openingBalance) || 0
    });
  };

  const Field = ({ label, field, type = 'text', required, placeholder, options, wide }) => (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label} {required && <span className="text-rose-500">*</span>}</label>
      {options ? (
        <select value={form[field]} onChange={(e) => handleChange(field, e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[field]} onChange={(e) => handleChange(field, e.target.value)} placeholder={placeholder} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 resize-none" />
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form[field]} onChange={(e) => handleChange(field, e.target.checked)} className="rounded border-slate-300" />
          <span className="text-xs text-slate-600">{placeholder}</span>
        </label>
      ) : (
        <input type={type} value={form[field]} onChange={(e) => handleChange(field, e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
      )}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer">
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
            <p className="text-xs text-slate-400">{supplier ? `Editing ${supplier.name}` : 'Fill in the supplier details below'}</p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
          {errors.map((err, i) => <p key={i} className="text-xs text-rose-700 font-semibold">• {err}</p>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Supplier Name" field="name" required placeholder="Enter company name" />
            <Field label="Supplier Type" field="supplierType" options={SupplierModel.supplierTypes} />
            <Field label="Status" field="status" options={SupplierModel.statusOptions} />
            <Field label="Contact Person" field="contactPerson" required placeholder="Primary contact name" />
            <Field label="Phone" field="phone" placeholder="10-digit mobile" />
            <Field label="Alternate Phone" field="alternatePhone" placeholder="Secondary number" />
            <Field label="Email" field="email" type="email" placeholder="email@supplier.com" />
            <Field label="Website" field="website" placeholder="www.supplier.com" />
            <Field label="Preferred Supplier" field="isPreferred" type="checkbox" placeholder="Mark as preferred supplier" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Address Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Street Address" field="addressStreet" placeholder="Street, Building" wide />
            <Field label="City" field="addressCity" placeholder="City" />
            <Field label="State" field="addressState" placeholder="State" />
            <Field label="Country" field="addressCountry" placeholder="Country" />
            <Field label="Pincode" field="addressPincode" placeholder="PIN Code" />
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Compliance & Licenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="GST Number" field="gstNumber" placeholder="29AAFCS9829K1Z4" />
            <Field label="PAN Number" field="panNumber" placeholder="ABCDE1234F" />
            <Field label="Drug License No" field="drugLicenseNo" placeholder="DL-XXX-XXXX" />
            <Field label="FSSAI Number" field="fssaiNumber" placeholder="FSSAI Number" />
          </div>
        </div>

        {/* Financial */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Financial Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Credit Limit (₹)" field="creditLimit" type="number" placeholder="200000" />
            <Field label="Credit Period (Days)" field="creditPeriod" type="number" placeholder="30" />
            <Field label="Payment Mode" field="paymentMode" options={SupplierModel.paymentModes} />
            <Field label="Opening Balance (₹)" field="openingBalance" type="number" placeholder="0" />
            <Field label="Remarks" field="remarks" type="textarea" placeholder="Additional notes..." wide />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer">
            <X size={14} /> Cancel
          </button>
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer">
            <Save size={14} /> {supplier ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
}
