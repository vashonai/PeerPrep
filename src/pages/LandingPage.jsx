import { ArrowRight, BadgeCheck, FileUp, MessagesSquare, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { QuestionCard, QuestionCardSkeleton } from '../components/QuestionCard'
import { SearchBar } from '../components/SearchBar'
import { ButtonLink } from '../components/ui/Button'
import { ErrorState } from '../components/ui/EmptyState'
import { homePathFor } from '../config/roles'
import { CourseGrid } from '../features/questions/CourseGrid'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { questionsApi } from '../services/api'

const POPULAR_SEARCHES = ['BCNF', 'Dijkstra', 'Integration by parts', "Bayes' theorem", 'Master Theorem']

const STEPS = [
  { icon: FileUp, title: 'Upload a question', text: 'Add a past paper question with its course, topic and difficulty. Attach the original PDF or a photo.' },
  { icon: MessagesSquare, title: 'Discuss solutions', text: 'Classmates post answers and explanations in one thread instead of a fast-moving group chat.' },
  { icon: BadgeCheck, title: 'Get it verified', text: 'Lecturers and student administrators mark answers as correct or incorrect, with feedback.' },
  { icon: Search, title: 'Find it at exam time', text: 'Search and filter every question by keyword, course, topic and difficulty when revision starts.' },
]

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-xl text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function LandingPage() {
  useDocumentTitle('')
  const { user } = useAuth()
  const { courses, loading: coursesLoading } = useCourses()
  const recent = useAsync(() => questionsApi.listQuestions({ pageSize: 4 }), [])

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,var(--color-brand-50),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-24">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
            <Sparkles className="size-3.5 text-teal-500" aria-hidden /> Built for university exam preparation
          </p>
          <h1 className="mt-6 text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
            Past paper questions, <span className="text-brand-600">answered together</span> and verified.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-slate-600">
            PeerPrep is one organised place to upload past exam questions, discuss solutions with classmates and see which answers your lecturers have checked.
          </p>
          <SearchBar size="lg" className="mx-auto mt-10 max-w-2xl" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-slate-500">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                to={`/questions?q=${encodeURIComponent(term)}&sort=relevance`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 transition hover:border-brand-200 hover:text-brand-700"
              >
                {term}
              </Link>
            ))}
          </div>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/questions" size="lg" icon={Search}>
              Explore questions
            </ButtonLink>
            {user ? (
              <ButtonLink to={homePathFor(user)} size="lg" variant="secondary">
                Go to your dashboard
              </ButtonLink>
            ) : (
              <ButtonLink to="/register" size="lg" variant="secondary">
                Create a free account
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Featured courses"
          title="Browse by course"
          description="Questions are organised by course and topic, so you can revise one unit at a time."
          action={
            <Link to="/questions" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              All questions <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <CourseGrid courses={courses} loading={coursesLoading} limit={6} />
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            eyebrow="Recently added"
            title="Fresh from the community"
            action={
              <Link to="/questions" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          {recent.error ? (
            <ErrorState error={recent.error} onRetry={recent.reload} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recent.loading && !recent.data
                ? Array.from({ length: 4 }, (_, i) => <QuestionCardSkeleton key={i} />)
                : recent.data.items.map((q) => <QuestionCard key={q.id} question={q} />)}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading eyebrow="How it works" title="From group chat chaos to a trusted study resource" />
        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <span className="absolute top-6 right-6 text-sm font-semibold text-slate-300 tabular-nums">0{index + 1}</span>
              <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {!user && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-900 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Ready to prepare smarter?</h2>
              <p className="mt-2 text-brand-100/80">Create a free student account, or try PeerPrep instantly with a demo account.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex h-12 items-center rounded-xl bg-white px-5 font-medium text-brand-800 transition hover:bg-brand-50">
                Sign up free
              </Link>
              <Link to="/login" className="inline-flex h-12 items-center rounded-xl px-5 font-medium text-white ring-1 ring-white/30 transition ring-inset hover:bg-white/10">
                Try a demo account
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
