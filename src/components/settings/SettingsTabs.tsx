import { NavLink } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';

/** Settings sections. Projects and Environments link to their management pages. */
export function SettingsTabs() {
  const { project } = useWorkspace();
  const tabs = [
    { to: '/settings/organization', label: 'General' },
    { to: '/settings/members', label: 'Members' },
    { to: '/projects', label: 'Projects' },
    ...(project ? [{ to: `/projects/${project.id}/environments`, label: 'Environments' }] : []),
  ];

  return (
    <nav aria-label="Settings sections" className="mb-6 flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `-mb-px border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
