import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, CalendarClock, CreditCard, ChevronRight } from 'lucide-react';
import { hrAPI } from '../../db/api';

export default function HRDashboard({ role, setActiveTab }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await hrAPI.getDashboard();
      if (res.success) setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const statCards = [
    { title: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: 'hr-employees' },
    { title: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'hr-attendance' },
    { title: 'Absent Today', value: stats.absentToday, icon: UserMinus, color: 'text-red-600', bg: 'bg-red-50', link: 'hr-attendance' },
    { title: 'Pending Leaves', value: stats.pendingLeaves, icon: CalendarClock, color: 'text-amber-600', bg: 'bg-amber-50', link: 'hr-leaves' },
    { title: 'Monthly Payroll', value: `₹${stats.monthlyPayroll.toLocaleString()}`, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', link: 'hr-payroll' }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">HR Dashboard</h2>
          <p className="text-xs font-bold text-slate-400">Overview of employees, attendance, and payroll</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col relative group overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`} />
            <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center text-slate-600 font-bold mb-4 z-10 border border-slate-100`}>
              <card.icon size={20} className={card.color} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider z-10">{card.title}</span>
            <div className="mt-1 flex items-end justify-between z-10">
              <span className="text-2xl font-black text-slate-800">{card.value}</span>
              <button onClick={() => setActiveTab(card.link)} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase flex items-center cursor-pointer hover:underline">
                View <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center h-64 text-slate-400">
        <BarChart3 size={48} className="mb-4 opacity-20" />
        <p className="font-bold">Graphical charts can be implemented here based on historical HR data.</p>
      </div>
    </div>
  );
}

// Temporary BarChart3 icon if missing above
import { BarChart3 } from 'lucide-react';
