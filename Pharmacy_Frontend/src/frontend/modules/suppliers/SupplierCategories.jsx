import React, { useState } from 'react';
import { Layers, Plus, Save, X, Trash2, Star } from 'lucide-react';
import { SupplierModel } from './SupplierModel';
import ConfirmDialog from './components/ConfirmDialog';

export default function SupplierCategories({ controller, addToast }) {
  const { suppliers, categories, createCategory, deleteCategory } = controller;
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ categoryName: SupplierModel.categoryOptions[0], isPreferred: false, isDefaultSupplier: false });

  const filteredCategories = selectedSupplier ? categories.filter(c => c.supplierId === selectedSupplier) : categories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return addToast('Please select a supplier', 'error');
    if (!form.categoryName) return addToast('Please select a category', 'error');

    // Check duplicate
    if (categories.find(c => c.supplierId === selectedSupplier && c.categoryName === form.categoryName)) {
      return addToast('Supplier already mapped to this category', 'error');
    }

    try {
      await createCategory({ supplierId: selectedSupplier, ...form });
      addToast('Category mapped successfully', 'success');
      setShowForm(false);
      setForm({ categoryName: SupplierModel.categoryOptions[0], isPreferred: false, isDefaultSupplier: false });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to map category', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(confirmDelete.id);
      addToast('Category mapping removed', 'success');
    } catch (err) {
      addToast('Failed to remove category', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Layers size={16} className="text-blue-600" />
            </div>
            Supplier Categories
          </h2>
          <p className="text-xs text-slate-400 mt-1">Map suppliers to product categories (e.g., Tablets, Syrups, Surgical)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Map Category</>}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Supplier</label>
        <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full md:w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">New Category Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {!selectedSupplier && (
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
                <select required onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs">
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
              <select required value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs">
                {SupplierModel.categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-1 flex items-center gap-4 pb-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={form.isPreferred} onChange={(e) => setForm({ ...form, isPreferred: e.target.checked })} className="rounded border-slate-300" />
                Preferred Category
              </label>
            </div>
            <div className="md:col-span-1">
              <button type="submit" className="w-full flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
                <Save size={14} /> Save Mapping
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Supplier</th>
              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category</th>
              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Flags</th>
              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mapped Date</th>
              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No categories mapped.</td></tr>
            ) : (
              filteredCategories.map((c, i) => (
                <tr key={c.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/30 transition`}>
                  <td className="py-2.5 px-4 font-bold text-slate-700">{c.supplier?.name || 'N/A'} <span className="text-[9px] text-slate-400 font-normal">({c.supplier?.code})</span></td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{c.categoryName}</td>
                  <td className="py-2.5 px-4">
                    {c.isPreferred && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200"><Star size={10} className="fill-amber-500" /> Preferred</span>}
                  </td>
                  <td className="py-2.5 px-4 text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button onClick={() => setConfirmDelete(c)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Remove Mapping">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog isOpen={!!confirmDelete} title="Remove Category Mapping" message={`Remove ${confirmDelete?.categoryName} from ${confirmDelete?.supplier?.name}?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
