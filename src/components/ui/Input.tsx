import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{icon}</span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-line bg-white py-2 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand-light focus:outline-none ${icon ? 'pl-9' : 'pl-3'}`}
      />
    </div>
  );
}
