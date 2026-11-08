import { FilePlus2, SearchX, X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { QuestionCard, QuestionCardSkeleton } from '../components/QuestionCard'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { PERMISSIONS, can } from '../config/roles'
import { QuestionFilters } from '../features/questions/QuestionFilters'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { questionsApi } from '../services/api'
import { pluralize } from '../utils/format'

const PAGE_SIZE = 8
const FILTER_KEYS = ['q', 'course', 'topic', 'difficulty', 'sort', 'page']

export function ExplorePage() {
  useDocumentTitle('Explore questions')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const { courses } = useCourses()

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? '']))
  filters.sort ||= 'recent'
  const page = Number(filters.page) || 1

  const results = useAsync(
    () =>
      questionsApi.listQuestions({
        q: filters.q,
        courseId: filters.course,
        topicId: filters.topic,
        difficulty: filters.difficulty,
        sort: filters.sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    [filters.q, filters.course, filters.topic, filters.difficulty, filters.sort, page],
  )

  const update = (patch) => {
    const next = { ...filters, page: '', ...patch }
    setParams(Object.fromEntries(Object.entries(next).filter(([key, value]) => value && !(key === 'sort' && value === 'recent'))), { replace: true })
  }

  const goToPage = (nextPage) => {
    update({ page: nextPage > 1 ? String(nextPage) : '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const course = courses.find((c) => c.id === filters.course)
  const topic = course?.topics.find((t) => t.id === filters.topic)
  const chips = [
    filters.q && { key: 'q', label: `“${filters.q}”`, clear: { q: '', sort: 'recent' } },
    course && { key: 'course', label: course.code, clear: { course: '', topic: '' } },
    topic && { key: 'topic', label: topic.name, clear: { topic: '' } },
    filters.difficulty && { key: 'difficulty', label: filters.difficulty, clear: { difficulty: '' } },
  ].filter(Boolean)

  const data = results.data

  return (
    <div>
      <PageHeader
        title="Explore questions"
        description="Search the past paper repository by keyword, course, topic and difficulty."
        actions={can(user, PERMISSIONS.QUESTION_CREATE) && <ButtonLink to="/questions/new" icon={FilePlus2}>Upload question</ButtonLink>}
      />

      <QuestionFilters filters={filters} courses={courses} onChange={update} />

      <div className="mt-5 mb-4 flex min-h-8 flex-wrap items-center gap-2" aria-live="polite">
        <p className="mr-2 text-sm text-slate-500">
          {results.loading && !data ? 'Searching…' : data ? <><span className="font-semibold text-slate-800">{pluralize(data.total, 'question')}</span> found</> : null}
        </p>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => update(chip.clear)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pr-2 pl-3 text-xs font-medium text-brand-700 ring-1 ring-brand-200 transition ring-inset hover:bg-brand-100"
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label}
            <X className="size-3.5" aria-hidden />
          </button>
        ))}
        {chips.length > 1 && (
          <button type="button" onClick={() => setParams({}, { replace: true })} className="text-xs font-medium text-slate-500 hover:text-slate-800">
            Clear all
          </button>
        )}
      </div>

      {results.error ? (
        <Card>
          <ErrorState error={results.error} onRetry={results.reload} />
        </Card>
      ) : results.loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <QuestionCardSkeleton key={i} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No questions match your search"
            description="Try a different keyword, or remove a filter to broaden the results."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {chips.length > 0 && (
                  <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                    Clear filters
                  </Button>
                )}
                {can(user, PERMISSIONS.QUESTION_CREATE) && <ButtonLink to="/questions/new">Upload this question</ButtonLink>}
              </div>
            }
          />
        </Card>
      ) : (
        <div className={results.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="space-y-3">
            {data.items.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={goToPage} />
          </div>
        </div>
      )}
    </div>
  )
}
