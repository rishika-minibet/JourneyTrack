import type { ReactNode } from 'react';
import { Logo } from './Sidebar';

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  width?: 'sm' | 'lg';
}

export function AuthLayout({ title, subtitle, children, aside, width = 'sm' }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:py-16">
      <Logo />
      <div className={`mt-8 w-full ${width === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}>
        <section className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
          <div className="mt-6">{children}</div>
        </section>
        {aside}
        <p className="mt-6 text-center text-xs text-muted">
          UI prototype — authentication is simulated and data is stored only in this browser.
        </p>
      </div>
    </div>
  );
}
