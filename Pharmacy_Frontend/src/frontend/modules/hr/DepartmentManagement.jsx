import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function DepartmentManagement({ role, setSchemaModalTable }) {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const res = activeTab === 'departments' ? await hrAPI.getDepartments() : await hrAPI.getDesignations();
      if (res.success) setData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        activeTab === 'departments' ? await hrAPI.updateDepartment(editingId, formData) : await hrAPI.updateDesignation(editingId, formData);
      } else {
        activeTab === 'departments' ? await hrAPI.createDepartment(formData) : await hrAPI.createDesignation(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ code: '', name: '', description: '' });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    try {
      activeTab === 'departments' ? await hrAPI.deleteDepartment(id) : await hrAPI.deleteDesignation(id);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Departments & Designations</h2>
            <p className="text-xs font-bold text-slate-400">Manage organizational structure and job titles</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ code: '', name: '', description: '' }); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Add {activeTab === 'departments' ? 'Department' : 'Designation'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {['departments', 'designations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === tab ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">Total: {filteredData.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium">No records found.</td></tr>
              ) : filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3 font-mono font-bold text-slate-600">{item.code}</td>
                  <td className="px-6 py-3 font-bold text-slate-800">{item.name}</td>
                  <td className="px-6 py-3 text-slate-500">{item.description || '-'}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setEditingId(item.id); setFormData({ code: item.code, name: item.name, description: item.description || '' }); setIsModalOpen(true); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase">{editingId ? 'Edit' : 'Add'} {activeTab === 'departments' ? 'Department' : 'Designation'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Code *</label>
                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"></textarea>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-md">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
