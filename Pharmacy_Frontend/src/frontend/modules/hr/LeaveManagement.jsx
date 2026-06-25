import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, CheckCircle, XCircle } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function LeaveManagement({ role, setSchemaModalTable }) {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lRes, eRes] = await Promise.all([
        hrAPI.getLeaves(),
        hrAPI.getEmployees()
      ]);
      if (lRes.success) setLeaves(lRes.data);
      if (eRes.success) setEmployees(eRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await hrAPI.applyLeave({
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await hrAPI.updateLeaveStatus(id, { status });
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <CalendarClock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Leave Requests</h2>
            <p className="text-xs font-bold text-slate-400">Manage employee time-off and approvals</p>
          </div>
        </div>
        <button 
          onClick={() => { setFormData({ employeeId: '', leaveType: 'Sick', startDate: '', endDate: '', reason: '' }); setIsModalOpen(true); }}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No leave requests found.</td></tr>
              ) : leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{leave.employee?.firstName} {leave.employee?.lastName}</td>
                  <td className="px-6 py-4 font-bold text-slate-600">{leave.leaveType}</td>
                  <td className="px-6 py-4 font-bold text-slate-600">
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${
                      leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {leave.status === 'Pending' ? (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => updateStatus(leave.id, 'Approved')} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer" title="Approve">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => updateStatus(leave.id, 'Rejected')} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-[10px] text-slate-400 font-bold uppercase">Processed</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleApply} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase">Apply for Leave</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee *</label>
                <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select Employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Leave Type</label>
                <select value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option>Sick</option><option>Casual</option><option>Earned</option><option>Maternity</option><option>Paternity</option><option>Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date *</label><input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date *</label><input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason *</label>
                <textarea required rows="3" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"></textarea>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
