import { useState } from 'react';
import { useDB } from '../../db/DBContext';
import { manufacturersAPI } from '../../db/api';

export function useManufacturerController() {
  const { manufacturers, setManufacturers } = useDB();
  const [newManufacturer, setNewManufacturer] = useState({ name: '', country: 'India', contactEmail: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const handleAddManufacturer = async (e) => {
    e.preventDefault();
    if (!newManufacturer.name.trim()) { alert('Manufacturer name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: newManufacturer.name.trim(),
        country: newManufacturer.country.trim() || undefined,
        contactEmail: newManufacturer.contactEmail.trim() || undefined,
        phone: newManufacturer.phone.trim() || undefined
      };
      const res = await manufacturersAPI.create(payload);
      if (res.success && res.data) {
        setManufacturers(prev => [...prev, res.data]);
      }
      alert(`Manufacturer "${newManufacturer.name}" added successfully.`);
      setNewManufacturer({ name: '', country: 'India', contactEmail: '', phone: '' });
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to add manufacturer'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManufacturer = async (id) => {
    const mfr = manufacturers.find(m => m.id === id);
    if (!mfr) return;
    if (!window.confirm(`Delete manufacturer "${mfr.name}"?`)) return;
    try {
      await manufacturersAPI.delete(id);
      setManufacturers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to delete manufacturer'));
    }
  };

  return {
    manufacturers,
    newManufacturer,
    setNewManufacturer,
    handleAddManufacturer,
    handleDeleteManufacturer,
    saving
  };
}
