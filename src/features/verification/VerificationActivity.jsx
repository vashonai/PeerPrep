import { History } from 'lucide-react'
import { Link } from 'react-router'
import { VerificationBadge } from '../../components/StatusBadges'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { verificationApi } from '../../services/api'
import { formatDateTime, fullName } from '../../utils/format'

/** Chronological log of verification decisions, including overrides. */
export function VerificationActivity({ limit = 50 }) {
  const activity = useAsync(() => verificationApi.listVerificationActivity({ limit }), [limit])

  if (activity.error) return <Card><ErrorState error={activity.error} onRetry={activity.reload} /></Card>
  if (!activity.data) return <Skeleton className="h-64 rounded-2xl" />
  if (!activity.data.length)
    return (
      <Card>
        <EmptyState icon={History} title="No verification activity yet" />
      </Card>
    )

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {activity.data.map((record) => (
          <li key={record.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Avatar user={record.reviewer} size="sm" />
              <div className="min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{fullName(record.reviewer)}</span> {record.isOverride ? 'overrode the decision on' : 'verified'} an answer to{' '}
                  {record.question ? (
                    <Link to={`/questions/${record.questionId}${record.answerExists ? `#answer-${record.answerId}` : ''}`} className="font-medium text-brand-700 hover:underline">
                      {record.question.title}
                    </Link>
                  ) : (
                    <span className="text-slate-500">a deleted question</span>
                  )}
                </p>
                {record.note && <p className="mt-0.5 truncate text-xs text-slate-500">“{record.note}”</p>}
                {!record.answerExists && record.question && <p className="mt-0.5 text-xs text-slate-400">The answer has since been deleted.</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
              {record.isOverride && <VerificationBadge status={record.previousStatus} className="opacity-60 line-through" />}
              <VerificationBadge status={record.status} />
              <time className="w-36 text-right text-xs text-slate-500" dateTime={record.createdAt}>
                {formatDateTime(record.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
