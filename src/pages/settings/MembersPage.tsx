import { useState } from 'react';
import { Mail, RotateCw, Trash2, UserPlus, X } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge, RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { InviteMemberDialog } from '../../components/settings/InviteMemberDialog';
import { SettingsTabs } from '../../components/settings/SettingsTabs';
import { useWorkspace } from '../../hooks/useWorkspace';
import { getMembersForOrganization, getPendingInvitations, type MemberRecord } from '../../store/selectors';
import { assignableRoles, canManageMember, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { simulateLatency } from '../../lib/browser';
import type { AssignableRole, Invitation, OrganizationRole } from '../../types/account';
import { formatDate, formatDateTime, timeAgo } from '../../utils/format';

type ConfirmState = { kind: 'remove'; member: MemberRecord } | { kind: 'cancel'; invitation: Invitation } | null;

export function MembersPage() {
  const { db, account, organization, role, actions, can } = useWorkspace();
  const notify = useToast();
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  if (!organization || !account) return null;

  const members = getMembersForOrganization(db, organization.id);
  const invitations = getPendingInvitations(db, organization.id);
  const canInvite = can('members.invite');
  const roleOptions = assignableRoles(role);
  const accountName = (id: string) => db.accounts.find((candidate) => candidate.id === id)?.name ?? 'Unknown';

  const changeRole = (member: MemberRecord, next: AssignableRole) => {
    const result = actions.changeMemberRole(member.membership.id, next);
    notify(result.ok ? `${member.account.name} is now ${ROLE_LABELS[next]}.` : result.error, result.ok ? 'success' : 'error');
  };

  const resend = (invitation: Invitation) => {
    const result = actions.resendInvitation(invitation.id);
    notify(result.ok ? `Invitation to ${invitation.email} re-sent (mock — no email delivered).` : result.error, result.ok ? 'info' : 'error');
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Settings"
        description={`People with access to ${organization.name}.`}
        actions={
          canInvite && (
            <Button icon={<UserPlus size={16} />} onClick={() => setInviting(true)}>
              Invite member
            </Button>
          )
        }
      />
      <SettingsTabs />

      <Card>
        <div className="px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Members ({members.length})</h2>
          <p className="text-xs text-muted">Roles apply to {organization.name} only — a person can have a different role in another organization.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-y border-line bg-slate-50 text-xs font-medium tracking-wide text-muted uppercase">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.account.id === account.id;
                const manageable = canManageMember(role, member.membership.role, isSelf);
                return (
                  <tr key={member.membership.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={member.account.name} />
                        <span className="font-medium text-ink">{member.account.name}</span>
                        {isSelf && <Badge tone="green">You</Badge>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">{member.account.email}</td>
                    <td className="px-5 py-3">
                      {manageable ? (
                        <select
                          aria-label={`Role for ${member.account.name}`}
                          value={member.membership.role}
                          onChange={(event) => changeRole(member, event.target.value as AssignableRole)}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-sm focus:border-brand focus:ring-2 focus:ring-brand-light focus:outline-none"
                        >
                          {roleOptions.map((option) => (
                            <option key={option} value={option}>
                              {ROLE_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={member.membership.role} />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="green">Active</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(member.membership.joinedAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {manageable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => setConfirm({ kind: 'remove', member })}
                          aria-label={`Remove ${member.account.name}`}
                        >
                          Remove
                        </Button>
                      ) : (
                        isSelf &&
                        member.membership.role === 'owner' && (
                          <span className="text-xs text-muted" title="Transfer ownership in General settings first.">
                            Owner can't be removed
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Pending invitations ({invitations.length})</h2>
          <p className="text-xs text-muted">Invitations are accepted automatically when someone signs up with the invited email.</p>
        </div>
        {invitations.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              icon={<Mail size={20} />}
              title="No pending invitations"
              description={canInvite ? 'Invite teammates as Admins or Members.' : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-y border-line bg-slate-50 text-xs font-medium tracking-wide text-muted uppercase">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Invited by</th>
                  <th className="px-5 py-3">Last sent</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink">{invitation.email}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={invitation.role} />
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="amber">Pending</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{accountName(invitation.invitedByUserId)}</td>
                    <td className="px-5 py-3 text-muted" title={formatDateTime(invitation.lastSentAt)}>
                      {timeAgo(invitation.lastSentAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canInvite && (
                        <span className="inline-flex gap-1">
                          <Button variant="ghost" size="sm" icon={<RotateCw size={14} />} onClick={() => resend(invitation)}>
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<X size={14} />}
                            onClick={() => setConfirm({ kind: 'cancel', invitation })}
                          >
                            Cancel
                          </Button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Roles" className="mt-6">
        <dl className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
          {(['owner', 'admin', 'member'] as OrganizationRole[]).map((option) => (
            <div key={option} className="rounded-lg border border-line p-3">
              <dt>
                <RoleBadge role={option} />
              </dt>
              <dd className="mt-2 text-sm text-muted">{ROLE_DESCRIPTIONS[option]}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <InviteMemberDialog open={inviting} onClose={() => setInviting(false)} />
      <ConfirmDialog
        open={confirm?.kind === 'remove'}
        title="Remove member?"
        description={
          confirm?.kind === 'remove' && (
            <>
              <strong className="text-ink">{confirm.member.account.name}</strong> will lose access to {organization.name}. Their
              account and memberships in other organizations are not affected.
            </>
          )
        }
        confirmLabel="Remove member"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.kind !== 'remove') return;
          await simulateLatency(300);
          const result = actions.removeMember(confirm.member.membership.id);
          notify(result.ok ? `${confirm.member.account.name} was removed.` : result.error, result.ok ? 'success' : 'error');
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === 'cancel'}
        title="Cancel invitation?"
        description={confirm?.kind === 'cancel' && <>The invitation for {confirm.invitation.email} will no longer be valid.</>}
        confirmLabel="Cancel invitation"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.kind !== 'cancel') return;
          await simulateLatency(300);
          const result = actions.cancelInvitation(confirm.invitation.id);
          notify(result.ok ? 'Invitation canceled.' : result.error, result.ok ? 'success' : 'error');
          setConfirm(null);
        }}
      />
    </div>
  );
}
