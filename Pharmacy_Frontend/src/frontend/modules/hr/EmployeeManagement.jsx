import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function EmployeeManagement({ role, setSchemaModalTable }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    empCode: '', firstName: '', lastName: '', gender: 'Male', dob: '',
    mobile: '', email: '', address: '', joiningDate: '', basicSalary: '',
    employmentType: 'Permanent', status: 'Active', departmentId: '', designationId: ''
  });

  const [viewProfileId, setViewProfileId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        hrAPI.getEmployees(),
        hrAPI.getDepartments(),
        hrAPI.getDesignations()
      ]);
      if (empRes.success) setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (desigRes.success) setDesignations(desigRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        dob: formData.dob ? new Date(formData.dob).toISOString() : null,
        joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : new Date().toISOString()
      };
      
      if (!payload.departmentId) delete payload.departmentId;
      if (!payload.designationId) delete payload.designationId;
      
      if (editingId) {
        await hrAPI.updateEmployee(editingId, payload);
      } else {
        await hrAPI.createEmployee(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await hrAPI.deleteEmployee(id);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const openEdit = (emp) => {
    setFormData({
      empCode: emp.empCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      gender: emp.gender || 'Male',
      dob: emp.dob ? emp.dob.split('T')[0] : '',
      mobile: emp.mobile,
      email: emp.email,
      address: emp.address || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      basicSalary: emp.basicSalary || '',
      employmentType: emp.employmentType,
      status: emp.status,
      departmentId: emp.departmentId || '',
      designationId: emp.designationId || ''
    });
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const filteredData = employees.filter(emp => {
    const matchesSearch = (emp.firstName + ' ' + emp.lastName + ' ' + emp.empCode).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept ? emp.departmentId === filterDept : true;
    const matchesStatus = filterStatus ? emp.status === filterStatus : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  if (viewProfileId) {
    const emp = employees.find(e => e.id === viewProfileId);
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => setViewProfileId(null)} className="text-blue-600 text-xs font-bold hover:underline mb-4">← Back to Employees</button>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-8">
          <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-4xl font-black text-slate-400 shrink-0">
            {emp.firstName[0]}{emp.lastName[0]}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800">{emp.firstName} {emp.lastName}</h2>
              <span className="text-sm font-bold text-slate-500">{emp.designation?.name || 'No Designation'} • {emp.department?.name || 'No Department'}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Employee Code</p><p className="text-sm font-bold text-slate-700">{emp.empCode}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Email</p><p className="text-sm font-bold text-slate-700">{emp.email}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Mobile</p><p className="text-sm font-bold text-slate-700">{emp.mobile}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Status</p><p className="text-sm font-bold text-emerald-600">{emp.status}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Joining Date</p><p className="text-sm font-bold text-slate-700">{new Date(emp.joiningDate).toLocaleDateString()}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Emp. Type</p><p className="text-sm font-bold text-slate-700">{emp.employmentType}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400">Basic Salary</p><p className="text-sm font-bold text-slate-700">₹{parseFloat(emp.basicSalary).toLocaleString()}</p></div>
            </div>
          </div>
        </div>
        {/* Document section can be appended here later */}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Employee Directory</h2>
            <p className="text-xs font-bold text-slate-400">Manage all staff members and their profiles</p>
          </div>
        </div>
        <button 
          onClick={() => { 
            setEditingId(null); 
            setFormData({
              empCode: '', firstName: '', lastName: '', gender: 'Male', dob: '',
              mobile: '', email: '', address: '', joiningDate: '', basicSalary: '',
              employmentType: 'Permanent', status: 'Active', departmentId: '', designationId: ''
            }); 
            setIsModalOpen(true); 
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 w-64"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter size={12} className="text-slate-400" />
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="text-xs text-slate-600 focus:outline-none bg-transparent">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter size={12} className="text-slate-400" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs text-slate-600 focus:outline-none bg-transparent">
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Emp Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3 font-mono font-bold text-slate-600">{emp.empCode}</td>
                  <td className="px-6 py-3 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black">{emp.firstName[0]}</div>
                      {emp.firstName} {emp.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{emp.department?.name || '-'}</td>
                  <td className="px-6 py-3 text-slate-500">{emp.designation?.name || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setViewProfileId(emp.id)} className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg"><Eye size={14} /></button>
                      <button onClick={() => openEdit(emp)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 z-10">
              <h3 className="text-sm font-black text-slate-800 uppercase">
                {editingId 
                  ? `Edit Employee - ${formData.firstName} ${formData.lastName}` 
                  : (formData.firstName || formData.lastName) 
                      ? `New Employee - ${formData.firstName} ${formData.lastName}`
                      : 'New Employee'}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emp Code *</label><input required type="text" value={formData.empCode} onChange={e => setFormData({...formData, empCode: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email *</label><input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">First Name *</label><input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Last Name *</label><input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile *</label><input required type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"><option>Male</option><option>Female</option><option>Other</option></select></div>
              
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth</label><input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Joining Date *</label><input required type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Designation</label>
                <select value={formData.designationId} onChange={e => setFormData({...formData, designationId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select...</option>
                  {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employment Type</label><select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"><option>Permanent</option><option>Contract</option><option>Part-Time</option><option>Temporary</option></select></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Basic Salary</label><input type="number" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"><option>Active</option><option>Inactive</option><option>Resigned</option><option>Terminated</option></select></div>
              <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address</label><textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="2" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">Save Employee</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
