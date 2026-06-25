import React, { useState, useEffect } from 'react';
import { UserCheck, LogIn, LogOut, Search, Clock, AlertCircle } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function AttendanceManagement({ role, setSchemaModalTable }) {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, empRes] = await Promise.all([
        hrAPI.getAttendance(),
        hrAPI.getEmployees()
      ]);
      if (attRes.success) setAttendances(attRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmp) return alert('Select an employee first');
    try {
      await hrAPI.checkIn({ employeeId: selectedEmp });
      alert('Checked in successfully!');
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmp) return alert('Select an employee first');
    try {
      await hrAPI.checkOut({ employeeId: selectedEmp });
      alert('Checked out successfully!');
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Daily Attendance</h2>
            <p className="text-xs font-bold text-slate-400">Track check-ins, check-outs, and working hours</p>
          </div>
        </div>
      </div>

      {/* Action Kiosk */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Select Employee</label>
          <select 
            value={selectedEmp} 
            onChange={e => setSelectedEmp(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.empCode} - {emp.firstName} {emp.lastName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleCheckIn} className="flex-1 md:w-40 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition">
            <LogIn size={16} /> Check In
          </button>
          <button onClick={handleCheckOut} className="flex-1 md:w-40 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition">
            <LogOut size={16} /> Check Out
          </button>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-black text-slate-700 uppercase">Recent Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Working Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No attendance logs available.</td></tr>
              ) : attendances.map(log => {
                const checkInTime = log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
                const checkOutTime = log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
                
                let statusColor = 'bg-emerald-100 text-emerald-700';
                if (log.status === 'Absent') statusColor = 'bg-rose-100 text-rose-700';
                if (log.status === 'Half Day') statusColor = 'bg-amber-100 text-amber-700';
                if (log.status === 'Leave') statusColor = 'bg-blue-100 text-blue-700';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{log.employee?.firstName} {log.employee?.lastName} <span className="text-[10px] text-slate-400 ml-1">({log.employee?.empCode})</span></td>
                    <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{checkInTime}</td>
                    <td className="px-6 py-4 font-mono text-rose-600 font-bold">{checkOutTime}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 flex items-center gap-1">
                      {log.workingHours ? <><Clock size={12}/> {parseFloat(log.workingHours).toFixed(2)} hrs</> : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${statusColor}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
