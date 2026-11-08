import { ChevronDown, CircleCheck, Clock, ExternalLink, History, Inbox, ListChecks, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AttachmentList } from '../components/Attachments'
import { CourseBadge, VerificationBadge } from '../components/StatusBadges'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { Input, Select } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Spinner'
import { Tabs } from '../components/ui/Tabs'
import { VerificationActivity } from '../features/verification/VerificationActivity'
import { VerificationActions } from '../features/verification/VerificationActions'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { verificationApi } from '../services/api'
import { cx } from '../utils/cx'
import { formatDateTime, fullName, timeAgo } from '../utils/format'

function ReviewItem({ answer, onVerified }) {
  const [expanded, setExpanded] = useState(false)
  const long = answer.content.length > 320
  const latestNote = answer.verificationHistory.find((v) => v.kind === 'review')?.note

  return (
    <Card as="article" className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CourseBadge course={answer.question.course} />
        <span className="text-xs text-slate-500">{answer.question.topic?.name}</span>
        <span className="ml-auto">
          <VerificationBadge status={answer.verificationStatus} />
        </span>
      </div>
      <Link to={`/questions/${answer.questionId}#answer-${answer.id}`} className="group mt-2 inline-flex items-start gap-1.5 font-semibold text-slate-900 hover:text-brand-700">
        {answer.question.title}
        <ExternalLink className="mt-1 size-3.5 shrink-0 text-slate-400 group-hover:text-brand-600" aria-label="Open question" />
      </Link>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Avatar user={answer.author} size="xs" />
          <span className="font-medium text-slate-700">{fullName(answer.author)}</span>
          <span aria-hidden>·</span>
          <time dateTime={answer.createdAt} title={formatDateTime(answer.createdAt)}>
            {timeAgo(answer.createdAt)}
          </time>
        </div>
        <p className={cx('mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700', !expanded && long && 'line-clamp-5')}>{answer.content}</p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            {expanded ? 'Show less' : 'Show full answer'}
            <ChevronDown className={cx('size-3.5 transition', expanded && 'rotate-180')} aria-hidden />
          </button>
        )}
        {answer.attachments.length > 0 && (
          <div className="mt-3">
            <AttachmentList attachments={answer.attachments} />
          </div>
        )}
      </div>

      {answer.reviewer && (
        <p className="mt-3 text-xs text-slate-500">
          Decided by <span className="font-medium text-slate-700">{fullName(answer.reviewer)}</span> · {formatDateTime(answer.verifiedAt)}
          {latestNote && <span className="text-slate-600"> — “{latestNote}”</span>}
        </p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <VerificationActions answer={answer} onVerified={onVerified} />
      </div>
    </Card>
  )
}

function QueueList({ status, courseId, q, onChanged }) {
  const queue = useAsync(() => verificationApi.listVerificationQueue({ status, courseId, q }), [status, courseId, q])

  if (queue.error) return <Card><ErrorState error={queue.error} onRetry={queue.reload} /></Card>
  if (!queue.data)
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  if (!queue.data.length)
    return (
      <Card>
        {status === 'pending' ? (
          <EmptyState icon={CircleCheck} title="You’re all caught up" description={courseId || q ? 'No unverified answers match these filters.' : 'There are no answers waiting for verification right now.'} />
        ) : (
          <EmptyState icon={Inbox} title="No reviewed answers" description="Answers you and other reviewers verify will appear here." />
        )}
      </Card>
    )

  return (
    <div className={cx('space-y-4', queue.loading && 'opacity-60')}>
      {queue.data.map((answer) => (
        <ReviewItem
          key={answer.id}
          answer={answer}
          onVerified={() => {
            queue.reload()
            onChanged()
          }}
        />
      ))}
    </div>
  )
}

export function ReviewPage() {
  useDocumentTitle('Verification')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = ['pending', 'reviewed', 'activity'].includes(params.get('tab')) ? params.get('tab') : 'pending'
  const [courseId, setCourseId] = useState('')
  const [keyword, setKeyword] = useState('')
  const q = useDebouncedValue(keyword.trim(), 300)
  const { courses } = useCourses()
  const pendingCount = useAsync(() => verificationApi.listVerificationQueue({ status: 'pending' }).then((list) => list.length), [tab])

  return (
    <div>
      <PageHeader
        eyebrow={`Signed in as ${fullName(user)}`}
        title="Answer verification"
        description="Review student answers and mark them as correct or incorrect. Your decision and its timestamp are recorded with each answer."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          label="Verification view"
          value={tab}
          onChange={(next) => setParams(next === 'pending' ? {} : { tab: next }, { replace: true })}
          tabs={[
            { id: 'pending', label: 'Awaiting review', icon: Clock, count: pendingCount.data },
            { id: 'reviewed', label: 'Reviewed', icon: ListChecks },
            { id: 'activity', label: 'Activity', icon: History },
          ]}
        />
        {tab !== 'activity' && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_14rem] lg:w-[30rem]">
            <Input type="search" icon={Search} aria-label="Search answers" placeholder="Search question or answer text" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <Select aria-label="Filter by course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {tab === 'activity' ? (
        <VerificationActivity />
      ) : (
        <QueueList key={tab} status={tab} courseId={courseId} q={q} onChanged={pendingCount.reload} />
      )}
    </div>
  )
}
