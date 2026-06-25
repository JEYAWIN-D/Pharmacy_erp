import React, { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useDB } from '../../db/DBContext';

export default function AdministrationView({ role, setRole }) {
  const { auditLogs, setAuditLogs } = useDB();

  // Mock users list
  const [users, setUsers] = useState([
    { username: 'admin_user', name: 'System Admin', role: 'Admin', status: 'Active', lastLogin: '2026-06-12 05:30 PM' },
    { username: 'manager_1', name: 'Ravi Verma', role: 'Pharmacy Manager', status: 'Active', lastLogin: '2026-06-12 04:15 PM' },
    { username: 'pharmacist_1', name: 'Dr. Neha Sen', role: 'Pharmacist', status: 'Active', lastLogin: '2026-06-12 11:20 AM' },
    { username: 'inventory_staff', name: 'Karan Singh', role: 'Inventory Staff', status: 'Active', lastLogin: '2026-06-12 08:30 AM' },
    { username: 'purchase_manager', name: 'Vikram Seth', role: 'Purchase Manager', status: 'Active', lastLogin: '2026-06-11 06:10 PM' },
    { username: 'billing_desk1', name: 'Pooja Roy', role: 'Billing Staff', status: 'Active', lastLogin: '2026-06-12 12:45 PM' }
  ]);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Pharmacist');

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    const newUserObj = {
      username: newUsername.trim().toLowerCase(),
      name: newName.trim(),
      role: newUserRole,
      status: 'Active',
      lastLogin: 'Never'
    };

    setUsers([...users, newUserObj]);

    const auditObj = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toLocaleString(),
      user: 'Admin',
      action: 'User Account Created',
      details: `Created new system user ${newUserObj.name} with role ${newUserObj.role}`
    };
    setAuditLogs([auditObj, ...auditLogs]);

    alert(`User ${newUserObj.name} registered successfully.`);
    setNewUsername('');
    setNewName('');
    setNewUserRole('Pharmacist');
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
          System Administration &amp; Governance
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          Manage user credentials, check login sessions, and review security access controls.
        </p>
      </div>

      {/* USER ACCOUNTS MASTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">

        {/* User List Table */}
        <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users size={15} className="text-blue-600" />
            Registered System Operators (user_master)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Name / Username</th>
                  <th className="py-2.5">Assigned Security Role</th>
                  <th className="py-2.5">Last System Login</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-700">
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3 text-slate-600 font-bold">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-black">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[10px]">{u.lastLogin}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-green-700 bg-green-50 border border-green-200/50">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Operator Form */}
        <div className="unique-form-panel p-6 text-left space-y-4">
          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserPlus size={15} className="text-blue-600" />
            Create Operator Account
          </h4>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Operator Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sandeep Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Username / Login Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. sandeep_s"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                System Security Role
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Pharmacy Manager">Pharmacy Manager</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Inventory Staff">Inventory Staff</option>
                <option value="Purchase Manager">Purchase Manager</option>
                <option value="Billing Staff">Billing Staff</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center"
            >
              Register Operator Profile
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
