import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, FolderKanban, LayoutDashboard, Route, Settings, UserCog, Users } from 'lucide-react';
import { EnvironmentSelector, OrganizationSwitcher, ProjectSelector } from './ContextSelectors';

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

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  { items: [{ to: '/overview', label: 'Overview', icon: <LayoutDashboard size={18} /> }] },
  {
    // The existing Users list → User details → activity timeline is the Track User Activity feature.
    title: 'Track user activity',
    items: [
      { to: '/users', label: 'Users', icon: <Users size={18} /> },
      { to: '/events', label: 'Events', icon: <Activity size={18} /> },
    ],
  },
  {
    title: 'Organization',
    items: [
      { to: '/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
      { to: '/settings/members', label: 'Members', icon: <UserCog size={18} /> },
      { to: '/settings/organization', label: 'Settings', icon: <Settings size={18} /> },
    ],
  },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4" aria-label="Main">
      <div className="hidden px-2 pt-1 md:block">
        <Logo />
      </div>

      <div className="flex flex-col gap-3">
        <OrganizationSwitcher onNavigate={onNavigate} />
        <ProjectSelector />
        <EnvironmentSelector />
      </div>

      {NAV_SECTIONS.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title && (
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted uppercase">{section.title}</p>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-light text-brand-dark' : 'text-muted hover:bg-slate-100 hover:text-ink'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
