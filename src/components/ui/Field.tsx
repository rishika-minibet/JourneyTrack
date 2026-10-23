import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, optional, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${htmlFor}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
  fieldClassName?: string;
}

export function TextField({ label, error, hint, optional, icon, trailing, fieldClassName, ...props }: TextFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} optional={optional} className={fieldClassName}>
      <Input {...props} id={id} icon={icon} trailing={trailing} invalid={Boolean(error)} aria-describedby={describedBy} />
    </Field>
  );
}

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="rounded-md p-1.5 text-muted hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

export const selectClasses =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand-light focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  fieldClassName?: string;
}

export function SelectField({ label, error, hint, fieldClassName, children, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} className={fieldClassName}>
      <select {...props} id={id} className={selectClasses} aria-invalid={Boolean(error) || undefined}>
        {children}
      </select>
    </Field>
  );
}

/** Inline alert for form-level errors and notices. */
export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  const styles = tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-sky-200 bg-sky-50 text-sky-800';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}
