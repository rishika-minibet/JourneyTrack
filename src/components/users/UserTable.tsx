import type { User } from '../../types/user';
import { UserRow } from './UserRow';

const COLUMNS = ['User', 'Email', 'Last Seen', 'Signed Up', 'Account ID'];

export function UserTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-y border-line bg-slate-50 text-xs font-medium tracking-wide text-muted uppercase">
            {COLUMNS.map((column) => (
              <th key={column} className="px-5 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-5 py-12 text-center text-muted">
                No users match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
