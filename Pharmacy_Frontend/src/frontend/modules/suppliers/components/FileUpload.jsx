import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

export default function FileUpload({ onFileSelect, accept = '*', label = 'Upload Document', multiple = false }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);
    onFileSelect?.(multiple ? newFiles : newFiles[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (name) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) return <Image size={14} className="text-violet-500" />;
    return <FileText size={14} className="text-blue-500" />;
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'
        }`}
      >
        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-xs font-bold text-slate-600">{label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop or click to browse</p>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={(e) => handleFiles(e.target.files)} className="hidden" />
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              {getFileIcon(file.name)}
              <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{file.name}</span>
              <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
              <button onClick={() => removeFile(idx)} className="p-0.5 hover:bg-slate-200 rounded cursor-pointer">
                <X size={12} className="text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
