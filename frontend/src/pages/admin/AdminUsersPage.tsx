import { mockAdminUsers } from '@/data/mock/mockAdminData'
import { formatDateLabel } from '@/utils/format'

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Users</h1>
      <p className="mb-5 text-sm text-ink-500">{mockAdminUsers.length} accounts on the platform.</p>

      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {mockAdminUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                <td className="px-4 py-3 text-ink-600">{u.phone}</td>
                <td className="px-4 py-3 text-ink-600">{u.location}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {u.roles.map((r) => (
                      <span key={r} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-700">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-500">{formatDateLabel(u.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
