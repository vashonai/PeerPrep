import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { cx } from '../utils/cx'

/**
 * Question search box. Navigates to Explore with the query unless an
 * `onSearch` handler is supplied.
 */
export function SearchBar({ defaultValue = '', onSearch, size = 'md', placeholder = 'Search questions, courses or topics…', className, autoFocus }) {
  const [value, setValue] = useState(defaultValue)
  const navigate = useNavigate()
  const large = size === 'lg'

  const submit = (event) => {
    event.preventDefault()
    const q = value.trim()
    if (onSearch) onSearch(q)
    else navigate(q ? `/questions?q=${encodeURIComponent(q)}&sort=relevance` : '/questions')
  }

  return (
    <form role="search" onSubmit={submit} className={cx('relative flex w-full items-center', className)}>
      <label htmlFor="question-search" className="sr-only">
        Search questions
      </label>
      <Search className={cx('pointer-events-none absolute text-slate-400', large ? 'left-4 size-5' : 'left-3 size-4')} aria-hidden />
      <input
        id="question-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cx(
          'w-full rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none',
          large ? 'h-14 pr-32 pl-12 text-base' : 'h-11 pr-24 pl-10 text-sm',
        )}
      />
      <button
        type="submit"
        className={cx(
          'absolute rounded-lg bg-brand-600 font-medium text-white transition hover:bg-brand-700',
          large ? 'right-2 h-10 px-5 text-sm' : 'right-1.5 h-8 px-3.5 text-sm',
        )}
      >
        Search
      </button>
    </form>
  )
}
