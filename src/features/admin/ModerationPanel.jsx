import { ExternalLink, Inbox, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { CourseBadge, VerificationBadge } from '../../components/StatusBadges'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Form'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Spinner'
import { Tabs } from '../../components/ui/Tabs'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useToast } from '../../hooks/useToast'
import { adminApi, answersApi, errorMessage, questionsApi } from '../../services/api'
import { cx } from '../../utils/cx'
import { excerpt, fullName, pluralize, timeAgo } from '../../utils/format'

const PAGE = 15

export function ModerationPanel() {
  const toast = useToast()
  const [type, setType] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [visible, setVisible] = useState(PAGE)
  const [target, setTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const q = useDebouncedValue(keyword.trim(), 300)
  const queue = useAsync(() => adminApi.listModerationQueue({ type, q }), [type, q])

  const remove = async (reason) => {
    setDeleting(true)
    try {
      if (target.type === 'question') await questionsApi.deleteQuestion(target.id, { reason })
      else await answersApi.deleteAnswer(target.id, { reason })
      toast.success(target.type === 'question' ? 'Question removed' : 'Answer removed', 'Recorded in the moderation log.')
      queue.reload()
    } catch (error) {
      toast.error('Could not remove content', errorMessage(error))
    } finally {
      setDeleting(false)
      setTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          label="Content type"
          value={type}
          onChange={(next) => {
            setType(next)
            setVisible(PAGE)
          }}
          tabs={[
            { id: 'all', label: 'All content' },
            { id: 'question', label: 'Questions' },
            { id: 'answer', label: 'Answers' },
          ]}
        />
        <div className="sm:w-80">
          <Input type="search" icon={Search} aria-label="Search content" placeholder="Search text or author" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {queue.error ? (
        <Card><ErrorState error={queue.error} onRetry={queue.reload} /></Card>
      ) : !queue.data ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : queue.data.length === 0 ? (
        <Card><EmptyState icon={Inbox} title="Nothing to review" description="No content matches the current filters." /></Card>
      ) : (
        <Card className={cx('overflow-hidden', queue.loading && 'opacity-60')}>
          <p className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">Newest first · {pluralize(queue.data.length, 'item')}</p>
          <ul className="divide-y divide-slate-100">
            {queue.data.slice(0, visible).map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.type === 'question' ? 'brand' : 'teal'}>{item.type === 'question' ? 'Question' : 'Answer'}</Badge>
                    <CourseBadge course={item.meta.course} />
                    {item.type === 'answer' && <VerificationBadge status={item.meta.verificationStatus} />}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{item.type === 'answer' ? `Re: ${item.title}` : item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{excerpt(item.body, 180)}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Avatar user={item.author} size="xs" />
                    {fullName(item.author)} · {timeAgo(item.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link
                    to={`/questions/${item.questionId}${item.type === 'answer' ? `#answer-${item.id}` : ''}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ExternalLink className="size-4" aria-hidden /> View
                  </Link>
                  <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setTarget(item)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {visible < queue.data.length && (
            <div className="border-t border-slate-100 p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setVisible((v) => v + PAGE)}>
                Show more ({queue.data.length - visible} remaining)
              </Button>
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title={target?.type === 'question' ? 'Remove this question?' : 'Remove this answer?'}
        description={target && (target.type === 'question' ? `“${target.title}” and all of its answers will be permanently deleted.` : `This answer by ${fullName(target.author)} will be permanently deleted.`)}
        confirmLabel="Remove"
        reasonLabel="Reason for removal"
        reasonPlaceholder="e.g. Spam, academic dishonesty, inappropriate content"
      />
    </div>
  )
}
