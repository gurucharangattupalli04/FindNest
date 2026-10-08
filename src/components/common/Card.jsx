import React from 'react';

export function Card({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-aurora-card rounded-2xl border border-aurora-border p-5 text-aurora-text ${
        hoverEffect ? 'hover:border-aurora-accent/40 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300' : 'shadow-subtle'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

