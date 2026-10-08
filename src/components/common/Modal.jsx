import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-aurora-text/40 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className={`relative w-full ${maxWidth} bg-aurora-card rounded-2xl shadow-card border border-aurora-border p-6 sm:p-7 z-10 animate-fade-in my-8 max-h-[90vh] flex flex-col transition-colors`}>
        <div className="flex items-center justify-between pb-4 border-b border-aurora-border mb-5">
          <h3 className="text-xl font-bold text-aurora-text tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-aurora-muted hover:text-aurora-text hover:bg-aurora-chip rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 text-aurora-text">
          {children}
        </div>
      </div>
    </div>
  );
}
