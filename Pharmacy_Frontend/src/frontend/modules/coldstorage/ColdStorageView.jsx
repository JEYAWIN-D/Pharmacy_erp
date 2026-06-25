import React from 'react';
import { Database, Thermometer, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useColdStorageController } from './useColdStorageController';

export default function ColdStorageView({ setSchemaModalTable }) {
  const {
    currentTemp,
    tempLogs,
    vaccinesChecklist,
    handleTempSlider
  } = useColdStorageController();

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase flex items-center gap-2">
            Medicine Fridge Cold Checker
            <button 
              onClick={() => setSchemaModalTable('cold_storage')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="View Database Table Info"
            >
              <Database size={14} />
            </button>
          </h3>
          <p className="text-xs text-slate-400">Keep track of fridge temperature and make sure cold medicines are safe.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temp stats & simulation */}
        <div className="unique-form-panel p-6 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Thermometer size={15} className="text-blue-600" />
            Fridge Temperature Status
          </h4>
          
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center gap-3 text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Fridge Unit ID: FRIDGE-A</span>
            <h2 className={`text-4xl font-black ${
              currentTemp > 8.0 || currentTemp < 2.0 ? 'text-red-500 animate-pulse' : 'text-blue-600'
            }`}>{currentTemp.toFixed(1)}°C</h2>
            
            {currentTemp > 8.0 || currentTemp < 2.0 ? (
              <span className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-bold text-red-600 flex items-center gap-1 animate-pulse select-none">
                <AlertCircle size={12} /> ⚠️ TEMPERATURE TOO HOT/COLD!
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-600 flex items-center gap-1 select-none">
                <CheckCircle size={12} /> Normal Zone (2°C to 8°C)
              </span>
            )}
          </div>

          {/* Temp Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Change Temperature to Test:</span>
              <span className="font-bold text-slate-700">{currentTemp.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min="-2.0"
              max="12.0"
              step="0.2"
              value={currentTemp}
              onChange={handleTempSlider}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[9px] text-slate-400 block text-center">Drag slider to test how alerts show up</span>
          </div>
        </div>

        {/* Checklist & Storage directory */}
        <div className="unique-card lg:col-span-2 p-6 text-left space-y-4">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={15} className="text-blue-600" />
            Cold Medicine Safety Checklist
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Medicine Name</th>
                  <th className="py-2.5 text-center">Last Checked Temp</th>
                  <th className="py-2.5 text-center">Door Status / Lid Check</th>
                  <th className="py-2.5">Where is it inside the Fridge?</th>
                </tr>
              </thead>
              <tbody>
                {vaccinesChecklist.map(vaccine => (
                  <tr key={vaccine.id} className="border-b border-slate-100">
                    <td className="py-3 font-bold text-slate-700">{vaccine.name}</td>
                    <td className="py-3 text-center font-bold text-slate-600">{vaccine.activeTemp}</td>
                    <td className="py-3 text-center">
                      {vaccine.safetyCheck ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold border border-blue-200/50">Door Closed (Safe)</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-bold border border-red-200/50 animate-pulse">Door Left Open Alert</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[10px]">Fridge Section {vaccine.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
