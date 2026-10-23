import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { TextField } from './Field';
import { Modal, ModalFooter } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  /** When set, the user must type this exact text before confirming. */
  confirmationText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  confirmationText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const blocked = confirmationText !== undefined && typed !== confirmationText;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="text-sm text-muted">{description}</div>
      {confirmationText !== undefined && (
        <TextField
          fieldClassName="mt-4"
          label={`Type "${confirmationText}" to confirm`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoFocus
        />
      )}
      <ModalFooter>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} disabled={blocked} loading={busy}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
