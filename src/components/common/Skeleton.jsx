import React from 'react';

export function Skeleton({ className = '', variant = 'rect' }) {
  const baseClasses = 'animate-pulse bg-aurora-chip rounded-xl';
  const variantClasses = {
    rect: '',
    circle: 'rounded-full',
    text: 'h-4 rounded-md',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-aurora-card rounded-2xl border border-aurora-border p-5 shadow-card flex flex-col justify-between animate-pulse">
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-aurora-chip rounded-full" />
            <div className="h-5 w-20 bg-aurora-chip rounded-full" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-aurora-chip" />
        </div>

        {/* Thumbnail skeleton */}
        <div className="w-full h-44 rounded-xl mb-4 bg-aurora-chip" />

        {/* Title */}
        <div className="h-5 w-3/4 bg-aurora-chip rounded-lg mb-2" />

        {/* Description */}
        <div className="space-y-1.5 mb-4">
          <div className="h-3.5 w-full bg-aurora-chip rounded" />
          <div className="h-3.5 w-4/5 bg-aurora-chip rounded" />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-aurora-border flex items-center justify-between">
        <div className="h-4 w-28 bg-aurora-chip rounded" />
        <div className="h-4 w-16 bg-aurora-chip rounded" />
      </div>
    </div>
  );
}
