import React, { useState } from 'react';
import { Database, FileText, CheckCircle, UserCheck, ShieldCheck, Plus, X, Stethoscope } from 'lucide-react';
import { useDB } from '../../db/DBContext';

export default function PrescriptionView({
  dispenseRxId,
  setDispenseRxId,
  rxDispenseItems,
  setRxDispenseItems,
  setActiveTab,
  setFefoMedId,
  setFefoPrescriptionId,
  setSchemaModalTable
}) {
  const { prescriptions, setPrescriptions, medicines, auditLogs, setAuditLogs } = useDB();
  const [activeLocalTab, setActiveLocalTab] = useState('list');

  // ── NEW PRESCRIPTION FORM STATE ──────────────────────────────────────────
  const emptyRx = { patient: '', doctor: '', department: '', items: [{ name: '', qty: 1, dosage: '1-0-1', note: '' }] };
  const [newRx, setNewRx] = useState(emptyRx);

  const addItem = () => setNewRx({ ...newRx, items: [...newRx.items, { name: '', qty: 1, dosage: '1-0-1', note: '' }] });
  const removeItem = (idx) => setNewRx({ ...newRx, items: newRx.items.filter((_, i) => i !== idx) });
  const updateItem = (idx, field, value) => setNewRx({ ...newRx, items: newRx.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) });

  const handleSubmitRx = (e) => {
    e.preventDefault();
    if (!newRx.patient.trim() || !newRx.doctor.trim()) { alert('Patient name and Doctor name are required.'); return; }
    if (newRx.items.some(item => !item.name.trim() || !item.qty)) { alert('Please fill all medicine items completely.'); return; }
    const rxId = `RX-${Date.now().toString().slice(-4)}`;
    const created = {
      id: rxId,
      patient: newRx.patient.trim(),
      doctor: newRx.doctor.trim(),
      department: newRx.department.trim() || 'General',
      date: new Date().toLocaleDateString('en-IN'),
      items: newRx.items.map(item => ({ name: item.name.trim(), qty: parseInt(item.qty), dosage: item.dosage, note: item.note.trim() })),
      status: 'Pending',
      entryMode: 'Manual'
    };
    setPrescriptions([created, ...prescriptions]);
    setAuditLogs([{ id: `LOG-${Date.now().toString().slice(-4)}`, timestamp: new Date().toLocaleString(), user: 'Pharmacist', action: 'Prescription Added', details: `Rx ${rxId} manually entered for ${created.patient}` }, ...(auditLogs || [])]);
    alert(`Prescription ${rxId} saved for ${created.patient}.`);
    setNewRx(emptyRx);
    setActiveLocalTab('list');
  };

  const loadPrescriptionForDispense = (rx) => {
    setDispenseRxId(rx.id);
    setRxDispenseItems(rx.items.map(item => {
      const dbMed = medicines.find(m => m.name.toLowerCase().includes(item.name.toLowerCase()));
      const inStock = dbMed ? dbMed.stock : 0;
      return { ...item, availableStock: inStock, insufficient: inStock < item.qty, substituteSuggested: inStock < item.qty ? 'Checking substitutes...' : null, dispenseQty: item.qty };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Prescription Register
            <button onClick={() => setSchemaModalTable('prescription')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer" title="View DB Schema">
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">View incoming prescriptions or manually enter new ones</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'list', label: 'View Prescriptions', icon: <FileText size={13} /> },
            { id: 'new', label: 'Add New Rx', icon: <Plus size={13} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveLocalTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeLocalTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: VIEW PRESCRIPTIONS ────────────────────────────────────── */}
      {activeLocalTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-card p-6 lg:col-span-2 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={15} className="text-blue-600" /> Prescription Queue ({prescriptions.filter(rx => rx.status === 'Pending').length} Pending)
            </h4>
            <div className="space-y-3">
              {prescriptions.map(rx => (
                <div key={rx.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-600 text-xs">{rx.id}</span>
                      <span className="text-slate-400 text-[10px]">{rx.date}</span>
                      {rx.entryMode === 'Manual' && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[8px] font-bold rounded">Manual</span>}
                    </div>
                    <h4 className="text-xs font-bold text-slate-700">Patient: {rx.patient}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Doctor: {rx.doctor} — {rx.department}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rx.items.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600">
                          {item.name} × {item.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    {rx.status === 'Dispensed' ? (
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 select-none">
                        <CheckCircle size={12} /> Dispensed
                      </span>
                    ) : (
                      <button onClick={() => loadPrescriptionForDispense(rx)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">
                        Dispense ▸
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {prescriptions.length === 0 && <p className="text-center py-6 text-slate-400 text-xs">No prescriptions in queue.</p>}
            </div>
          </div>

          {/* Verify panel */}
          <div className="unique-form-panel p-6 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck size={15} className="text-blue-600" /> Slip Security Check
            </h4>
            {dispenseRxId ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                  <p className="font-bold text-blue-800 flex items-center gap-1"><ShieldCheck size={14} /> Verified (Doctor Slip Confirmed)</p>
                  <p className="text-[10px] text-slate-500">Ready to proceed to billing desk.</p>
                </div>
                <div className="space-y-2">
                  {rxDispenseItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl text-[11px]">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-800">{item.name}</span>
                        <span className="text-slate-400">Qty: {item.qty}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-1 font-semibold italic">Instructions: {item.note}</div>
                      {item.insufficient && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[9px] font-bold">
                          ⚠️ Only {item.availableStock} in stock — substitute check on dispense screen
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  const matchingMed = medicines.find(m => m.name.toLowerCase().includes(rxDispenseItems[0]?.name.toLowerCase()));
                  setActiveTab('dispensing');
                  setFefoMedId(matchingMed?.id || 1);
                  setFefoPrescriptionId(dispenseRxId);
                  setDispenseRxId(null);
                }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer text-center">
                  Proceed to Billing POS →
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                Select a pending prescription from the list to verify and proceed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ADD NEW PRESCRIPTION ──────────────────────────────────── */}
      {activeLocalTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="unique-form-panel p-6 lg:col-span-2 text-left space-y-5">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope size={15} className="text-blue-600" /> Manual Prescription Entry
            </h4>
            <form onSubmit={handleSubmitRx} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Name *</label>
                  <input type="text" placeholder="e.g. Anand Kumar" value={newRx.patient}
                    onChange={(e) => setNewRx({ ...newRx, patient: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor Name *</label>
                  <input type="text" placeholder="e.g. Dr. S. Sharma" value={newRx.doctor}
                    onChange={(e) => setNewRx({ ...newRx, doctor: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <input type="text" placeholder="e.g. Cardiology" value={newRx.department}
                    onChange={(e) => setNewRx({ ...newRx, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medicine Items *</label>
                  <button type="button" onClick={addItem}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition cursor-pointer">
                    <Plus size={11} /> Add Medicine
                  </button>
                </div>
                {newRx.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Medicine {idx + 1}</span>
                      {idx > 0 && <button type="button" onClick={() => removeItem(idx)}
                        className="p-1 bg-red-50 text-red-500 hover:bg-red-100 rounded cursor-pointer"><X size={11} /></button>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <select value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer">
                          <option value="">— Select Medicine —</option>
                          {medicines.map(m => <option key={m.id} value={m.name}>{m.name} (Stock: {m.stock})</option>)}
                        </select>
                      </div>
                      <div>
                        <input type="number" placeholder="Qty" min="1" value={item.qty}
                          onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none" required />
                      </div>
                      <div>
                        <select value={item.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer">
                          <option value="1-0-0">Morning only</option>
                          <option value="0-1-0">Afternoon only</option>
                          <option value="0-0-1">Night only</option>
                          <option value="1-0-1">Morning & Night</option>
                          <option value="1-1-1">Thrice daily</option>
                          <option value="1-1-0">Morning & Afternoon</option>
                          <option value="SOS">SOS (as needed)</option>
                        </select>
                      </div>
                    </div>
                    <input type="text" placeholder="Special instructions (e.g. Take after food)..." value={item.note}
                      onChange={(e) => updateItem(idx, 'note', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none" />
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer">
                Save Prescription & Add to Queue
              </button>
            </form>
          </div>
          <div className="unique-card p-6 text-left space-y-4 h-fit">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Quick Tips</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> Enter prescriptions from handwritten doctor slips</li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> Dosage codes: 1-0-1 means Morning and Night</li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> After saving, go to prescriptions list → Dispense</li>
              <li className="flex gap-2"><span className="text-amber-600 font-bold">⚠</span> Medicines with 0 stock will trigger substitution prompts</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
