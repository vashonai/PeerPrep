import { ArrowRight, BookOpen, CircleCheck, CircleX, Clock, FilePlus2, FileQuestion, MessageSquare, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router'
import { QuestionCard, QuestionCardSkeleton } from '../components/QuestionCard'
import { SearchBar } from '../components/SearchBar'
import { VerificationBadge } from '../components/StatusBadges'
import { ButtonLink } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Spinner'
import { VERIFICATION_STATUS } from '../data/models'
import { CourseGrid } from '../features/questions/CourseGrid'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { answersApi, questionsApi } from '../services/api'
import { excerpt, pluralize, timeAgo } from '../utils/format'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_SUMMARY = [
  { status: VERIFICATION_STATUS.CORRECT, label: 'Correct', icon: CircleCheck, className: 'text-emerald-600 bg-emerald-50' },
  { status: VERIFICATION_STATUS.INCORRECT, label: 'Incorrect', icon: CircleX, className: 'text-red-600 bg-red-50' },
  { status: VERIFICATION_STATUS.UNVERIFIED, label: 'Pending', icon: Clock, className: 'text-slate-600 bg-slate-100' },
]

function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  )
}

function MyAnswersCard({ state }) {
  const answers = state.data ?? []
  return (
    <Card>
      <CardHeader
        icon={MessageSquare}
        title="Your answers"
        description="Verification status of what you’ve contributed"
        action={answers.length > 0 && <Link to="/my-contributions?tab=answers" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>}
      />
      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.loading && !state.data ? (
        <ListSkeleton />
      ) : answers.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No answers yet" description="Help a classmate by answering a question you know well." action={<ButtonLink to="/questions" variant="secondary" size="sm">Find a question</ButtonLink>} />
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2 border-b border-slate-100 p-4">
            {STATUS_SUMMARY.map(({ status, label, icon: Icon, className }) => (
              <div key={status} className="rounded-xl bg-slate-50 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`grid size-5 place-items-center rounded-md ${className}`}>
                    <Icon className="size-3" aria-hidden />
                  </span>
                  <span className="truncate">{label}</span>
                </dt>
                <dd className="mt-1.5 text-xl font-semibold text-slate-900 tabular-nums">{answers.filter((a) => a.verificationStatus === status).length}</dd>
              </div>
            ))}
          </dl>
          <ul className="divide-y divide-slate-100">
            {answers.slice(0, 4).map((answer) => (
              <li key={answer.id}>
                <Link to={`/questions/${answer.questionId}#answer-${answer.id}`} className="block px-5 py-3.5 transition hover:bg-slate-50">
                  <p className="truncate text-sm font-medium text-slate-900">{answer.question?.title ?? 'Deleted question'}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{excerpt(answer.content, 90)}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <VerificationBadge status={answer.verificationStatus} />
                    <span className="text-xs text-slate-400">{timeAgo(answer.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

function MyQuestionsCard({ state }) {
  const questions = state.data ?? []
  return (
    <Card>
      <CardHeader
        icon={FileQuestion}
        title="Your questions"
        description="Questions you’ve uploaded"
        action={questions.length > 0 && <Link to="/my-contributions" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>}
      />
      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.loading && !state.data ? (
        <ListSkeleton />
      ) : questions.length === 0 ? (
        <EmptyState icon={FilePlus2} title="You haven’t uploaded a question" description="Share a past paper question so everyone can work through it together." action={<ButtonLink to="/questions/new" size="sm">Upload question</ButtonLink>} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {questions.slice(0, 4).map((q) => (
            <li key={q.id}>
              <Link to={`/questions/${q.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{q.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {q.course?.code} · {q.topic?.name} · {timeAgo(q.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-right text-xs">
                  <span className={q.answerCount ? 'font-medium text-slate-700' : 'text-amber-700'}>{q.answerCount ? pluralize(q.answerCount, 'answer') : 'Unanswered'}</span>
                  {q.verifiedAnswerCount > 0 && <span className="mt-0.5 block font-medium text-emerald-700">Verified</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const recent = useAsync(() => questionsApi.listQuestions({ pageSize: 5 }), [])
  const myQuestions = useAsync(() => questionsApi.listMyQuestions(), [user.id])
  const myAnswers = useAsync(() => answersApi.listMyAnswers(), [user.id])
  const { courses, loading: coursesLoading } = useCourses()

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-brand-600">{greeting()},</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{user.firstName}, what are you revising today?</h1>
          <p className="mt-2 text-sm text-slate-500">Search past paper questions or share one from your latest exam.</p>
        </div>
        <ButtonLink to="/questions/new" icon={FilePlus2} size="lg" className="self-start lg:self-center">
          Upload a question
        </ButtonLink>
      </section>
      <SearchBar size="lg" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="recent-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold text-slate-900">
              Recently uploaded
            </h2>
            <Link to="/questions" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              Explore all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {recent.error ? (
            <Card>
              <ErrorState error={recent.error} onRetry={recent.reload} />
            </Card>
          ) : (
            <div className="space-y-3">
              {recent.loading && !recent.data
                ? Array.from({ length: 3 }, (_, i) => <QuestionCardSkeleton key={i} />)
                : recent.data.items.map((q) => <QuestionCard key={q.id} question={q} />)}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <MyAnswersCard state={myAnswers} />
          <MyQuestionsCard state={myQuestions} />
        </aside>
      </div>

      <section aria-labelledby="courses-heading">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="size-5 text-brand-600" aria-hidden />
          <h2 id="courses-heading" className="text-lg font-semibold text-slate-900">
            Courses & topics
          </h2>
        </div>
        <CourseGrid courses={courses} loading={coursesLoading} topicLimit={5} />
      </section>
    </div>
  )
}
