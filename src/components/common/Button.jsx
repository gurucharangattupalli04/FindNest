import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  id,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-aurora-bg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary: 'bg-aurora-accent hover:bg-aurora-accent-hover text-aurora-accent-text focus:ring-aurora-accent shadow-subtle',
    lost: 'bg-aurora-error hover:opacity-90 text-white focus:ring-aurora-error shadow-subtle',
    found: 'bg-aurora-success hover:opacity-90 text-white focus:ring-aurora-success shadow-subtle',
    secondary: 'bg-aurora-card hover:bg-aurora-chip text-aurora-text border border-aurora-border focus:ring-aurora-accent shadow-subtle',
    outline: 'bg-aurora-card hover:bg-aurora-chip text-aurora-text border border-aurora-border focus:ring-aurora-accent',
    ghost: 'text-aurora-muted hover:text-aurora-text hover:bg-aurora-chip focus:ring-aurora-accent',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
    xl: 'text-lg px-6 py-3 rounded-2xl gap-3 font-bold',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
