import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <section className={`min-w-0 rounded-xl border border-line bg-white shadow-sm ${className}`}>
      {title && <h2 className="px-5 pt-5 pb-3 text-base font-semibold text-ink">{title}</h2>}
      {children}
    </section>
  );
}
