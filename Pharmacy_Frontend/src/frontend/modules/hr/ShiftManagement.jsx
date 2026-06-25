import React, { useState, useEffect } from 'react';
import { Thermometer, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function ShiftManagement({ role, setSchemaModalTable }) {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', startTime: '', endTime: '' });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignData, setAssignData] = useState({ employeeId: '', shiftId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        hrAPI.getShifts(),
        hrAPI.getEmployees()
      ]);
      if (sRes.success) setShifts(sRes.data);
      if (eRes.success) setEmployees(eRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await hrAPI.updateShift(editingId, formData);
      } else {
        await hrAPI.createShift(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', startTime: '', endTime: '' });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    try {
      await hrAPI.deleteShift(id);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await hrAPI.assignShift(assignData);
      setAssignModalOpen(false);
      alert('Shift assigned successfully!');
      fetchData(); // employees with updated shifts
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
            <Thermometer size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Shift Management</h2>
            <p className="text-xs font-bold text-slate-400">Manage working schedules and shift assignments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setAssignData({ employeeId: '', shiftId: '' }); setAssignModalOpen(true); }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Users size={16} /> Assign Shift
          </button>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', startTime: '', endTime: '' }); setIsModalOpen(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Create Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-700 uppercase">Master Shifts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Shift Name</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map(shift => (
                <tr key={shift.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{shift.name}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{shift.startTime}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{shift.endTime}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setEditingId(shift.id); setFormData({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime }); setIsModalOpen(true); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(shift.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase">{editingId ? 'Edit Shift' : 'New Shift'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift Name *</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" placeholder="Morning Shift"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Time (HH:mm) *</label><input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Time (HH:mm) *</label><input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md">Save Shift</button>
            </div>
          </form>
        </div>
      )}

      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAssign} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase">Assign Shift to Employee</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee *</label>
                <select required value={assignData.employeeId} onChange={e => setAssignData({...assignData, employeeId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select Employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift *</label>
                <select required value={assignData.shiftId} onChange={e => setAssignData({...assignData, shiftId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select Shift...</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>)}
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-md">Assign</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
