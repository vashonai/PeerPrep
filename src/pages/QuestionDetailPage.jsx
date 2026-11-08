import { ChevronRight, LogIn, MessagesSquare, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AttachmentList } from '../components/Attachments'
import { CourseBadge, DifficultyBadge, RoleBadge } from '../components/StatusBadges'
import { Avatar } from '../components/ui/Avatar'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/Modal'
import { PageSpinner, Skeleton } from '../components/ui/Spinner'
import { PERMISSIONS, ROLES, can } from '../config/roles'
import { AnswerForm } from '../features/answers/AnswerForm'
import { AnswerItem } from '../features/answers/AnswerItem'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useToast } from '../hooks/useToast'
import { answersApi, errorMessage, questionsApi } from '../services/api'
import { formatDate, formatDateTime, fullName, pluralize } from '../utils/format'

function QuestionActions({ question }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = user?.id === question.authorId && can(user, PERMISSIONS.CONTENT_EDIT_OWN)
  const canModerate = !isOwner && can(user, PERMISSIONS.CONTENT_MODERATE)
  if (!isOwner && !canModerate) return null

  const remove = async (reason) => {
    setDeleting(true)
    try {
      await questionsApi.deleteQuestion(question.id, { reason })
      toast.success('Question deleted', 'The question and its answers were removed.')
      navigate(isOwner ? '/my-contributions' : '/questions', { replace: true })
    } catch (error) {
      toast.error('Could not delete question', errorMessage(error))
      setDeleting(false)
      setConfirm(false)
    }
  }

  return (
    <div className="flex gap-1">
      {isOwner && (
        <ButtonLink to={`/questions/${question.id}/edit`} variant="ghost" size="sm" icon={Pencil}>
          Edit
        </ButtonLink>
      )}
      <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>
        {canModerate ? 'Remove' : 'Delete'}
      </Button>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={deleting}
        title={canModerate ? 'Remove this question?' : 'Delete your question?'}
        description={`This permanently deletes the question and ${pluralize(question.answerCount, 'answer')}.${canModerate ? ' The action is recorded in the moderation log.' : ''}`}
        confirmLabel={canModerate ? 'Remove question' : 'Delete question'}
        reasonLabel={canModerate ? 'Reason for removal' : undefined}
        reasonPlaceholder="e.g. Spam, duplicate, inappropriate content"
      />
    </div>
  )
}

function AnswerComposer({ questionId, onCreated }) {
  const { user } = useAuth()
  const location = useLocation()
  const toast = useToast()

  if (!user) {
    return (
      <Card className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Know how to solve this?</p>
          <p className="mt-0.5 text-sm text-slate-500">Sign in to post an answer and help your classmates.</p>
        </div>
        <ButtonLink to="/login" state={{ from: location.pathname }} icon={LogIn}>
          Sign in to answer
        </ButtonLink>
      </Card>
    )
  }
  if (!can(user, PERMISSIONS.ANSWER_CREATE)) {
    return <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">As a reviewer, you can verify the answers above. Posting answers is reserved for students.</p>
  }

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Post an answer</h3>
      <AnswerForm
        onSubmit={async (values) => {
          const answer = await answersApi.createAnswer(questionId, values)
          toast.success('Answer posted', 'It will appear as Unverified until a reviewer checks it.')
          onCreated(answer)
        }}
      />
    </Card>
  )
}

export function QuestionDetailPage() {
  const { id } = useParams()
  const { hash } = useLocation()
  const question = useAsync(() => questionsApi.getQuestion(id), [id])
  const answers = useAsync(() => answersApi.listAnswers(id), [id])
  const [localAnswers, setLocalAnswers] = useState(null)
  const [answersFor, setAnswersFor] = useState(null)
  useDocumentTitle(question.data?.title ?? 'Question')

  // Local copy so edits, verifications and deletions update instantly.
  if (answers.data && answersFor !== answers.data) {
    setAnswersFor(answers.data)
    setLocalAnswers(answers.data)
  }

  // Deep links such as /questions/:id#answer-:answerId scroll once answers load.
  const answersLoaded = Boolean(localAnswers)
  useEffect(() => {
    if (answersLoaded && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [answersLoaded, hash])

  if (question.loading && !question.data) return <PageSpinner label="Loading question…" />
  if (question.error) {
    return (
      <Card>
        <ErrorState error={question.error} onRetry={question.error.code === 'NOT_FOUND' ? undefined : question.reload} />
        {question.error.code === 'NOT_FOUND' && (
          <div className="pb-10 text-center">
            <ButtonLink to="/questions" variant="secondary">Back to Explore</ButtonLink>
          </div>
        )}
      </Card>
    )
  }

  const q = question.data
  const list = localAnswers ?? []
  const replace = (updated) => setLocalAnswers((current) => current.map((a) => (a.id === updated.id ? updated : a)))

  return (
    <div className="mx-auto max-w-4xl">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link to="/questions" className="hover:text-slate-800">Explore</Link>
        <ChevronRight className="size-4 text-slate-300" aria-hidden />
        <Link to={`/questions?course=${q.courseId}`} className="hover:text-slate-800">{q.course?.code}</Link>
        <ChevronRight className="size-4 text-slate-300" aria-hidden />
        <Link to={`/questions?course=${q.courseId}&topic=${q.topicId}`} className="hover:text-slate-800">{q.topic?.name}</Link>
      </nav>

      <Card as="article" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <CourseBadge course={q.course} />
          <span className="text-sm text-slate-500">{q.course?.title}</span>
          <span className="text-slate-300" aria-hidden>·</span>
          <span className="text-sm font-medium text-slate-600">{q.topic?.name}</span>
          <span className="ml-auto">
            <DifficultyBadge difficulty={q.difficulty} />
          </span>
        </div>
        <h1 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{q.title}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar user={q.author} size="sm" />
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{fullName(q.author)}</span>
              {q.author && q.author.role !== ROLES.STUDENT && <RoleBadge role={q.author.role} className="ml-2" />}
              <span className="block text-xs text-slate-500">
                Uploaded <time dateTime={q.createdAt} title={formatDateTime(q.createdAt)}>{formatDate(q.createdAt)}</time>
                {q.updatedAt !== q.createdAt && ` · edited ${formatDate(q.updatedAt)}`}
              </span>
            </p>
          </div>
          <QuestionActions question={{ ...q, answerCount: list.length }} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700">{q.content}</div>
        {q.attachments.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Attached files</h2>
            <AttachmentList attachments={q.attachments} />
          </div>
        )}
      </Card>

      <section aria-labelledby="answers-heading" className="mt-8">
        <h2 id="answers-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MessagesSquare className="size-5 text-brand-600" aria-hidden />
          {localAnswers ? pluralize(list.length, 'answer') : 'Answers'}
        </h2>

        {answers.error ? (
          <Card>
            <ErrorState error={answers.error} onRetry={answers.reload} />
          </Card>
        ) : !localAnswers ? (
          <div className="space-y-3">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : list.length === 0 ? (
          <Card>
            <EmptyState icon={MessagesSquare} title="No answers yet" description="Be the first to share how you would approach this question." />
          </Card>
        ) : (
          <div className="space-y-4">
            {list.map((answer) => (
              <AnswerItem key={answer.id} answer={answer} onChanged={replace} onDeleted={(answerId) => setLocalAnswers((current) => current.filter((a) => a.id !== answerId))} />
            ))}
          </div>
        )}

        <div className="mt-6">
          <AnswerComposer questionId={q.id} onCreated={(answer) => setLocalAnswers((current) => [...(current ?? []), answer])} />
        </div>
      </section>
    </div>
  )
}
