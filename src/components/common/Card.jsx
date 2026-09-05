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
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 ${
        hoverEffect ? 'hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200' : 'shadow-sm'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
