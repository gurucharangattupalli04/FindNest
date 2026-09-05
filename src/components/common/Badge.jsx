import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const variantStyles = {
    lost: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
    found: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold',
    brand: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    accent: 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
}
