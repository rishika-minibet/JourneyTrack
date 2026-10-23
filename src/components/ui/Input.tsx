import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  /** Element rendered inside the right edge, e.g. a password visibility toggle. */
  trailing?: ReactNode;
  invalid?: boolean;
}

export function Input({ icon, trailing, invalid = false, className = '', ...props }: InputProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{icon}</span>
      )}
      <input
        aria-invalid={invalid || undefined}
        {...props}
        className={`w-full rounded-lg border bg-white py-2 text-sm text-ink placeholder:text-muted focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted ${
          invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-line focus:border-brand focus:ring-brand-light'
        } ${icon ? 'pl-9' : 'pl-3'} ${trailing ? 'pr-10' : 'pr-3'}`}
      />
      {trailing && <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>}
    </div>
  );
}
