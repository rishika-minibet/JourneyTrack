import { useEffect, useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import type { AssignableRole } from '../../types/account';
import { useWorkspace } from '../../hooks/useWorkspace';
import { assignableRoles, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { simulateLatency } from '../../lib/browser';
import { isValidEmail } from '../../lib/validation';
import { Button } from '../ui/Button';
import { FormAlert, SelectField, TextField } from '../ui/Field';
import { Modal, ModalFooter } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { organization, role, actions } = useWorkspace();
  const notify = useToast();
  const roles = assignableRoles(role);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableRole>('member');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setInviteRole('member');
    setSubmitted(false);
    setFormError(undefined);
  }, [open]);

  const emailError = !email.trim() ? 'Email is required.' : !isValidEmail(email) ? 'Enter a valid email address.' : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(undefined);
    if (emailError || !organization) return;
    setSaving(true);
    await simulateLatency(300);
    const result = actions.inviteMember(organization.id, { email, role: inviteRole });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    notify(`Invitation for ${result.value.email} is pending. No email was sent (prototype).`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite member" description={`Invite a teammate to ${organization?.name}.`}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="Email"
          type="email"
          icon={<Mail size={16} />}
          placeholder="teammate@company.com"
          value={email}
          autoFocus
          onChange={(event) => setEmail(event.target.value)}
          error={submitted ? emailError : undefined}
        />
        <SelectField
          label="Role"
          value={inviteRole}
          onChange={(event) => setInviteRole(event.target.value as AssignableRole)}
          hint={ROLE_DESCRIPTIONS[inviteRole]}
        >
          {roles.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </SelectField>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Send invitation
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
