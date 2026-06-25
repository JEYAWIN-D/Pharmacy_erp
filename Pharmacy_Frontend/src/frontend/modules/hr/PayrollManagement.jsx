import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, CheckCircle, Search } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function PayrollManagement({ role, setSchemaModalTable }) {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    payrollMonth: '',
    basicSalary: 0,
    allowances: 0,
    deductions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        hrAPI.getPayrolls(),
        hrAPI.getEmployees()
      ]);
      if (pRes.success) setPayrolls(pRes.data);
      if (eRes.success) setEmployees(eRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setFormData({
        ...formData,
        employeeId: id,
        basicSalary: emp.basicSalary || 0
      });
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await hrAPI.generatePayroll(formData);
      setIsModalOpen(false);
      fetchData();
      alert('Payroll generated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Payroll Processing</h2>
            <p className="text-xs font-bold text-slate-400">Generate salaries, payslips, and track payments</p>
          </div>
        </div>
        <button 
          onClick={() => { setFormData({ employeeId: '', payrollMonth: new Date().toISOString().slice(0,7), basicSalary: 0, allowances: 0, deductions: 0 }); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <FileText size={16} /> Generate Payroll
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Basic</th>
                <th className="px-6 py-4">Allowances</th>
                <th className="px-6 py-4">Deductions</th>
                <th className="px-6 py-4">Net Salary</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">No payroll records generated yet.</td></tr>
              ) : payrolls.map(pr => (
                <tr key={pr.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{pr.payrollMonth}</td>
                  <td className="px-6 py-4 font-bold text-slate-600">{pr.employee?.firstName} {pr.employee?.lastName}</td>
                  <td className="px-6 py-4 text-slate-500">₹{parseFloat(pr.basicSalary).toLocaleString()}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">+₹{parseFloat(pr.allowances).toLocaleString()}</td>
                  <td className="px-6 py-4 text-rose-600 font-bold">-₹{parseFloat(pr.deductions).toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-indigo-700 text-sm">₹{parseFloat(pr.netSalary).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold uppercase">
                      {pr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGenerate} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase">Process Monthly Payroll</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee *</label>
                <select required value={formData.employeeId} onChange={e => handleSelectEmployee(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select Employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} (Basic: ₹{emp.basicSalary || 0})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payroll Month (YYYY-MM) *</label>
                <input required type="month" value={formData.payrollMonth} onChange={e => setFormData({...formData, payrollMonth: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Basic Salary *</label>
                <input required type="number" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Allowances (+)</label>
                  <input type="number" value={formData.allowances} onChange={e => setFormData({...formData, allowances: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deductions (-)</label>
                  <input type="number" value={formData.deductions} onChange={e => setFormData({...formData, deductions: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-800 uppercase">Net Payable</span>
                <span className="text-lg font-black text-indigo-700">₹{(formData.basicSalary + formData.allowances - formData.deductions).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-2"><CheckCircle size={16}/> Generate</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
