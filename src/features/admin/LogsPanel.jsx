import { ScrollText, ShieldAlert } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Spinner'
import { Tabs } from '../../components/ui/Tabs'
import { LOG_ACTION_LABELS } from '../../data/models'
import { useAsync } from '../../hooks/useAsync'
import { adminApi } from '../../services/api'
import { formatDateTime, fullName } from '../../utils/format'
import { VerificationActivity } from '../verification/VerificationActivity'

const ACTION_TONES = { QuestionDeleted: 'danger', AnswerDeleted: 'danger', RoleChanged: 'warning' }

function LogTable({ state, columns, empty }) {
  if (state.error) return <Card><ErrorState error={state.error} onRetry={state.reload} /></Card>
  if (!state.data) return <Skeleton className="h-64 rounded-2xl" />
  if (!state.data.length) return <Card>{empty}</Card>
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-slate-100 text-xs text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.label} scope="col" className="px-5 py-3 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 align-top">
          {state.data.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.label} className="px-5 py-3">{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

const person = (user, fallback = 'Anonymous') => (
  <span className="flex items-center gap-2 whitespace-nowrap">
    <Avatar user={user} size="xs" />
    <span className="font-medium text-slate-800">{user ? fullName(user) : fallback}</span>
  </span>
)

const when = (iso) => <time dateTime={iso} className="whitespace-nowrap text-slate-500">{formatDateTime(iso)}</time>

function ModerationLog() {
  const logs = useAsync(() => adminApi.listModerationLogs(), [])
  return (
    <LogTable
      state={logs}
      empty={<EmptyState icon={ScrollText} title="No moderation actions recorded" />}
      columns={[
        { label: 'When', render: (r) => when(r.createdAt) },
        { label: 'Administrator', render: (r) => person(r.actor) },
        { label: 'Action', render: (r) => <Badge tone={ACTION_TONES[r.action] ?? 'neutral'}>{LOG_ACTION_LABELS[r.action] ?? r.action}</Badge> },
        { label: 'Target', render: (r) => <span className="text-slate-700">{r.summary}</span> },
        { label: 'Reason', render: (r) => <span className="text-slate-500">{r.reason || '—'}</span> },
      ]}
    />
  )
}

function AccessLog() {
  const logs = useAsync(() => adminApi.listAccessLogs(), [])
  return (
    <LogTable
      state={logs}
      empty={<EmptyState icon={ShieldAlert} title="No unauthorized access attempts" />}
      columns={[
        { label: 'When', render: (r) => when(r.createdAt) },
        { label: 'User', render: (r) => person(r.user) },
        { label: 'Resource', render: (r) => <span className="text-slate-700">{r.resource}</span> },
        { label: 'Attempted action', render: (r) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{r.action}</code> },
      ]}
    />
  )
}

const LOGS = { moderation: ModerationLog, verification: VerificationActivity, access: AccessLog }

export function LogsPanel() {
  const [params, setParams] = useSearchParams()
  const log = LOGS[params.get('log')] ? params.get('log') : 'moderation'
  const Log = LOGS[log]
  return (
    <div className="space-y-4">
      <Tabs
        label="Log type"
        className="w-fit"
        value={log}
        onChange={(next) => setParams({ tab: 'logs', log: next }, { replace: true })}
        tabs={[
          { id: 'moderation', label: 'Moderation' },
          { id: 'verification', label: 'Verification activity' },
          { id: 'access', label: 'Unauthorized access' },
        ]}
      />
      <Log />
    </div>
  )
}
