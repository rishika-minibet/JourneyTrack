import { NavLink } from 'react-router-dom';
import { Route, Users } from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
        <Route size={18} />
      </span>
      <span className="text-lg font-semibold text-ink">JourneyTrack</span>
    </div>
  );
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav className="flex h-full flex-col gap-6 p-4">
      <div className="hidden px-2 pt-1 md:block">
        <Logo />
      </div>
      <NavLink
        to="/users"
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive ? 'bg-brand-light text-brand-dark' : 'text-muted hover:bg-slate-100 hover:text-ink'
          }`
        }
      >
        <Users size={18} />
        Users
      </NavLink>
    </nav>
  );
}
