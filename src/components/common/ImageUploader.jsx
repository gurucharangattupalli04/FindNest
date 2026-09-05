import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const MAX_SIZE_MB = 5;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
  onFileSelect,
  existingImageUrl = null,
  uploading = false,
  error = null,
  className = '',
}) {
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedFile && existingImageUrl) {
      setPreviewUrl(existingImageUrl);
    }
  }, [existingImageUrl, selectedFile]);

  const handleFile = (file) => {
    setValidationError(null);

    if (!file) return;

    // Check MIME type
    if (!ALLOWED_MIME.includes(file.type.toLowerCase())) {
      setValidationError('Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // Check size limit
    if (file.size > MAX_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File is too large (${sizeMB} MB). Maximum permitted size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase flex items-center justify-between">
        <span>Item Photo / Image (Optional)</span>
        <span className="text-[11px] font-normal text-slate-400">JPG, PNG, WEBP up to 5MB</span>
      </label>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Error Notices */}
      {(validationError || error) && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Image Preview State */}
      {previewUrl ? (
        <div className="relative rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-900 group">
          <div className="h-48 w-full flex items-center justify-center bg-slate-950/40">
            <img
              src={previewUrl}
              alt="Item Preview"
              className="max-h-48 w-full object-contain"
            />
          </div>

          {/* Uploading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold animate-fade-in">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
              <span>Uploading to secure storage...</span>
            </div>
          )}

          {/* Image Toolbar */}
          {!uploading && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/50 to-transparent p-3 flex items-center justify-between text-white">
              <div className="text-xs truncate max-w-[200px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate font-medium">
                  {selectedFile ? selectedFile.name : 'Current Image'}
                </span>
                {selectedFile && (
                  <span className="text-[10px] text-slate-300">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 ${
            dragOver
              ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
              : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50/70 bg-slate-50/30'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-brand-600">
            <UploadCloud className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Click to select <span className="font-normal text-slate-500">or drag and drop</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              High quality photos significantly speed up community recovery
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
