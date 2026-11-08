import { CircleCheck, MessageSquare, Paperclip } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../utils/cx'
import { excerpt, fullName, pluralize, timeAgo } from '../utils/format'
import { CourseBadge, DifficultyBadge } from './StatusBadges'
import { Avatar } from './ui/Avatar'
import { Skeleton } from './ui/Spinner'

export function QuestionCard({ question, compact = false }) {
  const { id, title, content, course, topic, difficulty, author, createdAt, answerCount, verifiedAnswerCount, attachments } = question
  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-raised">
      <div className="flex flex-wrap items-center gap-2">
        <CourseBadge course={course} />
        {topic && <span className="text-xs font-medium text-slate-500">{topic.name}</span>}
        <span className="ml-auto">
          <DifficultyBadge difficulty={difficulty} />
        </span>
      </div>

      <h3 className="mt-3 text-base leading-snug font-semibold text-slate-900 group-hover:text-brand-700">
        <Link to={`/questions/${id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {title}
        </Link>
      </h3>
      {!compact && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{excerpt(content, 220)}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <Avatar user={author} size="xs" />
          <span className="font-medium text-slate-700">{fullName(author)}</span>
          <span aria-hidden>·</span>
          <time dateTime={createdAt}>{timeAgo(createdAt)}</time>
        </span>
        <span className="ml-auto flex items-center gap-3">
          {attachments.length > 0 && (
            <span className="flex items-center gap-1" title="Has attachments">
              <Paperclip className="size-3.5" aria-hidden />
              {attachments.length}
              <span className="sr-only">attachments</span>
            </span>
          )}
          <span className={cx('flex items-center gap-1', answerCount === 0 && 'text-amber-700')}>
            <MessageSquare className="size-3.5" aria-hidden />
            {answerCount === 0 ? 'No answers yet' : pluralize(answerCount, 'answer')}
          </span>
          {verifiedAnswerCount > 0 && (
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <CircleCheck className="size-3.5" aria-hidden />
              Verified answer
            </span>
          )}
        </span>
      </div>
    </article>
  )
}

export function QuestionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-2/3" />
      <Skeleton className="mt-5 h-4 w-40" />
    </div>
  )
}
