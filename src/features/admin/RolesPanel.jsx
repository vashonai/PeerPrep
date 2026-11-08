import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { RoleBadge } from '../../components/StatusBadges'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState'
import { Input, Select } from '../../components/ui/Form'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Spinner'
import { ROLES, ROLE_LABELS } from '../../config/roles'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useToast } from '../../hooks/useToast'
import { adminApi, errorMessage } from '../../services/api'
import { cx } from '../../utils/cx'
import { formatDate, fullName } from '../../utils/format'

export function RolesPanel() {
  const toast = useToast()
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [change, setChange] = useState(null) // { user, role }
  const [saving, setSaving] = useState(false)
  const q = useDebouncedValue(keyword.trim(), 300)
  const users = useAsync(() => adminApi.listUsers({ q, role: roleFilter }), [q, roleFilter])

  const confirm = async (reason) => {
    setSaving(true)
    try {
      await adminApi.changeUserRole(change.user.id, { role: change.role, reason })
      toast.success('Role updated', `${fullName(change.user)} is now a ${ROLE_LABELS[change.role]}.`)
      users.reload()
    } catch (error) {
      toast.error('Could not change role', errorMessage(error))
    } finally {
      setSaving(false)
      setChange(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <Input type="search" icon={Search} aria-label="Search users" placeholder="Search by name or email" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <Select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {Object.values(ROLES).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </Select>
      </div>

      {users.error ? (
        <Card><ErrorState error={users.error} onRetry={users.reload} /></Card>
      ) : !users.data ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : users.data.length === 0 ? (
        <Card><EmptyState icon={Users} title="No users found" /></Card>
      ) : (
        <Card className={cx('overflow-x-auto', users.loading && 'opacity-60')}>
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">User</th>
                <th scope="col" className="px-5 py-3 font-medium">Current role</th>
                <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                <th scope="col" className="px-5 py-3 font-medium">Change role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.data.map((u) => {
                const locked = u.isSelf || u.isDemo
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {fullName(u)} {u.isSelf && <span className="font-normal text-slate-400">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="w-52">
                        <Select
                          aria-label={`Role for ${fullName(u)}`}
                          value={u.role}
                          disabled={locked}
                          onChange={(e) => setChange({ user: u, role: e.target.value })}
                        >
                          {Object.values(ROLES).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </Select>
                        {locked && <p className="mt-1 text-xs text-slate-400">{u.isSelf ? 'You can’t change your own role' : 'Demo roles are fixed'}</p>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(change)}
        onClose={() => setChange(null)}
        onConfirm={confirm}
        loading={saving}
        tone="warning"
        title="Change user role?"
        description={change && `${fullName(change.user)} will change from ${ROLE_LABELS[change.user.role]} to ${ROLE_LABELS[change.role]}. Their permissions update on their next request.`}
        confirmLabel="Change role"
        reasonLabel="Reason"
        reasonPlaceholder="e.g. Confirmed faculty member, elected class representative"
      />
    </div>
  )
}
