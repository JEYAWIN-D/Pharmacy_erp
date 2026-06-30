import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, Download, FileText, UploadCloud } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import DataTable from './components/DataTable';
import FileUpload from './components/FileUpload';
import { SupplierModel } from './SupplierModel';

export default function SupplierDocuments({ controller, addToast }) {
  const { suppliers, documents, createDocument, deleteDocument } = controller;
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ supplierId: '', documentType: 'GST Certificate', documentName: '', fileUrl: '' });
  const [file, setFile] = useState(null);

  const columns = [
    { key: 'supplier', header: 'Supplier', render: (row) => <span className="font-bold text-slate-700">{row.supplier?.name}</span> },
    { key: 'type', header: 'Document Type', render: (row) => <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">{row.documentType}</span> },
    { key: 'name', header: 'File Name', accessor: 'documentName', render: (row) => (
      <div className="flex items-center gap-1.5">
        <FileText size={14} className="text-blue-500" />
        <span className="text-xs font-semibold text-slate-700">{row.documentName}</span>
      </div>
    )},
    { key: 'date', header: 'Uploaded On', render: (row) => <span className="text-[10px] text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', header: 'Actions', align: 'right', sortable: false, render: (row) => (
      <div className="flex justify-end gap-1">
        <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition cursor-pointer" title="Download">
          <Download size={13} />
        </a>
        <button onClick={() => setConfirmDelete(row)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition cursor-pointer" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    )}
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return addToast('Select a supplier', 'error');
    if (!file && !form.fileUrl) return addToast('Please upload a file or provide a URL', 'error');

    try {
      // In a real implementation, you would upload the 'file' to S3/Cloud Storage here
      // and get back a URL. For this demo, we simulate a mock URL if a file is selected.
      const mockFileUrl = file ? `/uploads/${file.name}` : form.fileUrl;
      const docName = file ? file.name : form.documentName;

      await createDocument({
        ...form,
        documentName: docName,
        fileUrl: mockFileUrl
      });
      
      addToast('Document uploaded successfully', 'success');
      setShowForm(false);
      setForm({ supplierId: '', documentType: 'GST Certificate', documentName: '', fileUrl: '' });
      setFile(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload document', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument(confirmDelete.id);
      addToast('Document deleted', 'success');
    } catch (err) {
      addToast('Failed to delete document', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <FolderOpen size={16} className="text-slate-600" />
            </div>
            Supplier Documents
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage compliance documents, agreements, and licenses</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setFile(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
          {showForm ? <><X size={14} /> Cancel</> : <><UploadCloud size={14} /> Upload Document</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Upload New Document</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
                <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type *</label>
                <select required value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  {SupplierModel.documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {!file && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Or Document Name (if using URL)</label>
                  <input type="text" value={form.documentName} onChange={(e) => setForm({ ...form, documentName: e.target.value })} placeholder="Document Name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">File Upload</label>
              <FileUpload onFileSelect={setFile} accept=".pdf,.jpg,.jpeg,.png" label="Upload License/Certificate" />
              <div className="mt-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">OR External URL</label>
                <input type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." disabled={!!file} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-50" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer">
              <Plus size={14} /> Save Document
            </button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={documents} searchPlaceholder="Search documents..." />

      <ConfirmDialog isOpen={!!confirmDelete} title="Delete Document" message={`Are you sure you want to delete ${confirmDelete?.documentName}? This action is permanent.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
