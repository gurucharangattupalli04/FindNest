import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const variantStyles = {
    lost: 'bg-aurora-error-bg text-aurora-error border-aurora-error/20 font-semibold',
    found: 'bg-aurora-success-bg text-aurora-success border-aurora-success/20 font-semibold',
    brand: 'bg-aurora-chip text-aurora-accent border-aurora-accent/20 font-semibold',
    neutral: 'bg-aurora-chip text-aurora-muted border-aurora-border font-medium',
    accent: 'bg-aurora-warning-bg text-aurora-warning border-aurora-warning/20 font-semibold',
    reward: 'bg-aurora-warning-bg text-aurora-warning border-aurora-warning/30 font-bold',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-xs px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
}
