import { ExternalLink, FilePlus2, FileQuestion, MessageSquare, MessagesSquare, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CourseBadge, DifficultyBadge, VerificationBadge } from '../components/StatusBadges'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Spinner'
import { Tabs } from '../components/ui/Tabs'
import { VERIFICATION_STATUS } from '../data/models'
import { AnswerForm } from '../features/answers/AnswerForm'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useToast } from '../hooks/useToast'
import { answersApi, errorMessage, questionsApi } from '../services/api'
import { excerpt, formatDate, fullName, pluralize } from '../utils/format'

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  )
}

function QuestionsTab({ state }) {
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      await questionsApi.deleteQuestion(pendingDelete.id)
      toast.success('Question deleted')
      state.reload()
    } catch (error) {
      toast.error('Could not delete question', errorMessage(error))
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  if (state.error) return <Card><ErrorState error={state.error} onRetry={state.reload} /></Card>
  if (!state.data) return <ListSkeleton />
  if (!state.data.length)
    return (
      <Card>
        <EmptyState icon={FileQuestion} title="You haven’t uploaded any questions" description="Questions you upload will appear here so you can edit or remove them." action={<ButtonLink to="/questions/new" icon={FilePlus2}>Upload question</ButtonLink>} />
      </Card>
    )

  return (
    <>
      <ul className="space-y-3">
        {state.data.map((q) => (
          <li key={q.id}>
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CourseBadge course={q.course} />
                  <span className="text-xs text-slate-500">{q.topic?.name}</span>
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <Link to={`/questions/${q.id}`} className="mt-2 block font-semibold text-slate-900 hover:text-brand-700">
                  {q.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  Uploaded {formatDate(q.createdAt)} · {q.answerCount ? pluralize(q.answerCount, 'answer') : 'No answers yet'}
                  {q.verifiedAnswerCount > 0 && <span className="font-medium text-emerald-700"> · {q.verifiedAnswerCount} verified</span>}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <ButtonLink to={`/questions/${q.id}`} variant="ghost" size="sm" icon={ExternalLink}>
                  Open
                </ButtonLink>
                <ButtonLink to={`/questions/${q.id}/edit`} variant="ghost" size="sm" icon={Pencil}>
                  Edit
                </ButtonLink>
                <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setPendingDelete(q)}>
                  Delete
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this question?"
        description={pendingDelete && `“${pendingDelete.title}” and its ${pluralize(pendingDelete.answerCount, 'answer')} will be permanently deleted.`}
        confirmLabel="Delete question"
      />
    </>
  )
}

function AnswersTab({ state }) {
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const save = async (values) => {
    const wasVerified = editing.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED
    const updated = await answersApi.updateAnswer(editing.id, values)
    toast.success('Answer updated', wasVerified && updated.verificationStatus === VERIFICATION_STATUS.UNVERIFIED ? 'Its verification was reset and it will be reviewed again.' : undefined)
    setEditing(null)
    state.reload()
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await answersApi.deleteAnswer(pendingDelete.id)
      toast.success('Answer deleted')
      state.reload()
    } catch (error) {
      toast.error('Could not delete answer', errorMessage(error))
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  if (state.error) return <Card><ErrorState error={state.error} onRetry={state.reload} /></Card>
  if (!state.data) return <ListSkeleton />
  if (!state.data.length)
    return (
      <Card>
        <EmptyState icon={MessagesSquare} title="You haven’t posted any answers" description="Answer a question you know well. Verified answers help everyone revise." action={<ButtonLink to="/questions">Find a question</ButtonLink>} />
      </Card>
    )

  return (
    <>
      <ul className="space-y-3">
        {state.data.map((a) => (
          <li key={a.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {a.question ? (
                    <Link to={`/questions/${a.questionId}#answer-${a.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {a.question.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-500">Deleted question</span>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500">
                    {a.question?.course?.code} · Answered {formatDate(a.createdAt)}
                  </p>
                </div>
                <VerificationBadge status={a.verificationStatus} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{excerpt(a.content, 240)}</p>
              {a.reviewer && (
                <p className="mt-2 text-xs text-slate-500">
                  Reviewed by {fullName(a.reviewer)} on {formatDate(a.verifiedAt)}
                  {a.verificationHistory[0]?.note && <span className="text-slate-600"> — “{a.verificationHistory[0].note}”</span>}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                <ButtonLink to={`/questions/${a.questionId}#answer-${a.id}`} variant="ghost" size="sm" icon={ExternalLink}>
                  Open thread
                </ButtonLink>
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(a)}>
                  Edit
                </Button>
                <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setPendingDelete(a)}>
                  Delete
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit answer" description={editing?.question?.title} size="lg">
        {editing && (
          <>
            {editing.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED && (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">This answer is verified. Changing its text will reset it to Unverified so it can be reviewed again.</p>
            )}
            <AnswerForm key={editing.id} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} submitLabel="Save changes" autoFocus />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this answer?"
        description="Your answer and its verification status will be permanently deleted."
        confirmLabel="Delete answer"
      />
    </>
  )
}

export function MyContributionsPage() {
  useDocumentTitle('My contributions')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'answers' ? 'answers' : 'questions'
  const questions = useAsync(() => questionsApi.listMyQuestions(), [])
  const answers = useAsync(() => answersApi.listMyAnswers(), [])

  return (
    <div>
      <PageHeader title="My contributions" description="Manage the questions you’ve uploaded and the answers you’ve posted." />
      <Tabs
        label="Contribution type"
        className="mb-5 w-fit"
        value={tab}
        onChange={(next) => setParams(next === 'answers' ? { tab: 'answers' } : {}, { replace: true })}
        tabs={[
          { id: 'questions', label: 'Questions', icon: FileQuestion, count: questions.data?.length },
          { id: 'answers', label: 'Answers', icon: MessageSquare, count: answers.data?.length },
        ]}
      />
      <div role="tabpanel">{tab === 'questions' ? <QuestionsTab state={questions} /> : <AnswersTab state={answers} />}</div>
    </div>
  )
}
