import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { useSupplierController } from './useSupplierController';
import Toast, { useToast } from './components/Toast';
import SupplierList from './SupplierList';
import SupplierModal from './SupplierModal';
import SupplierFormModal from './SupplierFormModal';

export default function SupplierView({ setSchemaModalTable }) {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const controller = useSupplierController();

  // ── Open supplier detail modal ──────────────────────────────────────────
  const handleView = (supplier) => {
    setSelectedSupplier(supplier);
    controller.setSelectedSupplier(supplier);
  };

  const handleCloseModal = () => {
    setSelectedSupplier(null);
    controller.setSelectedSupplier(null);
  };

  // ── Open create/edit form modal ─────────────────────────────────────────
  const handleAddNew = () => {
    setEditingSupplier(null);
    setShowFormModal(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowFormModal(true);
    // Close detail modal if open for the same supplier
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier(null);
    }
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingSupplier(null);
  };

  const handleFormSave = async (data) => {
    try {
      if (editingSupplier) {
        await controller.updateSupplier(editingSupplier.id, data);
        addToast('Supplier updated successfully', 'success');
        // If we were viewing this supplier, refresh the reference
        if (selectedSupplier?.id === editingSupplier.id) {
          // Update the selected supplier object with the new data
          setSelectedSupplier(prev => ({ ...prev, ...data }));
        }
      } else {
        await controller.createSupplier(data);
        addToast('Supplier created successfully', 'success');
      }
      setShowFormModal(false);
      setEditingSupplier(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Module Header Bar ── */}
      <div className="flex items-center gap-3 pb-1">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow shadow-blue-500/20">
          <Truck size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-slate-800">Supplier Hub</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Management Module — {controller.dashboardStats.total} Suppliers · {controller.dashboardStats.active} Active · {controller.dashboardStats.preferred} Preferred
          </p>
        </div>
      </div>

      {/* ── Supplier List Table ── */}
      <SupplierList
        controller={controller}
        onAdd={handleAddNew}
        onEdit={handleEdit}
        onView={handleView}
        addToast={addToast}
      />

      {/* ── Supplier Detail Modal ── */}
      {selectedSupplier && (
        <SupplierModal
          supplier={selectedSupplier}
          controller={controller}
          onClose={handleCloseModal}
          addToast={addToast}
        />
      )}

      {/* ── Create / Edit Form Modal ── */}
      {showFormModal && (
        <SupplierFormModal
          supplier={editingSupplier}
          onSave={handleFormSave}
          onClose={handleFormClose}
          addToast={addToast}
        />
      )}

      {/* ── Toast Notifications ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
