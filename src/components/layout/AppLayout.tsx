import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo, Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-muted hover:bg-slate-100"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside
        className={`${menuOpen ? 'block' : 'hidden'} border-b border-line bg-white md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0`}
      >
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          <TopBar />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
