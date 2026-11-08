import { ArrowUpRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router'
import { Skeleton } from '../../components/ui/Spinner'
import { pluralize } from '../../utils/format'

/** Course cards with their topics; each links into Explore with filters applied. */
export function CourseGrid({ courses, loading, limit, topicLimit = 4 }) {
  if (loading && !courses.length) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.slice(0, limit).map((course) => (
        <li key={course.id} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-raised">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <BookOpen className="size-5" aria-hidden />
            </span>
            <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-brand-600" aria-hidden />
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wide text-brand-600">{course.code}</p>
          <h3 className="mt-0.5 font-semibold text-slate-900">
            <Link to={`/questions?course=${course.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
              {course.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {course.department} · {pluralize(course.questionCount, 'question')}
          </p>
          <ul className="relative z-10 mt-4 flex flex-wrap gap-1.5">
            {course.topics.slice(0, topicLimit).map((topic) => (
              <li key={topic.id}>
                <Link
                  to={`/questions?course=${course.id}&topic=${topic.id}`}
                  className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-brand-100 hover:text-brand-700"
                >
                  {topic.name}
                </Link>
              </li>
            ))}
            {course.topics.length > topicLimit && <li className="px-1 py-1 text-xs text-slate-400">+{course.topics.length - topicLimit} more</li>}
          </ul>
        </li>
      ))}
    </ul>
  )
}
