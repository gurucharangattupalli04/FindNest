import React from 'react';

export function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  helperText,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-aurora-text tracking-wide">
          {label} {required && <span className="text-aurora-error">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-aurora-muted flex items-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full bg-aurora-card border border-aurora-border rounded-xl py-2.5 text-sm text-aurora-text placeholder:text-aurora-muted focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20 transition-all ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } ${error ? 'border-aurora-error focus:border-aurora-error focus:ring-aurora-error/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-aurora-error mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs text-aurora-muted mt-0.5">{helperText}</p>}
    </div>
  );
}
