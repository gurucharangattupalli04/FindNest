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

    if (!ALLOWED_MIME.includes(file.type.toLowerCase())) {
      setValidationError('Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

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
      <label className="text-xs font-semibold text-aurora-text tracking-wide uppercase flex items-center justify-between">
        <span>Item Photo / Image (Optional)</span>
        <span className="text-[11px] font-normal text-aurora-muted">JPG, PNG, WEBP up to 5MB</span>
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
        <div className="p-3 bg-aurora-error-bg border border-aurora-error/20 rounded-xl text-xs text-aurora-error flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Image Preview State */}
      {previewUrl ? (
        <div className="relative rounded-xl border border-aurora-border overflow-hidden bg-aurora-chip group">
          <div className="h-44 w-full flex items-center justify-center bg-aurora-chip">
            <img
              src={previewUrl}
              alt="Item Preview"
              className="max-h-44 w-full object-contain"
            />
          </div>

          {/* Uploading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-aurora-card/90 flex flex-col items-center justify-center gap-2 text-aurora-text text-xs font-semibold animate-fade-in">
              <RefreshCw className="w-5 h-5 animate-spin text-aurora-accent" />
              <span>Uploading to secure storage...</span>
            </div>
          )}

          {/* Image Toolbar */}
          {!uploading && (
            <div className="p-2.5 bg-aurora-card border-t border-aurora-border flex items-center justify-between text-aurora-text">
              <div className="text-xs truncate max-w-[200px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-success shrink-0" />
                <span className="truncate font-medium text-aurora-text">
                  {selectedFile ? selectedFile.name : 'Current Image'}
                </span>
                {selectedFile && (
                  <span className="text-[10px] text-aurora-muted">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-aurora-chip hover:bg-aurora-border text-xs font-semibold text-aurora-text transition-colors cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 rounded-lg bg-aurora-error-bg hover:bg-aurora-error text-aurora-error hover:text-white transition-colors cursor-pointer"
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
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-aurora-accent bg-aurora-chip'
              : 'border-aurora-border hover:border-aurora-accent bg-aurora-card hover:bg-aurora-chip/40'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-aurora-chip border border-aurora-border flex items-center justify-center text-aurora-accent">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-aurora-text">
              Click to select <span className="font-normal text-aurora-muted">or drag and drop</span>
            </p>
            <p className="text-[11px] text-aurora-muted mt-0.5">
              High quality photos significantly speed up community recovery
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
