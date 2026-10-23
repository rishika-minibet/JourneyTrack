import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  size?: 'md' | 'lg';
}

// Built on the native <dialog> element, which provides focus trapping, Escape
// handling and inert background content.
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-slate-900/40 ${
        size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
      }`}
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
              {description && <div className="mt-1 text-sm text-muted">{description}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-2 rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}
