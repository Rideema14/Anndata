import { useEffect, useState } from 'react'
import { adminService, type AdminUser } from '@/services/adminService'
import { formatDateLabel } from '@/utils/format'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminService
      .listUsers({ limit: 100 })
      .then(({ items, totalItems }) => {
        if (cancelled) return
        setUsers(items)
        setTotalItems(totalItems)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Users</h1>
      <p className="mb-5 text-sm text-ink-500">{totalItems} accounts on the platform.</p>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email / Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                  <td className="px-4 py-3 text-ink-600">{u.email}{u.phone ? ` · ${u.phone}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-700">
                      {u.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.isActive ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-500'}`}>
                      {u.isActive ? 'active' : 'suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDateLabel(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
