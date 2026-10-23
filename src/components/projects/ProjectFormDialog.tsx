import { useEffect, useState, type FormEvent } from 'react';
import type { Project } from '../../types/account';
import { useWorkspace } from '../../hooks/useWorkspace';
import { simulateLatency } from '../../lib/browser';
import { emptyToUndefined, optionalUrlError } from '../../lib/validation';
import { Button } from '../ui/Button';
import { FormAlert, TextField } from '../ui/Field';
import { Modal, ModalFooter } from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Edit this project; omit to create a new one. */
  project?: Project;
  onSaved?: (project: Project) => void;
}

export function ProjectFormDialog({ open, onClose, project, onSaved }: ProjectFormDialogProps) {
  const { organization, actions } = useWorkspace();
  const notify = useToast();
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [withDefaults, setWithDefaults] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setWebsiteUrl(project?.websiteUrl ?? '');
    setWithDefaults(true);
    setSubmitted(false);
    setFormError(undefined);
  }, [open, project]);

  const errors = {
    name: name.trim() ? undefined : 'Project name is required.',
    websiteUrl: optionalUrlError(websiteUrl),
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!organization || errors.name || errors.websiteUrl) return;
    setSaving(true);
    await simulateLatency(300);
    const draft = { name, websiteUrl: emptyToUndefined(websiteUrl) };
    const result = project
      ? actions.updateProject(project.id, draft)
      : actions.createProject(
          organization.id,
          draft,
          withDefaults
            ? [
                { name: 'DEV', type: 'development' },
                { name: 'PROD', type: 'production' },
              ]
            : [],
        );
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    notify(project ? 'Project updated.' : `Project "${result.value.name}" created.`);
    onSaved?.(result.value);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'Create project'}
      description={project ? undefined : `Projects belong to ${organization?.name}.`}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="Project name"
          value={name}
          placeholder="Website"
          autoFocus
          onChange={(event) => setName(event.target.value)}
          error={submitted ? errors.name : undefined}
        />
        <TextField
          label="Website URL"
          optional
          type="url"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          error={submitted ? errors.websiteUrl : undefined}
        />
        {!project && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={withDefaults}
              onChange={(event) => setWithDefaults(event.target.checked)}
            />
            Create default DEV and PROD environments
          </label>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
