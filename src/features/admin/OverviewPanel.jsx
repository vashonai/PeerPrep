import { ArrowRight, Clock, FilePlus2, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Spinner'
import { LOG_ACTION_LABELS } from '../../data/models'
import { useAsync } from '../../hooks/useAsync'
import { adminApi } from '../../services/api'
import { fullName, timeAgo } from '../../utils/format'

const TILES = [
  { key: 'pendingVerification', label: 'Answers awaiting verification', icon: Clock, to: '/review', tone: 'bg-amber-50 text-amber-600' },
  { key: 'newContentThisWeek', label: 'New questions & answers (7 days)', icon: FilePlus2, to: '/admin?tab=moderation', tone: 'bg-brand-50 text-brand-600' },
  { key: 'accessDeniedThisWeek', label: 'Blocked access attempts (7 days)', icon: ShieldAlert, to: '/admin?tab=logs&log=access', tone: 'bg-red-50 text-red-600' },
  { key: 'users', label: 'Registered users', icon: Users, to: '/admin?tab=roles', tone: 'bg-teal-50 text-teal-600' },
]

export function OverviewPanel() {
  const overview = useAsync(() => adminApi.getAdminOverview(), [])
  const logs = useAsync(() => adminApi.listModerationLogs(), [])
  const access = useAsync(() => adminApi.listAccessLogs(), [])

  if (overview.error) return <Card><ErrorState error={overview.error} onRetry={overview.reload} /></Card>

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map(({ key, label, icon: Icon, to, tone }) => (
          <li key={key}>
            <Link to={to} className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-raised">
              <div className="flex items-center justify-between">
                <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
              </div>
              {overview.data ? <p className="mt-4 text-2xl font-semibold text-slate-900 tabular-nums">{overview.data[key]}</p> : <Skeleton className="mt-4 h-8 w-12" />}
              <p className="mt-0.5 text-sm text-slate-500">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent moderation activity" action={<Link to="/admin?tab=logs" className="text-sm font-medium text-brand-600 hover:text-brand-700">View log</Link>} />
          {!logs.data ? (
            <div className="space-y-2 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : logs.data.length === 0 ? (
            <EmptyState title="No moderation activity yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.data.slice(0, 5).map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">{fullName(log.actor)}</span> · {LOG_ACTION_LABELS[log.action]}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {log.summary} · {timeAgo(log.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Blocked access attempts" action={<Link to="/admin?tab=logs&log=access" className="text-sm font-medium text-brand-600 hover:text-brand-700">View log</Link>} />
          {!access.data ? (
            <div className="space-y-2 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : access.data.length === 0 ? (
            <EmptyState title="No blocked attempts recorded" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {access.data.slice(0, 5).map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">{log.user ? fullName(log.user) : 'Anonymous'}</span> tried to access {log.resource}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{timeAgo(log.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
