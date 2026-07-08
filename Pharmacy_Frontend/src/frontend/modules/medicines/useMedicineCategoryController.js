import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { categoriesAPI } from '../../db/api';

export function useMedicineCategoryController() {
  const { medicineCategories, setMedicineCategories, refetch } = useDB();

  // ── ADD state ────────────────────────────────────────────────
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // ── EDIT state ───────────────────────────────────────────────
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);

  // ── ADD ──────────────────────────────────────────────────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) { alert('Category name is required'); return; }
    setSaving(true);
    try {
      const res = await categoriesAPI.create({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });
      if (res.success && res.data) {
        setMedicineCategories(prev => [...prev, res.data]);
      } else {
        await refetch();
      }
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to add category'));
    } finally {
      setSaving(false);
    }
  };

  // ── START EDIT ───────────────────────────────────────────────
  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditForm({ name: cat.name, description: cat.description || '' });
  };

  // ── CANCEL EDIT ──────────────────────────────────────────────
  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setEditForm({ name: '', description: '' });
  };

  // ── UPDATE ───────────────────────────────────────────────────
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) { alert('Category name is required'); return; }
    setEditSaving(true);
    try {
      const res = await categoriesAPI.update(editingCategory.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined
      });
      if (res.success && res.data) {
        setMedicineCategories(prev =>
          prev.map(c => c.id === editingCategory.id ? { ...c, ...res.data } : c)
        );
      } else {
        // Optimistic local update if response shape differs
        setMedicineCategories(prev =>
          prev.map(c => c.id === editingCategory.id
            ? { ...c, name: editForm.name.trim(), description: editForm.description.trim() }
            : c
          )
        );
      }
      setEditingCategory(null);
      setEditForm({ name: '', description: '' });
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to update category'));
    } finally {
      setEditSaving(false);
    }
  };

  // ── DELETE ───────────────────────────────────────────────────
  const handleDeleteCategory = async (id) => {
    const cat = medicineCategories.find(c => c.id === id);
    if (!cat) return;
    if (!window.confirm(`Delete category "${cat.name}"? Medicines in this category will be uncategorized.`)) return;
    try {
      await categoriesAPI.delete(id);
      setMedicineCategories(prev => prev.filter(c => c.id !== id));
      if (editingCategory?.id === id) {
        setEditingCategory(null);
        setEditForm({ name: '', description: '' });
      }
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to delete category'));
    }
  };

  return {
    medicineCategories,
    newCategory,
    setNewCategory,
    handleAddCategory,
    saving,
    // Edit
    editingCategory,
    editForm,
    setEditForm,
    editSaving,
    handleStartEditCategory,
    handleCancelCategoryEdit,
    handleUpdateCategory,
    handleDeleteCategory,
  };
}
