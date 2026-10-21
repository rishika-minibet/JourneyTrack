import { useNavigate } from 'react-router-dom';
import type { User } from '../../types/user';
import { formatDateTime, timeAgo } from '../../utils/format';
import { Avatar } from '../ui/Avatar';

const FIVE_MINUTES = 5 * 60_000;

export function UserRow({ user }: { user: User }) {
  const navigate = useNavigate();
  const open = () => navigate(`/users/${user.id}`);
  const isActiveNow = Date.now() - new Date(user.lastSeenAt).getTime() < FIVE_MINUTES;

  return (
    <tr
      onClick={open}
      onKeyDown={(event) => event.key === 'Enter' && open()}
      tabIndex={0}
      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-green-50/60 focus:bg-green-50/60 focus:outline-none"
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <span className="font-medium text-ink">{user.name}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-muted">{user.email}</td>
      <td className={`px-5 py-3 ${isActiveNow ? 'font-medium text-brand' : 'text-ink'}`}>{timeAgo(user.lastSeenAt)}</td>
      <td className="px-5 py-3 text-ink" title={formatDateTime(user.signedUpAt)}>
        {timeAgo(user.signedUpAt)}
      </td>
      <td className="px-5 py-3 font-mono text-xs text-muted">{user.accountId}</td>
    </tr>
  );
}
