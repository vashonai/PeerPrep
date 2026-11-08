import { cx } from '../../utils/cx'

/** Segmented tab control. `tabs`: [{ id, label, count?, icon? }] */
export function Tabs({ tabs, value, onChange, label, className }) {
  const onKeyDown = (event) => {
    const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!offset) return
    event.preventDefault()
    const index = tabs.findIndex((t) => t.id === value)
    const next = tabs[(index + offset + tabs.length) % tabs.length]
    onChange(next.id)
    event.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus()
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1', className)}>
      {tabs.map(({ id, label: tabLabel, count, icon: Icon }) => {
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            role="tab"
            data-tab={id}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition',
              selected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {tabLabel}
            {count !== undefined && (
              <span className={cx('rounded-full px-1.5 text-xs tabular-nums', selected ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600')}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
