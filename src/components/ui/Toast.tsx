import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

type Notify = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<Notify | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-brand" />,
  error: <XCircle size={18} className="text-rose-600" />,
  info: <Info size={18} className="text-sky-600" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const notify = useCallback<Notify>(
    (message, tone = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-lg"
          >
            <span className="mt-0.5 shrink-0">{ICONS[toast.tone]}</span>
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded p-0.5 text-muted hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Notify {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error('useToast must be used inside <ToastProvider>');
  return notify;
}
