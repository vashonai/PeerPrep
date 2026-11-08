import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Select } from '../../components/ui/Form'
import { DIFFICULTIES } from '../../data/models'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

/**
 * Explore filters. `filters` comes from the URL; `onChange(patch)` updates it.
 * Topics depend on the selected course.
 */
export function QuestionFilters({ filters, courses, onChange }) {
  const [keyword, setKeyword] = useState(filters.q)
  const debounced = useDebouncedValue(keyword, 350)

  useEffect(() => {
    if (debounced.trim() !== filters.q) onChange({ q: debounced.trim(), sort: debounced.trim() ? 'relevance' : 'recent' })
    // Only react to the debounced keyword.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Keep the box in sync when the URL changes elsewhere (e.g. "Clear filters").
  const [syncedQ, setSyncedQ] = useState(filters.q)
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q)
    if (filters.q !== keyword.trim()) setKeyword(filters.q)
  }

  const topics = courses.find((c) => c.id === filters.course)?.topics ?? []

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="relative">
        <label htmlFor="explore-search" className="sr-only">
          Search by keyword
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          id="explore-search"
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by keyword, e.g. “normalization” or “Dijkstra”"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-10 pl-10 text-sm shadow-xs transition placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none"
        />
        {keyword && (
          <button type="button" onClick={() => setKeyword('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label="Course" value={filters.course} onChange={(e) => onChange({ course: e.target.value, topic: '' })}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.title}
            </option>
          ))}
        </Select>
        <Select aria-label="Topic" value={filters.topic} onChange={(e) => onChange({ topic: e.target.value })} disabled={!filters.course}>
          <option value="">{filters.course ? 'All topics' : 'Select a course first'}</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Difficulty" value={filters.difficulty} onChange={(e) => onChange({ difficulty: e.target.value })}>
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select aria-label="Sort by" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
          <option value="recent">Most recent</option>
          <option value="relevance" disabled={!filters.q}>
            Most relevant{filters.q ? '' : ' (enter a keyword)'}
          </option>
        </Select>
      </div>
    </div>
  )
}
