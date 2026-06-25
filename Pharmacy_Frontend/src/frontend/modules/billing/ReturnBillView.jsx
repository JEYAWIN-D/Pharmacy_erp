import React, { useState } from 'react';
import { CornerDownLeft, CheckCircle, X } from 'lucide-react';
import { billingAPI } from '../../db/api';
import { useToast } from './useToast';

export default function ReturnBillView({ invoiceData, onBack }) {
  const { toast } = useToast();
  const [returnItems, setReturnItems] = useState(
    invoiceData.items.map(item => ({ ...item, returnQty: 0 }))
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRefund = returnItems.reduce((sum, item) => sum + (item.returnQty * Number(item.price)), 0);

  const handleSubmit = async () => {
    const itemsToReturn = returnItems
      .filter(i => i.returnQty > 0)
      .map(i => ({ billItemId: i.id, qty: i.returnQty }));
      
    if (itemsToReturn.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }

    try {
      setIsSubmitting(true);
      await billingAPI.returnBill(invoiceData.id, { itemsToReturn, reason });
      toast.success('Return processed successfully!');
      onBack();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-full">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-rose-50 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-black text-rose-700 flex items-center gap-2">
              <CornerDownLeft size={24} /> Process Return
            </h2>
            <p className="text-rose-600 font-bold text-sm">Bill No: {invoiceData.id}</p>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-rose-100 rounded-full text-rose-500 transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-sm mb-6">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 text-left font-black">Medicine</th>
                <th className="p-3 text-center font-black">Purchased Qty</th>
                <th className="p-3 text-center font-black">Return Qty</th>
                <th className="p-3 text-right font-black">Unit Price</th>
                <th className="p-3 text-right font-black">Refund Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-bold text-slate-800">{item.name}</td>
                  <td className="p-3 text-center font-bold text-slate-500">{item.qty}</td>
                  <td className="p-3 text-center">
                    <input 
                      type="number" 
                      min="0" 
                      max={item.qty} 
                      value={item.returnQty}
                      onChange={e => {
                        const val = Math.min(item.qty, Math.max(0, parseInt(e.target.value) || 0));
                        const newItems = [...returnItems];
                        newItems[idx].returnQty = val;
                        setReturnItems(newItems);
                      }}
                      className="w-20 text-center font-black bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-400 focus:bg-rose-50"
                    />
                  </td>
                  <td className="p-3 text-right font-bold text-slate-500">₹{Number(item.price).toFixed(2)}</td>
                  <td className="p-3 text-right font-black text-slate-800">₹{(item.returnQty * Number(item.price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-6 items-start">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Reason for Return</label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="E.g. Damaged product, wrong medicine..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:outline-none focus:border-rose-400"
                rows="3"
              />
            </div>
            <div className="w-72 bg-rose-50 border border-rose-200 rounded-xl p-6">
              <h3 className="text-rose-600 font-bold uppercase text-[10px] tracking-wider mb-2">Total Refund</h3>
              <div className="text-3xl font-black text-rose-700 mb-6">₹{totalRefund.toFixed(2)}</div>
              
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || totalRefund === 0}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 transition"
              >
                <CheckCircle size={18} /> Confirm Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
