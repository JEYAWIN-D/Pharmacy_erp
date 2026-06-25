import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { categoriesAPI } from '../../db/api';

export function useMedicineCategoryController() {
  const { medicineCategories, setMedicineCategories, refetch } = useDB();
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) { alert('Category name is required'); return; }
    setSaving(true);
    try {
      const res = await categoriesAPI.create({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });
      // Optimistically update + refetch
      if (res.success && res.data) {
        setMedicineCategories(prev => [...prev, res.data]);
      } else {
        await refetch();
      }
      alert(`Category "${newCategory.name}" added successfully.`);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to add category'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const cat = medicineCategories.find(c => c.id === id);
    if (!cat) return;
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await categoriesAPI.delete(id);
      setMedicineCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to delete category'));
    }
  };

  return {
    medicineCategories,
    newCategory,
    setNewCategory,
    handleAddCategory,
    handleDeleteCategory,
    saving
  };
}
