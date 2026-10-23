import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
  separatorBefore?: boolean;
}

interface DropdownMenuProps {
  /** Accessible name for the trigger button. */
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  header?: ReactNode;
  align?: 'left' | 'right';
  triggerClassName?: string;
  menuClassName?: string;
}

export function DropdownMenu({
  label,
  trigger,
  items,
  header,
  align = 'right',
  triggerClassName = 'rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink',
  menuClassName = 'w-52',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const options = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    options[(next + options.length) % options.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`absolute z-30 mt-1 rounded-xl border border-line bg-white py-1 shadow-lg ${menuClassName} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {header && <div className="border-b border-line px-3 py-2">{header}</div>}
          {items.map((item) => (
            <div key={item.key}>
              {item.separatorBefore && <div className="my-1 border-t border-line" />}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm focus:bg-slate-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink hover:bg-slate-50'
                }`}
              >
                {item.icon && <span className="shrink-0 text-muted">{item.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.checked && <Check size={16} className="shrink-0 text-brand" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
